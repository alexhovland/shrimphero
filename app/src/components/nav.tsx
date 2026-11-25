import type { ComponentType } from 'react';
import type { Route } from '../lib/router';
import { IconHome, IconHow, IconMap, IconMine, IconPlus } from './Icons';

// Main menu: the bottom bar on phones and the top menu on wide screens.
// A tab is active on its own page and on routes that point into it (see pageOf in router.ts).
export const NAV: { route: Route; label: string; Icon: ComponentType }[] = [
  { route: '/', label: 'nav.home', Icon: IconHome },
  { route: '/how', label: 'nav.how', Icon: IconHow },
  { route: '/log', label: 'nav.log', Icon: IconPlus },
  { route: '/map', label: 'nav.map', Icon: IconMap },
  { route: '/me', label: 'nav.me', Icon: IconMine },
];
