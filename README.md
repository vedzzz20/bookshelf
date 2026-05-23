# Bookshelf

A personal book tracking app. Search any book, log it to your shelf with status, rating, and notes.

## Project structure

```
bookshelf/
├── index.html        ← main page
├── vercel.json       ← Vercel routing config
└── src/
    ├── style.css     ← all styles
    ├── users.js      ← user accounts (edit this to add users)
    └── app.js        ← all app logic
```

## Adding / changing users

Open `src/users.js` and edit the `USERS` object:

```js
const USERS = {
  alice: { pass: "alicepassword", name: "Alice" },
  bob:   { pass: "bobpassword",   name: "Bob" },
};
```

Save and push to GitHub — Vercel will redeploy automatically.

## Deploy to Vercel

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Framework preset: **Other** (no build step needed)
4. Click Deploy — done!

## Notes

- Book data comes from [Open Library](https://openlibrary.org) (free, no API key needed)
- Each user's shelf is saved in their browser's `localStorage`
- No backend or database required
