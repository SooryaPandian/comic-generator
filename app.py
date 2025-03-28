from flask import Flask, jsonify, request
from flask_cors import CORS
import ollama
import re

app = Flask(__name__)
CORS(app)

@app.route('/generate/story', methods=['POST'])
def generate_story_elements():
    data = request.json
    try:
        # Generate main title if needed
        # print('generate_title', data.get('generate_title'))
        if data.get('generate_title'):
            title_prompt = f'''
            Generate a random title for a commic along with description.
            As this is used for showing in a webui, not in a chat ui, do not include any extra wordings to explain the content to the user.
            it should strictly follow the bellow format.
            Output format:
            **Main Title**: [Title]\n
            **Description**: [Description]
            
            '''
            title_response = ollama.generate(
                model='llama3.2',
                prompt=title_prompt,
                options={'temperature': 0.8}
            )
            response = title_response['response'].strip().replace('"', '')
            main_title = response.split('\n')[0]
            description= "".join(response.split('\n')[1:])
            # print("This is the generate title",main_title ),
            # print("This is the generate description",response)
        else:
            main_title = data['title']
            description = data['description']

        # Generate page titles and characters
        story_prompt = f"""
        Create a comic book story framework titled "{main_title}".
        Description: {description}
        in the generated titles, the first few pages should be introduction to sthe story and the last few pages(climax) should be the conclusion of the story with high tension.the story should be mixture of high tentions, drama, action and emotions accrding to the title and description.
        As this is used for showing in a webui, not in a chat ui, do not include any extra wordings to explain the content to the user.clearly use the format below.
        Generate description all the page titles, i.e, what would be the story of each page(a brief).it should mention all the incidents that are going to happen in the page.
        the page titles should be in the order of the story flow, and they should match the page description.Let the description be more detailed,as this would be the main for the story generation of that particular page.
        All the following details should be present in the response in specified format.
        Output format:
        Characters:
        1. [Character Name] - [Role/Description]
        2. [Character Name] - [Role/Description]
        --
        Page Titles:
        1. [Title 1]
        2. [Title 2]
        ...
        10. [Title 10]
        --
        Page descriptions:
        1. [Page Description 1]
        2. [Page Description 2]
        ...
        10. [Page Description 10]
        """
        
        response = ollama.generate(
            model='llama3.2',
            prompt=story_prompt,
            options={'temperature': 0.7, 'num_predict': 1024}
        )
        
        content = response['response'].strip()
        characters = []
        titles = []
        page_descriptions=[]
        # Parse response
        current_section = None
        for line in content.split('\n'):
            if 'characters:' in line.lower():
                current_section = 'characters'
            elif 'page titles:' in line.lower():
                current_section = 'titles'
            elif 'page descriptions:' in line.lower():
                current_section = 'descriptions'
            elif line.startswith('--'):
                current_section = None
            elif current_section == 'characters' and re.match(r'\d+\.', line):
                characters.append(line.split('. ', 1)[-1].strip())
            elif current_section == 'titles' and re.match(r'\d+\.', line):
                titles.append(line.split('. ', 1)[-1].strip())
            elif current_section == 'descriptions' and re.match(r'\d+\.', line):
                page_descriptions.append(line.split('. ', 1)[-1].strip())  
        # print("This is the page descriptions", page_descriptions)
        return jsonify({
            'main_title': main_title,
            'description': description,
            'characters': characters,  # Limit to 5 main characters
            'titles': titles,        # Ensure exactly 10 titles
            'descriptions':page_descriptions
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/generate/title', methods=['POST'])
def regenerate_single_title():
    data = request.json
    try:
        prompt = f"""The Main title of the story is "{data['main_title']}".The story have 10 pages and the titles of all the pages are "{data['all_titles']}".
        In that you have to Regenerate title for the page {data['page_number']}.
        Current title : {data['current_title']}
        Characters: {', '.join(data['characters'])}
        Current Page Description: {data['current_description']}
        Maintain story continuity. Return ONLY the new page title text."""

        response = ollama.generate(
            model='llama3.2',
            prompt=prompt,
            options={'temperature': 0.7}
        )
        return jsonify({'title': response['response'].strip()})
    
    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 500

@app.route('/generate/page', methods=['POST'])
def generate_page():
    data = request.json
    # print("this is the data",data)
    try:
        print(data.get('previous_development', 'None'))
        prompt = f"""
        Story:  {data['main_title']} - {data['description']}
        All page titles: {', '.join(data['all_titles'])}
        Characters: {', '.join(data['characters'])}

        For the above mentioned comic story you have to Generate content for the page: {data['current_title']}.
        Assume all the previous pages are aldready generated and the current page should be in continuation with the previous pages.the previous page development and the current page direction from the previous page is provided.
        Based on them and the description for the current page, you have to generate the content and also mention the key development in this page and suggestions for the next page content.
        Previous page Development: {data.get('previous_development', 'None')}
        current Page Direction from the previous page: {data.get('next_page_suggestion', 'Continue naturally')}
        current Page Description: {data['current_description']}
        strictly the output need to be in the follwing format.
        Output Format:
        **Page Content**
        [character1_name : character content]
        [character2_name : character content](5-15 dialogue exchanges with name of the characters)
        .
        .
        .

        **Key Developments**
        - [Important plot point 1]
        - [Important plot point 2]
        - [Important plot point 3]
        .
        .
        .
        **Next Page Suggestions**
        [What should happen in next page(2-3 ideas)]
        .
        .
        .

        """
        
        response = ollama.generate(
            model='llama3.2',
            prompt=prompt,
            options={'temperature': 0.6, 'num_predict': 1024}
        )
        
        content = response['response'].strip()
        
        sections = {
            'content': '',
            'key_developments': [],
            'next_suggestions': []
        }

        current_section = None
        for line in content.split('\n'):
            if 'page content' in line.lower():
                current_section = 'content'
            elif 'key developments' in line.lower():
                current_section = 'key_developments'
            elif 'next page suggestions' in line.lower():
                current_section = 'next_suggestions'
            elif current_section == 'content':
                sections['content'] += line + '\n'
            elif current_section == 'key_developments':
                sections['key_developments'].append(line.strip())
            elif current_section == 'next_suggestions':
                if line.strip():
                # if line.strip() and not line.startswith('**'):
                    sections['next_suggestions'].append(line.strip())
                
        
        return jsonify({
            'content': sections['content'].strip(),
            'key_developments': sections['key_developments'],
            'next_suggestions': sections['next_suggestions']
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
