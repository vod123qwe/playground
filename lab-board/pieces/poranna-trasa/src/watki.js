// The town's stories (the paper is about them, not about the paperboy): threads that go on issue by issue, each a few stages, each
// about its people (their portraits, their photos, a quote of theirs). Up to three run at once in a region; each issue one or two of them
// go a step on, a new one starts when one ends. The key people's threads (Janusz, the papers' war, Hela) go with you to every region;
// a region's own ones only there. And one thread grows out of what you do: the cyclist in the red cap (the windows, the
// kicks, the mailboxes) the police are after, stage by stage as the misdeeds add up (and quiet when you behave).
// advance(state, { region, misdeeds, clean, rnd }) → { state, stories: [{ id, kicker, head, text, spot, face, quote, fresh }] }

const T = (kicker, head, text, extra = {}) => ({ kicker, head, text, ...extra });
export const THREADS = {
  mruczek: { region: 'peryferia', stages: [
    T('Z OSIEDLA', 'Zaginął kot Mruczek', 'Babcia Stasia od trzech dni szuka rudego kocura. Mruczek odpowiada tylko na swoje imię i na dźwięk otwieranej puszki. Znalazcę czeka szarlotka.', { face: 'kapliczka', quote: ['Babcia Stasia', 'On nigdy nie spał poza domem. No, raz. U sąsiadki.'] }),
    T('Z OSIEDLA', 'Mruczek widziany przy działkach', 'Działkowiec spod torów twierdzi, że rudy kot od dwóch nocy podjada mu truskawki. Babcia Stasia nie wierzy: Mruczek truskawek nie lubi. Lubi śmietanę.', { spot: 'działki', face: 'dzialki' }),
    T('Z OSIEDLA', 'Kto karmi Mruczka?', 'Pan z przyczepy przyznał, że od tygodnia dokarmia rudego kota. Twierdzi, że kot sam przyszedł i sam zostanie. Babcia Stasia szykuje się do rozmowy.', { spot: 'przyczepa', face: 'przyczepa', quote: ['Pan z przyczepy', 'Kot wybiera człowieka, nie odwrotnie.'] }),
    T('Z OSIEDLA', 'Mruczek wrócił do domu!', 'Po negocjacjach przy przyczepie kot wrócił do Babci Stasi. Pan z przyczepy dostał szarlotkę na pocieszenie i prawo do odwiedzin w niedziele.', { face: 'kapliczka', end: true })] },
  koszulka: { region: 'peryferia', key: true, stages: [
    T('Z WARSZTATU', 'Skradziono koszulkę zwycięzcy', 'Pan Janusz zgłosił kradzież koszulki, w której, jak twierdzi, wygrał wielki wyścig w osiemdziesiątym trzecim. Koszulka ma dziurę na łokciu i „wartość historyczną”.', { face: 'janusz', spot: 'sklep rowerowy', quote: ['Pan Janusz', 'To nie szmata, to relikwia!'] }),
    T('Z WARSZTATU', 'Nagroda: dożywotnia pompka', 'Właściciel warsztatu wyznaczył nagrodę za odnalezienie koszulki: darmowe pompowanie kół do końca życia. Swojego albo znalazcy, nie sprecyzował.', { face: 'janusz' }),
    T('Z WARSZTATU', 'Pomocnik pod lupą', 'Według naszych informacji podejrzenia padają na Mietka, pomocnika z warsztatu. Mietek zaprzecza. Ma alibi: w chwili kradzieży jadł pączka. Pączek nie potwierdza.', { spot: 'sklep rowerowy' }),
    T('Z WARSZTATU', 'Nowy trop: czerwona chustka', 'Sąsiedzi widzieli pod warsztatem kobietę w czerwonej chustce w groszki. Pan Janusz na wieść o tym zamilkł na pół minuty. Najdłużej od lat.', { face: 'janusz', quote: ['Pan Janusz', 'Nie, nie znam. To znaczy znałem. Nieważne.'] }),
    T('Z WARSZTATU', 'Koszulka wróciła. Bez słowa', 'Koszulka zwycięzcy wisi znów na ścianie warsztatu, uprana i zacerowana na łokciu. Pan Janusz nie chce zdradzić, kto ją oddał. Uśmiecha się podejrzanie często.', { spot: 'sklep rowerowy', end: true })] },
  kurier: { region: 'peryferia', key: true, stages: [
    T('RYNEK PRASY', 'Kurier Osiedlowy wchodzi na osiedle', 'Konkurencyjna gazeta zapowiada, że będzie „szybsza, grubsza i z krzyżówką”. Redakcja Wieści zza płotu odpowiada spokojnie: my mamy ogłoszenia Heli.', { face: 'key:oldman' }),
    T('RYNEK PRASY', 'Kurier za darmo przez miesiąc', 'Konkurencja rozdaje gazetę za darmo. Część mieszkańców bierze obie, bo, jak mówią, „podpałka zawsze się przyda”. Redaktor nie komentuje, tylko nerwowo poprawia okulary.', { spot: 'przystanek' }),
    T('RYNEK PRASY', 'Obcy gazeciarze przy naszych skrzynkach', 'Mieszkańcy zgłaszają, że ludzie Kuriera wkładają swoją gazetę do skrzynek prenumeratorów Wieści. Redakcja apeluje: sprawdzajcie, co czytacie.', { spot: 'przystanek', quote: ['Pan Redaktor', 'Wojny nie chcieliśmy. Ale gazeciarzy mamy lepszych.'] }),
    T('RYNEK PRASY', 'Wieści zostają!', 'Mimo darmowej konkurencji prenumeratorzy Wieści zza płotu w większości zostali. Prezes Kuriera zapowiada „nową strategię”. Brzmi groźnie.', { face: 'key:oldman', end: true })] },
  budowa: { region: 'peryferia', stages: [
    T('INWESTYCJE', 'Budowa na rogu stoi', 'Plac budowy na rogu od tygodni świeci pustkami. Koparka czeka, betoniarka czeka, mieszkańcy też czekają. Na co, nikt nie wie.', { spot: 'budowa', face: 'budowa' }),
    T('INWESTYCJE', 'Kto stoi za budową?', 'Tablica informacyjna podaje inwestora: „Firma”. Tylko tyle. Kierownik budowy na pytania odpowiada, że „to się wszystko wyjaśni”. Nie mówi kiedy.', { spot: 'budowa', quote: ['Kierownik budowy', 'Budujemy przyszłość. Na razie powoli.'] }),
    T('INWESTYCJE', 'Dźwig przyjechał! I odjechał', 'W środę na plac wjechał dźwig. Po godzinie odjechał. Kierowca tłumaczył, że pomylił adresy. Kierownik budowy tłumaczył, że to próba generalna.', { spot: 'budowa' }),
    T('INWESTYCJE', 'Budowa ruszyła. Na trzy godziny', 'Robotnicy pracowali od siódmej do dziesiątej. Potem przyszedł deszcz, a po deszczu przerwa śniadaniowa. Mieszkańcy mówią, że to i tak rekord.', { spot: 'budowa', face: 'budowa', end: true })] },
  hela: { region: 'peryferia', key: true, stages: [
    T('LUDZIE', 'Papierniczy Heli ma jubileusz', 'Pani Hela od trzydziestu lat sprzedaje zeszyty, długopisy i znaczki. Z okazji jubileuszu każdy klient dostaje cukierka. Jednego, bo czasy trudne.', { face: 'key:shopper', quote: ['Pani Hela', 'Ja tu widziałam wszystko. Zapisane mam w zeszycie.'] }),
    T('LUDZIE', 'Hela zbiera podpisy', 'W papierniczym leży lista przeciw budowie supermarketu przy głównej. Podpisało się już pół osiedla i jeden pies, odciskiem łapy.', { face: 'key:shopper' }),
    T('LUDZIE', 'Supermarketu nie będzie?', 'Rada osiedla odłożyła decyzję o supermarkecie. Pani Hela triumfuje, ale ostrożnie: zamówiła tylko jedną paczkę cukierków na świętowanie.', { face: 'key:shopper', end: true })] },
  przyczepa: { region: 'peryferia', stages: [
    T('Z OSIEDLA', 'Czyja jest przyczepa?', 'Od miesiąca przy drodze stoi przyczepa i nikt się do niej nie przyznaje. Sąsiedzi zaczęli w niej trzymać rowery, a ktoś powiesił firanki.', { spot: 'przyczepa' }),
    T('Z OSIEDLA', 'Pan z przyczepy przemówił', 'W przyczepie mieszka starszy pan, który mówi, że „przyjechał na chwilę” w zeszłym roku. Sprzedaje informacje. Jakie, nie chciał powiedzieć. Za darmo.', { spot: 'przyczepa', face: 'przyczepa', quote: ['Pan z przyczepy', 'Wiem, kto, gdzie i za ile. Ale nie dziś.'] }),
    T('Z OSIEDLA', 'Przyczepa zostaje', 'Rada osiedla wydała zgodę na przyczepę „do odwołania”. Pan z przyczepy dziękuje i zapowiada, że wkrótce otworzy biuro informacji. Godziny otwarcia: kiedy chce.', { spot: 'przyczepa', end: true })] },
  gesi: { region: 'wies', stages: [
    T('Z GMINY', 'Gęsi blokują drogę', 'Stado gęsi od świtu spaceruje po drodze przez wieś. Kierowcy trąbią, gęsi syczą. Na razie wygrywają gęsi.', { spot: 'działki', quote: ['Sołtys', 'To nie moje gęsi. Moje są ładniejsze.'] }),
    T('Z GMINY', 'Sołtys: to nie moje gęsi', 'Sołtys stanowczo odcina się od stada. Gospodynie twierdzą jednak, że gęsi codziennie wieczorem wracają na jego podwórko. Z własnej woli.', { spot: 'działki' }),
    T('Z GMINY', 'Gęsi kontra traktor', 'Doszło do starcia na rozstajach: traktor zatrzymał się przed stadem i stał dwadzieścia minut. Traktorzysta mówi, że gęś spojrzała na niego „z wyższością”.', { spot: 'przystanek' }),
    T('Z GMINY', 'Gęsi na dożynkach', 'Sporne stado wystąpi w korowodzie dożynkowym. Sołtys zapowiada, że będzie je prowadził osobiście. Choć to podobno nie jego gęsi.', { end: true })] },
  dynia: { region: 'wies', stages: [
    T('Z GMINY', 'Rośnie rekordowa dynia', 'Na polu za kapliczką rośnie dynia, która według właściciela może pobić rekord powiatu. Waży już tyle co cielak i dalej przybiera.', { spot: 'kapliczka' }),
    T('Z GMINY', 'Ktoś podbiera dynię nocą', 'Właściciel rekordowej dyni twierdzi, że ktoś w nocy odkroił kawałek. Podejrzane są dziki, sąsiad i, według niektórych, gęsi.', { spot: 'kapliczka' }),
    T('Z GMINY', 'Dynia jedzie na wystawę', 'Rekordowa dynia pojechała na wystawę do miasteczka na przyczepie traktora. Mimo braku kawałka zajęła drugie miejsce. Pierwsze zajęła cukinia.', { end: true })] } };

