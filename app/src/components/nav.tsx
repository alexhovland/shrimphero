import type { ComponentType } from 'react';
import type { Route } from '../lib/router';
import { IconHome, IconMap, IconMine, IconPlus, IconRank } from './Icons';

export const NAV: { route: Route; label: string; Icon: ComponentType }[] = [
  { route: '/', label: 'nav.home', Icon: IconHome },
  { route: '/log', label: 'nav.log', Icon: IconPlus },
  { route: '/map', label: 'nav.map', Icon: IconMap },
  { route: '/leaderboard', label: 'nav.leaderboard', Icon: IconRank },
  { route: '/me', label: 'nav.me', Icon: IconMine },
];
