import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

export interface CommitInfo {
    hash: string;
    author: string;
    authorEmail: string;
    date: string;
    message: string;
    diff: string;
    lineStart: number;
    lineEnd: number;
    filesChanged: number;
    insertions: number;
    deletions: number;
    relativeTime: string;
}

export interface CodeEvolution {
    totalCommits: number;
    totalAuthors: number;
    firstCommit: CommitInfo | null;
    lastCommit: CommitInfo | null;
    mostActiveAuthor: string;
    codeAge: string;
    changeFrequency: string;
    authorContributions: Map<string, number>;
}

export interface RelatedFile {
    path: string;
    changeCount: number;
    lastChanged: string;
}

export interface CodeInsight {
    isHotspot: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    recommendation: string;
    complexity: string;
}

export class GitService {
    async getLineHistory(filePath: string, startLine: number, endLine: number): Promise<CommitInfo[]> {
        try {
            const workspaceRoot = this.getGitRoot(filePath);
            const relativePath = path.relative(workspaceRoot, filePath).replace(/\\/g, '/');

            // Get blame information for the selected lines
            const blameCmd = `git blame -L ${startLine},${endLine} --porcelain "${relativePath}"`;
            const { stdout: blameOutput } = await execAsync(blameCmd, { cwd: workspaceRoot, maxBuffer: 1024 * 1024 * 10 });

            // Parse commit hashes from blame
            const commitHashes = this.parseBlameOutput(blameOutput);

            // Get detailed info for each commit in parallel
            const commits: CommitInfo[] = [];
            const commitInfos = await Promise.all(
                commitHashes.map(hash => this.getCommitDetails(workspaceRoot, hash, relativePath, startLine, endLine))
            );
            const seen = new Set<string>();
            for (const commitInfo of commitInfos) {
                if (commitInfo && !seen.has(commitInfo.hash)) {
                    seen.add(commitInfo.hash);
                    commits.push(commitInfo);
                }
            }

            return commits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        } catch (error) {
            throw new Error(`Failed to get line history: ${error}`);
        }
    }

