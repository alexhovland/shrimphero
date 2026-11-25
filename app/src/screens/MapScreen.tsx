import { lazy, Suspense, useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { getStoreMap, type MapRow } from '../lib/api';
import { showSection } from '../lib/scroll';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { RankingSection } from './Leaderboard';

// MapLibre is only downloaded when someone opens this page.
const MapView = lazy(() => import('./MapView'));

// The map: pins for every store with stickers, then the credits.
function MapSection() {
  const { t } = useI18n();
  const [rows, setRows] = useState<MapRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    getStoreMap().then(setRows).catch(() => setFailed(true));
    // Start downloading the map library only after the page has painted,
    // so the heading and text show up straight away.
    let timer = 0;
    const frame = requestAnimationFrame(() => {
      timer = window.setTimeout(() => setShowMap(true), 0);
    });
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, []);

  const mapFailed = <p className="map-status" role="alert">{t('map.failed')}</p>;
  const loading = <p className="map-status" role="status">{t('map.loading')}</p>;

  return (
    <>
      <section className="block block--cream" aria-labelledby="map-title">
        <div className="wrap">
          <h1 id="map-title">{t('map.page_title')}</h1>
          <p>{t('map.note')}</p>
          {rows && rows.length === 0 && <p role="status"><strong>{t('map.empty')}</strong></p>}
        </div>
      </section>
      <div className="map-box">
        {failed ? (
          mapFailed
        ) : (
          <ErrorBoundary fallback={mapFailed}>
            <Suspense fallback={loading}>{showMap ? <MapView rows={rows} /> : loading}</Suspense>
          </ErrorBoundary>
        )}
      </div>
      <div className="block block--cream map-credit">
        <div className="wrap">
          <button type="button" className="link-button see-ranking" onClick={() => showSection('ranking')}>
            {t('map.see_ranking')} <span aria-hidden="true">↓</span>
          </button>
          <p className="credit">
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">{t('footer.osm')}</a>
            {' · '}
            <a href="https://openfreemap.org" target="_blank" rel="noopener noreferrer">OpenFreeMap</a>
            {' · '}
            <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener noreferrer">© OpenMapTiles</a>
          </p>
        </div>
      </div>
    </>
  );
}

// Map and ranking on one page. #/map opens it at the top, #/leaderboard at the ranking.
export default function MapScreen() {
  return (
    <>
      <MapSection />
      <RankingSection />
    </>
  );
}
