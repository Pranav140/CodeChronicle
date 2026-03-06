# CodeChronicle 📜

Trace the complete history of any code snippet — who wrote it, when, why, and how it evolved — with AI-powered insights and beautiful visualizations.

## Features

- **Interactive Timeline** — Full commit history with expandable diffs, author, date, and change stats
- **AI Insights** — Automatic hotspot detection, risk scoring, and smart recommendations
- **Author Analytics** — Visual contribution chart showing who wrote what
- **Related Files** — Discover files that change together, revealing hidden dependencies
- **Code Metrics** — Age, change frequency, complexity, and total commit count

## Requirements

- VS Code 1.80.0 or higher
- A Git repository

## Installation

### From VSIX (easiest)

1. Go to [Releases](https://github.com/Pranav140/CodeChronicle/releases) and download the `.vsix` file
2. In VS Code: `Ctrl+Shift+P` → **Extensions: Install from VSIX** → select the file
3. Reload VS Code

Or via command line:
```bash
code --install-extension code-chronicle-0.0.1.vsix
```

### From Source

```bash
git clone https://github.com/Pranav140/CodeChronicle.git
cd CodeChronicle
npm install
npm run compile
```
Then press **F5** in VS Code to launch the Extension Development Host.

## Usage

1. Open any file inside a Git repository
2. Select the lines of code you want to analyze
3. Right-click → **Show CodeChronicle**
4. Explore the panel:
   - **Timeline** — commit history with diffs
   - **Authors** — contribution chart
   - **Related Files** — co-changed files

## Development

```bash
npm install          # install dependencies
npm run compile      # compile TypeScript once
npm run watch        # compile on every save
```
Press **F5** to open the Extension Development Host for live testing. After changing source files, press `Ctrl+R` in the Host window to reload.

## Publishing

See [PUBLISHING.md](PUBLISHING.md) for step-by-step instructions to publish to the VS Code Marketplace.

## License

MIT
