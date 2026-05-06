/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/config.ts"
/*!***********************!*\
  !*** ./src/config.ts ***!
  \***********************/
(__unused_webpack_module, exports, __webpack_require__) {

eval("{\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.getConfig = getConfig;\nexports.requireApiKey = requireApiKey;\nconst vscode = __webpack_require__(/*! vscode */ \"vscode\");\nfunction getConfig() {\n    const cfg = vscode.workspace.getConfiguration('repoToPost');\n    return {\n        llmProvider: cfg.get('llmProvider', 'anthropic'),\n        apiKey: cfg.get('apiKey', ''),\n        xConsumerKey: cfg.get('xConsumerKey', ''),\n        xConsumerSecret: cfg.get('xConsumerSecret', ''),\n        xAccessToken: cfg.get('xAccessToken', ''),\n        xAccessTokenSecret: cfg.get('xAccessTokenSecret', ''),\n        defaultTones: cfg.get('defaultTones', ['technical', 'launch', 'community']),\n        customTemplates: cfg.get('customTemplates', []),\n    };\n}\nasync function requireApiKey() {\n    const { apiKey } = getConfig();\n    if (apiKey.trim() !== '') {\n        return true;\n    }\n    vscode.window.showInformationMessage('Post to X : aucune clé API configurée. Renseignez \"repoToPost.apiKey\" dans les Settings.', 'Ouvrir les Settings').then(choice => {\n        if (choice === 'Ouvrir les Settings') {\n            vscode.commands.executeCommand('workbench.action.openSettings', 'repoToPost');\n        }\n    });\n    return false;\n}\n\n\n//# sourceURL=webpack://repo-to-post/./src/config.ts?\n}");

/***/ },

/***/ "./src/errors.ts"
/*!***********************!*\
  !*** ./src/errors.ts ***!
  \***********************/
(__unused_webpack_module, exports, __webpack_require__) {

eval("{\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.RepoToPostError = void 0;\nexports.handleError = handleError;\nexports.configError = configError;\nexports.gitError = gitError;\nexports.publishError = publishError;\nexports.llmError = llmError;\nconst vscode = __webpack_require__(/*! vscode */ \"vscode\");\nclass RepoToPostError extends Error {\n    constructor(code, message, action) {\n        super(message);\n        this.code = code;\n        this.action = action;\n        this.name = 'RepoToPostError';\n    }\n}\nexports.RepoToPostError = RepoToPostError;\nfunction handleError(err) {\n    if (err instanceof RepoToPostError) {\n        if (err.action) {\n            vscode.window.showErrorMessage(`Post to X : ${err.message}`, err.action.label)\n                .then(choice => { if (choice === err.action.label) {\n                err.action.run();\n            } });\n        }\n        else {\n            vscode.window.showErrorMessage(`Post to X : ${err.message}`);\n        }\n        return;\n    }\n    const message = err instanceof Error ? err.message : String(err);\n    vscode.window.showErrorMessage(`Post to X : ${message}`);\n}\n// ─── Factories ────────────────────────────────────────────────────────────────\nfunction configError(detail) {\n    return new RepoToPostError('CONFIG_ERROR', detail, {\n        label: 'Ouvrir les Settings',\n        run: () => vscode.commands.executeCommand('workbench.action.openSettings', 'repoToPost'),\n    });\n}\nfunction gitError(detail) {\n    return new RepoToPostError('GIT_ERROR', detail);\n}\nfunction publishError(detail) {\n    return new RepoToPostError('PUBLISH_ERROR', detail, {\n        label: 'Ouvrir les Settings',\n        run: () => vscode.commands.executeCommand('workbench.action.openSettings', 'repoToPost'),\n    });\n}\nfunction llmError(detail) {\n    return new RepoToPostError('LLM_ERROR', detail, {\n        label: 'Ouvrir les Settings',\n        run: () => vscode.commands.executeCommand('workbench.action.openSettings', 'repoToPost'),\n    });\n}\n\n\n//# sourceURL=webpack://repo-to-post/./src/errors.ts?\n}");

/***/ },

