from flask import Flask, jsonify, request
from flask_cors import CORS
import ollama
import re
import requests
import base64
import json
from config import OLLAMA_MODEL_NAME, IMAGE_GENERATION_URL  # Import configuration

app = Flask(__name__)
CORS(app)

@app.route('/generate/image', methods=['POST'])
def generate_image():
    data = request.json
    try:
        url = IMAGE_GENERATION_URL  # Use URL from config

        # Payload with generation parameters
        payload = {
            "prompt": f"{data['prompt']}",
            "negative_prompt": "Incorrect colors, extra limbs, blurry, distorted details, unrealistic anatomy, low resolution, washed-out colors, overexposed, unnatural lighting, ugly, dull.",
            "steps": 20,
            "sampler_index": "Euler a",
            "cfg_scale": 7,
            "width": 512,
            "height": 512,
            "seed": 2000,  # -1 for random seed
            "override_settings": {
                "sd_model_checkpoint": "dreamshaper_8.safetensors"
            }
        }
        response = requests.post(url, json=payload)
        if response.status_code == 200:
            result = response.json()
            image_data = result['images'][0]
            return jsonify({'image': image_data})
        else:
            print("Error:", response.text)
            return jsonify({'error': response.text}), 500
    
    except Exception as e:

        print(e)
        return jsonify({'error': str(e)}), 500

