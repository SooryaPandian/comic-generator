### 📘 **README.md — Comic Book Generator App**

> A full-stack comic book creator powered by AI that runs locally on your system. Generate page titles, story content, and images using Ollama (LLaMA 3.2) and Stable Diffusion WebUI, then export everything to a beautiful PDF comic book!

---

## 🗂️ Project Structure

```
comic-generator/
├── app.py                      # Flask backend entrypoint
├── config.py                   # Configuration for models and URLs
├── requirements.txt            # Python dependencies
├── README.md                   # You're here!
```

---

## 🚀 Features

- ✍️ Generate comic **page titles & stories** with LLaMA 3.2 (Ollama)
- 🎨 Create **AI-generated comic panels** with Stable Diffusion WebUI
- 📦 Organize pages with titles, content, and images
- 📄 Export the full comic as a **beautifully formatted PDF**

---

## 🧠 AI Setup Instructions

### 1. 🦙 **Install Ollama & Run LLaMA 3.2**

> [Ollama Installation Guide](https://ollama.com)

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Run LLaMA 3.2 (or any model of your choice)
ollama run llama3.2:latest
```

### 2. 🎨 **Set Up Stable Diffusion WebUI**

> [Automatic1111 WebUI](https://github.com/AUTOMATIC1111/stable-diffusion-webui)

```bash
# Clone the repo
git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui.git
cd stable-diffusion-webui

# (Optional) Create venv
python -m venv venv
venv/Scripts/activate  # Windows
source venv/bin/activate  # Linux/Mac

# Run with API enabled
python launch.py --api --xformers
```

> Once it's running, the image generation API will be available at:  
> `http://localhost:7860/sdapi/v1/txt2img`

---

## ⚙️ System Requirements

- **Image Generation Model Size**: ~2GB
- **Minimum GPU Required**: 4GB VRAM
- **Tested GPU**: NVIDIA RTX 3050 with 4GB VRAM

---

## 🧪 Backend Setup (Flask)

1. **Install Dependencies**

```bash
pip install -r requirements.txt
```

2. **Run Flask App**

```bash
python app.py
```

By default, it runs at:  
`http://localhost:5000`

---

## 📄 Exporting PDF

After generating all pages and images, you can integrate a PDF export feature to compile all your pages, content, and panels into a printable PDF comic.

---

## 💡 Future Improvements

- Add drag-and-drop image rearrangement
- Upload custom images instead of AI-generated only
- Add multiple PDF themes and styles

---

## 📌 Notes

- All image generation happens **locally** using Stable Diffusion WebUI, so make sure it’s running before triggering generation.
- Text generation also happens locally via **Ollama**, giving you full offline capabilities.

---

## 🧑‍💻 Authors

**Sooryapandian S P**  
**Sudharshana B**  
**Shafeer Ahamed M**  
Comic Book Generator · 2025
