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

## Notes

- Book data comes from [Open Library](https://openlibrary.org) (free, no API key needed)
- Each user's shelf is saved in their browser's `localStorage`
- No backend or database required