@app.route('/generate/story', methods=['POST'])
def generate_story_elements():
    data = request.json
    try:
        # Generate main title if needed
        if data.get('generate_title'):
            print(data.get('description','generate random title') + data['title'])
            title_prompt = f'''
            user description/title: {data.get('description','generate random title') + data['title']}
            Generate a random title or enhance the given title for a comic along with description.
            As this is used for showing in a web UI, not in a chat UI, do not include any extra wordings to explain the content to the user.
            It should strictly follow the below format.
            Output format:
            **Main Title**: [Title]\n
            **Description**: [Description]
            '''
            title_response = ollama.generate(
                model=OLLAMA_MODEL_NAME,  # Use model name from config
                prompt=title_prompt,
                options={'temperature': 0.8}
            )
            response = title_response['response'].strip().replace('"', '')
            main_title = response.split('\n')[0].replace('**Main Title**: ', '').strip()
            description = "".join(response.split('\n')[1:]).replace('**Description**: ', '').strip()
        else:
            main_title = data['title']
            description = data['description']

        # Generate page titles and characters
        story_prompt = f"""
        Create a comic book story framework titled "{main_title}".
        you have to create prompts generating each page, all the page should have the detailed description of the page.
        The story should be engaging, with a clear plot and character development.
        Description: {description}
        Number of pages: {data.get('pagesCount', 10)}.
        Character suggested by the user: {', '.join(data['characters'])}.

        Return STRICTLY in this JSON format (NO OTHER TEXT):
        {{
        "characters": ["Character 1 - Description", "Character 2 - Description", ...],
        "pages": [
            {{
            "pageTitle": "Title 1",
            "prompt": "Detailed prompt to generate the content of this page"
            }},
            ...
        ]
        }}

        Rules:
        1. Use ONLY these 2 keys:  characters, pages
        2. The "pages" array must contain exactly {data.get('pagesCount', 10)} items
        3. Each item inside "pages" must have:
        - "pageTitle": short, creative title for the comic page
        - "prompt": detailed description to generate visuals + narration
        4. DO NOT include markdown or explanation. Just clean, parsable JSON.
        """

        response = ollama.generate(
            model=OLLAMA_MODEL_NAME,
            prompt=story_prompt,
            options={'temperature': 0.7, 'num_predict': 1024}
        )

        try:
            # Directly parse the response without transformation
           
            response_data = json.loads(response['response'].strip())
            # Validate structure
            required_keys = ['characters', 'pages']
            if not all(key in response_data for key in required_keys):
                raise ValueError("Missing required keys in response")

            # Ensure array lengths match
            # page_count = data.get('pagesCount', 10)
            # response_data['titles'] = response_data['titles']
            # response_data['descriptions'] = response_data['descriptions']
                        
            titles = [p['pageTitle'] for p in response_data['pages']]
            print("Requested number of pages:", data.get('pagesCount', 10),"\n generated number of pages:", len(titles))
            descriptions = [p['prompt'] for p in response_data['pages']]
            # Keep original frontend structure
            return jsonify({
                'main_title': main_title,
                'description': description,
                'characters': response_data['characters'],  # Limit to 5 characters
                'titles': titles,
                'descriptions': descriptions,
            })

        except json.JSONDecodeError:
            # Fallback to original parsing logic if JSON fails
            content = response['response'].strip()
            print({'error': str(json.JSONDecodeError)})
            return jsonify({'error': str(json.JSONDecodeError)}), 500
    except Exception as e:
        print(e)
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
            model=OLLAMA_MODEL_NAME,  # Use model name from config
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
    print(data)
    try:
        prompt = f"""
        You are an AI-powered comic script generator. Your task is to generate the content for a specific page of a comic book while ensuring narrative continuity, engaging character interactions, and maintaining the established tone of the story. Do not include any explanations, introductions, or extra text outside the specified format.

        ### Comic Story Details:
        - **Title:** {data['main_title']}
        - **Story Overview:** {data['description']}
        - **Key Characters:** {', '.join(data['characters'])}

        ### Page to be Generated:
        - **Current Page Title:** {data['current_title']}
        - **Previous Page Summary:** {data.get('previous_development', 'None')}
        - **Current Page Direction:** {data.get('next_page_suggestion', 'Continue naturally')}
        - **Current Page Prompt:** {data['current_description']}

        Your response **must strictly follow the format below**. Do not add any extra text, explanations, or modifications.
        **Rules to Follow:**  
        - **Do not include any extra text, explanations, or modifications.**  
        - **Strictly follow the output format.**   
        - **Ensure character dialogues stay true to their personalities.**  
        - **Ensure smooth storytelling and engaging interactions.** 
        generate the content based on the current page number and current page prompt provided. 
        Strictly follow the below format for the output.don't add any extra text or explanation, or panels within the content section
        Now, generate the comic page content in the below specified format only.
        ---
        ---
        Output format:

        **Page Content:**  
        Character 1: "Dialogue line 1"  

        Character 2: "Dialogue line 2" 

        Character 1: "Dialogue line 3" 

        Character 3: "Dialogue line 4" 

        ... (5-15 dialogue exchanges ensuring smooth character interactions and progress in the plot)  
        
        **Key Developments:**  
        - [Important plot point 1]  
        - [Important plot point 2]  
        - [Important plot point 3]  
        (Highlight the major events that happen in this page)  

        **Next Page Suggestions:**  
        - Idea 1: [Possible next event]  
        - Idea 2: [Possible next event]  
        - Idea 3: [Possible next event]  
        (Provide 2-3 engaging ideas that build upon this page)  

        **Image Prompts:**
        - [Description of visual for panel 1]
        - [Description of visual for panel 2]
        - [Description of visual for panel 3]
        - [Description of visual for panel 4]
        (Provide 4-5 detailed visual descriptions for comic panels) 

        ---
        """

        
        response = ollama.generate(
            model=OLLAMA_MODEL_NAME,  # Use model name from config
            prompt=prompt,
            options={'temperature': 0.6, 'num_predict': 1024}
        )
        
        content = response['response'].strip()
        sections = {
            'content': '',
            'key_developments': [],
            'next_suggestions': [],
            'image_prompts': []
        }

        current_section = None
        for line in content.split('\n'):
            if 'page content' in line.lower():
                current_section = 'content'
            elif 'key developments' in line.lower():
                current_section = 'key_developments'
            elif 'next page suggestions' in line.lower():
                current_section = 'next_suggestions'
            elif 'image prompts' in line.lower():
                current_section = 'image_prompts'
            elif current_section == 'content'and line!= '':
                sections['content'] += line + '\n'
            elif current_section == 'key_developments'and line!= '':
                sections['key_developments'].append(line.strip())
            elif current_section == 'next_suggestions'and line!= '':
                sections['next_suggestions'].append(line.strip())
            elif current_section == 'image_prompts'and line!= '':
                sections['image_prompts'].append(line.strip())
                
        return jsonify({
            'content': sections['content'].strip(),
            'key_developments': sections['key_developments'],
            'next_suggestions': sections['next_suggestions'],
            'image_prompts': sections['image_prompts']
        })
        
    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
