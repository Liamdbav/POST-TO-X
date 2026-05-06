import * as vscode from 'vscode';

export type ErrorCode = 'LLM_ERROR' | 'GIT_ERROR' | 'PUBLISH_ERROR' | 'CONFIG_ERROR';

interface ErrorAction {
  label: string;
  run: () => void;
}

export class RepoToPostError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly action?: ErrorAction,
  ) {
    super(message);
    this.name = 'RepoToPostError';
  }
}

export function handleError(err: unknown): void {
  if (err instanceof RepoToPostError) {
    if (err.action) {
      vscode.window.showErrorMessage(`Post to X : ${err.message}`, err.action.label)
        .then(choice => { if (choice === err.action!.label) { err.action!.run(); } });
    } else {
      vscode.window.showErrorMessage(`Post to X : ${err.message}`);
    }
    return;
  }

  const message = err instanceof Error ? err.message : String(err);
  vscode.window.showErrorMessage(`Post to X : ${message}`);
}

// ─── Factories ────────────────────────────────────────────────────────────────

export function configError(detail: string): RepoToPostError {
  return new RepoToPostError(
    'CONFIG_ERROR',
    detail,
    {
      label: 'Ouvrir les Settings',
      run: () => vscode.commands.executeCommand('workbench.action.openSettings', 'repoToPost'),
    }
  );
}

export function gitError(detail: string): RepoToPostError {
  return new RepoToPostError('GIT_ERROR', detail);
}

export function publishError(detail: string): RepoToPostError {
  return new RepoToPostError(
    'PUBLISH_ERROR',
    detail,
    {
      label: 'Ouvrir les Settings',
      run: () => vscode.commands.executeCommand('workbench.action.openSettings', 'repoToPost'),
    }
  );
}

export function llmError(detail: string): RepoToPostError {
  return new RepoToPostError(
    'LLM_ERROR',
    detail,
    {
      label: 'Ouvrir les Settings',
      run: () => vscode.commands.executeCommand('workbench.action.openSettings', 'repoToPost'),
    }
  );
}
