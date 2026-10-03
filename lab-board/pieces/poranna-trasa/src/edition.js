// Which game this copy is: 'trasa' (GTB Gazeciarz, the open 3D town) or 'klasyk' (Gazeciarz, the arcade Classic). The two games
// live in their own folders since v184 (poranna-trasa\ and gazeciarz\); this one line is what tells the shared code apart.
export const EDITION = 'trasa';
export const TITLE = { trasa: 'GTB GAZECIARZ', klasyk: 'GAZECIARZ' }[EDITION];
export const SUBTITLE = { trasa: 'GAZETY SAME SIĘ NIE ROZNIOSĄ', klasyk: 'NA CZAS I NA PUNKTY' }[EDITION];
