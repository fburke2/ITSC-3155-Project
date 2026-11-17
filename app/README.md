# React + TypeScript + Vite

## Degree survey SQL persistence

Degree survey submissions are saved in browser storage and synced to MySQL when
the API and a database configured by `DATABASE_URL` are available. The form
continues to work locally without a database.

1. Copy `.env.example` to `.env` and set `DATABASE_URL` to your MySQL database.
2. From this directory, run `npm run db:generate` and `npm run db:deploy`.
3. Run `npm run dev` with `npm run api` in a second terminal, or start the project
   with `run-app.cmd` from the project root.

The API listens on `127.0.0.1:3001`; Vite proxies `/api` requests to it.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
