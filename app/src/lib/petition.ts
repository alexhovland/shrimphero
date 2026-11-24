import { PETITION_DEFAULT, PETITION_LINKS } from '../site-config';

export const petitionFor = (lang: string) => PETITION_LINKS[lang] || PETITION_DEFAULT;
