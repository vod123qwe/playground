// The paper lad's notebook (Tab, or the button on a phone): the game waits. Who thinks what of you (each group's standing, and a line or
// two of what they say about you), the bike as it is (the parts on it), what you carry (finds, what the lottery keeps for you), and how
// you are (health, money, the papers by title, how far). createBook({ data }) → { toggle(), close(), key(e), isOpen }
// data() → { reps: { policja, ekipa, gang, sasiedzi, przystanek } (-6..6), parts: [{ cat, name }], items: [], kept: [], hp, money, fame, papers: [{ name, n, col }], dist }
export const GROUPS = {
  policja: { name: 'POLICJA', say: [
    'W NOTESIKU MASZ WŁASNĄ STRONĘ. KOMENDANT MÓWI O TOBIE „TEN Z GAZETAMI” I ROBI SIĘ CZERWONY.',
    'MÓWIĄ, ŻE JESZCZE RAZ I DO DOMU NA PIECHOTĘ. ROWER ODBIERZE MAMA.',
    'NIE ZNAJĄ CIĘ. I DOBRZE. NAJLEPSZY OBYWATEL TO TAKI, KTÓREGO NIE MA W PAPIERACH.',
    'DYŻURNY MÓWI, ŻE Z CIEBIE PORZĄDNY CHŁOPAK. NA RAZIE. PISZE TO OŁÓWKIEM.',
    'PRZYJACIEL POSTERUNKU. KOT Z SZAFKI POZWALA CI SIĘ GŁASKAĆ. TO WIĘCEJ NIŻ MEDAL.'] },
  ekipa: { name: 'EKIPA SPOD BECZKI', say: [
    'PRZY BECZCE MÓWIĄ NA CIEBIE „KABEL”. KOMORNIK, ZNACZY PIES, WARCZY NA SAM DŹWIĘK TWOJEGO ROWERU.',
    'PAN Z ROWERKIEM. TAK CIĘ NAZYWAJĄ. NIE JEST TO KOMPLEMENT.',
    'ZNAJĄ CIĘ Z WIDZENIA. TY RZUCASZ GAZETY, ONI RZUCAJĄ OKIEM.',
    'NASZ CZŁOWIEK. OGIEŃ ZAWSZE DLA CIEBIE JEST, MAKULATURA TEŻ.',
    'ZIUTEK CHCE CIĘ NA CHRZESTNEGO. PSA KOMORNIKA. MASZ JUŻ PRZYGOTOWANE MIEJSCE PRZY BECZCE.'] },
  gang: { name: 'GANG ROWEROWY', say: [
    'NA KAŻDYM SŁUPIE NA ICH REWIRZE TWOJA PODOBIZNA. MAZAKIEM. Z WĄSAMI, KTÓRYCH NIE MASZ.',
    'MÓWIĄ, ŻE KOPIESZ NASZYCH. NA ŚCIEŻKACH ROWEROWYCH OGLĄDAJ SIĘ ZA SIEBIE.',
    'DLA NICH JESTEŚ KOLEJNYM GOŚCIEM Z TORBĄ. NIKT, NIC, GAZECIARZ.',
    'MÓWIĄ, ŻE MASZ STYL. JAK NA GAZECIARZA. ZA TRICKI SZACUN.',
    'NA REWIRZE ZJEŻDŻAJĄ CI Z DROGI. ZE SZACUNKU. I TROCHĘ ZE STRACHU.'] },
  sasiedzi: { name: 'SĄSIEDZI', say: [
    'NA ULICY MÓWIĄ, ŻE TO PRZEZ CIEBIE GAZETY TAKIE DROGIE. I PRZEZ CIEBIE PADA.',
    'BABCIE ZASUWAJĄ FIRANKI, JAK JEDZIESZ. DZIADKOWIE KRĘCĄ GŁOWĄ. W RÓWNYM TEMPIE.',
    'DZIEŃ DOBRY, DO WIDZENIA. ZWYKŁY GAZECIARZ. ŻADNYCH PLOTEK, CO JEST DZIWNE.',
    'MÓWIĄ, ŻE NAJLEPSZY GAZECIARZ OD LAT. TAMTEN POPRZEDNI RZUCAŁ DO OCZKA WODNEGO.',
    'PANI HALINA CHCE CIĘ WYSWATAĆ Z WNUCZKĄ. DLA DOBRA ULICY. I DLA SZARLOTKI.'] },
  przystanek: { name: 'PRZYSTANEK I ŁAWKI', say: [
    'NA PRZYSTANKU MÓWIĄ, ŻE TO PRZEZ CIEBIE AUTOBUS SIĘ SPÓŹNIA. NIKT NIE WIE JAK, ALE WSZYSCY WIEDZĄ.',
    'PAN Z ŁAWKI UDAJE, ŻE ŚPI, JAK JEDZIESZ. CHOCIAŻ NA DOBRĄ SPRAWĘ NAPRAWDĘ ŚPI.',
    'CZEKAJĄ NA AUTOBUS. NA CIEBIE NIE. TO NIC OSOBISTEGO.',
    'MÓWIĄ, ŻE Z CIEBIE DOBRE DZIECKO. DAJESZ GAZETĘ DO POCZYTANIA I NIE TRĄBISZ.',
    'NA ŁAWCE TRZYMAJĄ CI MIEJSCE. NAWET LUMP SIĘ PRZESUWA. TROCHĘ.'] } };
