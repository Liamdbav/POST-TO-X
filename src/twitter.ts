import * as crypto from 'crypto';
import * as https from 'https';
import * as vscode from 'vscode';
import { Config } from './config';

const TWEET_ENDPOINT = 'https://api.twitter.com/2/tweets';

// ─── OAuth 1.0a helpers ───────────────────────────────────────────────────────

function percentEncode(s: string): string {
  return encodeURIComponent(s).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function buildOAuthHeader(method: string, url: string, body: string, cfg: Config): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key:     cfg.xConsumerKey,
    oauth_nonce:            crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp:        String(Math.floor(Date.now() / 1000)),
    oauth_token:            cfg.xAccessToken,
    oauth_version:          '1.0',
  };

  // Collect all params to sign: oauth params only (body is JSON, not form-encoded)
  const allParams = { ...oauthParams };

  // Sort and encode for the base string
  const paramString = Object.entries(allParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${percentEncode(k)}=${percentEncode(v)}`)
    .join('&');

  const baseString = [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(paramString),
  ].join('&');

  const signingKey = `${percentEncode(cfg.xConsumerSecret)}&${percentEncode(cfg.xAccessTokenSecret)}`;

  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(baseString)
    .digest('base64');

  oauthParams['oauth_signature'] = signature;

  const headerValue = Object.entries(oauthParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${percentEncode(k)}="${percentEncode(v)}"`)
    .join(', ');

  return `OAuth ${headerValue}`;
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

function httpsPost(url: string, headers: Record<string, string>, body: string): Promise<{ status: number; data: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path:     parsed.pathname + parsed.search,
      method:   'POST',
      headers,
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end',  () => resolve({ status: res.statusCode ?? 0, data }));
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── Error mapping ────────────────────────────────────────────────────────────

function xError(status: number, raw: string): Error {
  if (status === 401) {
    return new Error('Credentials X invalides — vérifiez vos tokens dans les Settings (repoToPost).');
  }
  if (status === 403) {
    return new Error('Permissions insuffisantes — votre app X doit avoir les droits Read+Write.');
  }
  if (status === 429) {
    return new Error('Rate limit X atteint — réessayez dans 15 minutes.');
  }
  try {
    const parsed = JSON.parse(raw);
    const detail = parsed?.detail ?? parsed?.title ?? raw;
    return new Error(`Erreur X API (${status}) : ${detail}`);
  } catch {
    return new Error(`Erreur X API (${status}) : ${raw}`);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface TweetResult {
  id: string;
  url: string;
}

export async function publishTweet(content: string, config: Config): Promise<TweetResult> {
  const body = JSON.stringify({ text: content });

  const authHeader = buildOAuthHeader('POST', TWEET_ENDPOINT, body, config);

  const headers: Record<string, string> = {
    'Authorization':  authHeader,
    'Content-Type':   'application/json',
    'Content-Length': Buffer.byteLength(body).toString(),
  };

  const { status, data } = await httpsPost(TWEET_ENDPOINT, headers, body);

  if (status < 200 || status >= 300) {
    throw xError(status, data);
  }

  const parsed = JSON.parse(data) as { data: { id: string; text: string } };
  const id  = parsed.data.id;
  const url = `https://x.com/i/web/status/${id}`;

  // Notification with "Open" action
  vscode.window.showInformationMessage(
    `Tweet publié avec succès !`,
    'Ouvrir sur X'
  ).then(choice => {
    if (choice === 'Ouvrir sur X') {
      vscode.env.openExternal(vscode.Uri.parse(url));
    }
  });

  return { id, url };
}