    private getGitRoot(filePath: string): string {
        try {
            const result = execSync('git rev-parse --show-toplevel', {
                cwd: path.dirname(filePath),
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'ignore']
            }) as string;
            return result.trim().replace(/\\/g, '/');
        } catch {
            return path.dirname(filePath);
        }
    }

    async getCodeEvolution(filePath: string, startLine: number, endLine: number): Promise<CodeEvolution> {
        try {
            const workspaceRoot = this.getGitRoot(filePath);
            const relativePath = path.relative(workspaceRoot, filePath).replace(/\\/g, '/');

            // Get all commits that touched these lines
            const logCmd = `git log --pretty=format:"%H|%an|%ae|%ai|%s" -L ${startLine},${endLine}:"${relativePath}"`;
            const { stdout } = await execAsync(logCmd, { cwd: workspaceRoot, maxBuffer: 1024 * 1024 * 10 });

            const lines = stdout.trim().split('\n').filter(l => l.includes('|'));
            const authorContributions = new Map<string, number>();

            lines.forEach(line => {
                const [, author] = line.split('|');
                authorContributions.set(author, (authorContributions.get(author) || 0) + 1);
            });

            const mostActiveAuthor = Array.from(authorContributions.entries())
                .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

            const firstCommitData = lines[lines.length - 1]?.split('|');
            const lastCommitData = lines[0]?.split('|');

            const firstDate = firstCommitData ? new Date(firstCommitData[3]) : new Date();
            const lastDate = lastCommitData ? new Date(lastCommitData[3]) : new Date();
            const ageInDays = Math.floor((Date.now() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
            const changeFreq = lines.length > 0 ? Math.floor(ageInDays / lines.length) : 0;

            return {
                totalCommits: lines.length,
                totalAuthors: authorContributions.size,
                firstCommit: null,
                lastCommit: null,
                mostActiveAuthor,
                codeAge: this.formatAge(ageInDays),
                changeFrequency: changeFreq > 0 ? `Every ${changeFreq} days` : 'Very frequent',
                authorContributions
            };
        } catch (error) {
            return {
                totalCommits: 0,
                totalAuthors: 0,
                firstCommit: null,
                lastCommit: null,
                mostActiveAuthor: 'Unknown',
                codeAge: 'Unknown',
                changeFrequency: 'Unknown',
                authorContributions: new Map()
            };
        }
    }

    async getRelatedFiles(filePath: string, commits: CommitInfo[]): Promise<RelatedFile[]> {
        try {
            const workspaceRoot = this.getGitRoot(filePath);
            const hashes = commits.map(c => c.hash).join(' ');
            
            if (!hashes) {
                return [];
            }

            const cmd = `git show --name-only --pretty=format: ${hashes}`;
            const { stdout } = await execAsync(cmd, { cwd: workspaceRoot, maxBuffer: 1024 * 1024 * 10 });

            const files = stdout.split('\n').filter(f => f.trim() && f !== path.relative(workspaceRoot, filePath).replace(/\\/g, '/'));
            const fileCount = new Map<string, number>();

            files.forEach(file => {
                fileCount.set(file, (fileCount.get(file) || 0) + 1);
            });

            return Array.from(fileCount.entries())
                .map(([path, count]) => ({
                    path,
                    changeCount: count,
                    lastChanged: 'Recently'
                }))
                .sort((a, b) => b.changeCount - a.changeCount)
                .slice(0, 10);
        } catch (error) {
            return [];
        }
    }

    async getCodeInsights(evolution: CodeEvolution): Promise<CodeInsight> {
        const isHotspot = evolution.totalCommits > 10;
        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        let recommendation = 'Code is stable with minimal changes.';
        let complexity = 'Simple';

        if (evolution.totalCommits > 20) {
            riskLevel = 'high';
            recommendation = '⚠️ High-churn code! Consider refactoring or adding tests.';
            complexity = 'Complex';
        } else if (evolution.totalCommits > 10) {
            riskLevel = 'medium';
            recommendation = '⚡ Moderate changes. Monitor for patterns.';
            complexity = 'Moderate';
        }

        if (evolution.totalAuthors > 5) {
            recommendation += ' Multiple authors - ensure documentation is clear.';
        }

        return {
            isHotspot,
            riskLevel,
            recommendation,
            complexity
        };
    }

    private formatAge(days: number): string {
        if (days < 1) {
            return 'Today';
        }
        if (days < 30) {
            return `${days} days`;
        }
        if (days < 365) {
            return `${Math.floor(days / 30)} months`;
        }
        return `${Math.floor(days / 365)} years`;
    }

    private getRelativeTime(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Today';
        }
        if (diffDays === 1) {
            return 'Yesterday';
        }
        if (diffDays < 7) {
            return `${diffDays} days ago`;
        }
        if (diffDays < 30) {
            return `${Math.floor(diffDays / 7)} weeks ago`;
        }
        if (diffDays < 365) {
            return `${Math.floor(diffDays / 30)} months ago`;
        }
        return `${Math.floor(diffDays / 365)} years ago`;
    }

    private parseBlameOutput(output: string): string[] {
        const lines = output.split('\n');
        const hashes: string[] = [];
        
        for (const line of lines) {
            if (line.match(/^[0-9a-f]{40}/)) {
                const hash = line.split(' ')[0];
                hashes.push(hash);
            }
        }
        
        return [...new Set(hashes)];
    }

    private async getCommitDetails(
        workspaceRoot: string,
        hash: string,
        filePath: string,
        startLine: number,
        endLine: number
    ): Promise<CommitInfo | null> {
        try {
            // Get commit metadata with stats
            const logCmd = `git log -1 --format="%H%n%an%n%ae%n%ai%n%s" --shortstat ${hash}`;
            const { stdout: logOutput } = await execAsync(logCmd, { cwd: workspaceRoot, maxBuffer: 1024 * 1024 * 10 });
            const lines = logOutput.trim().split('\n');
            const [commitHash, author, authorEmail, date, message] = lines;

            // Parse stats
            const statsLine = lines.find(l => l.includes('changed'));
            let filesChanged = 0, insertions = 0, deletions = 0;
            
            if (statsLine) {
                const fileMatch = statsLine.match(/(\d+) file/);
                const insertMatch = statsLine.match(/(\d+) insertion/);
                const deleteMatch = statsLine.match(/(\d+) deletion/);
                
                filesChanged = fileMatch ? parseInt(fileMatch[1]) : 0;
                insertions = insertMatch ? parseInt(insertMatch[1]) : 0;
                deletions = deleteMatch ? parseInt(deleteMatch[1]) : 0;
            }

            // Get diff for this file
            const diffCmd = `git show ${hash} -- "${filePath}"`;
            const { stdout: diffOutput } = await execAsync(diffCmd, { cwd: workspaceRoot, maxBuffer: 1024 * 1024 * 10 });

            const commitDate = new Date(date);

            return {
                hash: commitHash.substring(0, 8),
                author,
                authorEmail,
                date: commitDate.toLocaleString(),
                message,
                diff: diffOutput,
                lineStart: startLine,
                lineEnd: endLine,
                filesChanged,
                insertions,
                deletions,
                relativeTime: this.getRelativeTime(commitDate)
            };
        } catch (error) {
            return null;
        }
    }
}
