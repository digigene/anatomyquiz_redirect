# anatomyquiz_redirect

Static redirect site for **Anatomy Quiz: Trivia Body Game**.

Live site: https://digigene.github.io/anatomyquiz_redirect/

## Behaviour

- **Default:** redirects mobile visitors to Google Play / App Store; desktop visitors see both store buttons.
- **Campaign links:** supports `?source=` and `?medium=` UTM-style tracking on store URLs.
- **Challenge invites:** URLs like `https://digigene.github.io/anatomyquiz_redirect/challenge/<inviteCode>`:
  1. Generate/persist a `deviceUid` in `localStorage` (or reuse `?deviceUid=` from the URL)
  2. Append `?deviceUid=<uuid>` to the invite URL via `history.replaceState` so deferred App Links carry the same UUID
  3. `POST` to backend `recordDeferredInvite` with `{ deviceUid, inviteCode }`
  4. Redirect the user to the app store (Play Store referrer also includes `deviceUid` on Android)
  5. After install, the app resolves the deferred invite using the same `deviceUid` at guest login

`CHALLENGE_INVITE_URL_BASE` in AWS SSM should be:

```text
https://digigene.github.io/anatomyquiz_redirect/challenge
```

### Universal links (Android + iOS)

Android App Links and iOS Universal Links are verified at the **org Pages root** repo [`digigene/digigene.github.io`](https://github.com/digigene/digigene.github.io):

- `https://digigene.github.io/.well-known/assetlinks.json`
- `https://digigene.github.io/apple-app-site-association`

Deploy that repo (with the `ANDROID_PLAY_SIGNING_SHA256` secret set) before expecting challenge invite links to open the installed app directly.

## Setup

### GitHub Pages deploy

1. In the `digigene/anatomyquiz_redirect` repo settings, enable **GitHub Pages** from **GitHub Actions** or deploy from `main`.
2. Push to `main` — the workflow publishes the static site. No generated config files are required; `redirect.js` includes the production API base URL.

### API Gateway CORS

The browser `fetch` to `recordDeferredInvite` requires CORS on **BodyQuizRestApiBase** (`r2fihr72e5`). Allow origin `https://digigene.github.io` with methods `POST, OPTIONS` and header `content-type`.

```bash
aws apigatewayv2 update-api \
  --api-id r2fihr72e5 \
  --cors-configuration 'AllowCredentials=false,AllowHeaders=content-type,AllowMethods=POST,AllowMethods=OPTIONS,AllowOrigins=https://digigene.github.io,MaxAge=300'
```

### Local testing

```bash
python3 -m http.server 8080
```

Then open e.g. `http://localhost:8080/challenge/ABCD` (you may need to serve via a path-aware setup; GitHub Pages uses `404.html` for deep challenge links).

To point at a non-production API, set `window.AQ_CONFIG` before `redirect.js` loads:

```html
<script>window.AQ_CONFIG = { apiBaseUrl: "https://your-api.example.com/prod" };</script>
<script src="redirect.js"></script>
```

## Files

| File | Purpose |
|---|---|
| `index.html` | Main landing page |
| `404.html` | Same as `index.html`; GitHub Pages serves this for `/challenge/<code>` deep links |
| `redirect.js` | Store redirect + challenge invite handling (includes production API base URL) |
