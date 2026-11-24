// Shown on the Privacy and imprint page. The site is published under the
// project name. Never put a private person's name or address here.
export const PUBLISHER_NAME = 'ShrimpHero';
// Edit before launch: the project's own contact address.
export const CONTACT_EMAIL = '{{CONTACT_EMAIL}}';
// Optional postal address (for example a P.O. box). Leave empty to show none.
export const PUBLISHER_ADDRESS = '';
// The company that hosts the site. Change it if the site moves.
export const HOST = 'GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA';

// Petition per interface language. Everything else goes to the English site.
export const PETITION_LINKS: Record<string, string> = {
  fr: 'https://lidlcrevettes.com/',
  de: 'https://lidlgarnelen.de/',
  it: 'https://lidlgamberetti.com/',
  pl: 'https://lidlkrewetki.pl/',
};
export const PETITION_DEFAULT = 'https://lidlshrimp.com/';

// Sticker files in public/stickers. "label" is the language name shown in the picker.
export const STICKERS = [
  { file: 'sticker-fr.png', code: 'fr', label: 'Français' },
  { file: 'sticker-de.png', code: 'de', label: 'Deutsch' },
  { file: 'sticker-it.png', code: 'it', label: 'Italiano' },
  { file: 'sticker-pl.png', code: 'pl', label: 'Polski' },
  { file: 'sticker-en.png', code: 'en', label: 'English' },
  { file: 'sticker-nl.png', code: 'nl', label: 'Nederlands' },
  { file: 'sticker-nl-red.png', code: 'nl-red', label: 'Nederlands (rood)' },
  { file: 'sticker-cs.png', code: 'cs', label: 'Čeština' },
  { file: 'sticker-hu.png', code: 'hu', label: 'Magyar' },
] as const;

export const SOURCES = {
  europe: 'https://rethinkpriorities.org/research-area/estimating-the-number-of-shrimp-in-major-european-markets/',
  germany: 'https://rethinkpriorities.org/wp-content/uploads/2026/09/Estimating-The-Number-Of-Shrimp-In-The-German-Retail-Market.pdf',
};

export const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';
