import { useEffect, useState } from 'react';

// Hash routes (#/map) work on GitHub Pages without any server setup.
export const ROUTES = ['/', '/how', '/log', '/map', '/leaderboard', '/me', '/stickers', '/about', '/privacy'] as const;
export type Route = (typeof ROUTES)[number];

function current(): Route {
  const path = window.location.hash.replace(/^#/, '') || '/';
  return (ROUTES as readonly string[]).includes(path) ? (path as Route) : '/';
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(current);
  useEffect(() => {
    const on = () => {
      setRoute(current());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const href = (r: Route) => `#${r}`;
