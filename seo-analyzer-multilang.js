// SEO Analyzer Pro - Wersja wielojęzyczna
// Instalacja: npm install express axios cheerio xml2js csv-writer cors
// Użycie: node seo-analyzer-multilang.js
// Następnie otwórz: http://localhost:3000

import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import xml2js from 'xml2js';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/reports', express.static('reports'));

// Utworzenie folderów jeśli nie istnieją
const createDirectories = async () => {
    const dirs = ['public', 'reports'];
    for (const dir of dirs) {
        try {
            await fs.mkdir(dir, { recursive: true });
        } catch (err) {
            // Folder już istnieje
        }
    }
};

// HTML dla panelu głównego
const indexHTML = `
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SEO Analyzer Pro - Analiza wielojęzyczna</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 900px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            color: white;
            margin-bottom: 40px;
        }
        
        .header h1 {
            font-size: 3em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        
        .header p {
            font-size: 1.2em;
            opacity: 0.9;
        }
        
        .main-card {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        }
        
        .form-group {
            margin-bottom: 30px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 10px;
            font-weight: 600;
            color: #333;
            font-size: 1.1em;
        }
        
        .input-group {
            display: flex;
            gap: 10px;
            align-items: flex-start;
        }
        
        .form-control {
            flex: 1;
            padding: 15px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 16px;
            transition: all 0.3s ease;
        }
        
        .form-control:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .btn {
            padding: 15px 30px;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .btn-primary:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        .btn:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
        }
        
        .alert {
            padding: 15px 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            display: none;
        }
        
        .alert.show {
            display: block;
        }
        
        .alert-info {
            background: #e3f2fd;
            color: #1565c0;
            border-left: 4px solid #1565c0;
        }
        
        .alert-error {
            background: #ffebee;
            color: #c62828;
            border-left: 4px solid #c62828;
        }
        
        .alert-success {
            background: #e8f5e9;
            color: #2e7d32;
            border-left: 4px solid #2e7d32;
        }
        
        .alert-warning {
            background: #fff3e0;
            color: #e65100;
            border-left: 4px solid #e65100;
        }
        
        .progress-container {
            margin: 30px 0;
            display: none;
        }
        
        .progress-bar {
            width: 100%;
            height: 40px;
            background: #f5f5f5;
            border-radius: 20px;
            overflow: hidden;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            transition: width 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
        }
        
        .status-text {
            text-align: center;
            margin-top: 10px;
            color: #666;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        
        .stat-card {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 10px;
            text-align: center;
        }
        
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
        }
        
        .stat-label {
            color: #666;
            margin-top: 5px;
            font-size: 14px;
        }
        
        .language-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
            padding: 20px;
            background: #f9f9f9;
            border-radius: 10px;
        }
        
        .lang-stat {
            text-align: center;
        }
        
        .lang-flag {
            font-size: 2em;
            margin-bottom: 10px;
        }
        
        .lang-count {
            font-size: 1.5em;
            font-weight: bold;
            color: #333;
        }
        
        .lang-label {
            color: #666;
            font-size: 14px;
        }
        
        .issues-summary {
            background: #fff3e0;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            border-left: 4px solid #e65100;
        }
        
        .issues-summary h3 {
            color: #e65100;
            margin-bottom: 15px;
        }
        
        .issue-item {
            padding: 8px 0;
            border-bottom: 1px solid rgba(230, 81, 0, 0.2);
        }
        
        .issue-count {
            font-weight: bold;
            color: #e65100;
            margin-right: 10px;
        }
        
        .checkbox-group {
            margin: 15px 0;
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
        }
        
        .checkbox-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .checkbox-item input[type="checkbox"] {
            width: 18px;
            height: 18px;
            cursor: pointer;
        }
        
        .checkbox-item label {
            cursor: pointer;
            user-select: none;
        }
        
        .help-text {
            font-size: 14px;
            color: #666;
            margin-top: 8px;
        }
        
        .results-section {
            margin-top: 40px;
            padding-top: 40px;
            border-top: 2px solid #e0e0e0;
            display: none;
        }
        
        .results-section h2 {
            color: #333;
            margin-bottom: 20px;
        }
        
        .file-links {
            display: grid;
            gap: 15px;
        }
        
        .file-link {
            display: flex;
            align-items: center;
            padding: 15px;
            background: #f5f5f5;
            border-radius: 10px;
            text-decoration: none;
            color: #333;
            transition: all 0.3s ease;
        }
        
        .file-link:hover {
            background: #e0e0e0;
            transform: translateX(5px);
        }
        
        .file-icon {
            font-size: 24px;
            margin-right: 15px;
        }
        
        .file-info {
            flex: 1;
        }
        
        .file-name {
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .file-desc {
            font-size: 14px;
            color: #666;
        }
        
        .history-section {
            margin-top: 40px;
            padding-top: 40px;
            border-top: 2px solid #e0e0e0;
        }
        
        .history-section h2 {
            color: #333;
            margin-bottom: 20px;
        }
        
        .history-list {
            display: grid;
            gap: 10px;
        }
        
        .history-item {
            display: flex;
            align-items: center;
            padding: 12px;
            background: #f9f9f9;
            border-radius: 8px;
            font-size: 14px;
        }
        
        .history-domain {
            font-weight: 600;
            margin-right: 10px;
        }
        
        .history-date {
            color: #666;
            margin-right: auto;
        }
        
        .history-link {
            color: #667eea;
            text-decoration: none;
            margin-left: 10px;
        }
        
        .history-link:hover {
            text-decoration: underline;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-left: 10px;
        }
        .warning-badge {
            display: inline-block;
            padding: 4px 8px;
            background: #fff3e0;
            color: #e65100;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 SEO Analyzer Pro</h1>
            <p>Profesjonalna analiza SEO z obsługą wielu języków</p>
        </div>
        
        <div class="main-card">
            <div id="alert" class="alert"></div>
            
            <div class="form-group">
                <label for="sitemapUrl">Adres URL sitemapy XML lub indeksu sitemap</label>
                <div class="input-group">
                    <input 
                        type="url" 
                        id="sitemapUrl" 
                        class="form-control" 
                        placeholder="https://example.com/sitemap.xml lub sitemap_index.xml"
                        value="https://rafalszymanski.pl/sitemap-0.xml"
                    >
                    <button id="analyzeBtn" class="btn btn-primary" onclick="startAnalysis()">
                        Analizuj
                    </button>
                </div>
                <div class="help-text">
                    Obsługiwane formaty: sitemap.xml, sitemap_index.xml, sitemap-index.xml, sitemap-0.xml<br>
                    Program automatycznie wykryje czy to indeks i pobierze wszystkie pod-sitemapy
                </div>
            </div>
            
            <div class="checkbox-group">
                <div class="checkbox-item">
                    <input type="checkbox" id="checkMultipleSitemaps" checked>
                    <label for="checkMultipleSitemaps">Sprawdź kolejne sitemapy (sitemap-1.xml, sitemap-2.xml, itd.)</label>
                </div>
                <div class="checkbox-item">
                    <input type="checkbox" id="detectLanguages" checked>
                    <label for="detectLanguages">Wykryj wersje językowe</label>
                </div>
                <div class="checkbox-item">
                    <input type="checkbox" id="checkDuplicates" checked>
                    <label for="checkDuplicates">Sprawdź duplikaty tytułów/opisów</label>
                </div>
            </div>
            
            <div id="progressContainer" class="progress-container">
                <div class="progress-bar">
                    <div id="progressFill" class="progress-fill">0%</div>
                </div>
                <div id="statusText" class="status-text">Przygotowywanie...</div>
            </div>
            
            <div id="statsSection" class="stats" style="display: none;"></div>
            
            <div id="languageStats" class="language-stats" style="display: none;"></div>
            
            <div id="issuesSummary" class="issues-summary" style="display: none;">
                <h3>⚠️ Wykryte problemy</h3>
                <div id="issuesList"></div>
            </div>
            
            <div id="resultsSection" class="results-section">
                <h2>📊 Wyniki analizy</h2>
                <div id="fileLinks" class="file-links"></div>
            </div>
            
            <div id="historySection" class="history-section" style="display: none;">
                <h2>📜 Historia analiz</h2>
                <div id="historyList" class="history-list"></div>
            </div>
        </div>
        
        <!-- Usunięto sekcję podsumowania problemów SEO z landing page. Statystyki szczegółowe są dostępne w generowanych raportach. -->
    </div>
    
    <script>
        let currentAnalysisId = null;
        
        async function startAnalysis() {
            const url = document.getElementById('sitemapUrl').value.trim();
            
            if (!url) {
                showAlert('Proszę podać adres URL sitemapy', 'error');
                return;
            }
            
            if (!isValidUrl(url)) {
                showAlert('Proszę podać poprawny adres URL', 'error');
                return;
            }
            
            // Walidacja czy to XML
            if (!url.endsWith('.xml')) {
                showAlert('Adres URL powinien prowadzić do pliku XML', 'error');
                return;
            }
            
            const checkMultiple = document.getElementById('checkMultipleSitemaps').checked;
            const detectLanguages = document.getElementById('detectLanguages').checked;
            const checkDuplicates = document.getElementById('checkDuplicates').checked;
            
            document.getElementById('analyzeBtn').disabled = true;
            document.getElementById('progressContainer').style.display = 'block';
            document.getElementById('resultsSection').style.display = 'none';
            document.getElementById('issuesSummary').style.display = 'none';
            showAlert('Rozpoczynam analizę...', 'info');
            
            try {
                const response = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        sitemapUrl: url,
                        checkMultipleSitemaps: checkMultiple,
                        detectLanguages: detectLanguages,
                        checkDuplicates: checkDuplicates
                    })
                });
                
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    
                    const text = decoder.decode(value);
                    const lines = text.split('\\n').filter(line => line.trim());
                    
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = JSON.parse(line.substring(6));
                            
                            if (data.type === 'progress') {
                                updateProgress(data.progress, data.message);
                            } else if (data.type === 'stats') {
                                updateStats(data.stats);
                            } else if (data.type === 'language-stats') {
                                updateLanguageStats(data.languages);
                            } else if (data.type === 'issues') {
                                updateIssues(data.issues);
                            } else if (data.type === 'complete') {
                                showResults(data);
                            } else if (data.type === 'error') {
                                throw new Error(data.message);
                            }
                        }
                    }
                }
                
            } catch (error) {
                showAlert('Błąd: ' + error.message, 'error');
                document.getElementById('progressContainer').style.display = 'none';
            } finally {
                document.getElementById('analyzeBtn').disabled = false;
                loadHistory();
            }
        }
        
        function isValidUrl(string) {
            try {
                new URL(string);
                return true;
            } catch (_) {
                return false;
            }
        }
        
        function showAlert(message, type) {
            const alert = document.getElementById('alert');
            alert.className = 'alert show alert-' + type;
            alert.textContent = message;
            
            if (type === 'success') {
                setTimeout(() => {
                    alert.className = 'alert';
                }, 5000);
            }
        }
        
        function updateProgress(progress, message) {
            document.getElementById('progressFill').style.width = progress + '%';
            document.getElementById('progressFill').textContent = progress + '%';
            document.getElementById('statusText').textContent = message;
        }
        
        function updateStats(stats) {
            const statsSection = document.getElementById('statsSection');
            statsSection.style.display = 'grid';
            statsSection.innerHTML = \`
                <div class="stat-card">
                    <div class="stat-value">\${stats.total}</div>
                    <div class="stat-label">Strony</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">\${stats.avgScore}/100</div>
                    <div class="stat-label">Średni wynik</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">\${stats.missingTitle}</div>
                    <div class="stat-label">Brak tytułu</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">\${stats.missingDesc}</div>
                    <div class="stat-label">Brak opisu</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">\${stats.missingOG}</div>
                    <div class="stat-label">Brak OG Image</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">\${stats.errors}</div>
                    <div class="stat-label">Błędy</div>
                </div>
            \`;
        }
        
        function updateLanguageStats(languages) {
            const section = document.getElementById('languageStats');
            if (languages && Object.keys(languages).length > 0) {
                section.style.display = 'grid';
                section.innerHTML = Object.entries(languages).map(([lang, count]) => \`
                    <div class="lang-stat">
                        <div class="lang-flag">\${lang === 'pl' ? '🇵🇱' : lang === 'en' ? '🇬🇧' : '🌍'}</div>
                        <div class="lang-count">\${count}</div>
                        <div class="lang-label">\${lang === 'pl' ? 'Polski' : lang === 'en' ? 'English' : lang.toUpperCase()}</div>
                    </div>
                \`).join('');
            }
        }
        
        function updateIssues(issues) {
            if (issues && issues.length > 0) {
                const section = document.getElementById('issuesSummary');
                section.style.display = 'block';
                
                document.getElementById('issuesList').innerHTML = issues.map(issue => \`
                    <div class="issue-item">
                        <span class="issue-count">\${issue.count}x</span>
                        \${issue.description}
                    </div>
                \`).join('');
            }
        }
        
        function showResults(data) {
            showAlert('Analiza zakończona pomyślnie!', 'success');
            document.getElementById('progressContainer').style.display = 'none';
            
            const resultsSection = document.getElementById('resultsSection');
            resultsSection.style.display = 'block';
            
            const fileLinks = document.getElementById('fileLinks');
            fileLinks.innerHTML = \`
                <a href="/reports/\${data.files.html}" class="file-link" target="_blank">
                    <span class="file-icon">📊</span>
                    <div class="file-info">
                        <div class="file-name">Raport HTML</div>
                        <div class="file-desc">Szczegółowy raport wizualny z podziałem na języki</div>
                    </div>
                </a>
                <a href="/reports/\${data.files.csv}" class="file-link" download>
                    <span class="file-icon">📁</span>
                    <div class="file-info">
                        <div class="file-name">Plik CSV</div>
                        <div class="file-desc">Dane do analizy w Excel lub Google Sheets</div>
                    </div>
                </a>
                <a href="/reports/\${data.files.json}" class="file-link" download>
                    <span class="file-icon">📄</span>
                    <div class="file-info">
                        <div class="file-name">Plik JSON</div>
                        <div class="file-desc">Surowe dane w formacie JSON</div>
                    </div>
                </a>
            \`;
        }
        
        async function loadHistory() {
            try {
                const response = await fetch('/api/history');
                const history = await response.json();
                
                if (history.length > 0) {
                    const historySection = document.getElementById('historySection');
                    historySection.style.display = 'block';
                    
                    const historyList = document.getElementById('historyList');
                    historyList.innerHTML = history.map(item => \`
                        <div class="history-item">
                            <span class="history-domain">\${item.domain}</span>
                            <span class="history-date">\${item.date}</span>
                            <a href="/reports/\${item.html}" class="history-link" target="_blank">HTML</a>
                            <a href="/reports/\${item.csv}" class="history-link" download>CSV</a>
                            <a href="/reports/\${item.json}" class="history-link" download>JSON</a>
                        </div>
                    \`).join('');
                }
            } catch (error) {
                console.error('Błąd ładowania historii:', error);
            }
        }
        
        // Załaduj historię przy starcie
        window.addEventListener('load', loadHistory);
    </script>
</body>
</html>
`;

