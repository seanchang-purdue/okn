# OKN Proto

## How to start the website

1. Clone the directory

```bash
git clone <repo_name>
```

2. cd into client

```bash
cd client
```

3. Install all dependencies

```bash
npm install
```

4. Start running the website

```bash
npm run dev
```

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
.
├── public
├── README.md
└── src
   ├── components
   │  ├── Header.astro
   │  └── Map.tsx
   ├── data
   │  └── heatmap_points.json
   ├── env.d.ts
   ├── layouts
   │  └── Layout.astro
   ├── pages
   │  │   └── api
   │  └── index.astro
   └── utils
```

### pages

All public routes are in ./src/pages. [For more routing rules](https://docs.astro.build/en/guides/routing/).

### pages/api

Execute data fetching from our python endpoints.

### layouts

Define layouts here.

### components

All the components resides here. eg. Card, Form, Header, etc.

### data

Temporary storage for the data, in future we use python API for data fetching.

### utils

Utility functions, can be use to process API data.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |
| `npm run lint`            | Format and lint code.                            |

## UI and Styling

Using [TailwindCSS](https://tailwindcss.com/docs/flex) for simplicity and inline styling.

For UI component, we can use [MaterialUI](https://mui.com/material-ui/getting-started/), [TailwindCSS UI](https://tailwindui.com/components), [Flowbite](https://flowbite.com/docs/getting-started/introduction/), etc.
