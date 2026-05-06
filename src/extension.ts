import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { getConfig, requireApiKey } from './config';
import { buildDrafts, RepoContext } from './templates';
import { openPostPanel } from './webview';
import { publishTweet } from './twitter';
import { handleError, gitError, publishError } from './errors';

function git(cwd: string, args: string): string {
  return execSync(`git ${args}`, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

function buildRepoContext(rootPath: string): RepoContext {
  const readmePath = path.join(rootPath, 'README.md');
  if (!fs.existsSync(readmePath)) {
    throw gitError('README.md introuvable à la racine du workspace.');
  }
  const readmeContent = fs.readFileSync(readmePath, 'utf8');

  let remotUrl: string | null = null;
  let repoName: string = path.basename(rootPath);
  try {
    remotUrl = git(rootPath, 'remote get-url origin');
    const match = remotUrl.match(/\/([^/]+?)(?:\.git)?$/);
    if (match) { repoName = match[1]; }
  } catch { /* no remote — use folder name */ }

  let lastTag: string | null = null;
  try { lastTag = git(rootPath, 'describe --tags --abbrev=0'); } catch { /* no tags */ }

  let commitsSinceTag: number | null = null;
  if (lastTag) {
    try {
      commitsSinceTag = parseInt(git(rootPath, `rev-list ${lastTag}..HEAD --count`), 10);
    } catch { /* ignore */ }
  }

  return { repoName, readmeContent, lastTag, commitsSinceTag, remotUrl };
}

function isGitWorkspace(): boolean {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) { return false; }
  try {
    git(folders[0].uri.fsPath, 'rev-parse --git-dir');
    return true;
  } catch {
    return false;
  }
}

function createStatusBar(context: vscode.ExtensionContext): vscode.StatusBarItem {
  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  item.text    = '$(megaphone) Post to X';
  item.tooltip = 'Generate a post from your README';
  item.command = 'repo-to-post.generatePost';

  const update = () => { isGitWorkspace() ? item.show() : item.hide(); };
  update();

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(update),
    item,
  );

  return item;
}

export function activate(context: vscode.ExtensionContext) {
  createStatusBar(context);

  const command = vscode.commands.registerCommand('repo-to-post.generatePost', async () => {
    if (!(await requireApiKey())) { return; }

    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      handleError(gitError('Aucun workspace ouvert.'));
      return;
    }

    const rootPath = folders[0].uri.fsPath;

    try {
      const { repoContext, drafts } = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Post to X',
          cancellable: false,
        },
        async progress => {
          progress.report({ message: 'Analysing README and generating posts… (this may take 10-15 seconds)' });
          const repoContext = buildRepoContext(rootPath);
          const config     = getConfig();
          const drafts     = buildDrafts(repoContext, config);
          return { repoContext, drafts };
        }
      );

      openPostPanel(
        context,
        repoContext.repoName,
        drafts,
        (content) => {
          publishTweet(content, getConfig()).catch(err => {
            handleError(publishError(err instanceof Error ? err.message : String(err)));
          });
        },
        () => { vscode.commands.executeCommand('repo-to-post.generatePost'); }
      );
    } catch (err) {
      handleError(err);
    }
  });

  context.subscriptions.push(command);
}

export function deactivate() {}
