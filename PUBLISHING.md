# Publishing CodeChronicle to VS Code Marketplace

## Prerequisites

1. Microsoft/GitHub account
2. Node.js and npm installed
3. Extension tested and working

## Step-by-Step Guide

### 1. Create Publisher Account

1. Go to https://marketplace.visualstudio.com/manage
2. Sign in with Microsoft or GitHub
3. Click "Create Publisher"
4. Choose a unique publisher ID (e.g., "pranav140")
5. Fill in your details

### 2. Get Personal Access Token

1. Go to https://dev.azure.com/
2. Click on your profile → Security → Personal Access Tokens
3. Click "New Token"
4. Name: "VS Code Publishing"
5. Organization: All accessible organizations
6. Scopes: Select "Marketplace" → "Manage"
7. Click "Create" and COPY THE TOKEN (you won't see it again!)

### 3. Update package.json

Replace `YOUR_PUBLISHER_ID` in package.json with your actual publisher ID from step 1.

### 4. Create an Icon (Optional)

1. Open `create-icon.html` in a browser
2. Right-click the canvas and save as `icon.png`
3. Or create your own 128x128 PNG icon

If you skip this, remove the `"icon": "icon.png"` line from package.json.

### 5. Package the Extension

```bash
# Make sure dependencies are installed
npm install

# Compile TypeScript
npm run compile

# Package the extension
vsce package
```

This creates a `.vsix` file (e.g., `code-chronicle-0.0.1.vsix`)

### 6. Test the Package Locally

```bash
# Install in VS Code
code --install-extension code-chronicle-0.0.1.vsix
```

Test it thoroughly before publishing!

### 7. Publish to Marketplace

```bash
# Login with your token
vsce login YOUR_PUBLISHER_ID
# Paste your Personal Access Token when prompted

# Publish
vsce publish
```

### 8. Verify Publication

1. Go to https://marketplace.visualstudio.com/
2. Search for "CodeChronicle"
3. Your extension should appear within a few minutes!

## Updating the Extension

When you make changes:

```bash
# Update version in package.json (e.g., 0.0.1 → 0.0.2)
# Then:
npm run compile
vsce publish
```

Or use version bump commands:
```bash
vsce publish patch  # 0.0.1 → 0.0.2
vsce publish minor  # 0.0.1 → 0.1.0
vsce publish major  # 0.0.1 → 1.0.0
```

## Alternative: Share .vsix File Directly

If you don't want to publish publicly yet:

1. Create the .vsix file: `vsce package`
2. Share the file on GitHub releases
3. Users install with: `code --install-extension code-chronicle-0.0.1.vsix`

## Troubleshooting

### "Missing publisher name"
- Add `"publisher": "your-id"` to package.json

### "Missing repository"
- Already added in package.json

### "Missing icon"
- Either create icon.png or remove the icon field from package.json

### "Missing README"
- Already have README.md ✓

### "Missing LICENSE"
- Already have LICENSE ✓

## Resources

- [VS Code Publishing Guide](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [Marketplace Management](https://marketplace.visualstudio.com/manage)
- [Azure DevOps](https://dev.azure.com/)
