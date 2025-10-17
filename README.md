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
