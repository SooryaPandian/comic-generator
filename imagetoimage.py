import requests
import base64
from io import BytesIO
from PIL import Image

# Convert image to base64
def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")

# API URL (change if running on a different port)
url = "http://127.0.0.1:7860/sdapi/v1/img2img"

# Load and encode input image
input_image_path = "black2.jpg"  # Change to your image path
image_base64 = encode_image(input_image_path)

# Define img2img payload
payload = {
    "init_images": [image_base64],  # Pass the input image
    "prompt": "A high-quality enhanced version of this image, colorful,girl, 1girl, solo,original face structure,4k",
    "negative_prompt": "blurry, distorted, low quality, extra limbs, incorrect colors, unnatural proportions,grainy",
    "denoising_strength": 0.3,  # Controls how much the image changes (0.5-0.75 recommended)
    "steps": 80,
    "sampler_index": "DPM++ SDE Karras",
    "cfg_scale": 8,
    "width": 512,
    "height": 512
}


# Send request
response = requests.post(url, json=payload)

# Handle errors
if response.status_code != 200:
    print(f"ERROR: API request failed. Status Code: {response.status_code}")
    print(response.text)
    exit()

# Decode and save the cartoonized image
data = response.json()
image_data = data["images"][0]
image_bytes = base64.b64decode(image_data)

output_path = "black_output.jpg"
with open(output_path, "wb") as f:
    f.write(image_bytes)

print(f"✅ Cartoonized image saved as {output_path}")
