import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

function App() {
  const { t, i18n } = useTranslation();

  // Form fields
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [checkMultipleSitemaps, setCheckMultiple] = useState(true);
  const [detectLanguages, setDetectLanguages] = useState(true);
  const [checkDuplicates, setCheckDuplicates] = useState(true);

  // UI state
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Apply theme class to root element whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Change application language
  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  // Handle form submission and stream events
  const handleAnalyze = async () => {
    if (!sitemapUrl) {
      alert('Please enter a sitemap URL');
      return;
    }
    setIsLoading(true);
    setProgress(0);
    setMessage('');
    setResults(null);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sitemapUrl,
          checkMultipleSitemaps,
          detectLanguages,
          checkDuplicates,
        }),
      });

      if (!response.body) {
        const data = await response.json();
        setIsLoading(false);
        alert(data.error || 'Unexpected response');
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i].trim();
          if (part.startsWith('data:')) {
            const jsonStr = part.replace(/^data: /, '');
            try {
              const event = JSON.parse(jsonStr);
              if (event.type === 'progress') {
                setProgress(event.progress);
                setMessage(event.message || '');
              } else if (event.type === 'complete') {
                setProgress(100);
                setResults(event);
              }
            } catch (e) {
              console.error('Failed to parse event', e, jsonStr);
            }
          }
        }
        buffer = parts[parts.length - 1];
      }
    } catch (error) {
      console.error('Analysis failed', error);
      alert('An error occurred while analysing.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>{t('title')}</h1>
      <div>
        <label htmlFor="sitemapUrl">{t('enterSitemapUrl')}</label>
        <input
          id="sitemapUrl"
          type="text"
          value={sitemapUrl}
          placeholder={t('placeholderSitemap')}
          onChange={(e) => setSitemapUrl(e.target.value)}
        />
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            checked={checkMultipleSitemaps}
            onChange={(e) => setCheckMultiple(e.target.checked)}
          />
          {t('checkMultipleSitemaps')}
        </label>
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            checked={detectLanguages}
            onChange={(e) => setDetectLanguages(e.target.checked)}
          />
          {t('detectLanguages')}
        </label>
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            checked={checkDuplicates}
            onChange={(e) => setCheckDuplicates(e.target.checked)}
          />
          {t('checkDuplicates')}
        </label>
      </div>
      <button onClick={handleAnalyze} disabled={isLoading}>
        {t('analyze')}
      </button>
      <div style={{ marginTop: '1rem' }}>
        <div>
          {t('progress')}: {progress}% {message && ' - ' + message}
        </div>
        <div className="progress-bar">
          <div
            className="progress-bar-inner"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      {results && (
        <div style={{ marginTop: '1rem' }}>
          <h2>{t('results')}</h2>
          {results.files && results.files.csv && (
            <p>
              {t('downloadCSV')}: <a href={`/reports/${results.files.csv}`} target="_blank" rel="noopener noreferrer">{results.files.csv}</a>
            </p>
          )}
        </div>
      )}
      <div className="settings">
        <div>
          {t('theme')}: {' '} 
          <button onClick={() => setTheme('light')} disabled={theme === 'light'}>
            {t('light')}
          </button>
          <button onClick={() => setTheme('dark')} disabled={theme === 'dark'}>
            {t('dark')}
          </button>
        </div>
        <div>
          {t('language')}: {' '}
          <button onClick={() => changeLanguage('pl')} disabled={i18n.language === 'pl'}>
            {t('polish')}
          </button>
          <button onClick={() => changeLanguage('en')} disabled={i18n.language === 'en'}>
            {t('english')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
