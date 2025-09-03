@echo off
echo Setting up GitHub repository for deployment...
echo.

echo First, create a new repository on GitHub:
echo 1. Go to: https://github.com/new
echo 2. Name: mood-maestro-spotify-companion  
echo 3. Make it PUBLIC (required for free Netlify)
echo 4. Don't initialize with README
echo 5. Click "Create repository"
echo.

set /p username="Enter your GitHub username: "
echo.

echo Adding GitHub remote...
git remote add origin https://github.com/%username%/mood-maestro-spotify-companion.git

echo.
echo Pushing to GitHub...
git branch -M main
git push -u origin main

echo.
echo Done! Now go to Netlify to deploy:
echo https://app.netlify.com/
echo.
echo Follow the deployment guide: deploy-guide.md
pause