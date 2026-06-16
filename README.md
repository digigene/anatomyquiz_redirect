# anatomyquiz_redirect

Static redirect site for **Anatomy Quiz: Trivia Body Game**.

Live site: https://digigene.github.io/anatomyquiz_redirect/

## Behaviour

- **Default:** redirects mobile visitors to Google Play / App Store; desktop visitors see both store buttons.
- **Campaign links:** supports `?source=` and `?medium=` UTM-style tracking on store URLs.
- **Challenge invites:** URLs like `https://digigene.github.io/anatomyquiz_redirect/challenge/<inviteCode>`:
  1. Generate/persist a `deviceUid` in `localStorage`
  2. `POST` to backend `recordDeferredInvite` with `{ deviceUid, inviteCode }` and `x-deferred-invite-secret`
  3. Redirect the user to the app store so they can install and accept the challenge after login

`CHALLENGE_INVITE_URL_BASE` in AWS SSM should be:

```text
https://digigene.github.io/anatomyquiz_redirect/challenge
```

## Setup

### GitHub Pages deploy

1. In the `digigene/anatomyquiz_redirect` repo settings, enable **GitHub Pages** from **GitHub Actions**.
2. Add repository secret `CHALLENGE_DEFERRED_INVITE_SECRET` (same value as AWS SSM `CHALLENGE_DEFERRED_INVITE_SECRET`).
3. Push to `main` — the workflow generates `config.js` at deploy time and publishes the site.

### API Gateway CORS

The browser `fetch` to `recordDeferredInvite` requires CORS on **BodyQuizRestApiBase** (`r2fihr72e5`). Allow origin `https://digigene.github.io` with methods `POST, OPTIONS` and header `x-deferred-invite-secret`.

```bash
aws apigatewayv2 update-api \
  --api-id r2fihr72e5 \
  --cors-configuration 'AllowCredentials=false,AllowHeaders=content-type,x-deferred-invite-secret,AllowMethods=POST,AllowMethods=OPTIONS,AllowOrigins=https://digigene.github.io,MaxAge=300'
```

### Local testing

```bash
cp config.example.js config.js
# Edit config.js and set deferredInviteSecret
python3 -m http.server 8080
```

Then open e.g. `http://localhost:8080/challenge/ABCD1234` (you may need to serve via a path-aware setup; GitHub Pages uses `404.html` for deep challenge links).

## Files

| File | Purpose |
|---|---|
| `index.html` | Main landing page |
| `404.html` | Same as `index.html`; GitHub Pages serves this for `/challenge/<code>` deep links |
| `redirect.js` | Store redirect + challenge invite handling |
| `config.example.js` | Local config template |
| `config.js` | Generated locally or by CI; not committed |
