# Changelog

## 0.1.0 — Initial release

- Command **Post to X: Generate Post from README** available in the Command Palette
- Reads `README.md` and Git context (repo name, last tag, commit count, remote URL) from the open workspace
- 4 built-in post templates: Launch, Technical, Community, Release
- Manual draft mode for free-form writing
- Webview panel with editable drafts, real-time 280-character counter, and hashtag suggestions
- One-click **Copy** to clipboard
- **Publish** directly to X via OAuth 1.0a (requires X Developer account with Read+Write permissions)
- Status bar item — always visible on Git workspaces
- Supports custom templates via VS Code Settings (`repoToPost.customTemplates`)
- Compatible with Anthropic and OpenAI providers (LLM key configurable in Settings)
