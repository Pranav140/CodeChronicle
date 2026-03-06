import * as vscode from 'vscode';
import { CommitInfo, CodeEvolution, RelatedFile, CodeInsight } from './gitService';

export class GenealogyPanel {
    public static currentPanel: GenealogyPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    public static createOrShow(
        extensionUri: vscode.Uri,
        history: CommitInfo[],
        filePath: string,
        startLine: number,
        endLine: number,
        evolution: CodeEvolution,
        relatedFiles: RelatedFile[],
        insights: CodeInsight
    ) {
        const column = vscode.ViewColumn.Two;

        if (GenealogyPanel.currentPanel) {
            GenealogyPanel.currentPanel._panel.reveal(column);
            GenealogyPanel.currentPanel._update(history, filePath, startLine, endLine, evolution, relatedFiles, insights);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'codeChronicle',
            'CodeChronicle',
            column,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        GenealogyPanel.currentPanel = new GenealogyPanel(panel, extensionUri);
        GenealogyPanel.currentPanel._update(history, filePath, startLine, endLine, evolution, relatedFiles, insights);
    }

    private _update(
        history: CommitInfo[], 
        filePath: string, 
        startLine: number, 
        endLine: number,
        evolution: CodeEvolution,
        relatedFiles: RelatedFile[],
        insights: CodeInsight
    ) {
        this._panel.webview.html = this._getHtmlContent(history, filePath, startLine, endLine, evolution, relatedFiles, insights);
    }

    private _getHtmlContent(
        history: CommitInfo[], 
        filePath: string, 
        startLine: number, 
        endLine: number,
        evolution: CodeEvolution,
        relatedFiles: RelatedFile[],
        insights: CodeInsight
    ): string {
        const nonce = this._getNonce();
        const fileName = filePath.split(/[\\/]/).pop();
        const authorChartHtml = this._generateAuthorChart(evolution.authorContributions);
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodeChronicle</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
        }
        .header {
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 2px solid var(--vscode-panel-border);
        }
        .header h1 { margin: 0 0 10px 0; font-size: 24px; }
        .file-info { color: var(--vscode-descriptionForeground); font-size: 14px; }
        .insights-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        .insight-card {
            background: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 8px;
            padding: 15px;
            border-left: 4px solid var(--vscode-textLink-foreground);
        }
        .insight-card.risk-high { border-left-color: #f48771; }
        .insight-card.risk-medium { border-left-color: #dcdcaa; }
        .insight-card.risk-low { border-left-color: #4ec9b0; }
        .insight-title {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .insight-value { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .insight-subtitle { font-size: 12px; color: var(--vscode-descriptionForeground); }
        .recommendation-box {
            background: var(--vscode-textCodeBlock-background);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 30px;
            border-left: 4px solid var(--vscode-textLink-foreground);
        }
        .recommendation-box.risk-high {
            border-left-color: #f48771;
            background: rgba(244, 135, 113, 0.1);
        }
        .recommendation-box.risk-medium {
            border-left-color: #dcdcaa;
            background: rgba(220, 220, 170, 0.1);
        }
        .tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .tab {
            padding: 10px 20px;
            cursor: pointer;
            border: none;
            background: none;
            color: var(--vscode-foreground);
            font-size: 14px;
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
        }
        .tab:hover { background: var(--vscode-list-hoverBackground); }
        .tab.active {
            border-bottom-color: var(--vscode-textLink-foreground);
            color: var(--vscode-textLink-foreground);
        }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .related-files {
            background: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
        }
        .related-file {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px;
            margin: 5px 0;
            background: var(--vscode-textCodeBlock-background);
            border-radius: 4px;
            font-size: 13px;
        }
        .related-file-path { font-family: monospace; color: var(--vscode-textLink-foreground); }
        .related-file-count {
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
        }
        .author-chart { margin-top: 15px; }
        .author-bar { display: flex; align-items: center; margin: 8px 0; }
        .author-name {
            width: 150px;
            font-size: 13px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .author-bar-fill {
            height: 20px;
            background: linear-gradient(90deg, var(--vscode-textLink-foreground), var(--vscode-textLink-activeForeground));
            border-radius: 4px;
            margin: 0 10px;
            transition: width 0.3s;
        }
        .author-count { font-size: 12px; color: var(--vscode-descriptionForeground); }
        .timeline { position: relative; padding-left: 40px; }
        .timeline::before {
            content: '';
            position: absolute;
            left: 15px;
            top: 0;
            bottom: 0;
            width: 2px;
            background: var(--vscode-panel-border);
        }
        .commit {
            position: relative;
            margin-bottom: 30px;
            padding: 20px;
            background: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 8px;
            border-left: 4px solid var(--vscode-textLink-foreground);
        }
        .commit::before {
            content: '';
            position: absolute;
            left: -29px;
            top: 25px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: var(--vscode-textLink-foreground);
            border: 3px solid var(--vscode-editor-background);
        }
        .commit-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            flex-wrap: wrap;
            gap: 10px;
        }
        .commit-hash {
            font-family: monospace;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
        }
        .commit-date { color: var(--vscode-descriptionForeground); font-size: 12px; }
        .commit-stats {
            display: flex;
            gap: 10px;
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
        }
        .stat {
            background: var(--vscode-textCodeBlock-background);
            padding: 2px 6px;
            border-radius: 3px;
        }
        .stat.add { color: #4ec9b0; }
        .stat.del { color: #f48771; }
        .commit-author {
            font-weight: bold;
            margin-bottom: 5px;
            color: var(--vscode-textLink-foreground);
        }
        .commit-message { margin-bottom: 15px; font-size: 14px; }
        .diff-container {
            background: var(--vscode-textCodeBlock-background);
            border-radius: 4px;
            padding: 10px;
            overflow-x: auto;
            max-height: 300px;
            overflow-y: auto;
        }
        .diff-line { font-family: monospace; font-size: 12px; white-space: pre; line-height: 1.5; }
        .diff-add { background: rgba(0, 255, 0, 0.1); color: #4ec9b0; }
        .diff-remove { background: rgba(255, 0, 0, 0.1); color: #f48771; }
        .no-history { text-align: center; padding: 40px; color: var(--vscode-descriptionForeground); }
        .toggle-diff {
            cursor: pointer;
            color: var(--vscode-textLink-foreground);
            text-decoration: underline;
            font-size: 12px;
            margin-top: 10px;
            display: inline-block;
        }
        .toggle-diff:hover { color: var(--vscode-textLink-activeForeground); }
    </style>
</head>
<body>
    <div class="header">
        <h1>📜 CodeChronicle</h1>
        <div class="file-info">
            <strong>${fileName}</strong> (Lines ${startLine}-${endLine})
        </div>
    </div>

    ${history.length === 0 ? `
        <div class="no-history">
            <h2>No history found</h2>
            <p>This code might be uncommitted or the file is not tracked by Git.</p>
        </div>
    ` : `
        <div class="recommendation-box risk-${insights.riskLevel}">
            <strong>💡 AI Insight:</strong> ${insights.recommendation}
        </div>

        <div class="insights-grid">
            <div class="insight-card risk-${insights.riskLevel}">
                <div class="insight-title">Total Changes</div>
                <div class="insight-value">${evolution.totalCommits}</div>
                <div class="insight-subtitle">${insights.isHotspot ? '🔥 Hotspot' : 'Stable'}</div>
            </div>
            <div class="insight-card">
                <div class="insight-title">Contributors</div>
                <div class="insight-value">${evolution.totalAuthors}</div>
                <div class="insight-subtitle">${evolution.mostActiveAuthor}</div>
            </div>
            <div class="insight-card">
                <div class="insight-title">Code Age</div>
                <div class="insight-value">${evolution.codeAge}</div>
                <div class="insight-subtitle">${evolution.changeFrequency}</div>
            </div>
            <div class="insight-card risk-${insights.riskLevel}">
                <div class="insight-title">Complexity</div>
                <div class="insight-value">${insights.complexity}</div>
                <div class="insight-subtitle">Risk: ${insights.riskLevel.toUpperCase()}</div>
            </div>
        </div>

        <div class="tabs">
            <button class="tab active" onclick="switchTab(event, 'timeline')">📅 Timeline</button>
            <button class="tab" onclick="switchTab(event, 'authors')">👥 Authors</button>
            <button class="tab" onclick="switchTab(event, 'related')">🔗 Related Files</button>
        </div>

        <div id="timeline" class="tab-content active">
            <div class="timeline">
                ${history.map((commit, index) => `
                    <div class="commit">
                        <div class="commit-header">
                            <span class="commit-hash">${commit.hash}</span>
                            <span class="commit-date">${commit.relativeTime}</span>
                        </div>
                        <div class="commit-stats">
                            <span class="stat">📁 ${commit.filesChanged} files</span>
                            <span class="stat add">+${commit.insertions}</span>
                            <span class="stat del">-${commit.deletions}</span>
                        </div>
                        <div class="commit-author">👤 ${this._escapeHtml(commit.author)}</div>
                        <div class="commit-message">${this._escapeHtml(commit.message)}</div>
                        <span class="toggle-diff" onclick="toggleDiff(${index})">Show changes ▼</span>
                        <div class="diff-container" id="diff-${index}" style="display: none;">
                            ${this._formatDiff(commit.diff)}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div id="authors" class="tab-content">
            <div class="related-files">
                <h3 style="margin-top: 0;">Contribution Distribution</h3>
                ${authorChartHtml}
            </div>
        </div>

        <div id="related" class="tab-content">
            <div class="related-files">
                <h3 style="margin-top: 0;">Files Changed Together</h3>
                ${relatedFiles.length === 0 ? '<p>No related files found</p>' : relatedFiles.map(file => `
                    <div class="related-file">
                        <span class="related-file-path">${this._escapeHtml(file.path)}</span>
                        <span class="related-file-count">${file.changeCount} times</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `}

    <script nonce="${nonce}">
        function toggleDiff(index) {
            const diffEl = document.getElementById('diff-' + index);
            const toggleEl = diffEl.previousElementSibling;
            if (diffEl.style.display === 'none') {
                diffEl.style.display = 'block';
                toggleEl.textContent = 'Hide changes ▲';
            } else {
                diffEl.style.display = 'none';
                toggleEl.textContent = 'Show changes ▼';
            }
        }

        function switchTab(event, tabName) {
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            event.target.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        }
    </script>
</body>
</html>`;
    }

    private _generateAuthorChart(contributions: Map<string, number>): string {
        const maxContributions = Math.max(...Array.from(contributions.values()));
        const entries = Array.from(contributions.entries()).sort((a, b) => b[1] - a[1]);

        return `<div class="author-chart">
            ${entries.map(([author, count]) => {
                const percentage = (count / maxContributions) * 100;
                return `
                    <div class="author-bar">
                        <div class="author-name" title="${this._escapeHtml(author)}">${this._escapeHtml(author)}</div>
                        <div class="author-bar-fill" style="width: ${percentage}%"></div>
                        <div class="author-count">${count} commits</div>
                    </div>
                `;
            }).join('')}
        </div>`;
    }

    private _formatDiff(diff: string): string {
        const lines = diff.split('\n');
        return lines.map(line => {
            const escaped = this._escapeHtml(line);
            if (line.startsWith('+') && !line.startsWith('+++')) {
                return `<div class="diff-line diff-add">${escaped}</div>`;
            } else if (line.startsWith('-') && !line.startsWith('---')) {
                return `<div class="diff-line diff-remove">${escaped}</div>`;
            } else {
                return `<div class="diff-line">${escaped}</div>`;
            }
        }).join('');
    }

    private _escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    private _getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    public dispose() {
        GenealogyPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
