# Installing CodeChronicle

## For Users: Install from GitHub

### Option 1: Download and Install .vsix (Easiest)

1. Go to [Releases](https://github.com/Pranav140/CodeChronicle/releases)
2. Download the latest `.vsix` file
3. Open VS Code
4. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
5. Type "Install from VSIX"
6. Select the downloaded file
7. Reload VS Code

### Option 2: Build from Source

```bash
# Clone the repository
git clone https://github.com/Pranav140/CodeChronicle.git
cd CodeChronicle

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Package the extension
npm install -g @vscode/vsce
vsce package

# Install the generated .vsix file
code --install-extension code-chronicle-0.0.1.vsix
```

## Usage

1. Open any file in a Git repository
2. Select some lines of code
3. Right-click and choose "Show CodeChronicle"
4. Explore the interactive timeline!

## Requirements

- VS Code 1.80.0 or higher
- Git repository

## Uninstall

1. Open VS Code Extensions panel (`Ctrl+Shift+X`)
2. Search for "CodeChronicle"
3. Click "Uninstall"
