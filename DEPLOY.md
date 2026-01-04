# Deployment Guide

This guide covers deploying your Clipboard Manager to both GitHub and Vercel.

## Part 1: Deploy to GitHub

### Step 1: Create a GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Name it (e.g., "clipboard-manager-extension")
5. Choose public or private
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

### Step 2: Connect and Push

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add the remote (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

### Alternative: Using GitHub CLI

If you have GitHub CLI installed:

```bash
gh repo create clipboard-manager-extension --public --source=. --remote=origin --push
```

### Step 3: Verify

Visit your repository on GitHub to confirm all files are uploaded!

---

## Part 2: Deploy to Vercel

Vercel will host your web interface with automatic deployments from GitHub.

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push to GitHub first** (complete Part 1 above)

2. Go to [vercel.com](https://vercel.com) and sign in (or create an account)

3. Click "Add New..." → "Project"

4. Import your GitHub repository:
   - Select your repository from the list
   - Vercel will auto-detect the settings

5. Configure the project:
   - **Framework Preset**: Other (or leave as auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: Leave empty (static site)
   - **Output Directory**: Leave empty (serves from root)

6. Click "Deploy"

7. Your site will be live at: `https://your-project-name.vercel.app`

### Option 2: Deploy via Vercel CLI

1. Install Vercel CLI (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. For production deployment:
   ```bash
   vercel --prod
   ```

### Automatic Deployments

Once connected to GitHub, Vercel will automatically:
- Deploy on every push to main/master
- Create preview deployments for pull requests
- Provide instant rollbacks

### Custom Domain (Optional)

1. Go to your project settings on Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Follow the DNS configuration instructions

---

## Project Structure for Vercel

The web interface files are in the root:
- `index.html` - Main web interface
- `styles.css` - Styling
- `app.js` - Application logic

The `vercel.json` configuration file is already set up for optimal static site hosting.

---

## Troubleshooting

### If deployment fails:
- Ensure all files are committed and pushed to GitHub
- Check that `index.html` is in the root directory
- Verify `vercel.json` syntax is correct

### If the site loads but doesn't work:
- Check browser console for errors
- Ensure all file paths are relative (not absolute)
- Verify CORS settings if using extension sync

