import { Suspense, useEffect, useRef } from 'react';
import { useI18n } from './i18n';
import { useRoute, type Route } from './lib/router';
import { prefersReducedMotion } from './lib/motion';
import { Header } from './components/Header';
import { TabBar } from './components/TabBar';
import { Footer } from './components/Footer';
import Home from './screens/Home';
import Log from './screens/Log';
import Leaderboard from './screens/Leaderboard';
import Mine from './screens/Mine';
import Stickers from './screens/Stickers';
import About from './screens/About';
import Privacy from './screens/Privacy';
import MapScreen from './screens/MapScreen';
// MapScreen loads the large map library (MapLibre) on its own, only when opened.

const SCREENS: Record<Route, { C: React.ComponentType; title: string }> = {
  '/': { C: Home, title: '' },
  '/log': { C: Log, title: 'log.title' },
  '/map': { C: MapScreen, title: 'map.title' },
  '/leaderboard': { C: Leaderboard, title: 'leaderboard.title' },
  '/me': { C: Mine, title: 'me.title' },
  '/stickers': { C: Stickers, title: 'stickers.title' },
  '/about': { C: About, title: 'about.title' },
  '/privacy': { C: Privacy, title: 'privacy.title' },
};

export default function App() {
  const route = useRoute();
  const { t } = useI18n();
  const main = useRef<HTMLElement>(null);
  const first = useRef(true);
  const { C, title } = SCREENS[route];

  useEffect(() => {
    if (!prefersReducedMotion()) document.documentElement.classList.add('motion');
  }, []);

  useEffect(() => {
    document.title = title ? `${t(title)} · ShrimpHero` : 'ShrimpHero';
  }, [title, t]);

  // After a screen change, move focus to the new content for screen readers.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    main.current?.focus({ preventScroll: true });
  }, [route]);

  return (
    <div className="has-tabbar">
      <Header route={route} />
      <main id="main" ref={main} tabIndex={-1}>
        <Suspense fallback={<p className="block wrap" role="status">{t('common.loading')}</p>}>
          <C key={route} />
        </Suspense>
      </main>
      <Footer />
      <TabBar route={route} />
    </div>
  );
}
