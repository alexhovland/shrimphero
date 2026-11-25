import { Suspense, useEffect, useRef } from 'react';
import { useI18n } from './i18n';
import { pageOf, sectionOf, useRoute, type Route } from './lib/router';
import { prefersReducedMotion } from './lib/motion';
import { showSection } from './lib/scroll';
import { Header } from './components/Header';
import { TabBar } from './components/TabBar';
import { Footer } from './components/Footer';
import Home from './screens/Home';
import Log from './screens/Log';
import Mine from './screens/Mine';
import Stickers from './screens/Stickers';
import About from './screens/About';
import HowItWorks from './screens/HowItWorks';
import Privacy from './screens/Privacy';
import MapScreen from './screens/MapScreen';
// MapScreen loads the large map library (MapLibre) on its own, only when opened.

// One component per page. Routes that point into another page (see router.ts) are not listed.
const PAGES: Partial<Record<Route, React.ComponentType>> = {
  '/': Home,
  '/how': HowItWorks,
  '/log': Log,
  '/map': MapScreen,
  '/me': Mine,
  '/stickers': Stickers,
  '/about': About,
  '/privacy': Privacy,
};

// The browser tab title of each route.
const TITLES: Record<Route, string> = {
  '/': '',
  '/how': 'how.title',
  '/log': 'log.title',
  '/map': 'map.page_title',
  '/leaderboard': 'leaderboard.title',
  '/me': 'me.title',
  '/stickers': 'stickers.title',
  '/about': 'about.title',
  '/privacy': 'privacy.title',
};

export default function App() {
  const route = useRoute();
  const { t } = useI18n();
  const main = useRef<HTMLElement>(null);
  const first = useRef(true);
  const page = pageOf(route);
  const C = PAGES[page]!;
  const title = TITLES[route];

  useEffect(() => {
    if (!prefersReducedMotion()) document.documentElement.classList.add('motion');
  }, []);

  useEffect(() => {
    document.title = title ? `${t(title)} · ShrimpHero` : 'ShrimpHero';
  }, [title, t]);

  // After a route change: show the route's section (focus on its heading), or go to
  // the top of the page and move focus to the new content for screen readers.
  // On the very first load only a section link scrolls; otherwise nothing moves.
  useEffect(() => {
    const isFirst = first.current;
    first.current = false;
    const section = sectionOf(route);
    if (section) return showSection(section);
    if (isFirst) return;
    window.scrollTo(0, 0);
    main.current?.focus({ preventScroll: true });
  }, [route]);

  return (
    <div className="has-tabbar">
      <Header route={route} />
      <main id="main" ref={main} tabIndex={-1}>
        <Suspense fallback={<p className="block wrap" role="status">{t('common.loading')}</p>}>
          {/* Keyed by page, not route: #/map and #/leaderboard share one map, which is never reloaded. */}
          <C key={page} />
        </Suspense>
      </main>
      <Footer />
      <TabBar route={route} />
    </div>
  );
}
