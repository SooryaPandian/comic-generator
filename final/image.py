import requests
import base64
import json

# API endpoint (ensure the web UI is running locally with --api)
url = "http://localhost:7860/sdapi/v1/txt2img"

# Payload with generation parameters
payload = {
    "prompt": "Three beautifully detailed rabbits in a vibrant, magical landscape. The first rabbit is sky blue, with soft, glowing fur reflecting the gentle sunlight. The second rabbit is pure white, with a silky, elegant coat that shimmers under the ambient light. The third rabbit is deep purple, with a mystical aura and velvety fur. They are sitting on a lush green meadow surrounded by glowing bioluminescent flowers. A stunning waterfall cascades in the background, with a sunset sky in shades of pink, orange, and violet. Soft mist rises from the grass, and fireflies dance around, creating a peaceful, dreamlike atmosphere. Ultra-detailed, cinematic lighting, hyper-realistic fur textures, masterpiece, 4K UHD.",
    "negative_prompt": "Incorrect colors, extra limbs, blurry, distorted details, unrealistic anatomy, low resolution, washed-out colors, overexposed, unnatural lighting, ugly, dull.",
    "steps": 30,
    "sampler_index": "Euler a",
    "cfg_scale": 7,
    "width": 512,
    "height": 512,
    "seed": -1,  # -1 for random seed
    "override_settings": {
        "sd_model_checkpoint": "dreamshaper_8.safetensors"
    }
}

# Send request
response = requests.post(url, json=payload)

# Handle response
if response.status_code == 200:
    result = response.json()
    image_data = base64.b64decode(result['images'][0])
    
    # Save image
    with open("comic_output.png", "wb") as f:
        f.write(image_data)
    print("Image generated successfully!")
else:
    print("Error:", response.text)