// the cyclist in the red cap: the police's thread, grown out of what you do
const HEAT = [
  { at: 3, s: T('KRONIKA POLICYJNA', 'Wandal na rowerze', 'Mieszkańcy skarżą się na rowerzystę, który niszczy, co popadnie: szyby, skrzynki, nerwy. Rysopis: młody, szybki, w czerwonej czapce.', { quote: ['Dyżurny', 'Czerwona czapka to nie niewidka. Znajdziemy.'] }) },
  { at: 7, s: T('KRONIKA POLICYJNA', 'Policja szuka rowerzysty w czerwonej czapce', 'Dzielnicowy potwierdza: zgłoszeń jest coraz więcej. Patrole mają się pojawiać częściej, zwłaszcza rano, gdy na ulicach są głównie gazeciarze i psy.', { quote: ['Dyżurny', 'Kto widział, niech dzwoni. Kto to robi, niech przestanie.'] }) },
  { at: 12, s: T('KRONIKA POLICYJNA', 'Nagroda za wskazanie sprawcy', 'Rada osiedla wyznaczyła nagrodę za pomoc w ujęciu rowerzysty w czerwonej czapce. Kilku mieszkańców przyznało, że też mają czerwone czapki. Teraz ich nie noszą.', { quote: ['Babcia Stasia', 'Ja go poznam. Po oczach poznam.'] }) },
  { at: 18, s: T('KRONIKA POLICYJNA', 'Wandal wciąż na wolności', 'Mimo nagrody i patroli rowerzysta w czerwonej czapce nadal grasuje. Mieszkańcy montują kraty w oknach, a skrzynki pocztowe przykręcają do płotów na cztery śruby.', {}) }];
