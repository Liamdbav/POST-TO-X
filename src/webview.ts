import * as crypto from 'crypto';
import * as vscode from 'vscode';
import { PostDraft } from './templates';

const TONE_COLORS: Record<string, string> = {
  manual:    '#6c757d',
  launch:    '#e8612c',
  technical: '#0078d4',
  community: '#107c10',
  release:   '#8764b8',
};

function toneColor(templateId: string): string {
  return TONE_COLORS[templateId] ?? '#555';
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function draftCard(draft: PostDraft, index: number): string {
  const color  = toneColor(draft.templateId);
  const chars  = draft.content.length;
  const hashHtml = draft.hashtags.map(h =>
    `<span class="hashtag" data-tag="${escapeHtml(h)}" data-idx="${index}">#${escapeHtml(h)}</span>`
  ).join(' ');

  return /* html */`
  <div class="card" id="card-${index}">
    <div class="card-header">
      <span class="badge" style="background:${color}">${escapeHtml(draft.tone)}</span>
    </div>

    <textarea
      id="ta-${index}"
      class="post-textarea"
      placeholder="${draft.isManual ? 'Rédigez votre post ici…' : ''}"
      data-idx="${index}"
    >${escapeHtml(draft.content)}</textarea>

    <div class="card-footer">
      <span id="count-${index}" class="char-count${chars > 280 ? ' over' : ''}">${chars}/280</span>
      <div class="actions">
        ${draft.hashtags.length ? `<div class="hashtags">${hashHtml}</div>` : ''}
        <button class="btn btn-secondary" data-action="copy" data-idx="${index}">Copy</button>
        <button class="btn btn-primary"   data-action="publish" data-idx="${index}">Publish</button>
      </div>
    </div>
  </div>`;
}

function buildHtml(repoName: string, drafts: PostDraft[], nonce: string): string {
  const cards = drafts.map((d, i) => draftCard(d, i)).join('\n');

  return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy"
  content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Post to X</title>
<style nonce="${nonce}">
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: var(--vscode-font-family);
    font-size: var(--vscode-font-size);
    color: var(--vscode-editor-foreground);
    background: var(--vscode-editor-background);
    padding: 16px;
  }

  h1 {
    font-size: 1.1em;
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--vscode-editor-foreground);
  }

  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .card {
    border: 1px solid var(--vscode-panel-border, #444);
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 16px;
    background: var(--vscode-editorWidget-background, var(--vscode-editor-background));
  }

  .card-header { margin-bottom: 8px; }

  .badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 0.8em;
    font-weight: 600;
    color: #fff;
  }

  .post-textarea {
    width: 100%;
    min-height: 160px;
    padding: 8px;
    border: 1px solid var(--vscode-input-border, #555);
    border-radius: 4px;
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    font-family: var(--vscode-font-family);
    font-size: var(--vscode-font-size);
    resize: none;
    line-height: 1.6;
    overflow: hidden;
  }

  .post-textarea:focus {
    outline: 1px solid var(--vscode-focusBorder);
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
    flex-wrap: wrap;
    gap: 6px;
  }

  .char-count {
    font-size: 0.8em;
    color: var(--vscode-descriptionForeground);
  }

  .char-count.over { color: #f14c4c; font-weight: 600; }

  .actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .hashtags { display: flex; gap: 4px; flex-wrap: wrap; }

  .hashtag {
    font-size: 0.78em;
    color: var(--vscode-textLink-foreground, #3794ff);
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 3px;
  }

  .hashtag:hover { text-decoration: underline; }

  .btn {
    padding: 4px 12px;
    border: none;
    border-radius: 3px;
    font-size: 0.85em;
    cursor: pointer;
    font-family: var(--vscode-font-family);
  }

  .btn-primary {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
  }

  .btn-primary:hover { background: var(--vscode-button-hoverBackground); }

  .btn-secondary {
    background: var(--vscode-button-secondaryBackground, #3a3d41);
    color: var(--vscode-button-secondaryForeground, #ccc);
  }

  .btn-secondary:hover { background: var(--vscode-button-secondaryHoverBackground, #4a4d51); }

  .btn-regenerate {
    background: transparent;
    border: 1px solid var(--vscode-button-background);
    color: var(--vscode-button-background);
    padding: 4px 14px;
    border-radius: 3px;
    font-size: 0.85em;
    cursor: pointer;
    font-family: var(--vscode-font-family);
  }

  .btn-regenerate:hover { opacity: 0.8; }
</style>
</head>
<body>

<div class="top-bar">
  <h1>Post to X — ${escapeHtml(repoName)}</h1>
  <button class="btn-regenerate" id="btn-regenerate">↺ Regenerate</button>
</div>

${cards}

<script nonce="${nonce}">
  const vscode = acquireVsCodeApi();

  // Restore persisted state if any
  const state = vscode.getState() || { contents: {} };

  // Textarea → char counter
  document.querySelectorAll('.post-textarea').forEach(ta => {
    const idx   = ta.dataset.idx;
    const count = document.getElementById('count-' + idx);

    // Restore content from state
    if (state.contents[idx] !== undefined) {
      ta.value = state.contents[idx];
    }

    function update() {
      const len = ta.value.length;
      count.textContent = len + '/280';
      count.classList.toggle('over', len > 280);
      state.contents[idx] = ta.value;
      vscode.setState(state);
    }

    function autoResize() {
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    }

    ta.addEventListener('input', () => { update(); autoResize(); });
    update();
    autoResize();
  });

  // Hashtag click → append to textarea
  document.querySelectorAll('.hashtag').forEach(tag => {
    tag.addEventListener('click', () => {
      const idx = tag.dataset.idx;
      const ta  = document.getElementById('ta-' + idx);
      const ht  = ' #' + tag.dataset.tag;
      if (!ta.value.includes(ht.trim())) {
        ta.value += ht;
        ta.dispatchEvent(new Event('input'));
      }
    });
  });

  // Copy / Publish buttons
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) { return; }
    const idx     = btn.dataset.idx;
    const content = document.getElementById('ta-' + idx).value;
    vscode.postMessage({ type: btn.dataset.action, content });
  });

  // Regenerate button
  document.getElementById('btn-regenerate').addEventListener('click', () => {
    vscode.postMessage({ type: 'regenerate' });
  });

  // Extension → Webview messages
  window.addEventListener('message', e => {
    const msg = e.data;
    if (msg.type === 'loadDrafts') {
      // Full reload — extension will dispose and recreate the panel
    }
  });
</script>
</body>
</html>`;
}

export function openPostPanel(
  context: vscode.ExtensionContext,
  repoName: string,
  drafts: PostDraft[],
  onPublish: (content: string) => void,
  onRegenerate: () => void,
): vscode.WebviewPanel {
  const nonce = crypto.randomBytes(16).toString('base64').replace(/[^a-zA-Z0-9]/g, '');

  const panel = vscode.window.createWebviewPanel(
    'repoToPost',
    `Post to X — ${repoName}`,
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    }
  );

  panel.webview.html = buildHtml(repoName, drafts, nonce);

  panel.webview.onDidReceiveMessage(
    msg => {
      switch (msg.type) {
        case 'publish':
          onPublish(msg.content as string);
          break;
        case 'copy':
          vscode.env.clipboard.writeText(msg.content as string).then(() => {
            vscode.window.showInformationMessage('Post copié dans le presse-papier.');
          });
          break;
        case 'regenerate':
          onRegenerate();
          break;
      }
    },
    undefined,
    context.subscriptions
  );

  return panel;
}
