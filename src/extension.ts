import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface RepoContext {
  repoName: string;
  readmeContent: string;
  lastTag: string | null;
  commitsSinceTag: number | null;
  remotUrl: string | null;
}

function git(cwd: string, args: string): string {
  return execSync(`git ${args}`, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

function buildRepoContext(rootPath: string): RepoContext {
  // README
  const readmePath = path.join(rootPath, 'README.md');
  if (!fs.existsSync(readmePath)) {
    throw new Error('README.md introuvable à la racine du workspace.');
  }
  const readmeContent = fs.readFileSync(readmePath, 'utf8');

  // Nom du repo : remote origin en priorité, sinon nom du dossier
  let remotUrl: string | null = null;
  let repoName: string = path.basename(rootPath);
  try {
    remotUrl = git(rootPath, 'remote get-url origin');
    // "https://github.com/user/my-repo.git" → "my-repo"
    const match = remotUrl.match(/\/([^/]+?)(?:\.git)?$/);
    if (match) {
      repoName = match[1];
    }
  } catch {
    // pas de remote configuré — on garde le nom du dossier
  }

  // Dernier tag
  let lastTag: string | null = null;
  try {
    lastTag = git(rootPath, 'describe --tags --abbrev=0');
  } catch {
    // aucun tag dans ce repo
  }

  // Commits depuis le dernier tag
  let commitsSinceTag: number | null = null;
  if (lastTag) {
    try {
      const count = git(rootPath, `rev-list ${lastTag}..HEAD --count`);
      commitsSinceTag = parseInt(count, 10);
    } catch {
      // tag existe mais rev-list a échoué (cas rare)
    }
  }

  return { repoName, readmeContent, lastTag, commitsSinceTag, remotUrl };
}

export function activate(context: vscode.ExtensionContext) {
  const command = vscode.commands.registerCommand('repo-to-post.generatePost', () => {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      vscode.window.showErrorMessage('Post to X : aucun workspace ouvert.');
      return;
    }

    const rootPath = folders[0].uri.fsPath;

    try {
      const repoContext = buildRepoContext(rootPath);
      console.log('[repo-to-post] RepoContext :', JSON.stringify(repoContext, null, 2));
      vscode.window.showInformationMessage(
        `Post to X : contexte lu — ${repoContext.repoName}` +
        (repoContext.lastTag ? ` @ ${repoContext.lastTag}` : '')
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      vscode.window.showErrorMessage(`Post to X : ${message}`);
    }
  });

  context.subscriptions.push(command);
}

export function deactivate() {}