const CALM = T('KRONIKA POLICYJNA', 'Wandal przycichł?', 'Od kilku poranków spokój: żadnej szyby, żadnej skrzynki. Dzielnicowy ostrożnie mówi o sukcesie patroli. Mieszkańcy mówią, że wandal może po prostu dostał szlaban.', {});

// the misdeeds a run counts for (by kind of what was logged)
export const MISDEED = { window: 1, kick_mailbox: 1, kick_ped: 2, kick_bike: 1, kick_granny: 3, kick_police: 3, kick_car: 1, chase: 2 };

export function advance(st0, { region, misdeeds = 0, clean = false, rnd = Math.random }) {
  const st = { active: [], done: [], heat: 0, heatStage: -1, calm: 0, ...(st0 || {}) }, stories = [];
  // the police's: the heat up by what you did, down a little each quiet morning; a story when it goes a step up, or quiet again
  const h0 = st.heat; st.heat = Math.max(0, st.heat + misdeeds - (clean ? 1 : 0)); const lvl = HEAT.reduce((k, H, j) => st.heat >= H.at ? j : k, -1);
  if (lvl > st.heatStage) { stories.push({ id: 'sprawca', ...HEAT[lvl].s, fresh: true, lead: true }); st.heatStage = lvl; st.calm = 0; }
  else if (st.heatStage >= 0 && st.heat < HEAT[0].at && h0 >= HEAT[0].at) { stories.push({ id: 'sprawca', ...CALM, fresh: true }); st.heatStage = -1; }
  // the town's: those of this region running; one or two of them a step on; a new one when there is room
  const ofHere = id => THREADS[id].key || THREADS[id].region === region, here = Object.keys(THREADS).filter(ofHere);
  st.active = st.active.filter(a => THREADS[a.id]);
  const mine = st.active.filter(a => ofHere(a.id));
  for (const a of mine.sort(() => rnd() - .5).slice(0, 2)) { if (rnd() < .75) { a.stage++; const S = THREADS[a.id].stages[a.stage]; if (!S) continue; stories.push({ id: a.id, ...S, fresh: true }); if (S.end) { st.done.push(a.id); a.ended = true; } } }
  st.active = st.active.filter(a => !a.ended);
  const free = here.filter(id => !st.done.includes(id) && !st.active.some(a => a.id === id));
  while (st.active.filter(a => ofHere(a.id)).length < 3 && free.length) { const id = free.splice(rnd() * free.length | 0, 1)[0]; st.active.push({ id, stage: 0 }); stories.push({ id, ...THREADS[id].stages[0], fresh: true }); }
  // all of this region's done: they start over another day (a town keeps its stories going)
  if (!free.length && !st.active.some(a => ofHere(a.id))) st.done = st.done.filter(id => !ofHere(id));
  return { state: st, stories };
}
