import { lazy, Suspense, useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { getStoreMap, type MapRow } from '../lib/api';

// MapLibre is only downloaded when someone opens this screen.
const MapView = lazy(() => import('./MapView'));

export default function MapScreen() {
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

  return (
    <>
      <section className="block block--cream" aria-labelledby="map-title">
        <div className="wrap">
          <h1 id="map-title">{t('map.title')}</h1>
          <p>{t('map.note')}</p>
          {rows && rows.length === 0 && <p role="status"><strong>{t('map.empty')}</strong></p>}
        </div>
      </section>
      <div className="map-box">
        {failed ? (
          <p className="map-status" role="alert">{t('map.failed')}</p>
        ) : (
          <Suspense fallback={<p className="map-status" role="status">{t('map.loading')}</p>}>
            {showMap ? <MapView rows={rows} /> : <p className="map-status" role="status">{t('map.loading')}</p>}
          </Suspense>
        )}
      </div>
      <div className="block block--cream map-credit">
        <p className="wrap credit">
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">{t('footer.osm')}</a>
          {' · '}
          <a href="https://openfreemap.org" target="_blank" rel="noopener noreferrer">OpenFreeMap</a>
          {' · '}
          <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener noreferrer">© OpenMapTiles</a>
        </p>
      </div>
    </>
  );
}