const sentence = s => s.toLowerCase().replace(/(^|[.!?]\s+)(\p{L})/gu, (m, a, b) => a + b.toUpperCase());   // (said, not shouted: a capital after each full stop)
const tier = v => v <= -4 ? 0 : v <= -1.5 ? 1 : v < 1.5 ? 2 : v < 4 ? 3 : 4;
export function createBook({ data }) {
  const css = document.createElement('style'); css.textContent = `
    #book { position: fixed; inset: 0; z-index: 8; display: none; background: rgba(14,15,17,.92); color: #f6f3ea; font: 700 12px/1.4 ui-monospace, 'Cascadia Mono', Consolas, monospace; text-transform: uppercase; overflow-y: auto; }
    #book.on { display: block; } #book .in { max-width: 980px; margin: 0 auto; padding: max(14px, env(safe-area-inset-top)) 16px 20px; box-sizing: border-box; display: grid; grid-template-columns: 1.3fr 1fr; gap: 14px 22px; }
    #book .top { grid-column: 1 / -1; display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #efc970; padding-bottom: 7px; } #book .top b { color: #efc970; font-size: 15px; letter-spacing: .1em; }
    #book h4 { margin: 4px 0 8px; color: #efc970; font-size: 11px; letter-spacing: .12em; } #book .g { margin-bottom: 11px; } #book .g .h { display: flex; justify-content: space-between; gap: 8px; }
    #book .bar { height: 8px; background: #2a2c30; position: relative; margin: 4px 0 4px; } #book .bar i { position: absolute; top: 0; bottom: 0; } #book .bar u { position: absolute; left: 50%; top: -2px; bottom: -2px; width: 1px; background: #6b6e72; }
    #book .say { font-size: 11px; opacity: .78; text-transform: none; } #book .row { display: flex; justify-content: space-between; gap: 10px; padding: 2px 0; border-bottom: 1px solid #25272b; } #book .row span:last-child { color: #efc970; text-align: right; }
    #book .x { all: unset; cursor: pointer; border: 1.5px solid #efc970; color: #efc970; padding: 6px 12px; }
    @media (max-width: 720px) { #book .in { grid-template-columns: 1fr; } }
  `; document.head.appendChild(css);
  const el = document.createElement('div'); el.id = 'book'; document.body.appendChild(el);
  let open_ = false;
  function draw() {
    const d = data(), km = d.dist >= 1000 ? (d.dist / 1000).toFixed(2).replace('.', ',') + ' KM' : Math.round(d.dist) + ' M';
    const reps = Object.keys(GROUPS).map(k => { const v = d.reps[k] || 0, t = tier(v), w = Math.abs(v) / 6 * 50, col = v >= 1.5 ? '#9fd27a' : v <= -1.5 ? '#cf5a3e' : '#9a9c9e';
      return `<div class="g"><div class="h"><span>${GROUPS[k].name}</span><span style="color:${col}">${['WRÓG', 'NIECHĘĆ', 'OBOJĘTNOŚĆ', 'SYMPATIA', 'SZACUNEK'][t]}</span></div><div class="bar"><u></u><i style="left:${v < 0 ? 50 - w : 50}%;width:${w}%;background:${col}"></i></div><div class="say">„${sentence(GROUPS[k].say[t])}”</div></div>`; }).join('');
    const rows = (list, f) => list.length ? list.map(f).join('') : '<div class="row"><span>NIC</span><span></span></div>';
    el.innerHTML = `<div class="in"><div class="top"><b>NOTES GAZECIARZA</b><button class="x">WRÓĆ (TAB)</button></div>
      <div><h4>CO O TOBIE MÓWIĄ</h4>${reps}</div>
      <div><h4>STAN</h4>${[['ZDROWIE', Math.round(d.hp) + '/100'], ['KASA', d.money + ' ZŁ'], ['SŁAWA U POLICJI', Math.floor(d.fame)], ['DOJECHAŁEŚ', km]].map(([a, b]) => `<div class="row"><span>${a}</span><span>${b}</span></div>`).join('')}
        <h4 style="margin-top:12px">TORBA</h4>${rows(d.papers, p => `<div class="row"><span style="color:${p.col}">${p.name}</span><span>${p.n}</span></div>`)}
        <h4 style="margin-top:12px">ROWER</h4>${rows(d.parts, p => `<div class="row"><span>${p.cat}</span><span>${p.name}</span></div>`)}
        <h4 style="margin-top:12px">FANTY</h4>${rows(d.items, n => `<div class="row"><span>${n}</span><span></span></div>`)}
        <h4 style="margin-top:12px">NA KONCIE (Z LOTERII)</h4>${rows(d.kept, k => `<div class="row"><span>${k.label}</span><span></span></div>`)}</div></div>`;
    el.querySelector('.x').onclick = () => close();
  }
  function toggle() { open_ = !open_; el.classList.toggle('on', open_); if (open_) draw(); }
  function close() { open_ = false; el.classList.remove('on'); }
  function key(e) { if (!open_) return false; if (['Tab', 'Escape', 'Enter'].includes(e.code)) close(); e.preventDefault(); return true; }
  return { toggle, close, key, get isOpen() { return open_; } };
}
