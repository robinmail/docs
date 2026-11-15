# robinmail docs

The documentation site of [robinmail](https://github.com/robinmail/robinmail), a
JMAP-first mail, calendar and contacts server in Go. Built with
[Starlight](https://starlight.astro.build) on Astro.

Published at https://robinmail.github.io/docs/.

## Run it locally

You need Node 22.23.4 or newer.

```bash
npm install
```

```bash
npm run dev
```

The site is then on http://localhost:4321/docs/ and reloads on every change.

```bash
npm run build
```

writes the static site to `dist/`. `npm run preview` serves that build.

## Where things are

- `src/content/docs/`: the pages, in Markdown. The sidebar is set in `astro.config.mjs`.
- `public/diagrams/`: the diagrams, as plain SVG.
- `.github/workflows/deploy.yml`: builds and publishes on every push to `main`.

## Writing

The pages are written from the robinmail repository: its `docs/`, `PLAN.md`,
`README.md`, `robinmail.example.json`, `Makefile`, `contrib/` and the code. Where
those disagree, the code wins. Short sentences, no marketing words.
