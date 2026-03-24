# Deploying to Hugging Face Spaces

This guide will help you deploy the Disease Prediction API to Hugging Face Spaces.

## Prerequisites

1. A Hugging Face account (sign up at https://huggingface.co)
2. Git installed on your machine
3. Git LFS installed (for large model files)

## Step-by-Step Deployment

### 1. Install Git LFS (if not already installed)

Git LFS is required for the model files which are larger than 10MB.

**Windows:**
```bash
# Download from https://git-lfs.github.com/
# Or use chocolatey:
choco install git-lfs
git lfs install
```

**Mac:**
```bash
brew install git-lfs
git lfs install
```

**Linux:**
```bash
sudo apt-get install git-lfs
git lfs install
```

### 2. Create a New Space on Hugging Face

1. Go to https://huggingface.co/spaces
2. Click "Create new Space"
3. Choose a name (e.g., "disease-prediction-api")
4. Select "Docker" as the SDK
5. Choose "Public" or "Private" visibility
6. Click "Create Space"

### 3. Clone Your New Space Repository

```bash
git clone https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME
cd YOUR_SPACE_NAME
```

### 4. Copy Your Application Files

Copy all the files from your current directory to the cloned space:

```bash
# Copy all necessary files
cp -r models/ ../YOUR_SPACE_NAME/
cp app.py ../YOUR_SPACE_NAME/
cp model_loader.py ../YOUR_SPACE_NAME/
cp predictor.py ../YOUR_SPACE_NAME/
cp schemas.py ../YOUR_SPACE_NAME/
cp __init__.py ../YOUR_SPACE_NAME/
cp requirements.txt ../YOUR_SPACE_NAME/
cp Dockerfile ../YOUR_SPACE_NAME/
cp README.md ../YOUR_SPACE_NAME/
cp .gitignore ../YOUR_SPACE_NAME/
```

### 5. Track Model Files with Git LFS

```bash
cd YOUR_SPACE_NAME
git lfs track "*.cbm"
git lfs track "*.pkl"
git add .gitattributes
```

### 6. Commit and Push

```bash
git add .
git commit -m "Initial deployment of disease prediction API"
git push
```

### 7. Wait for Build

- Go to your Space page on Hugging Face
- The Docker container will build automatically (this may take 5-10 minutes)
- Once built, your API will be live at: `https://YOUR_USERNAME-YOUR_SPACE_NAME.hf.space`

## Testing Your Deployment

Once deployed, test your API:

```bash
# Health check
curl https://YOUR_USERNAME-YOUR_SPACE_NAME.hf.space/health

# Get symptoms
curl https://YOUR_USERNAME-YOUR_SPACE_NAME.hf.space/symptoms

# Make a prediction
curl -X POST https://YOUR_USERNAME-YOUR_SPACE_NAME.hf.space/predict \
  -H "Content-Type: application/json" \
  -d '{"symptoms": ["fever", "cough", "headache"]}'
```

## API Documentation

Once deployed, visit:
- API Docs: `https://YOUR_USERNAME-YOUR_SPACE_NAME.hf.space/docs`
- ReDoc: `https://YOUR_USERNAME-YOUR_SPACE_NAME.hf.space/redoc`

## Updating Your Deployment

To update your deployed app:

```bash
# Make your changes
git add .
git commit -m "Description of changes"
git push
```

The Space will automatically rebuild with your changes.

## Troubleshooting

### Build Fails
- Check the build logs in your Space's "Logs" tab
- Ensure all dependencies are in requirements.txt
- Verify model files are tracked with Git LFS

### Model Files Too Large
- Ensure Git LFS is properly installed and configured
- Check that .gitattributes includes your model file extensions

### API Not Responding
- Check the container logs in the Space
- Verify the port is set to 7860 (Hugging Face default)
- Ensure CORS is configured to allow all origins

### Out of Memory
- Hugging Face free tier has memory limits
- Consider upgrading to a paid tier for larger models
- Optimize model loading in model_loader.py

## Environment Variables (Optional)

If you need environment variables:

1. Go to your Space settings
2. Add variables in the "Variables and secrets" section
3. Access them in your code with `os.getenv("VARIABLE_NAME")`

## Custom Domain (Optional)

Hugging Face Pro users can set up custom domains in Space settings.

## Notes

- Free tier Spaces may sleep after inactivity
- First request after sleep will be slower (cold start)
- Consider upgrading for production use
- Monitor usage in your Hugging Face dashboard
