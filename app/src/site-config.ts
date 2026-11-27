// Shown on the Privacy and imprint page. The site is published under the
// project name. Never put a private person's name or address here.
export const PUBLISHER_NAME = 'ShrimpHero';
// Edit before launch: the project's own contact address.
export const CONTACT_EMAIL = 'hello@shrimphero.org';
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

// Sticker order form on Tally: the form id from its link (tally.so/r/<id>).
// One id per interface language if translated copies exist later, otherwise the default.
// Leave the default empty to hide ordering and show "Ordering opens soon".
export const ORDER_FORM_IDS: Record<string, string> = {};
export const ORDER_FORM_ID_DEFAULT = 'EqWdEr';

export const SOURCES = {
  europe: 'https://rethinkpriorities.org/research-area/estimating-the-number-of-shrimp-in-major-european-markets/',
  germany: 'https://rethinkpriorities.org/wp-content/uploads/2026/09/Estimating-The-Number-Of-Shrimp-In-The-German-Retail-Market.pdf',
};

export const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';
