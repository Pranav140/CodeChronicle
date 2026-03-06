import * as vscode from 'vscode';
import { CommitInfo, CodeEvolution, RelatedFile, CodeInsight } from './gitService';

export class GenealogyPanel {
    public static currentPanel: GenealogyPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        // Handle GitHub link clicks from the webview
        this._panel.webview.onDidReceiveMessage(
            (message) => {
                if (message.command === 'openUrl') {
                    const url = message.url as string;
                    if (url && url.startsWith('https://github.com/')) {
                        vscode.env.openExternal(vscode.Uri.parse(url));
                    }
                }
            },
            null,
            this._disposables
        );
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
        // Build email lookup from history for GitHub links
        const emailMap = new Map<string, string>();
        history.forEach(c => { if (c.authorEmail) { emailMap.set(c.author, c.authorEmail); } });
        const authorChartHtml = this._generateAuthorChart(evolution.authorContributions, emailMap);
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; connect-src https://github.com;">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodeChronicle</title>
    <style>
        :root {
            --accent: var(--vscode-textLink-foreground);
            --accent-dim: rgba(0,0,0,.0);
            --green: #4ec9b0;
            --red: #f48771;
            --yellow: #dcdcaa;
            --blue: #569cd6;
            --purple: #c586c0;
            --border: var(--vscode-panel-border);
            --bg: var(--vscode-editor-background);
            --bg2: var(--vscode-editor-inactiveSelectionBackground);
            --bg3: var(--vscode-textCodeBlock-background);
            --fg: var(--vscode-foreground);
            --fg2: var(--vscode-descriptionForeground);
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: var(--vscode-font-family);
            font-size: 13px;
            padding: 0 0 60px;
            color: var(--fg);
            background: var(--bg);
            line-height: 1.5;
        }
        a { color: var(--accent); text-decoration: none; }
        a:hover { text-decoration: underline; color: var(--vscode-textLink-activeForeground); }

