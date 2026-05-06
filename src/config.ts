import * as vscode from 'vscode';
import { PostTemplate } from './templates';

export type LlmProvider = 'anthropic' | 'openai';

export interface Config {
  llmProvider: LlmProvider;
  apiKey: string;
  xConsumerKey: string;
  xConsumerSecret: string;
  xAccessToken: string;
  xAccessTokenSecret: string;
  defaultTones: string[];
  customTemplates: PostTemplate[];
}

export function getConfig(): Config {
  const cfg = vscode.workspace.getConfiguration('repoToPost');

  return {
    llmProvider: cfg.get<LlmProvider>('llmProvider', 'anthropic'),
    apiKey: cfg.get<string>('apiKey', ''),
    xConsumerKey: cfg.get<string>('xConsumerKey', ''),
    xConsumerSecret: cfg.get<string>('xConsumerSecret', ''),
    xAccessToken: cfg.get<string>('xAccessToken', ''),
    xAccessTokenSecret: cfg.get<string>('xAccessTokenSecret', ''),
    defaultTones: cfg.get<string[]>('defaultTones', ['technical', 'launch', 'community']),
    customTemplates: cfg.get<PostTemplate[]>('customTemplates', []),
  };
}

export async function requireApiKey(): Promise<boolean> {
  const { apiKey } = getConfig();
  if (apiKey.trim() !== '') {
    return true;
  }

  vscode.window.showInformationMessage(
    'Post to X : aucune clé API configurée. Renseignez "repoToPost.apiKey" dans les Settings.',
    'Ouvrir les Settings'
  ).then(choice => {
    if (choice === 'Ouvrir les Settings') {
      vscode.commands.executeCommand('workbench.action.openSettings', 'repoToPost');
    }
  });

  return false;
}
