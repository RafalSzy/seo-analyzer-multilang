import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for the React front‑end.  This file instructs Vite to use the
// React plugin so that JSX is transformed properly.  It also exposes a
// consistent base path for the application.  Additional configuration (for
// example, aliases or environment variables) can be added here in future.
export default defineConfig({
  plugins: [react()],
  base: '',
});
