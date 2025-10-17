# SEO Analyzer Multilang

This project is a Node.js-based tool for analyzing SEO metadata across multi-language websites. It fetches page metadata, detects SEO issues, and generates HTML, CSV, and JSON reports. A modern React front-end provides a user-friendly interface with dark/light theme and Polish/English translations.

## Installation

### Clone this repository

```sh
git clone https://github.com/RafalSzy/seo-analyzer-multilang.git
cd seo-analyzer-multilang
```

### Backend (Node.js)

The backend server uses Express. Install dependencies using npm (requires Node.js v14+):

```sh
npm install
```

> The project does not include a `node_modules` directory, so you need to run the above command to install the required packages.

You can start the server directly with:

```sh
node seo-analyzer-multilang.js
```

By default, the server listens on port 3000.

### Frontend (React)

A modern frontend built with React, Vite and i18n offers a polished UI with light/dark modes and Polish & English language support. To run it in development mode:

```sh
cd frontend
npm install
npm run dev
```

This starts a development server (typically on port 5173) and proxies API requests to the backend. For production builds, run:

```sh
npm run build
```

The compiled app will be in `frontend/dist`. When using Docker (see below) the build is automated and served via Nginx.

## Usage

1. Start both backend and frontend (either manually as above, or via Docker Compose).
2. In your browser navigate to the frontend (for example at `http://localhost:5173` in development or `http://localhost` when using Docker).
3. Enter the list of URLs you want to analyze and click *Analyze*. The server will crawl the pages, extract SEO information and detect issues (e.g., missing meta descriptions, language mismatches, broken canonical links, etc.).
4. When the analysis is complete, you can download the results as HTML, CSV or JSON files from the `/reports` directory.

## Deployment with Docker

This repository includes Docker support to simplify deployment:

- `Dockerfile.backend` builds the Node.js backend.
- `frontend/Dockerfile.frontend` builds and serves the React frontend using Nginx.
- `docker-compose.yml` orchestrates both services.

To build and run both containers in detached mode:

```sh
docker-compose up -d
```

By default, the frontend is served on port 80 and proxies to the backend on port 3000. Reports are written to the `reports/` volume.

To stop the containers, run `docker-compose down`. When updating the code, rebuild the images with `docker-compose up --build -d`.

## Notes

- Make sure you have network connectivity and the target websites allow crawling.
- Reports are saved in the `reports/` folder in the project root and are also available via the frontend after analysis.

## Version

Current version: **1.1.0** (October 17, 2025)

## Changelog

### v1.1.0

- Introduced a modern React frontend with dark/light theme toggle and Polish/English translations.
- Added concurrency support with configurable limits and progress updates via server-sent events (SSE).
- Normalized relative URLs in metadata fields (canonical, og:url, og:image) to absolute form.
- Added fallback from `HEAD` to `GET` for Open Graph images to handle servers that block `HEAD` requests.
- Added detection of meta robots directives (`noindex`, `nofollow`) and flagged them as critical issues.
- Normalized language codes (e.g., `pl-PL` → `pl`) and refined missing translation heuristics to only check pages on the same domain.
- Implemented retry logic for network errors (e.g., 429/5xx responses).
- Added SSE heartbeat and improved progress messages during analysis.
- Removed the SEO -problems summary block from the landing page to prevent startup errors.
- Added Docker files (`Dockerfile.backend`, `frontend/Dockerfile.frontend`, `docker-compose.yml`) for containerized deployment.

## Future work

Potential improvements include:

- Expanding the dashboard with interactive charts and filters.
- Adding user authentication and persistent storage (e.g., MongoDB, PostgreSQL or Supabase).
- Supporting scheduled crawls and email notifications.
- Integrating more advanced SEO checks (Core Web Vitals, structured data validation, etc.).
