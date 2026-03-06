# 🚀 Quick Start Guide

## For You (Testing Locally)

### Option 1: Press F5 (Easiest for Development)
1. Open this project in VS Code
2. Press `F5` (or Run → Start Debugging)
3. A new VS Code window opens with the extension loaded
4. Open any Git repository
5. Select some code
6. Right-click → "Show CodeChronicle"

### Option 2: Install the .vsix File
1. Open terminal in this folder
2. Run: `code --install-extension code-chronicle-0.0.1.vsix`
3. Reload VS Code
4. Test it on any Git repo!

---

## For Others (Sharing with Friends/Team)

### Method 1: GitHub Releases (Recommended)

1. **Create a Release on GitHub:**
   - Go to https://github.com/Pranav140/CodeChronicle/releases
   - Click "Create a new release"
   - Tag: `v0.0.1`
   - Title: `CodeChronicle v0.0.1 - Initial Release`
   - Upload the `code-chronicle-0.0.1.vsix` file
   - Click "Publish release"

2. **Share the link** - Others can:
   - Download the `.vsix` file
   - In VS Code: `Ctrl+Shift+P` → "Install from VSIX"
   - Select the downloaded file
   - Done!

### Method 2: Direct File Share

1. Send them the `code-chronicle-0.0.1.vsix` file (via email, Slack, etc.)
2. They install it:
   ```bash
   code --install-extension code-chronicle-0.0.1.vsix
   ```

### Method 3: Clone and Build (For Developers)

Share this with them:
```bash
git clone https://github.com/Pranav140/CodeChronicle.git
cd CodeChronicle
npm install
npm run compile
code --install-extension code-chronicle-0.0.1.vsix
```

---

## Testing Checklist

Before sharing, test these scenarios:

- [ ] Select code in a Git repo
- [ ] Right-click shows "Show CodeChronicle"
- [ ] Timeline displays correctly
- [ ] Authors tab shows contributors
- [ ] Related files tab works
- [ ] Diffs expand/collapse
- [ ] Works on different file types
- [ ] Works on large files
- [ ] Error handling for non-Git files

---

## Demo Repository

Want to test on a real project? Try these:
- Your own projects
- https://github.com/microsoft/vscode (large, many contributors)
- https://github.com/facebook/react (complex history)

---

## Troubleshooting

### "No history found"
- Make sure the file is in a Git repository
- Make sure the file has been committed

### Extension not showing
- Reload VS Code: `Ctrl+Shift+P` → "Reload Window"
- Check if extension is enabled in Extensions panel

### Command not in context menu
- Make sure you have code selected
- Right-click on the selection, not empty space

---

## Next Steps

Once tested and working:
1. Create a GitHub Release (see Method 1 above)
2. Share on LinkedIn/Twitter with screenshots
3. Add to your resume/portfolio
4. Consider publishing to VS Code Marketplace (see PUBLISHING.md)
