import streamlit as st
import requests
from fpdf import FPDF
import os

# Backend API URL
BACKEND_URL = "http://localhost:5000"

# Initialize session state variables
def init_session():
    session_defaults = {
        'main_title': "",
        'description': "",
        'characters': [],
        'pages': [],
        'current_page': 0,
        'titles_finalized': False,
        'generation_complete': False
    }
    for key, value in session_defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value

# Custom PDF class
class ComicPDF(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 16)
        self.cell(0, 10, st.session_state.main_title, 0, 1, 'C')
        self.ln(5)
    
    def chapter_body(self, page):
        self.set_font('Arial', 'B', 14)
        self.cell(0, 10, f"Page {page['number']}: {page['title']}", 0, 1)
        self.ln(3)
        
        self.set_font('Arial', '', 12)
        content = page['content'].replace('**', '')  # Remove markdown-style bold
        lines = content.split('\n')
        for line in lines:
            if line.strip().endswith(':'):  # Detect character speech
                self.set_font('', 'B')
                self.multi_cell(0, 8, line.strip())
                self.set_font('', '')
            else:
                self.multi_cell(0, 8, line)
        self.ln(10)

# Generate PDF function
def generate_pdf():
    pdf = ComicPDF()
    pdf.add_page()
    for page in st.session_state.pages:
        # Ensure all text is encoded properly
        page['title'] = page['title'].encode('latin1', 'replace').decode('latin1')
        page['content'] = page['content'].encode('latin1', 'replace').decode('latin1')
        pdf.chapter_body(page)
        pdf.add_page()
    return pdf.output(dest='S').encode('latin1', 'ignore')

