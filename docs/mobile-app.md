# The phone app

The phone app is built in Flutter. The website is made for a computer: a board with columns and
dragging does not suit a small screen. This file is what the two have to agree on.

## Sending phones to the app (`MobileAppGate`)

On a phone, the website offers the app first: "Use the Globosoft app" with a **Get it on Google
Play** or **Download on the App Store** button, and a small **Continue in browser** link.

- Set the store addresses in the environment (see `.env.example`):
  `VITE_ANDROID_APP_URL` and `VITE_IOS_APP_URL`. They are public values.
- **Until the address for a kind of phone is set, nothing happens for that kind of phone.** Leave
  both empty until the app is published, so a demo on a phone still works.
- Only phones are sent: computers and tablets (including iPads, which call themselves a Mac) use the
  website.
- It is a pointer, not a lock. The browser tells the website what it is, so anyone can change that
  ("Desktop site"), and the API answers both the same. "Continue in browser" is remembered on that
  phone. Do not use it to keep anyone out.

## Opening a link in the app (to do with the app)

A link to the website, like `/board?client=3`, should open in the app when it is installed. That
needs files on the website's domain and a setting in each store build:

- iOS Universal Links: `/.well-known/apple-app-site-association`
- Android App Links: `/.well-known/assetlinks.json`

Without the app installed the same link opens the website (and, on a phone, the page above).
Notification links depend on this, so do it with the notifications.

## What the API has to give the app

The app talks to the same API as the website. The contract is written for both:

- **The backend decides who may do what.** Every card carries `actions` (see *Cards* in
  `api-contract.md`), so the app does not write the permission rules again.
- **Numbers are counted by the backend** (month overview, reports), not by the client.
- **Sign-in.** The website uses an httpOnly cookie session. The app signs in with Google on the
  phone and sends the ID token to `POST /auth/google` too. Decide with the auth code how the app
  keeps its session: a cookie jar (works with the same cookies) or a token in the response for
  non-browser clients. This is part of the open auth decisions in `database.md`.