/***/ "./src/extension.ts"
/*!**************************!*\
  !*** ./src/extension.ts ***!
  \**************************/
(__unused_webpack_module, exports, __webpack_require__) {

eval("{\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.activate = activate;\nexports.deactivate = deactivate;\nconst vscode = __webpack_require__(/*! vscode */ \"vscode\");\nconst fs = __webpack_require__(/*! fs */ \"fs\");\nconst path = __webpack_require__(/*! path */ \"path\");\nconst child_process_1 = __webpack_require__(/*! child_process */ \"child_process\");\nconst config_1 = __webpack_require__(/*! ./config */ \"./src/config.ts\");\nconst templates_1 = __webpack_require__(/*! ./templates */ \"./src/templates.ts\");\nconst webview_1 = __webpack_require__(/*! ./webview */ \"./src/webview.ts\");\nconst twitter_1 = __webpack_require__(/*! ./twitter */ \"./src/twitter.ts\");\nconst errors_1 = __webpack_require__(/*! ./errors */ \"./src/errors.ts\");\nfunction git(cwd, args) {\n    return (0, child_process_1.execSync)(`git ${args}`, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();\n}\nfunction buildRepoContext(rootPath) {\n    const readmePath = path.join(rootPath, 'README.md');\n    if (!fs.existsSync(readmePath)) {\n        throw (0, errors_1.gitError)('README.md introuvable à la racine du workspace.');\n    }\n    const readmeContent = fs.readFileSync(readmePath, 'utf8');\n    let remotUrl = null;\n    let repoName = path.basename(rootPath);\n    try {\n        remotUrl = git(rootPath, 'remote get-url origin');\n        const match = remotUrl.match(/\\/([^/]+?)(?:\\.git)?$/);\n        if (match) {\n            repoName = match[1];\n        }\n    }\n    catch { /* no remote — use folder name */ }\n    let lastTag = null;\n    try {\n        lastTag = git(rootPath, 'describe --tags --abbrev=0');\n    }\n    catch { /* no tags */ }\n    let commitsSinceTag = null;\n    if (lastTag) {\n        try {\n            commitsSinceTag = parseInt(git(rootPath, `rev-list ${lastTag}..HEAD --count`), 10);\n        }\n        catch { /* ignore */ }\n    }\n    return { repoName, readmeContent, lastTag, commitsSinceTag, remotUrl };\n}\nfunction isGitWorkspace() {\n    const folders = vscode.workspace.workspaceFolders;\n    if (!folders || folders.length === 0) {\n        return false;\n    }\n    try {\n        git(folders[0].uri.fsPath, 'rev-parse --git-dir');\n        return true;\n    }\n    catch {\n        return false;\n    }\n}\nfunction createStatusBar(context) {\n    const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);\n    item.text = '$(megaphone) Post to X';\n    item.tooltip = 'Generate a post from your README';\n    item.command = 'repo-to-post.generatePost';\n    const update = () => { isGitWorkspace() ? item.show() : item.hide(); };\n    update();\n    context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(update), item);\n    return item;\n}\nfunction activate(context) {\n    createStatusBar(context);\n    const command = vscode.commands.registerCommand('repo-to-post.generatePost', async () => {\n        if (!(await (0, config_1.requireApiKey)())) {\n            return;\n        }\n        const folders = vscode.workspace.workspaceFolders;\n        if (!folders || folders.length === 0) {\n            (0, errors_1.handleError)((0, errors_1.gitError)('Aucun workspace ouvert.'));\n            return;\n        }\n        const rootPath = folders[0].uri.fsPath;\n        try {\n            const { repoContext, drafts } = await vscode.window.withProgress({\n                location: vscode.ProgressLocation.Notification,\n                title: 'Post to X',\n                cancellable: false,\n            }, async (progress) => {\n                progress.report({ message: 'Analysing README and generating posts… (this may take 10-15 seconds)' });\n                const repoContext = buildRepoContext(rootPath);\n                const config = (0, config_1.getConfig)();\n                const drafts = (0, templates_1.buildDrafts)(repoContext, config);\n                return { repoContext, drafts };\n            });\n            (0, webview_1.openPostPanel)(context, repoContext.repoName, drafts, (content) => {\n                (0, twitter_1.publishTweet)(content, (0, config_1.getConfig)()).catch(err => {\n                    (0, errors_1.handleError)((0, errors_1.publishError)(err instanceof Error ? err.message : String(err)));\n                });\n            }, () => { vscode.commands.executeCommand('repo-to-post.generatePost'); });\n        }\n        catch (err) {\n            (0, errors_1.handleError)(err);\n        }\n    });\n    context.subscriptions.push(command);\n}\nfunction deactivate() { }\n\n\n//# sourceURL=webpack://repo-to-post/./src/extension.ts?\n}");

/***/ },

