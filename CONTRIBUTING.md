# Contributing to CodeChronicle

Thanks for taking the time to contribute! Here's how to get started.

---

## Project structure

```
src/
  extension.ts      — activation, command registration
  gitService.ts     — all git operations (blame, log, diff, insights)
  genealogyPanel.ts — webview panel (HTML/CSS/JS)
out/                — compiled JavaScript (generated, do not edit)
```

---

## Setting up locally

```bash
git clone https://github.com/Pranav140/CodeChronicle.git
cd CodeChronicle
npm install
npm run watch        # auto-compiles TypeScript on save
```

Press **F5** in VS Code to open the **Extension Development Host** — a second VS Code window with the extension loaded. After editing source files, press **Ctrl+R** in that window to reload.

---

## Making changes

### Bug fix
1. Reproduce the bug in the Extension Development Host
2. Find the relevant file (`gitService.ts` for git logic, `genealogyPanel.ts` for UI)
3. Fix it, compile (`npm run compile`), verify zero errors
4. Test in the host window

### New feature
1. Open an issue first to discuss the idea
2. Keep changes focused — one feature per PR
3. Test on at least one real Git repository

---

## Code conventions

- **TypeScript** — all source files are `.ts`, no `any` types unless unavoidable
- **Security** — never use `innerHTML` with user/git data; always use `_escapeHtml()` 
- **CSP** — all JS in the webview must be inside the `<script nonce="...">` block; no inline `onclick` handlers
- **Git commands** — use `execAsync` (promisified) for async operations; `execSync` only for synchronous necessities
- **Error handling** — git commands can fail silently; always wrap in try/catch and return a sensible default

---

## Submitting a PR

1. Fork the repo and create a branch: `git checkout -b feat/my-feature`
2. Make your changes
3. Run `npm run compile` — must have **zero errors**
4. Push and open a Pull Request against `main`
5. Describe what changed and why

---

## Reporting bugs

Open an [issue](https://github.com/Pranav140/CodeChronicle/issues) with:
- VS Code version
- What you did (file type, number of lines selected)
- What you expected vs what happened
- Any error messages from the Output panel (`Help` → `Toggle Developer Tools` → Console)

---

## Ideas for contribution

- [ ] Support for more VCS (e.g. Mercurial)
- [ ] Line-level blame gutter decorations
- [ ] Filter timeline by author or date range
- [ ] Export history as Markdown/HTML report
- [ ] Dark/light theme toggle in the panel