// Klasa SEOAnalyzer z obsługą wielojęzyczności
class SEOAnalyzer {
    constructor(sitemapUrl, options = {}) {
        this.sitemapUrl = sitemapUrl;
        this.urls = [];
        this.seoData = [];
        this.domain = new URL(sitemapUrl).hostname.replace('www.', '');
        this.options = {
            checkMultipleSitemaps: options.checkMultipleSitemaps ?? true,
            detectLanguages: options.detectLanguages ?? true,
            checkDuplicates: options.checkDuplicates ?? true
        };
        this.languageStats = {};
        this.duplicateIssues = [];
        this.missingTranslations = [];
        this.hreflangMap = new Map(); // Mapa relacji między językami
    }

    // Wykrywanie języka z URL
    detectLanguageFromUrl(url) {
        // Sprawdź popularne wzorce językowe w URL
        const patterns = [
            { pattern: /\/en\//i, lang: 'en' },
            { pattern: /\/en$/i, lang: 'en' },
            { pattern: /\/pl\//i, lang: 'pl' },
            { pattern: /\/pl$/i, lang: 'pl' },
            { pattern: /\/de\//i, lang: 'de' },
            { pattern: /\/de$/i, lang: 'de' },
            { pattern: /\/fr\//i, lang: 'fr' },
            { pattern: /\/fr$/i, lang: 'fr' },
            { pattern: /\/es\//i, lang: 'es' },
            { pattern: /\/es$/i, lang: 'es' }
        ];
        
        for (const { pattern, lang } of patterns) {
            if (pattern.test(url)) {
                return lang;
            }
        }
        
        // Jeśli nie znaleziono wzorca, zakładamy język domyślny
        return 'pl'; // lub można zwrócić 'default'
    }

    // Sprawdzanie kolejnych numerowanych sitemap i obsługa sitemap index
    async fetchAllSitemaps() {
        const allUrls = [];
        const processedSitemaps = new Set(); // Aby uniknąć duplikatów
        
        // Najpierw sprawdź czy podany URL to sitemap index
        try {
            console.log(`Sprawdzam: ${this.sitemapUrl}`);
            const response = await axios.get(this.sitemapUrl);
            const parser = new xml2js.Parser();
            const result = await parser.parseStringPromise(response.data);
            
            // Sprawdź czy to indeks sitemap (sitemap_index.xml lub sitemap.xml z tagiem sitemapindex)
            if (result.sitemapindex && result.sitemapindex.sitemap) {
                console.log('✅ Wykryto indeks sitemap!');
                console.log(`Znaleziono ${result.sitemapindex.sitemap.length} pod-sitemap w indeksie`);
                
                // Pobierz wszystkie sitemapy z indeksu
                for (const sitemap of result.sitemapindex.sitemap) {
                    const sitemapLoc = sitemap.loc[0];
                    const lastmod = sitemap.lastmod ? sitemap.lastmod[0] : 'nieznana';
                    
                    if (!processedSitemaps.has(sitemapLoc)) {
                        processedSitemaps.add(sitemapLoc);
                        console.log(`📥 Pobieram sitemapę: ${sitemapLoc} (ostatnia modyfikacja: ${lastmod})`);
                        
                        try {
                            const urls = await this.fetchSingleSitemap(sitemapLoc);
                            allUrls.push(...urls);
                            console.log(`   ✓ Pobrano ${urls.length} URL z ${sitemapLoc}`);
                        } catch (error) {
                            console.error(`   ✗ Błąd pobierania ${sitemapLoc}: ${error.message}`);
                        }
                    }
                }
                
                console.log(`Łącznie pobrano ${allUrls.length} URL ze wszystkich sitemap w indeksie`);
                return allUrls;
            }
            // Jeśli to zwykła sitemapa, przetwórz ją
            else if (result.urlset && result.urlset.url) {
                console.log('To zwykła sitemapa, nie indeks');
                // Użyj tej samej logiki co w fetchSingleSitemap
                for (const urlItem of result.urlset.url) {
                    const url = urlItem.loc[0];
                    allUrls.push(url);
                    
                    // Zapisz informacje o hreflang jeśli istnieją
                    if (urlItem.link) {
                        const hreflangData = {};
                        for (const link of urlItem.link) {
                            if (link.$ && link.$.hreflang && link.$.href) {
                                hreflangData[link.$.hreflang] = link.$.href;
                            }
                        }
                        if (Object.keys(hreflangData).length > 0) {
                            this.hreflangMap.set(url, hreflangData);
                        }
                    }
                    
                    // Zapisz też informacje o alternates jeśli istnieją (inny format)
                    if (urlItem['xhtml:link']) {
                        const hreflangData = this.hreflangMap.get(url) || {};
                        for (const link of urlItem['xhtml:link']) {
                            if (link.$ && link.$.hreflang && link.$.href) {
                                hreflangData[link.$.hreflang] = link.$.href;
                            }
                        }
                        if (Object.keys(hreflangData).length > 0) {
                            this.hreflangMap.set(url, hreflangData);
                        }
                    }
                }
                processedSitemaps.add(this.sitemapUrl);
            }
        } catch (error) {
            console.error(`Błąd pobierania ${this.sitemapUrl}: ${error.message}`);
            return allUrls;
        }
        
        // Jeśli nie był to indeks, sprawdź czy istnieje główny indeks
        if (!processedSitemaps.has(this.sitemapUrl) || allUrls.length === 0) {
            const baseUrl = this.sitemapUrl.replace(/sitemap[_-]?(?:index)?(?:-?\d+)?\.xml$/, '');
            
            // Sprawdź różne możliwe nazwy indeksu
            const possibleIndexNames = [
                'sitemap_index.xml',
                'sitemap-index.xml',
                'sitemap.xml',
                'sitemapindex.xml'
            ];
            
            for (const indexName of possibleIndexNames) {
                const indexUrl = baseUrl + indexName;
                if (!processedSitemaps.has(indexUrl)) {
                    try {
                        console.log(`Sprawdzam możliwy indeks: ${indexUrl}`);
                        const response = await axios.get(indexUrl);
                        const parser = new xml2js.Parser();
                        const result = await parser.parseStringPromise(response.data);
                        
                        if (result.sitemapindex && result.sitemapindex.sitemap) {
                            console.log(`✅ Znaleziono indeks sitemap pod: ${indexUrl}`);
                            processedSitemaps.add(indexUrl);
                            
                            for (const sitemap of result.sitemapindex.sitemap) {
                                const sitemapLoc = sitemap.loc[0];
                                if (!processedSitemaps.has(sitemapLoc)) {
                                    processedSitemaps.add(sitemapLoc);
                                    try {
                                        const urls = await this.fetchSingleSitemap(sitemapLoc);
                                        allUrls.push(...urls);
                                        console.log(`Pobrano ${urls.length} URL z ${sitemapLoc}`);
                                    } catch (err) {
                                        console.error(`Błąd pobierania ${sitemapLoc}: ${err.message}`);
                                    }
                                }
                            }
                            break;
                        }
                    } catch (error) {
                        // Ten indeks nie istnieje, spróbuj następny
                    }
                }
            }
        }
        
        // Jeśli opcja jest włączona i nie znaleziono indeksu, sprawdź kolejne numerowane
        if (this.options.checkMultipleSitemaps && allUrls.length > 0) {
            const baseUrl = this.sitemapUrl.replace(/sitemap[_-]?(?:index)?(?:-?\d+)?\.xml$/, '');
            let currentNumber = 0;
            const match = this.sitemapUrl.match(/sitemap[_-]?(\d+)\.xml$/);
            if (match) {
                currentNumber = parseInt(match[1]);
            }
            
            // Sprawdź kolejne sitemapy (do 10 kolejnych)
            for (let i = currentNumber + 1; i <= currentNumber + 10; i++) {
                // Próbuj różne formaty nazw
                const possibleUrls = [
                    `${baseUrl}sitemap-${i}.xml`,
                    `${baseUrl}sitemap_${i}.xml`,
                    `${baseUrl}sitemap${i}.xml`
                ];
                
                for (const nextSitemapUrl of possibleUrls) {
                    if (!processedSitemaps.has(nextSitemapUrl)) {
                        try {
                            const urls = await this.fetchSingleSitemap(nextSitemapUrl);
                            if (urls.length > 0) {
                                processedSitemaps.add(nextSitemapUrl);
                                allUrls.push(...urls);
                                console.log(`Znaleziono dodatkową sitemapę: ${nextSitemapUrl} z ${urls.length} URL`);
                                break;
                            }
                        } catch (error) {
                            // Ta sitemapa nie istnieje
                        }
                    }
                }
            }
        }
        
        return allUrls;
    }

    async fetchSingleSitemap(sitemapUrl) {
        try {
            console.log(`   📡 Pobieram: ${sitemapUrl}`);
            const response = await axios.get(sitemapUrl, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 SEO Analyzer Bot',
                    'Accept': 'application/xml, text/xml, */*'
                }
            });
            const parser = new xml2js.Parser();
            const result = await parser.parseStringPromise(response.data);
            
            // Sprawdź czy to przypadkiem nie jest indeks sitemap
            if (result.sitemapindex && result.sitemapindex.sitemap) {
                console.log(`   ⚠️  ${sitemapUrl} to indeks sitemap, przetwarzam rekurencyjnie...`);
                const allUrls = [];
                for (const sitemap of result.sitemapindex.sitemap) {
                    const sitemapLoc = sitemap.loc[0];
                    const urls = await this.fetchSingleSitemap(sitemapLoc);
                    allUrls.push(...urls);
                }
                return allUrls;
            }
            
            // To zwykła sitemapa
            const urls = [];
            if (result.urlset && result.urlset.url) {
                for (const urlItem of result.urlset.url) {
                    const url = urlItem.loc[0];
                    urls.push(url);
                    
                    // Zapisz informacje o hreflang jeśli istnieją
                    if (urlItem.link) {
                        const hreflangData = {};
                        for (const link of urlItem.link) {
                            if (link.$ && link.$.hreflang && link.$.href) {
                                hreflangData[link.$.hreflang] = link.$.href;
                            }
                        }
                        if (Object.keys(hreflangData).length > 0) {
                            this.hreflangMap.set(url, hreflangData);
                        }
                    }
                    
                    // Zapisz też informacje o alternates jeśli istnieją (inny format)
                    if (urlItem['xhtml:link']) {
                        const hreflangData = this.hreflangMap.get(url) || {};
                        for (const link of urlItem['xhtml:link']) {
                            if (link.$ && link.$.hreflang && link.$.href) {
                                hreflangData[link.$.hreflang] = link.$.href;
                            }
                        }
                        if (Object.keys(hreflangData).length > 0) {
                            this.hreflangMap.set(url, hreflangData);
                        }
                    }
                }
                console.log(`   ✅ Znaleziono ${urls.length} URL`);
            }
            return urls;
        } catch (error) {
            console.error(`   ❌ Błąd pobierania sitemapy ${sitemapUrl}:`, error.message);
            return [];
        }
    }

    async fetchSitemap() {
        console.log('\n=== ROZPOCZYNAM ANALIZĘ SITEMAP ===');
        console.log(`URL startowy: ${this.sitemapUrl}`);
        console.log(`Opcje: sprawdzanie wielu sitemap: ${this.options.checkMultipleSitemaps}`);
        
        this.urls = await this.fetchAllSitemaps();
        
        // Usuń duplikaty URL jeśli jakieś się pojawiły
        const uniqueUrls = [...new Set(this.urls)];
        if (uniqueUrls.length < this.urls.length) {
            console.log(`⚠️  Usunięto ${this.urls.length - uniqueUrls.length} zduplikowanych URL`);
            this.urls = uniqueUrls;
        }
        
        console.log(`\n=== PODSUMOWANIE ===`);
        console.log(`✅ Łącznie znaleziono ${this.urls.length} unikalnych URL do analizy`);
        
        // Pokaż statystyki językowe jeśli możliwe
        if (this.options.detectLanguages) {
            const langStats = {};
            for (const url of this.urls) {
                const lang = this.detectLanguageFromUrl(url);
                langStats[lang] = (langStats[lang] || 0) + 1;
            }
            console.log(`📊 Wstępne statystyki językowe (na podstawie URL):`);
            Object.entries(langStats).forEach(([lang, count]) => {
                console.log(`   - ${lang}: ${count} stron`);
            });
        }
        
        console.log('======================\n');
        return this.urls;
    }

    async fetchPageMetadata(url) {
        try {
            // Pobierz stronę z mechanizmem ponawiania w przypadku błędów
            const tryGet = async (u, attempts = 3) => {
                let lastErr;
                for (let i = 0; i < attempts; i++) {
                    try {
                        return await axios.get(u, {
                            headers: { 'User-Agent': 'Mozilla/5.0 SEO Analyzer Bot' },
                            timeout: 10000
                        });
                    } catch (e) {
                        lastErr = e;
                        // Przy błędach 429 lub 5xx poczekaj i spróbuj ponownie
                        const status = e.response?.status || 0;
                        if (status === 429 || status >= 500) {
                            await new Promise(r => setTimeout(r, 1500 * (i + 1)));
                            continue;
                        } else {
                            break;
                        }
                    }
                }
                throw lastErr;
            };

            const response = await tryGet(url);
            
            const $ = cheerio.load(response.data);

            // Wykryj język strony z URL
            const detectedLang = this.detectLanguageFromUrl(url);
            // Normalizuj atrybut lang w html (np. pl-PL -> pl)
            const normLang = (l) => (l || '').toLowerCase().split('-')[0];
            const htmlLang = normLang($('html').attr('lang')) || detectedLang;

            const metadata = {
                url: url,
                language: htmlLang || detectedLang,
                title: $('title').text().trim() || '',
                titleLength: $('title').text().trim().length,
                description: $('meta[name="description"]').attr('content') || '',
                descriptionLength: ($('meta[name="description"]').attr('content') || '').length,
                keywords: $('meta[name="keywords"]').attr('content') || '',
                ogTitle: $('meta[property="og:title"]').attr('content') || '',
                ogDescription: $('meta[property="og:description"]').attr('content') || '',
                ogImage: $('meta[property="og:image"]').attr('content') || '',
                ogImageStatus: '', // Nowe pole dla statusu obrazka
                ogUrl: $('meta[property="og:url"]').attr('content') || '',
                canonical: $('link[rel="canonical"]').attr('href') || '',
                robots: $('meta[name="robots"]').attr('content') || '',
                viewport: $('meta[name="viewport"]').attr('content') || '',
                h1Count: $('h1').length,
                h1Text: $('h1').first().text().trim() || '',
                imagesWithoutAlt: $('img:not([alt])').length,
                hreflang: this.hreflangMap.get(url) || {},
                status: 'success',
                statusCode: response.status,
                seoIssues: [] // Inicjalizacja na początku
            };
            
            // Normalizuj adresy kanoniczne, og:url i og:image (obsługa względnych ścieżek)
            const makeAbs = (maybeUrl) => {
                try {
                    return maybeUrl ? new URL(maybeUrl, url).href : '';
                } catch {
                    return maybeUrl || '';
                }
            };
            metadata.canonical = makeAbs(metadata.canonical);
            metadata.ogUrl = makeAbs(metadata.ogUrl);
            metadata.ogImage = makeAbs(metadata.ogImage);

            // Sprawdź status OG Image jeśli istnieje z fallbackiem HEAD->GET
            if (metadata.ogImage) {
                try {
                    let imageResp = await axios.head(metadata.ogImage, {
                        timeout: 5000,
                        validateStatus: (status) => status < 500
                    });
                    // Niektóre serwery nie wspierają HEAD – fallback do GET
                    if (imageResp.status === 405 || imageResp.status === 403) {
                        imageResp = await axios.get(metadata.ogImage, {
                            timeout: 7000,
                            responseType: 'stream',
                            validateStatus: (status) => status < 500
                        });
                    }
                    if (imageResp.status === 200) {
                        metadata.ogImageStatus = 'ok';
                    } else if (imageResp.status === 404) {
                        metadata.ogImageStatus = '404';
                        metadata.seoIssues.push(`OG Image zwraca 404: ${metadata.ogImage}`);
                    } else if (imageResp.status >= 300 && imageResp.status < 400) {
                        metadata.ogImageStatus = 'redirect';
                    } else {
                        metadata.ogImageStatus = `error-${imageResp.status}`;
                        metadata.seoIssues.push(`OG Image zwraca błąd ${imageResp.status}`);
                    }
                } catch (imgError) {
                    metadata.ogImageStatus = 'unreachable';
                    metadata.seoIssues.push(`OG Image niedostępny: ${imgError.message}`);
                }
            }
            
            // Aktualizuj statystyki językowe
            this.languageStats[metadata.language] = (this.languageStats[metadata.language] || 0) + 1;
            
            // Walidacja SEO
            
            if (!metadata.title) {
                metadata.seoIssues.push('Brak tytułu strony');
            } else if (metadata.titleLength < 30) {
                metadata.seoIssues.push('Tytuł za krótki (< 30 znaków)');
            } else if (metadata.titleLength > 60) {
                metadata.seoIssues.push('Tytuł za długi (> 60 znaków)');
            }
            
            if (!metadata.description) {
                metadata.seoIssues.push('Brak meta description');
            } else if (metadata.descriptionLength < 120) {
                metadata.seoIssues.push('Opis za krótki (< 120 znaków)');
            } else if (metadata.descriptionLength > 160) {
                metadata.seoIssues.push('Opis za długi (> 160 znaków)');
            }
            
            if (!metadata.ogImage) {
                metadata.seoIssues.push('Brak OG Image');
            }
            
            if (metadata.h1Count === 0) {
                metadata.seoIssues.push('Brak tagu H1');
            } else if (metadata.h1Count > 1) {
                metadata.seoIssues.push(`Za dużo tagów H1 (${metadata.h1Count})`);
            }
            
            if (metadata.imagesWithoutAlt > 0) {
                metadata.seoIssues.push(`${metadata.imagesWithoutAlt} obrazków bez atrybutu alt`);
            }
            
            if (!metadata.canonical) {
                metadata.seoIssues.push('Brak canonical URL');
            }
            // Sprawdź robots noindex/nofollow
            const robotsDirectives = (metadata.robots || '').toLowerCase();
            if (robotsDirectives.includes('noindex')) {
                metadata.seoIssues.push('Strona oznaczona jako noindex');
            }
            if (robotsDirectives.includes('nofollow')) {
                metadata.seoIssues.push('Strona oznaczona jako nofollow');
            }

            // --- Structured data validation (JSON-LD) ---
            try {
                const ldScripts = $('script[type="application/ld+json"]');
                let hasStructured = false;
                let structuredValid = true;
                ldScripts.each((i, el) => {
                    const text = $(el).contents().text().trim();
                    if (!text) return;
                    try {
                        const data = JSON.parse(text);
                        hasStructured = true;
                        // check for required JSON-LD properties
                        if (!data['@context'] || !data['@type']) {
                            structuredValid = false;
                        }
                    } catch {
                        structuredValid = false;
                    }
                });
                metadata.hasStructuredData = hasStructured;
                metadata.structuredDataValid = structuredValid;
                if (!hasStructured) {
                    metadata.seoIssues.push('Brak danych strukturalnych (structured data)');
                } else if (!structuredValid) {
                    metadata.seoIssues.push('Niepoprawne dane strukturalne');
                }
            } catch (e) {
                // ignore parsing errors
            }

            // --- Simplified Core Web Vitals heuristics ---
            // DOM size heuristic
            try {
                const domSize = $('*').length;
                metadata.domSize = domSize;
                if (domSize > 1500) {
                    metadata.seoIssues.push(`Duży rozmiar DOM (${domSize} elementów)`);
                }
            } catch (e) {
                metadata.domSize = 0;
            }

            // Count external scripts
            try {
                const scriptCount = $('script[src]').length;
                metadata.scriptCount = scriptCount;
                if (scriptCount > 20) {
                    metadata.seoIssues.push(`Zbyt wiele zewnętrznych skryptów (${scriptCount})`);
                }
            } catch (e) {
                metadata.scriptCount = 0;
            }

            // Large image heuristic: check size of up to 3 images via HEAD
            try {
                const imgSrcs = $('img[src]').map((i, el) => makeAbs($(el).attr('src'))).get();
                const unique = [...new Set(imgSrcs)].slice(0, 3);
                let largestBytes = 0;
                for (const imgUrl of unique) {
                    if (!imgUrl) continue;
                    try {
                        const headResp = await axios.head(imgUrl, { timeout: 5000 });
                        const len = headResp.headers && headResp.headers['content-length'] ? parseInt(headResp.headers['content-length'], 10) : 0;
                        if (!isNaN(len) && len > largestBytes) {
                            largestBytes = len;
                        }
                    } catch (e) {
                        // ignore failure to fetch image size
                    }
                }
                metadata.largestImageBytes = largestBytes;
                if (largestBytes > 1000000) {
                    metadata.seoIssues.push('Duży obraz (>1MB) - może negatywnie wpływać na wydajność (LCP)');
                }
            } catch (e) {
                metadata.largestImageBytes = 0;
            }
            
            metadata.seoScore = Math.max(0, 100 - (metadata.seoIssues.length * 10));
            
            return metadata;
            
        } catch (error) {
            return {
                url: url,
                language: this.detectLanguageFromUrl(url),
                status: 'error',
                error: error.message,
                statusCode: error.response?.status || 0,
                seoIssues: ['Nie udało się pobrać strony'],
                seoScore: 0
            };
        }
    }

    // Analiza duplikatów tytułów i opisów
    analyzeDuplicates() {
        const titleMap = new Map();
        const descMap = new Map();
        
        // Grupuj strony według tytułów i opisów
        for (const page of this.seoData) {
            if (page.title) {
                if (!titleMap.has(page.title)) {
                    titleMap.set(page.title, []);
                }
                titleMap.get(page.title).push(page.url);
            }
            
            if (page.description) {
                if (!descMap.has(page.description)) {
                    descMap.set(page.description, []);
                }
                descMap.get(page.description).push(page.url);
            }
        }
        
        // Znajdź duplikaty
        const duplicateTitles = [];
        const duplicateDescriptions = [];
        
        for (const [title, urls] of titleMap) {
            if (urls.length > 1) {
                duplicateTitles.push({
                    value: title,
                    urls: urls,
                    count: urls.length
                });
            }
        }
        
        for (const [desc, urls] of descMap) {
            if (urls.length > 1) {
                duplicateDescriptions.push({
                    value: desc,
                    urls: urls,
                    count: urls.length
                });
            }
        }
        
        return { duplicateTitles, duplicateDescriptions };
    }

    // Analiza brakujących tłumaczeń
    analyzeMissingTranslations() {
        const missingTranslations = [];
        
        // Dla każdej strony sprawdź czy ma odpowiedniki w innych językach
        for (const page of this.seoData) {
            if (page.hreflang && Object.keys(page.hreflang).length > 0) {
                // Sprawdź czy wszystkie linki hreflang faktycznie istnieją
                for (const [lang, url] of Object.entries(page.hreflang)) {
                    const exists = this.seoData.some(p => p.url === url);
                    if (!exists && lang !== 'x-default') {
                        missingTranslations.push({
                            sourceUrl: page.url,
                            sourceLang: page.language,
                            missingLang: lang,
                            expectedUrl: url
                        });
                    }
                }
            } else {
                // Strona nie ma hreflang - może brakować tłumaczeń. Sprawdzaj tylko w obrębie tej samej domeny.
                const pageDomain = new URL(page.url).hostname.replace('www.', '');
                if (pageDomain === this.domain && page.language === 'pl' && !page.url.includes('/en/')) {
                    // Oczekiwana angielska wersja (przy założeniu struktury /en/)
                    const expectedEnUrl = page.url.replace(pageDomain, `${pageDomain}/en`);
                    const hasEnVersion = this.seoData.some(p => {
                        const pDomain = new URL(p.url).hostname.replace('www.', '');
                        return pDomain === this.domain && p.url.includes('/en/') && p.url.includes(page.url.split('/').pop());
                    });
                    if (!hasEnVersion) {
                        missingTranslations.push({
                            sourceUrl: page.url,
                            sourceLang: 'pl',
                            missingLang: 'en',
                            expectedUrl: expectedEnUrl
                        });
                    }
                }
            }
        }
        
        return missingTranslations;
    }

    generateHTMLReport(filename) {
        const date = new Date().toLocaleString('pl-PL');
        const duplicates = this.options.checkDuplicates ? this.analyzeDuplicates() : { duplicateTitles: [], duplicateDescriptions: [] };
        const missingTranslations = this.options.detectLanguages ? this.analyzeMissingTranslations() : [];
        
        // Analiza problemów - nowe statystyki
        const pagesWithProblems = this.seoData.filter(page => page.seoIssues && page.seoIssues.length > 0);
        const problemStats = {
            total: pagesWithProblems.length,
            byType: {
                titleProblems: this.seoData.filter(d => !d.title || d.titleLength < 30 || d.titleLength > 60).length,
                descProblems: this.seoData.filter(d => !d.description || d.descriptionLength < 120 || d.descriptionLength > 160).length,
                h1Problems: this.seoData.filter(d => d.h1Count === 0 || d.h1Count > 1).length,
                ogImageProblems: this.seoData.filter(d => !d.ogImage || d.ogImageStatus === '404' || d.ogImageStatus === 'unreachable').length,
                canonicalProblems: this.seoData.filter(d => !d.canonical).length,
                altProblems: this.seoData.filter(d => d.imagesWithoutAlt > 0).length
            },
            critical: this.seoData.filter(d => d.seoScore < 60).length,
            warning: this.seoData.filter(d => d.seoScore >= 60 && d.seoScore < 80).length,
            good: this.seoData.filter(d => d.seoScore >= 80).length
        };
        
        // Grupuj strony według języka
        const pagesByLanguage = {};
        for (const page of this.seoData) {
            const lang = page.language || 'unknown';
            if (!pagesByLanguage[lang]) {
                pagesByLanguage[lang] = [];
            }
            pagesByLanguage[lang].push(page);
        }
        
        const html = `
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Raport SEO - ${this.domain}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            background: #f4f4f4;
            padding: 20px;
        }
        .container {
            max-width: 1600px;
            margin: 0 auto;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 15px;
            margin-bottom: 30px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        }
        h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        h2 {
            color: #333;
            margin: 30px 0 20px;
            padding: 10px;
            background: #f8f9fa;
            border-left: 4px solid #667eea;
        }
        h3 {
            color: #555;
            margin: 20px 0 15px;
        }
        .meta-info {
            opacity: 0.9;
            font-size: 1.1em;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .stat-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
            text-align: center;
            transition: transform 0.3s ease;
        }
        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 20px rgba(0,0,0,0.15);
        }
        .stat-value {
            font-size: 2.5em;
            font-weight: bold;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .stat-label {
            color: #666;
            margin-top: 8px;
            font-size: 1.1em;
        }
        .language-section {
            margin: 40px 0;
            padding: 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
        }
        .language-header {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        .language-flag {
            font-size: 2em;
        }
        .language-name {
            font-size: 1.5em;
            font-weight: bold;
            color: #333;
        }
        .language-count {
            margin-left: auto;
            padding: 8px 15px;
            background: #667eea;
            color: white;
            border-radius: 20px;
            font-weight: 600;
        }
        .issues-section {
            background: #fff3e0;
            padding: 25px;
            border-radius: 12px;
            margin: 30px 0;
            border-left: 4px solid #e65100;
        }
        .issues-section h3 {
            color: #e65100;
            margin-bottom: 20px;
        }
        .duplicate-group {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            border: 1px solid #ffd54f;
        }
        .duplicate-value {
            font-weight: 600;
            color: #333;
            margin-bottom: 10px;
            padding: 10px;
            background: #fffde7;
            border-radius: 4px;
        }
        .duplicate-urls {
            list-style: none;
            padding: 10px;
        }
        .duplicate-urls li {
            padding: 5px 0;
            color: #666;
            word-break: break-all;
        }
        .missing-translation {
            background: #ffebee;
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
            border-left: 3px solid #f44336;
        }
        .table-container {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
            margin-bottom: 30px;
            overflow-x: auto;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th {
            background: #f8f9fa;
            padding: 15px;
            text-align: left;
            font-weight: 600;
            color: #333;
            border-bottom: 2px solid #e0e0e0;
            position: sticky;
            top: 0;
            z-index: 10;
        }
        td {
            padding: 15px;
            border-bottom: 1px solid #f0f0f0;
            vertical-align: top;
        }
        tr:hover {
            background: #f9f9f9;
        }
        .url-cell {
            font-weight: 500;
            color: #667eea;
            max-width: 300px;
            word-break: break-all;
        }
        .url-cell a {
            color: inherit;
            text-decoration: none;
        }
        .url-cell a:hover {
            text-decoration: underline;
        }
        .title-cell, .desc-cell {
            max-width: 350px;
            line-height: 1.4;
        }
        .og-image {
            max-width: 150px;
            max-height: 100px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            cursor: pointer;
            transition: transform 0.3s ease;
        }
        .og-image:hover {
            transform: scale(1.5);
            z-index: 100;
            position: relative;
        }
        .no-image {
            display: inline-block;
            padding: 8px 12px;
            background: #ffebee;
            color: #c62828;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
        }
        .score-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
        }
        .score-high {
            background: #e8f5e9;
            color: #2e7d32;
        }
        .score-medium {
            background: #fff3e0;
            color: #e65100;
        }
        .score-low {
            background: #ffebee;
            color: #c62828;
        }
        .issues-list {
            font-size: 13px;
            color: #666;
            list-style: none;
        }
        .issues-list li {
            padding: 3px 0;
        }
        .issues-list li:before {
            content: "⚠️ ";
            margin-right: 5px;
        }
        .length-indicator {
            display: inline-block;
            margin-left: 8px;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
        }
        .length-good {
            background: #e8f5e9;
            color: #2e7d32;
        }
        .length-warning {
            background: #fff3e0;
            color: #e65100;
        }
        .length-bad {
            background: #ffebee;
            color: #c62828;
        }
        .status-indicator {
            display: inline-flex;
            align-items: center;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
        }
        .status-success {
            background: #e8f5e9;
            color: #2e7d32;
        }
        .status-error {
            background: #ffebee;
            color: #c62828;
        }
        .lang-badge {
            display: inline-block;
            padding: 4px 8px;
            background: #e3f2fd;
            color: #1565c0;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            margin-right: 5px;
        }
        .og-image-container {
            position: relative;
            display: inline-block;
        }
        .og-image-status {
            position: absolute;
            top: -8px;
            right: -8px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .og-image-status.ok {
            background: #4caf50;
            color: white;
        }
        .og-image-status.error {
            background: #f44336;
            color: white;
        }
        .og-image-404 {
            padding: 20px;
            background: #ffebee;
            border: 2px dashed #f44336;
            border-radius: 8px;
            text-align: center;
            color: #c62828;
            font-size: 12px;
        }
        .problems-summary {
            background: linear-gradient(135deg, #fff3e0 0%, #ffecb3 100%);
            padding: 30px;
            border-radius: 15px;
            margin: 30px 0;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .problems-summary h2 {
            color: #e65100;
            margin-bottom: 25px;
            border: none;
            background: none;
            padding: 0;
        }
        .problems-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }
        .problem-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .problem-card h4 {
            color: #333;
            margin-bottom: 15px;
            font-size: 1.1em;
        }
        .problem-stat {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
        }
        .problem-stat:last-child {
            border-bottom: none;
        }
        .problem-label {
            color: #666;
        }
        .problem-count {
            font-weight: bold;
            padding: 2px 8px;
            border-radius: 12px;
            background: #f5f5f5;
        }
        .problem-count.critical {
            background: #ffebee;
            color: #c62828;
        }
        .problem-count.warning {
            background: #fff3e0;
            color: #e65100;
        }
        .problem-count.good {
            background: #e8f5e9;
            color: #2e7d32;
        }
        .score-distribution {
            display: flex;
            gap: 15px;
            margin-top: 20px;
            padding: 20px;
            background: white;
            border-radius: 10px;
        }
        .score-group {
            flex: 1;
            text-align: center;
            padding: 15px;
            border-radius: 8px;
        }
        .score-group.critical {
            background: #ffebee;
        }
        .score-group.warning {
            background: #fff3e0;
        }
        .score-group.good {
            background: #e8f5e9;
        }
        .score-group-value {
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .score-group-label {
            font-size: 0.9em;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Raport SEO - ${this.domain}</h1>
            <p class="meta-info">
                🔗 Sitemapa: ${this.sitemapUrl}<br>
                📅 Data analizy: ${date}<br>
                📄 Przeanalizowano: ${this.seoData.length} stron<br>
                🌍 Języki: ${Object.keys(this.languageStats).map(lang => `${lang} (${this.languageStats[lang]})`).join(', ')}
            </p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value">${this.seoData.length}</div>
                <div class="stat-label">Wszystkie strony</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${Math.round(this.seoData.reduce((sum, d) => sum + (d.seoScore || 0), 0) / this.seoData.length)}/100</div>
                <div class="stat-label">Średni wynik SEO</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${this.seoData.filter(d => !d.title).length}</div>
                <div class="stat-label">Brak tytułu</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${this.seoData.filter(d => !d.description).length}</div>
                <div class="stat-label">Brak opisu</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${this.seoData.filter(d => !d.ogImage).length}</div>
                <div class="stat-label">Brak OG Image</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${this.seoData.filter(d => d.status === 'error').length}</div>
                <div class="stat-label">Błędy pobierania</div>
            </div>
        </div>
        
        ${duplicates.duplicateTitles.length > 0 || duplicates.duplicateDescriptions.length > 0 ? `
        <div class="issues-section">
            <h3>⚠️ Wykryte duplikaty</h3>
            
            ${duplicates.duplicateTitles.length > 0 ? `
                <h4>Duplikaty tytułów (${duplicates.duplicateTitles.length})</h4>
                ${duplicates.duplicateTitles.map(dup => `
                    <div class="duplicate-group">
                        <div class="duplicate-value">Tytuł: "${dup.value.substring(0, 100)}..."</div>
                        <ul class="duplicate-urls">
                            ${dup.urls.map(url => `<li>• ${url}</li>`).join('')}
                        </ul>
                    </div>
                `).join('')}
            ` : ''}
            
            ${duplicates.duplicateDescriptions.length > 0 ? `
                <h4>Duplikaty opisów (${duplicates.duplicateDescriptions.length})</h4>
                ${duplicates.duplicateDescriptions.map(dup => `
                    <div class="duplicate-group">
                        <div class="duplicate-value">Opis: "${dup.value.substring(0, 100)}..."</div>
                        <ul class="duplicate-urls">
                            ${dup.urls.map(url => `<li>• ${url}</li>`).join('')}
                        </ul>
                    </div>
                `).join('')}
            ` : ''}
        </div>
        ` : ''}
        
        ${missingTranslations.length > 0 ? `
        <div class="issues-section">
            <h3>🌐 Brakujące tłumaczenia (${missingTranslations.length})</h3>
            ${missingTranslations.map(mt => `
                <div class="missing-translation">
                    <strong>Strona źródłowa:</strong> ${mt.sourceUrl}<br>
                    <strong>Język:</strong> ${mt.sourceLang} → ${mt.missingLang}<br>
                    <strong>Oczekiwany URL:</strong> ${mt.expectedUrl}
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        ${Object.entries(pagesByLanguage).map(([lang, pages]) => `
        <div class="language-section">
            <div class="language-header">
                <span class="language-flag">${lang === 'pl' ? '🇵🇱' : lang === 'en' ? '🇬🇧' : '🌍'}</span>
                <span class="language-name">${lang === 'pl' ? 'Polski' : lang === 'en' ? 'English' : lang.toUpperCase()}</span>
                <span class="language-count">${pages.length} stron</span>
            </div>
            
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Lp.</th>
                            <th>URL</th>
                            <th>Status</th>
                            <th>Tytuł strony</th>
                            <th>Meta Description</th>
                            <th>OG Image</th>
                            <th>H1</th>
                            <th>Canonical</th>
                            <th>Wynik SEO</th>
                            <th>Problemy</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pages.map((item, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td class="url-cell">
                                    <a href="${item.url}" target="_blank">${item.url}</a>
                                    ${duplicates.duplicateTitles.some(d => d.urls.includes(item.url)) ? '<span class="warning-badge">DUP-T</span>' : ''}
                                    ${duplicates.duplicateDescriptions.some(d => d.urls.includes(item.url)) ? '<span class="warning-badge">DUP-D</span>' : ''}
                                </td>
                                <td>
                                    <span class="status-indicator status-${item.status}">
                                        ${item.status === 'success' ? '✅' : '❌'} ${item.statusCode || 'Error'}
                                    </span>
                                </td>
                                <td class="title-cell">
                                    ${item.title || '<span class="no-image">Brak tytułu</span>'}
                                    ${item.titleLength ? `<span class="length-indicator ${
                                        item.titleLength >= 30 && item.titleLength <= 60 ? 'length-good' :
                                        item.titleLength < 30 ? 'length-warning' : 'length-bad'
                                    }">${item.titleLength} znaków</span>` : ''}
                                </td>
                                <td class="desc-cell">
                                    ${item.description || '<span class="no-image">Brak opisu</span>'}
                                    ${item.descriptionLength ? `<span class="length-indicator ${
                                        item.descriptionLength >= 120 && item.descriptionLength <= 160 ? 'length-good' :
                                        item.descriptionLength < 120 ? 'length-warning' : 'length-bad'
                                    }">${item.descriptionLength} znaków</span>` : ''}
                                </td>
                                <td>
                                    ${item.ogImage ? 
                                        (item.ogImageStatus === '404' ? 
                                            `<div class="og-image-404">
                                                ❌ Obrazek zwraca 404<br>
                                                <small>${item.ogImage}</small>
                                            </div>` :
                                        item.ogImageStatus === 'unreachable' ?
                                            `<div class="og-image-404">
                                                ⚠️ Obrazek niedostępny<br>
                                                <small>${item.ogImage}</small>
                                            </div>` :
                                        item.ogImageStatus === 'ok' ?
                                            `<div class="og-image-container">
                                                <img src="${item.ogImage}" alt="OG Image" class="og-image" onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'no-image\\'>Błąd ładowania</div>'">
                                                <span class="og-image-status ok" title="Obrazek dostępny">✓</span>
                                            </div>` :
                                            `<div class="og-image-container">
                                                <img src="${item.ogImage}" alt="OG Image" class="og-image" onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'no-image\\'>Błąd ładowania</div>'">
                                                <span class="og-image-status error" title="Status: ${item.ogImageStatus}">!</span>
                                            </div>`)
                                        : '<span class="no-image">Brak OG Image</span>'}
                                </td>
                                <td>
                                    ${item.h1Text ? `${item.h1Text.substring(0, 100)}... (${item.h1Count} tag(ów))` : '<span class="no-image">Brak H1</span>'}
                                </td>
                                <td>
                                    ${item.canonical ? '✅' : '❌'}
                                </td>
                                <td>
                                    <span class="score-badge ${
                                        item.seoScore >= 80 ? 'score-high' : 
                                        item.seoScore >= 60 ? 'score-medium' : 'score-low'
                                    }">${item.seoScore}/100</span>
                                </td>
                                <td>
                                    ${item.seoIssues && item.seoIssues.length > 0 ? 
                                        `<ul class="issues-list">${item.seoIssues.map(issue => `<li>${issue}</li>`).join('')}</ul>` : 
                                        '✅ Brak problemów'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        `).join('')}
        
    </div>
</body>
</html>
        `;
        
        return html;
    }
}

// API Endpoints
app.post('/api/analyze', async (req, res) => {
    const { sitemapUrl, checkMultipleSitemaps, detectLanguages, checkDuplicates } = req.body;
    
    if (!sitemapUrl) {
        return res.status(400).json({ error: 'Brak URL sitemapy' });
    }
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    const sendEvent = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };
    
    try {
        const analyzer = new SEOAnalyzer(sitemapUrl, {
            checkMultipleSitemaps,
            detectLanguages,
            checkDuplicates
        });
        
        // Pobierz wszystkie sitemapy
        sendEvent({ type: 'progress', progress: 5, message: 'Sprawdzam strukturę sitemap...' });
        
        // Sprawdź najpierw czy to indeks
        let isIndex = false;
        try {
            const testResponse = await axios.get(sitemapUrl);
            const parser = new xml2js.Parser();
            const testResult = await parser.parseStringPromise(testResponse.data);
            if (testResult.sitemapindex) {
                isIndex = true;
                const sitemapCount = testResult.sitemapindex.sitemap ? testResult.sitemapindex.sitemap.length : 0;
                sendEvent({ 
                    type: 'progress', 
                    progress: 7, 
                    message: `Wykryto indeks sitemap z ${sitemapCount} pod-sitemapami...` 
                });
            }
        } catch (error) {
            // Kontynuuj normalnie
        }
        
        await analyzer.fetchSitemap();
        
        sendEvent({ 
            type: 'progress', 
            progress: 10, 
            message: `Znaleziono ${analyzer.urls.length} URL do analizy${isIndex ? ' (ze wszystkich sitemap w indeksie)' : ''}` 
        });
        
        // Analizuj każdy URL z ograniczeniem współbieżności (np. 5 równoległych)
        const pLimit = (concurrency) => {
            const queue = [];
            let active = 0;
            const next = () => {
                if (queue.length && active < concurrency) {
                    active++;
                    queue.shift()();
                }
            };
            return (fn) => (...args) => new Promise((resolve, reject) => {
                queue.push(async () => {
                    try {
                        resolve(await fn(...args));
                    } catch (e) {
                        reject(e);
                    } finally {
                        active--;
                        next();
                    }
                });
                next();
            });
        };

        const limit = pLimit(5);
        let completed = 0;
        const total = analyzer.urls.length;
        await Promise.all(analyzer.urls.map((u) => limit(async () => {
            const metadata = await analyzer.fetchPageMetadata(u);
            analyzer.seoData.push(metadata);
            completed++;
            const prog = Math.round((completed / total) * 80) + 10;
            sendEvent({
                type: 'progress',
                progress: prog,
                message: `Analizuję [${completed}/${total}]: ${u.substring(0, 50)}...`
            });
        })));
        
        // Oblicz statystyki
        const stats = {
            total: analyzer.seoData.length,
            errors: analyzer.seoData.filter(d => d.status === 'error').length,
            missingTitle: analyzer.seoData.filter(d => !d.title).length,
            missingDesc: analyzer.seoData.filter(d => !d.description).length,
            missingOG: analyzer.seoData.filter(d => !d.ogImage).length,
            avgScore: Math.round(analyzer.seoData.reduce((sum, d) => sum + (d.seoScore || 0), 0) / analyzer.seoData.length)
        };
        
        sendEvent({ type: 'stats', stats });
        sendEvent({ type: 'language-stats', languages: analyzer.languageStats });
        
        // Analiza problemów
        if (checkDuplicates) {
            const duplicates = analyzer.analyzeDuplicates();
            const issues = [];
            
            if (duplicates.duplicateTitles.length > 0) {
                issues.push({
                    description: `Duplikaty tytułów`,
                    count: duplicates.duplicateTitles.length
                });
            }
            
            if (duplicates.duplicateDescriptions.length > 0) {
                issues.push({
                    description: `Duplikaty opisów`,
                    count: duplicates.duplicateDescriptions.length
                });
            }
            
            const missingTranslations = analyzer.analyzeMissingTranslations();
            if (missingTranslations.length > 0) {
                issues.push({
                    description: `Brakujące tłumaczenia`,
                    count: missingTranslations.length
                });
            }
            
            sendEvent({ type: 'issues', issues });
        }
        
        sendEvent({ type: 'progress', progress: 95, message: 'Generuję raporty...' });
        
        // Generuj nazwy plików z domeną i datą
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
        const filePrefix = `seo_${analyzer.domain}_${dateStr}_${timeStr}`;
        
        // Zapisz pliki
        const csvFilename = `${filePrefix}.csv`;
        const jsonFilename = `${filePrefix}.json`;
        const htmlFilename = `${filePrefix}.html`;
        
        // CSV z dodatkowymi kolumnami
        const csvWriter = createCsvWriter({
            path: path.join('reports', csvFilename),
            header: [
                {id: 'url', title: 'URL'},
                {id: 'language', title: 'Język'},
                {id: 'statusCode', title: 'Status HTTP'},
                {id: 'title', title: 'Tytuł'},
                {id: 'titleLength', title: 'Długość tytułu'},
                {id: 'description', title: 'Opis'},
                {id: 'descriptionLength', title: 'Długość opisu'},
                {id: 'keywords', title: 'Słowa kluczowe'},
                {id: 'ogTitle', title: 'OG Title'},
                {id: 'ogDescription', title: 'OG Description'},
                {id: 'ogImage', title: 'OG Image'},
                {id: 'ogImageStatus', title: 'Status OG Image'},
                {id: 'canonical', title: 'Canonical URL'},
                {id: 'h1Count', title: 'Liczba H1'},
                {id: 'h1Text', title: 'Tekst H1'},
                {id: 'imagesWithoutAlt', title: 'Obrazki bez ALT'},
                {id: 'robots', title: 'Robots'},
                {id: 'seoScore', title: 'Wynik SEO'},
                {id: 'seoIssues', title: 'Problemy SEO'},
                {id: 'hreflang', title: 'Hreflang'}
            ]
        });
        
        const records = analyzer.seoData.map(item => ({
            ...item,
            seoIssues: item.seoIssues ? item.seoIssues.join('; ') : '',
            hreflang: item.hreflang ? JSON.stringify(item.hreflang) : ''
        }));
        
        await csvWriter.writeRecords(records);
        
        // JSON
        await fs.writeFile(
            path.join('reports', jsonFilename), 
            JSON.stringify(analyzer.seoData, null, 2)
        );
        
        // HTML
        const htmlContent = analyzer.generateHTMLReport(htmlFilename);
        await fs.writeFile(path.join('reports', htmlFilename), htmlContent);
        
        sendEvent({ type: 'progress', progress: 100, message: 'Zakończono!' });
        sendEvent({ 
            type: 'complete', 
            files: {
                csv: csvFilename,
                json: jsonFilename,
                html: htmlFilename
            },
            stats 
        });
        
    } catch (error) {
        sendEvent({ type: 'error', message: error.message });
    } finally {
        res.end();
    }
});

// Historia analiz
app.get('/api/history', async (req, res) => {
    try {
        const files = await fs.readdir('reports');
        const htmlFiles = files.filter(f => f.endsWith('.html'));
        
        const history = htmlFiles.map(htmlFile => {
            const parts = htmlFile.replace('.html', '').split('_');
            const domain = parts[1];
            const date = parts[2] + ' ' + parts[3].replace(/-/g, ':');
            const base = htmlFile.replace('.html', '');
            
            return {
                domain,
                date,
                html: htmlFile,
                csv: `${base}.csv`,
                json: `${base}.json`
            };
        });
        
        history.sort((a, b) => b.date.localeCompare(a.date));
        res.json(history.slice(0, 10)); // Ostatnie 10 analiz
        
    } catch (error) {
        res.json([]);
    }
});

// Strona główna
app.get('/', (req, res) => {
    res.send(indexHTML);
});

// Start serwera
const startServer = async () => {
    await createDirectories();
    
    app.listen(PORT, () => {
        console.log(`
╔════════════════════════════════════════════╗
║                                            ║
║       🚀 SEO Analyzer Pro                  ║
║       Wersja wielojęzyczna                 ║
║                                            ║
║   Serwer uruchomiony pomyślnie!           ║
║                                            ║
║   📍 URL: http://localhost:${PORT}         ║
║                                            ║
║   Otwórz powyższy adres w przeglądarce    ║
║                                            ║
╚════════════════════════════════════════════╝
        `);
    });
};

startServer();