/***/ "./src/templates.ts"
/*!**************************!*\
  !*** ./src/templates.ts ***!
  \**************************/
(__unused_webpack_module, exports) {

eval("{\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.resolveTemplate = resolveTemplate;\nexports.getAllTemplates = getAllTemplates;\nexports.buildDrafts = buildDrafts;\nconst BUILT_IN_TEMPLATES = [\n    {\n        id: 'launch',\n        label: '🚀 Launch',\n        body: '🚀 Just shipped {repoName} {lastTag}!\\n\\n{description}\\n\\n{url}',\n        hashtags: ['opensource', 'buildinpublic'],\n    },\n    {\n        id: 'technical',\n        label: '🛠 Technical',\n        body: 'Built {repoName} to solve [problem].\\n\\nStack: [à compléter]\\n\\n{url}',\n        hashtags: ['devtools', 'programming'],\n    },\n    {\n        id: 'community',\n        label: '👋 Community',\n        body: 'Hey dev community 👋 — {repoName} {lastTag} is out.\\n\\n{description}\\n\\n{url}',\n        hashtags: ['devcommunity', 'opensource'],\n    },\n    {\n        id: 'release',\n        label: '📦 Release',\n        body: '{repoName} {lastTag} — What\\'s new:\\n\\n• [à compléter]\\n\\n{url}',\n        hashtags: ['release', 'changelog'],\n    },\n];\nconst MANUAL_DRAFT = {\n    templateId: 'manual',\n    tone: '✏️ Rédiger manuellement',\n    content: '',\n    hashtags: [],\n    isManual: true,\n};\nfunction extractDescription(readmeContent) {\n    const lines = readmeContent.split('\\n');\n    for (const line of lines) {\n        const trimmed = line.trim();\n        // Skip headings, badges, empty lines, HTML tags\n        if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!') || trimmed.startsWith('<') || trimmed.startsWith('>')) {\n            continue;\n        }\n        return trimmed;\n    }\n    return '';\n}\nfunction resolveTemplate(template, ctx) {\n    const vars = {\n        repoName: ctx.repoName,\n        lastTag: ctx.lastTag ?? '',\n        description: extractDescription(ctx.readmeContent),\n        url: ctx.remotUrl ?? '',\n    };\n    return template.body.replace(/\\{(\\w+)\\}/g, (_, key) => vars[key] ?? '');\n}\nfunction getAllTemplates(config) {\n    return [...BUILT_IN_TEMPLATES, ...(config.customTemplates ?? [])];\n}\nfunction buildDrafts(ctx, config) {\n    const templates = getAllTemplates(config);\n    const resolved = templates.map(t => ({\n        templateId: t.id,\n        tone: t.label,\n        content: resolveTemplate(t, ctx),\n        hashtags: t.hashtags,\n        isManual: false,\n    }));\n    return [MANUAL_DRAFT, ...resolved];\n}\n\n\n//# sourceURL=webpack://repo-to-post/./src/templates.ts?\n}");

/***/ },

