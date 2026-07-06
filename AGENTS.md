# AGENTS.md

## Project Context

This is a standalone React storefront repository. Keep changes focused on the app experience, styling, and local auth flow.

Start with `README.md` for setup and local development instructions.

## Key Files

- `src/` — frontend application source.
- `src/api/authClient.js` — local mock authentication client.
- `src/lib/AuthContext.jsx` — authentication provider.
- `src/lib/products.js` — product and category data.
- `src/components/store/Header.jsx` — navigation, mobile menu, and search overlay.
- `src/components/store/Hero.jsx` — homepage hero section.
- `vite.config.js` — Vite project configuration.

## Working Notes

- Use `npm install` and `npm run dev` for local development.
- Use `npm run build` to generate production output.
- No external backend framework is required for this app.
- Keep the app independent from external tooling or CLI commands.