        /* ── Scrollbar ── */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--fg2); }

        /* ── Header ── */
        .header {
            position: sticky;
            top: 0;
            z-index: 10;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 20px 12px;
            background: var(--bg);
            border-bottom: 1px solid var(--border);
            backdrop-filter: blur(8px);
        }
        .header-icon {
            width: 32px; height: 32px;
            background: linear-gradient(135deg, var(--accent), var(--purple));
            border-radius: 8px;
            display: flex; align-items: center; justify-content: center;
            font-size: 16px;
            flex-shrink: 0;
        }
        .header-text { flex: 1; min-width: 0; }
        .header h1 {
            font-size: 15px;
            font-weight: 700;
            letter-spacing: -0.2px;
            background: linear-gradient(90deg, var(--fg), var(--fg2));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .header-sub {
            font-size: 11px;
            color: var(--fg2);
            margin-top: 1px;
        }
        .file-badge {
            font-family: monospace;
            font-size: 11px;
            background: var(--bg3);
            color: var(--accent);
            padding: 3px 10px;
            border-radius: 12px;
            border: 1px solid var(--border);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 200px;
        }

        /* ── Main Content ── */
        .main-content { padding: 16px 20px 0; }

        /* ── Insight banner ── */
        .recommendation-box {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            padding: 11px 14px;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 12px;
            line-height: 1.6;
            background: var(--bg3);
            border: 1px solid var(--border);
            border-left: 3px solid var(--accent);
        }
        .recommendation-box.risk-high  { border-left-color: var(--red); background: rgba(244,135,113,.06); border-color: rgba(244,135,113,.25); }
        .recommendation-box.risk-medium { border-left-color: var(--yellow); background: rgba(220,220,170,.06); border-color: rgba(220,220,170,.25); }
        .recommendation-box.risk-low   { border-left-color: var(--green); background: rgba(78,201,176,.06); border-color: rgba(78,201,176,.25); }
        .recommendation-icon { font-size: 15px; margin-top: 1px; flex-shrink: 0; }
        .recommendation-text { flex: 1; }

        /* ── Metrics row ── */
        .metrics-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 18px;
        }
        .metric {
            padding: 12px 14px;
            border-radius: 10px;
            background: var(--bg2);
            border: 1px solid var(--border);
            position: relative;
            overflow: hidden;
            cursor: default;
            transition: transform .15s, border-color .15s;
        }
        .metric:hover { transform: translateY(-1px); border-color: var(--accent); }
        .metric::before {
            content: '';
            position: absolute;
            inset: 0;
            opacity: .04;
            background: linear-gradient(135deg, var(--accent), transparent);
            pointer-events: none;
        }
        .metric.risk-high::before   { background: linear-gradient(135deg, var(--red), transparent); }
        .metric.risk-medium::before { background: linear-gradient(135deg, var(--yellow), transparent); }
        .metric.risk-low::before    { background: linear-gradient(135deg, var(--green), transparent); }
        .metric-icon { font-size: 18px; margin-bottom: 6px; }
        .metric-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: .7px;
            color: var(--fg2);
            margin-bottom: 4px;
        }
        .metric-value {
            font-size: 26px;
            font-weight: 800;
            line-height: 1;
            margin-bottom: 4px;
            color: var(--fg);
        }
        .metric.risk-high   .metric-value { color: var(--red); }
        .metric.risk-medium .metric-value { color: var(--yellow); }
        .metric.risk-low    .metric-value { color: var(--green); }
        .metric-sub { font-size: 11px; color: var(--fg2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* ── Tabs ── */
        .tabs {
            display: flex;
            gap: 0;
            margin-bottom: 16px;
            border-bottom: 1px solid var(--border);
        }
        .tab {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 9px 16px;
            cursor: pointer;
            border: none;
            background: none;
            color: var(--fg2);
            font-size: 12px;
            font-weight: 500;
            border-bottom: 2px solid transparent;
            margin-bottom: -1px;
            transition: color .15s;
            white-space: nowrap;
        }
        .tab-count {
            background: var(--bg3);
            border: 1px solid var(--border);
            color: var(--fg2);
            font-size: 10px;
            padding: 1px 6px;
            border-radius: 8px;
            font-weight: 600;
        }
        .tab:hover { color: var(--fg); }
        .tab:hover .tab-count { color: var(--fg); border-color: var(--fg2); }
        .tab.active {
            border-bottom-color: var(--accent);
            color: var(--accent);
        }
        .tab.active .tab-count {
            background: color-mix(in srgb, var(--accent) 15%, transparent);
            border-color: color-mix(in srgb, var(--accent) 35%, transparent);
            color: var(--accent);
        }
        .tab-content { display: none; }
        .tab-content.active { display: block; }

        /* ── Timeline ── */
        .timeline { position: relative; padding-left: 30px; }
        .timeline::before {
            content: '';
            position: absolute;
            left: 9px; top: 20px; bottom: 0;
            width: 2px;
            background: linear-gradient(180deg, var(--accent), transparent);
            opacity: .25;
        }
        .commit {
            position: relative;
            margin-bottom: 12px;
            background: var(--bg2);
            border-radius: 10px;
            border: 1px solid var(--border);
            overflow: hidden;
            transition: border-color .15s, box-shadow .15s;
        }
        .commit:hover {
            border-color: color-mix(in srgb, var(--accent) 40%, var(--border));
            box-shadow: 0 2px 12px rgba(0,0,0,.15);
        }
        .commit-dot {
            position: absolute;
            left: -24px; top: 18px;
            width: 8px; height: 8px;
            border-radius: 50%;
            background: var(--accent);
            border: 2px solid var(--bg);
            box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 25%, transparent);
        }
        .commit-top {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 11px 14px;
        }
        .avatar {
            width: 34px; height: 34px;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-weight: 700; font-size: 12px;
            flex-shrink: 0;
            background: linear-gradient(135deg, var(--accent), var(--purple));
            color: #ffffff;
            text-transform: uppercase;
            letter-spacing: .5px;
        }
        .commit-meta { flex: 1; min-width: 0; }
        .commit-message {
            font-size: 13px;
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-bottom: 3px;
            color: var(--fg);
        }
        .commit-byline {
            font-size: 11px;
            color: var(--fg2);
            display: flex;
            gap: 5px;
            align-items: center;
            flex-wrap: wrap;
        }
        .commit-byline .sep { opacity: .4; }
        .commit-byline .author-link {
            font-weight: 600;
            color: var(--accent);
        }
        .commit-right {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 5px;
            flex-shrink: 0;
        }
        .commit-hash {
            font-family: monospace;
            font-size: 10.5px;
            background: var(--bg3);
            color: var(--blue);
            padding: 2px 7px;
            border-radius: 4px;
            border: 1px solid var(--border);
            cursor: pointer;
            transition: background .15s;
        }
        .commit-hash:hover { background: color-mix(in srgb, var(--blue) 15%, var(--bg3)); }
        .commit-stats {
            display: flex;
            gap: 4px;
            font-size: 10.5px;
        }
        .stat {
            padding: 2px 6px;
            border-radius: 4px;
            background: var(--bg3);
            border: 1px solid var(--border);
            display: flex;
            align-items: center;
            gap: 3px;
        }
        .stat.add { color: var(--green); border-color: rgba(78,201,176,.3); background: rgba(78,201,176,.06); }
        .stat.del { color: var(--red); border-color: rgba(244,135,113,.3); background: rgba(244,135,113,.06); }

        /* ── Commit body (WHY) ── */
        .commit-body-toggle {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 10.5px;
            color: var(--purple);
            cursor: pointer;
            margin-top: 4px;
            padding: 2px 7px;
            border-radius: 4px;
            background: rgba(197,134,192,.1);
            border: 1px solid rgba(197,134,192,.25);
            transition: background .15s;
        }
        .commit-body-toggle:hover { background: rgba(197,134,192,.2); }
        .commit-body {
            display: none;
            margin: 6px 0 2px;
            padding: 8px 11px;
            background: var(--bg3);
            border-radius: 6px;
            font-size: 11.5px;
            line-height: 1.65;
            white-space: pre-wrap;
            color: var(--fg2);
            border-left: 3px solid var(--purple);
        }

        /* ── Toggle diff button ── */
        .toggle-diff {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            font-size: 11px;
            cursor: pointer;
            background: var(--bg3);
            color: var(--fg2);
            border-top: 1px solid var(--border);
            user-select: none;
            transition: color .15s, background .15s;
        }
        .toggle-diff:hover { color: var(--fg); background: color-mix(in srgb, var(--accent) 6%, var(--bg3)); }
        .toggle-arrow { transition: transform .2s; display: inline-block; font-size: 10px; opacity: .7; }
        .toggle-diff.open { color: var(--accent); }
        .toggle-diff.open .toggle-arrow { transform: rotate(180deg); }
        .toggle-diff-icon { font-size: 12px; }

        /* ── Diff view switcher ── */
        .diff-view-bar {
            display: flex;
            align-items: center;
            border-bottom: 1px solid var(--border);
            background: var(--bg3);
            padding: 0 12px;
        }
        .diff-view-btn {
            padding: 5px 12px;
            font-size: 11px;
            border: none;
            background: none;
            cursor: pointer;
            color: var(--fg2);
            border-bottom: 2px solid transparent;
            margin-bottom: -1px;
            transition: color .15s;
        }
        .diff-view-btn.active { color: var(--accent); border-bottom-color: var(--accent); font-weight: 600; }
        .diff-view-btn:hover { color: var(--fg); }
        .diff-focused-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 5px 10px;
            font-size: 11px;
            color: var(--green);
        }
        .diff-pane { display: none; }
        .diff-pane.active { display: block; }
        .diff-no-relevant {
            padding: 10px 14px;
            font-size: 11px;
            color: var(--yellow);
            background: rgba(220,220,170,.06);
            border-top: 1px solid rgba(220,220,170,.15);
        }

        /* ── Diff ── */
        .diff-container {
            display: none;
            background: var(--bg3);
            border-top: 1px solid var(--border);
            overflow: auto;
            max-height: 360px;
        }
        .diff-hunk-header {
            font-family: monospace;
            font-size: 11px;
            color: var(--blue);
            padding: 3px 14px;
            background: rgba(86,156,214,.06);
            border-top: 1px solid rgba(86,156,214,.15);
            border-bottom: 1px solid rgba(86,156,214,.1);
            margin-top: 4px;
        }
        .diff-hunk-header:first-child { margin-top: 0; }
        .diff-line {
            font-family: monospace;
            font-size: 11.5px;
            white-space: pre;
            line-height: 1.65;
            padding: 0 14px;
            transition: background .1s;
        }
        .diff-add    { background: rgba(78,201,176,.1); color: var(--green); border-left: 2px solid rgba(78,201,176,.5); }
        .diff-remove { background: rgba(244,135,113,.1); color: var(--red); border-left: 2px solid rgba(244,135,113,.5); }
        .diff-add:hover    { background: rgba(78,201,176,.18); }
        .diff-remove:hover { background: rgba(244,135,113,.18); }

        /* ── No history ── */
        .no-history {
            text-align: center;
            padding: 80px 20px;
            color: var(--fg2);
        }
        .no-history-icon { font-size: 48px; margin-bottom: 16px; }
        .no-history h2 { margin-bottom: 8px; font-size: 16px; color: var(--fg); }
        .no-history p { font-size: 12px; }

        /* ── Authors tab ── */
        .authors-header {
            font-size: 11px;
            color: var(--fg2);
            padding: 4px 0 12px;
            border-bottom: 1px solid var(--border);
            margin-bottom: 12px;
        }
        .author-row {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 12px;
            border-radius: 8px;
            margin-bottom: 6px;
            background: var(--bg2);
            border: 1px solid var(--border);
            transition: border-color .15s, transform .15s;
        }
        .author-row:hover {
            border-color: color-mix(in srgb, var(--accent) 40%, var(--border));
            transform: translateX(2px);
        }
        .author-rank {
            font-size: 13px;
            font-weight: 800;
            color: var(--fg2);
            min-width: 22px;
            text-align: center;
        }
        .author-row:first-child .author-rank { color: #ffd700; }
        .author-row:nth-child(2) .author-rank { color: #c0c0c0; }
        .author-row:nth-child(3) .author-rank { color: #cd7f32; }
        .author-avatar {
            width: 36px; height: 36px;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-weight: 700; font-size: 13px;
            flex-shrink: 0;
            background: linear-gradient(135deg, var(--accent), var(--purple));
            color: #ffffff;
            text-transform: uppercase;
        }
        .author-info { flex: 1; min-width: 0; }
        .author-name-link {
            font-weight: 600;
            font-size: 13px;
            display: block;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            margin-bottom: 5px;
        }
        .author-bar-track {
            height: 5px;
            background: var(--border);
            border-radius: 3px;
            overflow: hidden;
        }
        .author-bar-fill {
            height: 100%;
            border-radius: 3px;
            background: linear-gradient(90deg, var(--accent), var(--purple));
            transition: width .6s cubic-bezier(.4,0,.2,1);
        }
        .author-commit-count {
            font-size: 12px;
            font-weight: 700;
            color: var(--fg);
            min-width: 70px;
            text-align: right;
        }
        .author-pct {
            font-size: 10px;
            color: var(--fg2);
            font-weight: 400;
        }

        /* ── Related files tab ── */
        .related-file {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 9px 12px;
            margin-bottom: 6px;
            background: var(--bg2);
            border-radius: 8px;
            border: 1px solid var(--border);
            font-size: 12px;
            transition: border-color .15s;
        }
        .related-file:hover { border-color: color-mix(in srgb, var(--accent) 40%, var(--border)); }
        .related-file-icon { color: var(--fg2); font-size: 14px; flex-shrink: 0; }
        .related-file-path { 
            font-family: monospace;
            color: var(--accent);
            word-break: break-all;
            flex: 1;
        }
        .related-file-count {
            flex-shrink: 0;
            background: var(--bg3);
            border: 1px solid var(--border);
            color: var(--fg2);
            padding: 2px 8px;
            border-radius: 8px;
            font-size: 11px;
            font-weight: 600;
        }

        /* ── Section title ── */
        .section-title {
            font-size: 10.5px;
            text-transform: uppercase;
            letter-spacing: .8px;
            color: var(--fg2);
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .section-title::after {
            content: '';
            flex: 1;
            height: 1px;
            background: var(--border);
        }

        /* ── Evolution Story ── */
        .story-banner {
            display: flex;
            flex-direction: column;
            gap: 0;
            margin-bottom: 16px;
            border: 1px solid var(--border);
            border-radius: 10px;
            overflow: hidden;
            background: var(--bg2);
        }
        .story-point {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 12px 14px;
        }
        .story-point + .story-point { border-top: 1px solid var(--border); }
        .story-icon-wrap {
            width: 30px; height: 30px;
            border-radius: 8px;
            display: flex; align-items: center; justify-content: center;
            font-size: 14px;
            flex-shrink: 0;
            background: var(--bg3);
            border: 1px solid var(--border);
        }
        .story-content { flex: 1; min-width: 0; }
        .story-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: .7px;
            color: var(--fg2);
            margin-bottom: 3px;
            font-weight: 600;
        }
        .story-msg {
            font-size: 12.5px;
            font-weight: 600;
            margin-bottom: 3px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: var(--fg);
        }
        .story-meta {
            font-size: 11px;
            color: var(--fg2);
        }
        .story-connector {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 6px 14px;
            background: var(--bg3);
            border-top: 1px solid var(--border);
            border-bottom: 1px solid var(--border);
            font-size: 11px;
            color: var(--fg2);
            font-style: italic;
        }
        .story-connector-line { flex: 1; height: 1px; background: var(--border); }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-icon">📜</div>
        <div class="header-text">
            <h1>CodeChronicle</h1>
            <div class="header-sub">Code History &amp; Genealogy</div>
        </div>
        <span class="file-badge">${fileName} · L${startLine}–${endLine}</span>
    </div>

    <div class="main-content">
    ${history.length === 0 ? `
        <div class="no-history">
            <div class="no-history-icon">🔍</div>
            <h2>No history found</h2>
            <p>This code might be uncommitted or the file is not tracked by Git.</p>
        </div>
    ` : `
        <div class="recommendation-box risk-${insights.riskLevel}">
            <span class="recommendation-icon">${insights.riskLevel === 'high' ? '🔥' : insights.riskLevel === 'medium' ? '⚠️' : '✅'}</span>
            <span class="recommendation-text">${insights.recommendation}</span>
        </div>

        ${evolution.firstCommit ? `
        <div class="story-banner">
            <div class="story-point">
                <div class="story-icon-wrap">🌱</div>
                <div class="story-content">
                    <div class="story-label">Born</div>
                    <div class="story-msg" title="${this._escapeHtml(evolution.firstCommit.message)}">${this._escapeHtml(evolution.firstCommit.message)}</div>
                    <div class="story-meta">${evolution.firstCommit.relativeTime} &middot; <a href="https://github.com/${encodeURIComponent(evolution.firstCommit.author.replace(/ /g, ''))}">${this._escapeHtml(evolution.firstCommit.author)}</a></div>
                </div>
            </div>
            ${evolution.lastCommit && evolution.lastCommit.hash !== evolution.firstCommit.hash ? `
            <div class="story-connector">
                <div class="story-connector-line"></div>
                <span>evolved through ${evolution.totalCommits} commits</span>
                <div class="story-connector-line"></div>
            </div>
            <div class="story-point">
                <div class="story-icon-wrap">🔄</div>
                <div class="story-content">
                    <div class="story-label">Last changed</div>
                    <div class="story-msg" title="${this._escapeHtml(evolution.lastCommit.message)}">${this._escapeHtml(evolution.lastCommit.message)}</div>
                    <div class="story-meta">${evolution.lastCommit.relativeTime} &middot; <a href="https://github.com/${encodeURIComponent(evolution.lastCommit.author.replace(/ /g, ''))}">${this._escapeHtml(evolution.lastCommit.author)}</a></div>
                </div>
            </div>
            ` : ''}
        </div>
        ` : ''}

        <div class="metrics-row">
            <div class="metric risk-${insights.riskLevel}">
                <div class="metric-icon">${insights.isHotspot ? '🔥' : '📊'}</div>
                <div class="metric-label">Changes</div>
                <div class="metric-value">${evolution.totalCommits}</div>
                <div class="metric-sub">${insights.isHotspot ? 'Hotspot' : 'Stable code'}</div>
            </div>
            <div class="metric">
                <div class="metric-icon">👥</div>
                <div class="metric-label">Contributors</div>
                <div class="metric-value">${evolution.totalAuthors}</div>
                <div class="metric-sub" title="${this._escapeHtml(evolution.mostActiveAuthor)}">Lead: ${this._escapeHtml(evolution.mostActiveAuthor.split(' ')[0])}</div>
            </div>
            <div class="metric">
                <div class="metric-icon">📅</div>
                <div class="metric-label">Code Age</div>
                <div class="metric-value">${evolution.codeAge}</div>
                <div class="metric-sub">${evolution.changeFrequency}</div>
            </div>
            <div class="metric risk-${insights.riskLevel}">
                <div class="metric-icon">${insights.riskLevel === 'high' ? '🚨' : insights.riskLevel === 'medium' ? '⚠️' : '🛡️'}</div>
                <div class="metric-label">Risk</div>
                <div class="metric-value">${insights.riskLevel.toUpperCase()}</div>
                <div class="metric-sub">${insights.complexity}</div>
            </div>
        </div>

        <div class="tabs">
            <button class="tab active" data-tab="timeline">⏱ Timeline <span class="tab-count">${history.length}</span></button>
            <button class="tab" data-tab="authors">👥 Authors <span class="tab-count">${evolution.totalAuthors}</span></button>
            <button class="tab" data-tab="related">🔗 Related Files</button>
        </div>

        <div id="timeline" class="tab-content active">
            <div class="timeline">
                ${history.map((commit) => {
                    const initials = commit.author.split(' ').map((w: string) => w[0]).join('').substring(0, 2);
                    const ghUrl = 'https://github.com/' + encodeURIComponent(commit.author.replace(/ /g, ''));
                    return `
                    <div class="commit">
                        <div class="commit-dot"></div>
                        <div class="commit-top">
                            <div class="avatar">${this._escapeHtml(initials)}</div>
                            <div class="commit-meta">
                                <div class="commit-message" title="${this._escapeHtml(commit.message)}">${this._escapeHtml(commit.message)}</div>
                                ${commit.body ? `<span class="commit-body-toggle">💬 See full reason ▾</span><div class="commit-body">${this._escapeHtml(commit.body)}</div>` : ''}
                                <div class="commit-byline">
                                    <a class="author-link" href="${ghUrl}" title="View ${this._escapeHtml(commit.author)} on GitHub">${this._escapeHtml(commit.author)}</a>
                                    <span class="sep">—</span>
                                    <span>${commit.relativeTime}</span>
                                    <span class="sep">·</span>
                                    <span>${commit.date}</span>
                                </div>
                            </div>
                            <div class="commit-right">
                                <span class="commit-hash">${commit.hash}</span>
                                <div class="commit-stats">
                                    <span class="stat">📁 ${commit.filesChanged}</span>
                                    <span class="stat add">+${commit.insertions}</span>
                                    <span class="stat del">-${commit.deletions}</span>
                                </div>
                            </div>
                        </div>
                        <div class="toggle-diff">
                            <span class="toggle-diff-icon">⟨/⟩</span>
                            <span class="toggle-label">Show diff</span>
                            <span class="toggle-arrow">▾</span>
                        </div>
                        <div class="diff-container">
                            ${this._formatDiff(commit.diff, commit.lineStart, commit.lineEnd)}
                        </div>
                    </div>
                `}).join('')}
            </div>
        </div>

        <div id="authors" class="tab-content">
            <div class="authors-header">Contribution breakdown — click a name to open GitHub profile</div>
            ${authorChartHtml}
        </div>

        <div id="related" class="tab-content">
            <div class="section-title">Co-changed files</div>
            ${relatedFiles.length === 0 ? '<p style="color:var(--fg2);padding:30px 0;text-align:center">No related files found</p>' : relatedFiles.map(file => `
                <div class="related-file">
                    <span class="related-file-icon">📄</span>
                    <span class="related-file-path">${this._escapeHtml(file.path)}</span>
                    <span class="related-file-count">${file.changeCount}×</span>
                </div>
            `).join('')}
        </div>
    `}
    </div>

    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();

        // ── Tab switching ──
        document.querySelectorAll('.tab').forEach(function(tab) {
            tab.addEventListener('click', function() {
                var tabName = this.getAttribute('data-tab');
                document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
                document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
                this.classList.add('active');
                var el = document.getElementById(tabName);
                if (el) { el.classList.add('active'); }
                // Animate author bars when switching to authors tab
                if (tabName === 'authors') {
                    setTimeout(function() {
                        document.querySelectorAll('.author-bar-fill').forEach(function(bar) {
                            var w = bar.style.width;
                            bar.style.width = '0%';
                            requestAnimationFrame(function() { bar.style.width = w; });
                        });
                    }, 50);
                }
            });
        });

        // ── Diff toggle (show/hide) ──
        document.querySelectorAll('.toggle-diff').forEach(function(toggle) {
            toggle.addEventListener('click', function() {
                var diffEl = this.nextElementSibling;
                var label = this.querySelector('.toggle-label');
                var isOpen = diffEl.style.display === 'block';
                diffEl.style.display = isOpen ? 'none' : 'block';
                label.textContent = isOpen ? 'Show diff' : 'Hide diff';
                if (isOpen) { this.classList.remove('open'); } else { this.classList.add('open'); }
            });
        });

        // ── Near/Full diff view switcher ──
        document.querySelectorAll('.diff-view-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var container = this.closest('.diff-container');
                var view = this.getAttribute('data-view');
                container.querySelectorAll('.diff-view-btn').forEach(function(b) { b.classList.remove('active'); });
                container.querySelectorAll('.diff-pane').forEach(function(p) { p.classList.remove('active'); });
                this.classList.add('active');
                var pane = container.querySelector('.diff-pane[data-pane="' + view + '"]');
                if (pane) { pane.classList.add('active'); }
            });
        });

        // ── Commit body expander ──
        document.querySelectorAll('.commit-body-toggle').forEach(function(toggle) {
            toggle.addEventListener('click', function() {
                var body = this.nextElementSibling;
                var isOpen = body.style.display === 'block';
                body.style.display = isOpen ? 'none' : 'block';
                this.textContent = isOpen ? '💬 See full reason ▾' : '💬 Hide reason ▴';
            });
        });

        // ── Author / story GitHub links — open via extension host ──
        document.querySelectorAll('a[href^="https://github.com"]').forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                vscode.postMessage({ command: 'openUrl', url: this.href });
            });
        });

        // ── Commit hash copy on click ──
        document.querySelectorAll('.commit-hash').forEach(function(el) {
            el.title = 'Click to copy hash';
            el.addEventListener('click', function() {
                var hash = this.textContent.trim();
                navigator.clipboard && navigator.clipboard.writeText(hash).then(function() {
                    el.textContent = 'Copied!';
                    setTimeout(function() { el.textContent = hash; }, 1200);
                });
            });
        });
    </script>
