import * as vscode from 'vscode';
import { GitService } from './gitService';
import { GenealogyPanel } from './genealogyPanel';

export function activate(context: vscode.ExtensionContext) {
    const gitService = new GitService();

    let disposable = vscode.commands.registerCommand('code-chronicle.showChronicle', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        const selection = editor.selection;
        if (selection.isEmpty) {
            vscode.window.showWarningMessage('Please select some code to view its genealogy');
            return;
        }

        const filePath = editor.document.uri.fsPath;
        const startLine = selection.start.line + 1;
        const endLine = selection.end.line + 1;

        try {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Analyzing code history...",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: "Fetching commits..." });
                
                const history = await gitService.getLineHistory(filePath, startLine, endLine);
                
                progress.report({ increment: 33, message: "Analyzing evolution..." });
                const evolution = await gitService.getCodeEvolution(filePath, startLine, endLine);
                
                progress.report({ increment: 33, message: "Finding related files..." });
                const relatedFiles = await gitService.getRelatedFiles(filePath, history);
                
                progress.report({ increment: 34, message: "Generating insights..." });
                const insights = await gitService.getCodeInsights(evolution);
                
                GenealogyPanel.createOrShow(
                    context.extensionUri, 
                    history, 
                    filePath, 
                    startLine, 
                    endLine,
                    evolution,
                    relatedFiles,
                    insights
                );
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to get code history: ${error}`);
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
