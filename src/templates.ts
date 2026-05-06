import { Config } from './config';

export interface RepoContext {
  repoName: string;
  readmeContent: string;
  lastTag: string | null;
  commitsSinceTag: number | null;
  remotUrl: string | null;
}

export interface PostTemplate {
  id: string;
  label: string;
  body: string;
  hashtags: string[];
}

export interface PostDraft {
  templateId: string;
  tone: string;
  content: string;
  hashtags: string[];
  isManual: boolean;
}

const BUILT_IN_TEMPLATES: PostTemplate[] = [
  {
    id: 'launch',
    label: '🚀 Launch',
    body: '🚀 Just shipped {repoName} {lastTag}!\n\n{description}\n\n{url}',
    hashtags: ['opensource', 'buildinpublic'],
  },
  {
    id: 'technical',
    label: '🛠 Technical',
    body: 'Built {repoName} to solve [problem].\n\nStack: [à compléter]\n\n{url}',
    hashtags: ['devtools', 'programming'],
  },
  {
    id: 'community',
    label: '👋 Community',
    body: 'Hey dev community 👋 — {repoName} {lastTag} is out.\n\n{description}\n\n{url}',
    hashtags: ['devcommunity', 'opensource'],
  },
  {
    id: 'release',
    label: '📦 Release',
    body: '{repoName} {lastTag} — What\'s new:\n\n• [à compléter]\n\n{url}',
    hashtags: ['release', 'changelog'],
  },
];

const MANUAL_DRAFT: PostDraft = {
  templateId: 'manual',
  tone: '✏️ Rédiger manuellement',
  content: '',
  hashtags: [],
  isManual: true,
};

function extractDescription(readmeContent: string): string {
  const lines = readmeContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip headings, badges, empty lines, HTML tags
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!') || trimmed.startsWith('<') || trimmed.startsWith('>')) {
      continue;
    }
    return trimmed;
  }
  return '';
}

export function resolveTemplate(template: PostTemplate, ctx: RepoContext): string {
  const vars: Record<string, string> = {
    repoName: ctx.repoName,
    lastTag: ctx.lastTag ?? '',
    description: extractDescription(ctx.readmeContent),
    url: ctx.remotUrl ?? '',
  };

  return template.body.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');
}

export function getAllTemplates(config: Config): PostTemplate[] {
  return [...BUILT_IN_TEMPLATES, ...(config.customTemplates ?? [])];
}

export function buildDrafts(ctx: RepoContext, config: Config): PostDraft[] {
  const templates = getAllTemplates(config);

  const resolved: PostDraft[] = templates.map(t => ({
    templateId: t.id,
    tone: t.label,
    content: resolveTemplate(t, ctx),
    hashtags: t.hashtags,
    isManual: false,
  }));

  return [MANUAL_DRAFT, ...resolved];
}