# Home page (Title & Description)
def home_page():
    st.title("AI Comic Generator")
    st.markdown("---")

    # Initialize session state for toggle
    if "generate_title" not in st.session_state:
        st.session_state.generate_title = False

    # Toggle button (Must be outside the form to avoid callback error)
    generate_title = st.toggle("Generate Random Title", value=st.session_state.generate_title)
    st.session_state.generate_title = generate_title  # Update session state

    with st.form("main_form"):
        col1, col2 = st.columns([3, 1])
        with col1:
            st.session_state.main_title = st.text_input(
                "Comic Title:", 
                st.session_state.get("main_title", ""), 
                disabled=st.session_state.generate_title  # Dynamically disable input
            )

            st.session_state.description = st.text_area(
                "Story Description:", 
                st.session_state.get("description", ""), 
                height=150, 
                help="Describe the main story and climax",
                disabled=st.session_state.generate_title  # Dynamically disable input
            )

        if st.form_submit_button("Generate Story Framework"):
            response = requests.post(
                f"{BACKEND_URL}/generate/story",
                json={
                    'title': st.session_state.get("main_title", ""),
                    'description': st.session_state.get("description", ""),
                    'generate_title': st.session_state.generate_title
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                st.session_state.main_title = data['main_title']
                st.session_state.characters = data['characters']
                st.session_state.all_titles= data['titles']
                st.session_state.description = data['description']
                st.session_state.pages = [
                    {'number': i+1, 'title': title, 'content': '', 'key_developments': [], 'next_suggestions': [],'description':data['descriptions'][i]} 
                    for i, title in enumerate(data['titles'])
                ]
                st.session_state.titles_finalized = False
                st.rerun()
            else:
                st.error("Failed to generate story framework")
                
def title_review_page():
    st.title("Review & Finalize Titles")
    st.markdown(f"{st.session_state.main_title}")
    st.markdown(f"{st.session_state.description}")
    
    st.subheader("Main Characters")
    for char in st.session_state.characters:
        st.write(f"- {char}")
    
    st.markdown("---")
    st.subheader("Page Titles (Edit or Regenerate as needed)")
    
    for i, page in enumerate(st.session_state.pages):
        cols = st.columns([4, 1])
        with cols[0]:
            new_title = st.text_input(
                f"Page {i+1} Title:", 
                value=page['title'],
                key=f"title_{i}"
            )
            if new_title != page['title']:
                st.session_state.pages[i]['title'] = new_title
        with cols[1]:
            if st.button("↻ Regenerate", key=f"regen_{i}"):
                response = requests.post(
                    f"{BACKEND_URL}/generate/title",
                    json={
                        'main_title': st.session_state.main_title+st.session_state.description,
                        'all_titles': st.session_state.all_titles,
                        'page_number': i+1,
                        'current_title': page['title'],
                        'current_description':page['description'],
                        'characters': st.session_state.characters,
                        'topic': st.session_state.main_title
                    }
                )
                if response.status_code == 200:
                    st.session_state.pages[i]['title'] = response.json()['title']
                    st.rerun()

    col1, col2 = st.columns([1, 1])
    
    with col1:
        if st.button("✅ Finalize Titles & Start Manual Generation"):
            st.session_state.titles_finalized = True
            st.session_state.current_page = 0
            st.rerun()

    with col2:
        if st.button("⚡ Auto Generate All Pages"):
            st.session_state.titles_finalized = True
            st.session_state.current_page = 0
            st.session_state.auto_generate = True  # Flag to start auto generation
            st.rerun()

def content_generation_page():
    st.title("Generating Comic Content...")

    # Debug: Show session state for troubleshooting
    st.write("Session State Debug:", st.session_state)

    # Ensure pages exist before generating content
    if 'pages' not in st.session_state or not st.session_state.pages:
        st.error("No pages found! Please restart the process.")
        return

    # ✅ Auto-generate all pages in one go
    if 'auto_generate' in st.session_state and st.session_state.auto_generate:
        progress_bar = st.progress(0)  # Show progress bar

        for i in range(len(st.session_state.pages)):
            page = st.session_state.pages[i]
            prev_dev = "\n".join(st.session_state.pages[i-1]['key_developments']) if i > 0 else ""

            response = requests.post(
                f"{BACKEND_URL}/generate/page",
                json={
                    'main_title': st.session_state.main_title,
                    'description': st.session_state.description,
                    'all_titles': st.session_state.all_titles,
                    'page_description':page['description'],
                    'current_title': page['title'],
                    'characters': st.session_state.characters,
                    'previous_development': prev_dev,
                    'next_page_suggestion': page.get('next_suggestions', [''])[0] if page.get('next_suggestions') else ''
                }
            )

            if response.status_code == 200:
                data = response.json()
                page['content'] = data['content']
                page['key_developments'] = data['key_developments']
                if i < len(st.session_state.pages) - 1:
                    st.session_state.pages[i+1]['next_suggestions'] = data['next_suggestions']

            progress_bar.progress((i + 1) / len(st.session_state.pages))  # Update progress

        # ✅ Mark generation as complete and refresh UI
        st.session_state.auto_generate = False
        st.session_state.generation_complete = True
        st.rerun()

    # ✅ Show success message when done
    if st.session_state.get('generation_complete', False):
        st.success("🎉 All pages have been generated successfully!")

        pdf_bytes = generate_pdf()
        st.download_button(
            label="📥 Download Comic PDF",
            data=pdf_bytes,
            file_name=f"{st.session_state.main_title.replace(' ', '_')}_comic.pdf",
            mime="application/pdf"
        )

        if st.button("🔄 Create New Comic"):
            st.session_state.clear()
            st.rerun()
        return  # ✅ Stop further execution

    # ✅ Show each page (if not auto-generating)
    if 'current_page' not in st.session_state:
        st.session_state.current_page = 0

    if st.session_state.current_page < len(st.session_state.pages):
        page = st.session_state.pages[st.session_state.current_page]
        st.subheader(f"Page {page['number']}: {page['title']}")

        if not page['content']:
            prev_dev = "\n".join(st.session_state.pages[st.session_state.current_page-1]['key_developments']) if st.session_state.current_page > 0 else ""
            
            response = requests.post(
                f"{BACKEND_URL}/generate/page",
                json={
                    'main_title': st.session_state.main_title,
                    'description': st.session_state.description,
                    'all_titles': st.session_state.all_titles,
                    'current_title': page['title'],
                    'current_description':page['description'],
                    'characters': st.session_state.characters,
                    'characters': st.session_state.characters,
                    'previous_development': prev_dev,
                    'next_page_suggestion': "\n".join(st.session_state.pages[st.session_state.current_page -1]['next_suggestions']) if st.session_state.current_page > 0  else ''
                }
            )

            if response.status_code == 200:
                data = response.json()
                page['content'] = data['content']
                page['key_developments'] = data['key_developments']
                page['next_suggestions'] = data['next_suggestions']
                

        new_content = st.text_area("Page Content:", value=page['content'], height=400, key=f"content_{page['number']}")

        if new_content != page['content']:
            page['content'] = new_content

        cols = st.columns([1, 3, 1])
        with cols[0]:
            if st.button("🔄 Regenerate"):
                page['content'] = ""
                st.rerun()
        with cols[2]:
            next_text = "Finish" if page['number'] == len(st.session_state.pages) else "Next Page →"
            if st.button(next_text):
                if page['number'] == len(st.session_state.pages):
                    st.session_state.generation_complete = True
                st.session_state.current_page += 1
                st.rerun()




# Main function
def main():
    init_session()
    
    if not st.session_state.pages:
        home_page()
    elif not st.session_state.titles_finalized:
        title_review_page()
    elif not st.session_state.generation_complete:
        content_generation_page()
    
    st.success("🎉 All pages have been generated successfully!")

    pdf_bytes = generate_pdf()
    st.download_button(
        label="📥 Download Comic PDF",
        data=pdf_bytes,
        file_name=f"{st.session_state.main_title.replace(' ', '_')}_comic.pdf",
        mime="application/pdf"
    )

    if st.button("🔄 Create New Comic"):
        st.session_state.clear()
        st.rerun()
if __name__ == "__main__":
    main()
