# CodeChronicle 📜

> **Trace the complete history of any code snippet — WHO wrote it, WHEN, WHY, and how it evolved.**

[![Version](https://img.shields.io/badge/version-0.0.1-blue)](https://github.com/Pranav140/CodeChronicle/releases)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.80%2B-007ACC)](https://code.visualstudio.com)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## What it does

Select any lines of code, right-click, and instantly see:

| | |
|---|---|
| ⏱ **Timeline** | Every commit that touched those lines, with expandable diffs |
| 🌱 **Evolution Story** | When the code was born, how many times it changed, and what it looks like now |
| 👥 **Authors** | Ranked contributors with GitHub links and % ownership |
| 🔗 **Related Files** | Files that always change alongside yours — hidden coupling revealed |
| 🚨 **Risk Insights** | Hotspot detection, complexity score, and smart recommendations |
| 🔍 **Diff Viewer** | Near-selection and full-file diff views per commit |

---

## Installation

### Option A — Download release (recommended)

1. Go to [Releases](https://github.com/Pranav140/CodeChronicle/releases)
2. Download `code-chronicle-0.0.1.zip` and extract it — you'll get `code-chronicle-0.0.1.vsix`
3. In VS Code: **Extensions panel** → `···` menu → **Install from VSIX...** → select the file
4. Reload VS Code when prompted

### Option B — Command line

```bash
# After extracting the .vsix from the .zip:
code --install-extension code-chronicle-0.0.1.vsix
```

### Option C — Build from source

```bash
git clone https://github.com/Pranav140/CodeChronicle.git
cd CodeChronicle
npm install
npm run compile
```
Press **F5** in VS Code to launch the Extension Development Host.

---

## Usage

1. Open any file inside a Git repository
2. **Select one or more lines** of code
3. **Right-click** → **Show CodeChronicle**
4. The panel opens to the right — explore the tabs:

```
Timeline  →  Author rows with diffs
Authors   →  Ranked contribution chart
Related   →  Co-changed files
```

> **Tip:** Click a commit hash to copy it. Click an author name to open their GitHub profile.

---

## Requirements

- VS Code **1.80.0** or higher
- A **Git repository** (the file must be tracked by git)

---

## Development

```bash
npm install        # install dependencies
npm run compile    # one-time TypeScript compile
npm run watch      # auto-compile on save
```

Press **F5** to open the Extension Development Host.  
After editing source files, press **Ctrl+R** in the host window to reload.

See [CONTRIBUTING.md](CONTRIBUTING.md) to learn how to contribute.

---

## License

MIT — see [LICENSE](LICENSE)
