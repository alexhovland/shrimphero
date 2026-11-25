import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { GeoJSONSource, MapSourceDataEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// The map's worker is served from this site, so the security policy can stay strict.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { useI18n } from '../i18n';
import type { MapRow } from '../lib/api';
import { formatNumber } from '../lib/format';
import { MAP_STYLE } from '../site-config';

// Europe, one pin per store with stickers, clustered when zoomed out.
// Pins are HTML buttons, so they work with a keyboard and screen readers.
maplibregl.setWorkerUrl(workerUrl);

const EUROPE: [[number, number], [number, number]] = [[-10.5, 36], [24.5, 59]];

const compact = (n: number, lang: string) =>
  new Intl.NumberFormat(lang, { notation: 'compact', maximumFractionDigits: 1 }).format(n);

// Help texts shown when someone scrolls over the map without Ctrl/⌘, or uses one finger on a phone.
const gestureTexts = (t: (key: string) => string) => ({
  'CooperativeGesturesHandler.WindowsHelpText': t('map.gesture_windows'),
  'CooperativeGesturesHandler.MacHelpText': t('map.gesture_mac'),
  'CooperativeGesturesHandler.MobileHelpText': t('map.gesture_mobile'),
});

export default function MapView({ rows }: { rows: MapRow[] | null }) {
  const { t, lang } = useI18n();
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [failed, setFailed] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const textRef = useRef({ t, lang });
  textRef.current = { t, lang };

  // Create the map once.
  useEffect(() => {
    if (!box.current) return;
    let loaded = false;
    const map = new maplibregl.Map({
      container: box.current,
      style: MAP_STYLE,
      bounds: EUROPE,
      fitBoundsOptions: { padding: 16 },
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      maxZoom: 16,
      // One finger scrolls the page, two fingers move the map, so the map never traps the page on a phone.
      cooperativeGestures: true,
      locale: gestureTexts(textRef.current.t),
    });
    map.touchZoomRotate.disableRotation();
    map.keyboard.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.on('load', () => {
      loaded = true;
      map.addSource('stores', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterRadius: 56,
        clusterMaxZoom: 12,
        clusterProperties: { sum: ['+', ['get', 'total']] },
      });
      // Invisible layer: the visible pins are HTML markers drawn from it.
      map.addLayer({ id: 'stores', type: 'circle', source: 'stores', paint: { 'circle-radius': 0, 'circle-opacity': 0 } });
      mapRef.current = map;
      setMapReady(true);
    });
    map.on('error', () => {
      if (!loaded) setFailed(true);
    });

    const markers = new Map<string, maplibregl.Marker>();
    let popup: maplibregl.Popup | null = null;

    const update = () => {
      if (!map.getSource('stores')) return;
      const { t, lang } = textRef.current;
      const seen = new Set<string>();
      for (const f of map.querySourceFeatures('stores')) {
        const p = f.properties || {};
        const isCluster = !!p.cluster;
        const key = isCluster ? `c${p.cluster_id}` : `s${p.store_id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        if (markers.has(key)) continue;
        const coords = (f.geometry as unknown as { coordinates: [number, number] }).coordinates;
        const total = Number(isCluster ? p.sum : p.total) || 0;
        const el = document.createElement('button');
        el.type = 'button';
        el.className = isCluster ? 'pin pin--cluster' : 'pin';
        const badge = document.createElement('span');
        badge.textContent = compact(total, lang);
        el.appendChild(badge);
        const place = [p.city, p.street].filter(Boolean).join(', ');
        const label = isCluster
          ? t('map.cluster', { count: total, total: formatNumber(total, lang) })
          : `${place || 'Lidl'}: ${t('map.stickers', { count: total, total: formatNumber(total, lang) })}`;
        el.addEventListener('click', async (ev) => {
          ev.stopPropagation();
          if (isCluster) {
            const source = map.getSource('stores') as GeoJSONSource;
            const zoom = await source.getClusterExpansionZoom(p.cluster_id);
            map.easeTo({ center: coords, zoom: Math.min(zoom, 16) });
          } else {
            popup?.remove();
            const content = document.createElement('div');
            const title = document.createElement('strong');
            title.textContent = place || 'Lidl';
            const line = document.createElement('div');
            line.textContent = t('map.stickers', { count: total, total: formatNumber(total, lang) });
            content.append(title, line);
            popup = new maplibregl.Popup({ offset: 24, closeButton: true, focusAfterOpen: false }).setLngLat(coords).setDOMContent(content).addTo(map);
          }
        });
        const marker = new maplibregl.Marker({ element: el }).setLngLat(coords).addTo(map);
        el.setAttribute('aria-label', label);
        el.removeAttribute('role');
        markers.set(key, marker);
      }
      for (const [key, marker] of markers) {
        if (!seen.has(key)) {
          marker.remove();
          markers.delete(key);
        }
      }
    };
    map.on('moveend', update);
    map.on('sourcedata', (e: MapSourceDataEvent) => {
      if (e.sourceId === 'stores' && e.isSourceLoaded) update();
    });

    return () => {
      popup?.remove();
      markers.forEach((m) => m.remove());
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // The map writes its gesture help texts once; rewrite them when the language changes.
  useEffect(() => {
    const screen = box.current?.querySelector('.maplibregl-cooperative-gesture-screen');
    if (!screen) return;
    const texts = gestureTexts(t);
    // Same test as the map library: ⌘ on a Mac, Ctrl elsewhere.
    const mac = navigator.platform.indexOf('Mac') === 0;
    const desktop = screen.querySelector('.maplibregl-desktop-message');
    const mobile = screen.querySelector('.maplibregl-mobile-message');
    if (desktop) desktop.textContent = texts[mac ? 'CooperativeGesturesHandler.MacHelpText' : 'CooperativeGesturesHandler.WindowsHelpText'];
    if (mobile) mobile.textContent = texts['CooperativeGesturesHandler.MobileHelpText'];
  }, [t, mapReady]);

  // Put the store totals on the map once both the map and the data are ready.
  useEffect(() => {
    const source = mapReady ? (mapRef.current?.getSource('stores') as GeoJSONSource | undefined) : undefined;
    if (!source || !rows) return;
    source.setData({
      type: 'FeatureCollection',
      features: rows.map((r) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [r.lng, r.lat] },
        properties: { store_id: r.store_id, total: r.total, city: r.city ?? '', street: r.street ?? '' },
      })),
    });
  }, [rows, mapReady]);

  return (
    <>
      <div ref={box} className="map-canvas" />
      {failed && <p className="map-status" role="alert">{t('map.failed')}</p>}
      {!failed && !rows && <p className="map-status" role="status">{t('map.loading')}</p>}
    </>
  );
}
