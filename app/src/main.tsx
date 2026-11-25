import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/bricolage-grotesque/opsz.css';
import './styles.css';
import { I18nProvider, initI18n } from './i18n';
import { startStats } from './lib/stats';
import { SessionProvider } from './lib/session';
import App from './App';

startStats();

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
