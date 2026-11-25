import { useEffect, useState } from 'react';

// Hash routes (#/map) work on GitHub Pages without any server setup.
export const ROUTES = ['/', '/how', '/log', '/map', '/leaderboard', '/me', '/stickers', '/about', '/privacy'] as const;
export type Route = (typeof ROUTES)[number];

// Some routes open another page and scroll to one of its sections.
// The old links keep working: #/leaderboard is the ranking under the map, and
// #/about is "How we count" at the end of How it works.
const PAGE_OF: Partial<Record<Route, Route>> = { '/leaderboard': '/map', '/about': '/how' };
const SECTION_OF: Partial<Record<Route, string>> = { '/leaderboard': 'ranking', '/about': 'how-we-count' };
export const pageOf = (r: Route): Route => PAGE_OF[r] ?? r;
export const sectionOf = (r: Route): string | undefined => SECTION_OF[r];

function current(): Route {
  const path = window.location.hash.replace(/^#/, '') || '/';
  return (ROUTES as readonly string[]).includes(path) ? (path as Route) : '/';
}

// The current route. Scrolling and focus after a change are handled in App.
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(current);
  useEffect(() => {
    const on = () => setRoute(current());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const href = (r: Route) => `#${r}`;
