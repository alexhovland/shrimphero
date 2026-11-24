import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/libre-franklin/latin-700.css';
import '@fontsource/libre-franklin/latin-ext-700.css';
import '@fontsource/libre-franklin/latin-900.css';
import '@fontsource/libre-franklin/latin-ext-900.css';
import '@fontsource/newsreader/latin-400.css';
import '@fontsource/newsreader/latin-ext-400.css';
import './styles.css';
import { I18nProvider, initI18n } from './i18n';
import { SessionProvider } from './lib/session';
import App from './App';

initI18n().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <I18nProvider>
        <SessionProvider>
          <App />
        </SessionProvider>
      </I18nProvider>
    </StrictMode>,
  );
});
