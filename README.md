# SEO Analyzer Multilang

This project is a Node.js based tool for analyzing SEO metadata across multi-language websites. It fetches page metadata, detects SEO issues, and generates HTML, CSV, and JSON reports.

## Installation

1. Clone this repository:

   ```sh
   git clone https://github.com/RafalSzy/seo-analyzer-multilang.git
   cd seo-analyzer-multilang
   ```

2. Install dependencies using npm (requires Node.js v14+):

   ```sh
   npm install express axios cheerio xml2js csv-writer cors
   ```

   The project does not include a `node_modules` directory, so you need to run the above command to install the required packages.

## Usage

1. Start the server:

   ```sh
   node seo-analyzer-multilang.js
   ```

2. Open your browser and navigate to:

   ```
   http://localhost:3000
   ```

3. Enter the list of URLs you want to analyze and start the process. The server will crawl the pages, extract SEO information and detect issues (e.g., missing meta descriptions, language mismatches, broken canonical links, etc.).

4. When the analysis is complete, you can download the results as HTML, CSV or JSON files from the `/reports` directory.

## Notes

- Make sure you have network connectivity and the target websites allow crawling.
- Reports are saved in the `reports/` folder in the project root.


## Version

Current version: **1.1.0** (October 17, 2025)

## Changelog

### v1.1.0
- Improved concurrency and throttling for analyzing multiple pages simultaneously using a configurable limit.
- Normalized relative URLs in metadata fields (canonical, og:url, og:image) to absolute form.
- Added fallback from `HEAD` to `GET` for Open Graph images to handle servers that block `HEAD` requests.
- Added detection of meta robots directives (`noindex`, `nofollow`) and flagged them as critical issues.
- Normalized language codes (e.g. `pl-PL` → `pl`) and refined missing translation heuristics to only check pages on the same domain.
- Implemented retry logic for network errors (e.g. 429/5xx responses).
- Added SSE heartbeat and improved progress messages during analysis.
- Removed the SEO-problems summary block from the landing page to prevent startup errors.

## Modern UI considerations

The current interface uses plain HTML and inline CSS. For future development (e.g. dashboards, user accounts and database integration), migrating to a modern frontend framework is recommended. React-based component libraries like **Material UI**, **Chakra UI**, **Ant Design** or **Next UI** provide ready‑made components, accessibility and theming support. Material UI offers theme toggling and supports dark and light modes via its `ThemeProvider`【206187130813717†L92-L104】. Chakra UI is dark‑mode compatible and allows customization through style props【206187130813717†L157-L163】. Ant Design includes built‑in internationalization support for dozens of languages and lets you customize light/dark themes【206187130813717†L192-L195】. Next UI also provides a default dark theme and built‑in i18n support【206187130813717†L324-L333】.

To enable Polish and English interface translations, you can integrate **react‑i18next** or **next‑i18next** and store translations in JSON files. A tutorial on building multilingual React apps uses `i18next` together with Tailwind CSS; it enables dark mode through Tailwind’s `darkMode: "class"` setting and sets up language detection with `LanguageDetector`【422698150915525†L117-L130】【422698150915525†L151-L179】. Tailwind’s dark mode support works by adding a `dark` class to the root element and applying alternate colour tokens【422698150915525†L117-L130】.  

For a richer user experience, consider using a framework like **Next.js** (React) or **SvelteKit**, which handle routing, code splitting and server-side rendering. Combined with a UI library, these frameworks can provide dashboards for SEO statistics, user authentication, and persistent storage backed by a database (e.g. MongoDB, PostgreSQL or Supabase). Future iterations could implement user login, store analysis history, and render interactive charts and tables via a frontend dashboard.