/***/ "./src/twitter.ts"
/*!************************!*\
  !*** ./src/twitter.ts ***!
  \************************/
(__unused_webpack_module, exports, __webpack_require__) {

eval("{\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.publishTweet = publishTweet;\nconst crypto = __webpack_require__(/*! crypto */ \"crypto\");\nconst https = __webpack_require__(/*! https */ \"https\");\nconst vscode = __webpack_require__(/*! vscode */ \"vscode\");\nconst TWEET_ENDPOINT = 'https://api.twitter.com/2/tweets';\n// ─── OAuth 1.0a helpers ───────────────────────────────────────────────────────\nfunction percentEncode(s) {\n    return encodeURIComponent(s).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());\n}\nfunction buildOAuthHeader(method, url, body, cfg) {\n    const oauthParams = {\n        oauth_consumer_key: cfg.xConsumerKey,\n        oauth_nonce: crypto.randomBytes(16).toString('hex'),\n        oauth_signature_method: 'HMAC-SHA1',\n        oauth_timestamp: String(Math.floor(Date.now() / 1000)),\n        oauth_token: cfg.xAccessToken,\n        oauth_version: '1.0',\n    };\n    // Collect all params to sign: oauth params only (body is JSON, not form-encoded)\n    const allParams = { ...oauthParams };\n    // Sort and encode for the base string\n    const paramString = Object.entries(allParams)\n        .sort(([a], [b]) => a.localeCompare(b))\n        .map(([k, v]) => `${percentEncode(k)}=${percentEncode(v)}`)\n        .join('&');\n    const baseString = [\n        method.toUpperCase(),\n        percentEncode(url),\n        percentEncode(paramString),\n    ].join('&');\n    const signingKey = `${percentEncode(cfg.xConsumerSecret)}&${percentEncode(cfg.xAccessTokenSecret)}`;\n    const signature = crypto\n        .createHmac('sha1', signingKey)\n        .update(baseString)\n        .digest('base64');\n    oauthParams['oauth_signature'] = signature;\n    const headerValue = Object.entries(oauthParams)\n        .sort(([a], [b]) => a.localeCompare(b))\n        .map(([k, v]) => `${percentEncode(k)}=\"${percentEncode(v)}\"`)\n        .join(', ');\n    return `OAuth ${headerValue}`;\n}\n// ─── HTTP helper ──────────────────────────────────────────────────────────────\nfunction httpsPost(url, headers, body) {\n    return new Promise((resolve, reject) => {\n        const parsed = new URL(url);\n        const options = {\n            hostname: parsed.hostname,\n            path: parsed.pathname + parsed.search,\n            method: 'POST',\n            headers,\n        };\n        const req = https.request(options, res => {\n            let data = '';\n            res.on('data', chunk => { data += chunk; });\n            res.on('end', () => resolve({ status: res.statusCode ?? 0, data }));\n        });\n        req.on('error', reject);\n        req.write(body);\n        req.end();\n    });\n}\n// ─── Error mapping ────────────────────────────────────────────────────────────\nfunction xError(status, raw) {\n    if (status === 401) {\n        return new Error('Credentials X invalides — vérifiez vos tokens dans les Settings (repoToPost).');\n    }\n    if (status === 403) {\n        return new Error('Permissions insuffisantes — votre app X doit avoir les droits Read+Write.');\n    }\n    if (status === 429) {\n        return new Error('Rate limit X atteint — réessayez dans 15 minutes.');\n    }\n    try {\n        const parsed = JSON.parse(raw);\n        const detail = parsed?.detail ?? parsed?.title ?? raw;\n        return new Error(`Erreur X API (${status}) : ${detail}`);\n    }\n    catch {\n        return new Error(`Erreur X API (${status}) : ${raw}`);\n    }\n}\nasync function publishTweet(content, config) {\n    const body = JSON.stringify({ text: content });\n    const authHeader = buildOAuthHeader('POST', TWEET_ENDPOINT, body, config);\n    const headers = {\n        'Authorization': authHeader,\n        'Content-Type': 'application/json',\n        'Content-Length': Buffer.byteLength(body).toString(),\n    };\n    const { status, data } = await httpsPost(TWEET_ENDPOINT, headers, body);\n    if (status < 200 || status >= 300) {\n        throw xError(status, data);\n    }\n    const parsed = JSON.parse(data);\n    const id = parsed.data.id;\n    const url = `https://x.com/i/web/status/${id}`;\n    // Notification with \"Open\" action\n    vscode.window.showInformationMessage(`Tweet publié avec succès !`, 'Ouvrir sur X').then(choice => {\n        if (choice === 'Ouvrir sur X') {\n            vscode.env.openExternal(vscode.Uri.parse(url));\n        }\n    });\n    return { id, url };\n}\n\n\n//# sourceURL=webpack://repo-to-post/./src/twitter.ts?\n}");

/***/ },

