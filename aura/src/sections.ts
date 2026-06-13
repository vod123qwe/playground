export type Section = {
  eyebrow: string;
  title: string;
  body: string;
  /** State color — tints the glass + drives the glowing core / bloom. */
  color: string;
  /** Target world position of the product for this section. */
  productPos: [number, number, number];
  /** Target uniform scale of the product. */
  scale: number;
  /** Which side the annotation copy sits on. */
  side: 'left' | 'right' | 'center';
};

export const SECTIONS: Section[] = [
  {
    eyebrow: 'AURA — 01 / Forma',
    title: 'Energia, która ma kształt',
    body: 'Poznaj AURA — rdzeń z płynnego szkła reagujący na każdy Twój ruch. Przewiń w dół, by zobaczyć, jak ożywa.',
    color: '#5b8cff',
    productPos: [1.4, 0, 0],
    scale: 1,
    side: 'left',
  },
  {
    eyebrow: 'AURA — 02 / Ruch',
    title: 'Płynie tam, gdzie Ty',
    body: 'Każdy gest przesuwa rdzeń w przestrzeni. Pozycja, obrót i skala podążają za scrollem w czasie rzeczywistym.',
    color: '#a766ff',
    productPos: [-1.5, -0.1, 0],
    scale: 0.82,
    side: 'right',
  },
  {
    eyebrow: 'AURA — 03 / Stany',
    title: 'Cztery stany, jedna dusza',
    body: 'Materiał zmienia barwę, gęstość i blask. To nie animacja w pętli — to reakcja na to, gdzie jesteś.',
    color: '#ff7a3c',
    productPos: [1.6, 0.1, -0.4],
    scale: 1.18,
    side: 'left',
  },
  {
    eyebrow: 'AURA — 04 / Ty',
    title: 'Twój produkt, ożywiony',
    body: 'Dowolny model 3D, dowolna historia. AURA to gotowy szkielet pod premium scroll-experience dla Twojej marki.',
    color: '#2ee6a6',
    productPos: [0, 0, 0.6],
    scale: 1.05,
    side: 'center',
  },
];
