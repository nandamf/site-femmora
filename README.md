# Femmora

Femmora is a React + Vite storefront built with Tailwind CSS, React Router, and React Query.

## Setup

1. Clone the repository.
2. Open the project folder.
3. Install dependencies:

```bash
npm install
```

## Run locally

Start the development server:

```bash
npm run dev
```

Open the local URL printed by Vite.

## Build

Build the production output:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Project structure

- `src/` — main React application source
- `src/api/authClient.js` — local mock authentication client
- `src/components/` — UI components and layout pieces
- `src/lib/` — app data, utilities, and context providers

## Notes

- The app uses local authentication state and does not depend on an external hosted backend.
- Update styling and product data in `src/lib/products.js`.