/***/ "./src/webview.ts"
/*!************************!*\
  !*** ./src/webview.ts ***!
  \************************/
(__unused_webpack_module, exports, __webpack_require__) {

eval("{\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.openPostPanel = openPostPanel;\nconst crypto = __webpack_require__(/*! crypto */ \"crypto\");\nconst vscode = __webpack_require__(/*! vscode */ \"vscode\");\nconst TONE_COLORS = {\n    manual: '#6c757d',\n    launch: '#e8612c',\n    technical: '#0078d4',\n    community: '#107c10',\n    release: '#8764b8',\n};\nfunction toneColor(templateId) {\n    return TONE_COLORS[templateId] ?? '#555';\n}\nfunction escapeHtml(str) {\n    return str\n        .replace(/&/g, '&amp;')\n        .replace(/</g, '&lt;')\n        .replace(/>/g, '&gt;')\n        .replace(/\"/g, '&quot;');\n}\nfunction draftCard(draft, index) {\n    const color = toneColor(draft.templateId);\n    const chars = draft.content.length;\n    const hashHtml = draft.hashtags.map(h => `<span class=\"hashtag\" data-tag=\"${escapeHtml(h)}\" data-idx=\"${index}\">#${escapeHtml(h)}</span>`).join(' ');\n    return /* html */ `\n  <div class=\"card\" id=\"card-${index}\">\n    <div class=\"card-header\">\n      <span class=\"badge\" style=\"background:${color}\">${escapeHtml(draft.tone)}</span>\n    </div>\n\n    <textarea\n      id=\"ta-${index}\"\n      class=\"post-textarea\"\n      placeholder=\"${draft.isManual ? 'Rédigez votre post ici…' : ''}\"\n      data-idx=\"${index}\"\n    >${escapeHtml(draft.content)}</textarea>\n\n    <div class=\"card-footer\">\n      <span id=\"count-${index}\" class=\"char-count${chars > 280 ? ' over' : ''}\">${chars}/280</span>\n      <div class=\"actions\">\n        ${draft.hashtags.length ? `<div class=\"hashtags\">${hashHtml}</div>` : ''}\n        <button class=\"btn btn-secondary\" data-action=\"copy\" data-idx=\"${index}\">Copy</button>\n        <button class=\"btn btn-primary\"   data-action=\"publish\" data-idx=\"${index}\">Publish</button>\n      </div>\n    </div>\n  </div>`;\n}\nfunction buildHtml(repoName, drafts, nonce) {\n    const cards = drafts.map((d, i) => draftCard(d, i)).join('\\n');\n    return /* html */ `<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"UTF-8\">\n<meta http-equiv=\"Content-Security-Policy\"\n  content=\"default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n<title>Post to X</title>\n<style nonce=\"${nonce}\">\n  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }\n\n  body {\n    font-family: var(--vscode-font-family);\n    font-size: var(--vscode-font-size);\n    color: var(--vscode-editor-foreground);\n    background: var(--vscode-editor-background);\n    padding: 16px;\n  }\n\n  h1 {\n    font-size: 1.1em;\n    font-weight: 600;\n    margin-bottom: 12px;\n    color: var(--vscode-editor-foreground);\n  }\n\n  .top-bar {\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n    margin-bottom: 20px;\n  }\n\n  .card {\n    border: 1px solid var(--vscode-panel-border, #444);\n    border-radius: 6px;\n    padding: 12px;\n    margin-bottom: 16px;\n    background: var(--vscode-editorWidget-background, var(--vscode-editor-background));\n  }\n\n  .card-header { margin-bottom: 8px; }\n\n  .badge {\n    display: inline-block;\n    padding: 2px 10px;\n    border-radius: 12px;\n    font-size: 0.8em;\n    font-weight: 600;\n    color: #fff;\n  }\n\n  .post-textarea {\n    width: 100%;\n    min-height: 160px;\n    padding: 8px;\n    border: 1px solid var(--vscode-input-border, #555);\n    border-radius: 4px;\n    background: var(--vscode-input-background);\n    color: var(--vscode-input-foreground);\n    font-family: var(--vscode-font-family);\n    font-size: var(--vscode-font-size);\n    resize: none;\n    line-height: 1.6;\n    overflow: hidden;\n  }\n\n  .post-textarea:focus {\n    outline: 1px solid var(--vscode-focusBorder);\n  }\n\n  .card-footer {\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n    margin-top: 8px;\n    flex-wrap: wrap;\n    gap: 6px;\n  }\n\n  .char-count {\n    font-size: 0.8em;\n    color: var(--vscode-descriptionForeground);\n  }\n\n  .char-count.over { color: #f14c4c; font-weight: 600; }\n\n  .actions {\n    display: flex;\n    align-items: center;\n    gap: 6px;\n    flex-wrap: wrap;\n  }\n\n  .hashtags { display: flex; gap: 4px; flex-wrap: wrap; }\n\n  .hashtag {\n    font-size: 0.78em;\n    color: var(--vscode-textLink-foreground, #3794ff);\n    cursor: pointer;\n    padding: 2px 4px;\n    border-radius: 3px;\n  }\n\n  .hashtag:hover { text-decoration: underline; }\n\n  .btn {\n    padding: 4px 12px;\n    border: none;\n    border-radius: 3px;\n    font-size: 0.85em;\n    cursor: pointer;\n    font-family: var(--vscode-font-family);\n  }\n\n  .btn-primary {\n    background: var(--vscode-button-background);\n    color: var(--vscode-button-foreground);\n  }\n\n  .btn-primary:hover { background: var(--vscode-button-hoverBackground); }\n\n  .btn-secondary {\n    background: var(--vscode-button-secondaryBackground, #3a3d41);\n    color: var(--vscode-button-secondaryForeground, #ccc);\n  }\n\n  .btn-secondary:hover { background: var(--vscode-button-secondaryHoverBackground, #4a4d51); }\n\n  .btn-regenerate {\n    background: transparent;\n    border: 1px solid var(--vscode-button-background);\n    color: var(--vscode-button-background);\n    padding: 4px 14px;\n    border-radius: 3px;\n    font-size: 0.85em;\n    cursor: pointer;\n    font-family: var(--vscode-font-family);\n  }\n\n  .btn-regenerate:hover { opacity: 0.8; }\n</style>\n</head>\n<body>\n\n<div class=\"top-bar\">\n  <h1>Post to X — ${escapeHtml(repoName)}</h1>\n  <button class=\"btn-regenerate\" id=\"btn-regenerate\">↺ Regenerate</button>\n</div>\n\n${cards}\n\n<script nonce=\"${nonce}\">\n  const vscode = acquireVsCodeApi();\n\n  // Restore persisted state if any\n  const state = vscode.getState() || { contents: {} };\n\n  // Textarea → char counter\n  document.querySelectorAll('.post-textarea').forEach(ta => {\n    const idx   = ta.dataset.idx;\n    const count = document.getElementById('count-' + idx);\n\n    // Restore content from state\n    if (state.contents[idx] !== undefined) {\n      ta.value = state.contents[idx];\n    }\n\n    function update() {\n      const len = ta.value.length;\n      count.textContent = len + '/280';\n      count.classList.toggle('over', len > 280);\n      state.contents[idx] = ta.value;\n      vscode.setState(state);\n    }\n\n    function autoResize() {\n      ta.style.height = 'auto';\n      ta.style.height = ta.scrollHeight + 'px';\n    }\n\n    ta.addEventListener('input', () => { update(); autoResize(); });\n    update();\n    autoResize();\n  });\n\n  // Hashtag click → append to textarea\n  document.querySelectorAll('.hashtag').forEach(tag => {\n    tag.addEventListener('click', () => {\n      const idx = tag.dataset.idx;\n      const ta  = document.getElementById('ta-' + idx);\n      const ht  = ' #' + tag.dataset.tag;\n      if (!ta.value.includes(ht.trim())) {\n        ta.value += ht;\n        ta.dispatchEvent(new Event('input'));\n      }\n    });\n  });\n\n  // Copy / Publish buttons\n  document.addEventListener('click', e => {\n    const btn = e.target.closest('[data-action]');\n    if (!btn) { return; }\n    const idx     = btn.dataset.idx;\n    const content = document.getElementById('ta-' + idx).value;\n    vscode.postMessage({ type: btn.dataset.action, content });\n  });\n\n  // Regenerate button\n  document.getElementById('btn-regenerate').addEventListener('click', () => {\n    vscode.postMessage({ type: 'regenerate' });\n  });\n\n  // Extension → Webview messages\n  window.addEventListener('message', e => {\n    const msg = e.data;\n    if (msg.type === 'loadDrafts') {\n      // Full reload — extension will dispose and recreate the panel\n    }\n  });\n</script>\n</body>\n</html>`;\n}\nfunction openPostPanel(context, repoName, drafts, onPublish, onRegenerate) {\n    const nonce = crypto.randomBytes(16).toString('base64').replace(/[^a-zA-Z0-9]/g, '');\n    const panel = vscode.window.createWebviewPanel('repoToPost', `Post to X — ${repoName}`, vscode.ViewColumn.Beside, {\n        enableScripts: true,\n        retainContextWhenHidden: true,\n    });\n    panel.webview.html = buildHtml(repoName, drafts, nonce);\n    panel.webview.onDidReceiveMessage(msg => {\n        switch (msg.type) {\n            case 'publish':\n                onPublish(msg.content);\n                break;\n            case 'copy':\n                vscode.env.clipboard.writeText(msg.content).then(() => {\n                    vscode.window.showInformationMessage('Post copié dans le presse-papier.');\n                });\n                break;\n            case 'regenerate':\n                onRegenerate();\n                break;\n        }\n    }, undefined, context.subscriptions);\n    return panel;\n}\n\n\n//# sourceURL=webpack://repo-to-post/./src/webview.ts?\n}");

/***/ },

/***/ "vscode"
/*!*************************!*\
  !*** external "vscode" ***!
  \*************************/
(module) {

module.exports = require("vscode");

/***/ },

/***/ "child_process"
/*!********************************!*\
  !*** external "child_process" ***!
  \********************************/
(module) {

module.exports = require("child_process");

/***/ },

/***/ "crypto"
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
(module) {

module.exports = require("crypto");

/***/ },

/***/ "fs"
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
(module) {

module.exports = require("fs");

/***/ },

/***/ "https"
/*!************************!*\
  !*** external "https" ***!
  \************************/
(module) {

module.exports = require("https");

/***/ },

/***/ "path"
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
(module) {

module.exports = require("path");

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src/extension.ts");
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;