</body>
</html>`;
    }

    private _generateAuthorChart(contributions: Map<string, number>, emailMap: Map<string, string>): string {
        const maxContributions = Math.max(...Array.from(contributions.values()));
        const total = Array.from(contributions.values()).reduce((a, b) => a + b, 0);
        const entries = Array.from(contributions.entries()).sort((a, b) => b[1] - a[1]);

        return entries.map(([author, count], idx) => {
            const percentage = Math.round((count / maxContributions) * 100);
            const pct = Math.round((count / total) * 100);
            const initials = author.split(' ').map((w: string) => w[0]).join('').substring(0, 2);
            const ghUrl = 'https://github.com/' + encodeURIComponent(author.replace(/ /g, ''));
            const rankLabel = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
            return `
                <div class="author-row">
                    <div class="author-rank">${rankLabel}</div>
                    <div class="author-avatar">${this._escapeHtml(initials)}</div>
                    <div class="author-info">
                        <a class="author-name-link" href="${ghUrl}" title="Open ${this._escapeHtml(author)} on GitHub">${this._escapeHtml(author)}</a>
                        <div class="author-bar-track">
                            <div class="author-bar-fill" style="width:${percentage}%"></div>
                        </div>
                    </div>
                    <div class="author-commit-count">${count} commit${count !== 1 ? 's' : ''}<br><span class="author-pct">${pct}%</span></div>
                </div>
            `;
        }).join('');
    }

    private _formatDiff(diff: string, startLine: number, endLine: number): string {
        if (!diff || !diff.trim()) {
            return '<div class="diff-no-relevant">No diff available</div>';
        }

        // Parse the diff into hunks
        const hunkPattern = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/;
        const rawLines = diff.split('\n');

        type Hunk = { header: string; newStart: number; newEnd: number; lines: string[] };
        const hunks: Hunk[] = [];
        let current: Hunk | null = null;

        for (const line of rawLines) {
            const m = line.match(hunkPattern);
            if (m) {
                if (current) { hunks.push(current); }
                const newStart = parseInt(m[1]);
                const newCount = m[2] !== undefined ? parseInt(m[2]) : 1;
                current = { header: line, newStart, newEnd: newStart + newCount, lines: [] };
            } else if (current) {
                current.lines.push(line);
            }
        }
        if (current) { hunks.push(current); }

        const renderHunk = (h: Hunk) => {
            const headerHtml = `<div class="diff-hunk-header">${this._escapeHtml(h.header)}</div>`;
            const linesHtml = h.lines.map(line => {
                const e = this._escapeHtml(line);
                if (line.startsWith('+') && !line.startsWith('+++')) { return `<div class="diff-line diff-add">${e}</div>`; }
                if (line.startsWith('-') && !line.startsWith('---')) { return `<div class="diff-line diff-remove">${e}</div>`; }
                return `<div class="diff-line">${e}</div>`;
            }).join('');
            return headerHtml + linesHtml;
        };

        if (hunks.length === 0) {
            const raw = rawLines.map(line => {
                const e = this._escapeHtml(line);
                if (line.startsWith('+') && !line.startsWith('+++')) { return `<div class="diff-line diff-add">${e}</div>`; }
                if (line.startsWith('-') && !line.startsWith('---')) { return `<div class="diff-line diff-remove">${e}</div>`; }
                return `<div class="diff-line">${e}</div>`;
            }).join('');
            // No @@ headers — can't determine relevance, just show it
            return `
                <div class="diff-view-bar">
                    <span class="diff-focused-badge">✅ All changes in this commit are near your selection</span>
                </div>
                <div class="diff-pane active" data-pane="relevant">${raw}</div>`;
        }

        // Relevant: hunks overlapping selected range (±10 line tolerance)
        const tolerance = 10;
        const relevant = hunks.filter(h =>
            h.newStart <= endLine + tolerance && h.newEnd >= startLine - tolerance
        );

        const fullHtml = hunks.map(renderHunk).join('');
        const allChangesNearSelection = relevant.length === hunks.length && hunks.length > 0;

        // If every hunk is relevant, no need for two tabs — this commit only touched your selection area
        if (allChangesNearSelection) {
            return `
                <div class="diff-view-bar">
                    <span class="diff-focused-badge">✅ All changes in this commit are near your selection</span>
                </div>
                <div class="diff-pane active" data-pane="relevant">${fullHtml}</div>`;
        }

        const relevantHtml = relevant.length > 0
            ? relevant.map(renderHunk).join('')
            : `<div class="diff-no-relevant">⚠ This commit's changes are in other parts of the file — switch to Full File to see them</div>`;

        return `
            <div class="diff-view-bar">
                <button class="diff-view-btn active" data-view="relevant">Near selection</button>
                <button class="diff-view-btn" data-view="full">Full file (${hunks.length} hunks)</button>
            </div>
            <div class="diff-pane active" data-pane="relevant">${relevantHtml}</div>
            <div class="diff-pane" data-pane="full">${fullHtml}</div>`;
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
