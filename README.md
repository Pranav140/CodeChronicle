# CodeChronicle 📜

Trace the complete history of any code snippet - WHO wrote it, WHEN, WHY, and how it evolved.

> Chronicle your code's journey through time with AI-powered insights and beautiful visualizations.

## 🚀 Unique Features

### 1. AI-Powered Code Insights
- **Risk Analysis**: Automatically detects high-churn "hotspot" code
- **Smart Recommendations**: Get actionable advice based on change patterns
- **Complexity Scoring**: Understand code stability at a glance

### 2. Interactive Timeline
- **Visual History**: Beautiful timeline with all modifications
- **Commit Details**: Author, date, message, and full diffs
- **Change Statistics**: See insertions, deletions, and files changed
- **Relative Time**: "2 days ago" instead of raw timestamps

### 3. Collaboration Intelligence
- **Author Contributions**: Visual chart showing who wrote what
- **Multiple Contributors Alert**: Warns when many devs touch the same code
- **Most Active Author**: Instantly see the code owner

### 4. Related Files Discovery
- **Co-Changed Files**: Find files that change together with your code
- **Change Frequency**: See how often files are modified together
- **Dependency Insights**: Understand hidden relationships

### 5. Code Evolution Metrics
- **Code Age**: How old is this code?
- **Change Frequency**: How often does it change?
- **Total Commits**: Complete modification count
- **Hotspot Detection**: Identifies problematic areas

## Usage

1. Select any lines of code in your editor
2. Right-click and choose "Show Code Genealogy"
3. View the complete history in an interactive panel

## Requirements

- Git repository
- VS Code 1.80.0 or higher

## Installation

1. Clone this repository
2. Run `npm install`
3. Run `npm run compile`
4. Press F5 to open a new VS Code window with the extension loaded
5. Open a Git repository and select some code
6. Right-click and choose "Show Code Genealogy"

## Development

```bash
npm install
npm run compile
# Press F5 in VS Code to debug
```




## Usage

1. Open any file in a Git repository
2. Select the lines of code you want to analyze
3. Right-click and choose "Show CodeChronicle"
4. Explore the interactive panel with 3 tabs:
   - **Timeline**: Complete commit history with diffs
   - **Authors**: Visual contribution chart
   - **Related Files**: Files that change together

## Why CodeChronicle is Unique

Unlike other Git history tools, CodeChronicle provides:

- **AI-powered insights** that detect code hotspots and risks
- **Smart recommendations** based on change patterns
- **Related files discovery** to understand dependencies
- **Beautiful visualizations** with interactive charts
- **Context-aware analysis** that goes beyond simple blame

## Requirements

- Git repository
- VS Code 1.80.0 or higher

## Installation & Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Debug in VS Code
# Press F5 to open a new window with the extension loaded
```

## Publishing to Marketplace

```bash
# Install vsce
npm install -g @vscode/vsce

# Package extension
vsce package

# Publish (requires publisher account)
vsce publish
```

## Features in Detail

### 🎯 Risk Detection
Automatically identifies high-churn code that may need refactoring or additional testing.

### 📊 Visual Analytics
Beautiful charts showing author contributions and change patterns over time.

### 🔍 Smart Discovery
Finds files that are frequently changed together, revealing hidden dependencies.

### ⚡ Performance
Optimized Git operations with progress indicators for large repositories.

### 🎨 VS Code Integration
Native look and feel with full theme support and responsive design.

## License

MIT
