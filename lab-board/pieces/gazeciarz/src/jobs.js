// The town's people (personas) and the jobs they give (docs/zlecenia.md). A persona: a name, who they are, a phone number, a face (a
// resident's portrait from the studio, or a picture), how they talk on the phone. A job: taken on the phone (from the paper's ads, or a
// call before a stretch), kept in the notebook (2 places at the start; Hela sells more), done on the way, its end in the next paper.
// Each job when a stretch starts is bound to that stretch's way (its target on it); in the run it watches what happens.
//   PERSONAS, JOBS; offers(save, rnd) → the ads of this issue; bind(job, ctx) → its targets; step(job, ctx, ev) → 'done' | 'fail' | null

const pickOf = (a, r = Math.random) => a[r() * a.length | 0];

export const PERSONAS = {
  janusz: { name: 'Pan Janusz', role: 'warsztat przy głównej', tel: '23-45', face: 'janusz' },
  babcia: { name: 'Babcia Stasia', role: 'spod kapliczki', tel: '17-07', face: 'kapliczka',
    hello: ['Halo? Kto mówi? A, to ty, złotko. Dobrze, że dzwonisz, bo ja do ciebie nie umiem.', 'Słucham, słucham. Tylko mów wolno, bo mi aparat w uchu piszczy.'] },
  redaktor: { name: 'Pan Redaktor', role: 'naczelny Wieści zza płotu', tel: '11-00', face: 'key:oldman',
    hello: ['Redakcja, słucham. Szybko, mam numer do zamknięcia.', 'O, nasz gazeciarz. Czytelnicy cię lubią. Ja też, kiedy dowozisz na czas.'] },
  beczka: { name: 'Szef spod beczki', role: 'ekipa od ogniska', tel: '66-6', face: 'budowa',
    hello: ['No? Kto tam? A, młody od gazet. Mam robotę. Nie pytaj o szczegóły.', 'Gadaj krótko, bo bateria siada. Bateria w tym telefonie, nie w nas.'] },
  zaneta: { name: 'Pani Żaneta', role: 'ma znajomości na mieście', tel: '44-77', face: 'img:zaneta',
    hello: ['No słucham. Tylko szybko, bo mi kawa stygnie.', 'Czego, kochaniutki? Ja tu interesy prowadzę, a nie poczekalnię.', 'Halo. Jak w sprawie długu, to mnie nie ma. A jak w interesach, to jestem.', 'Mówi Żaneta. Słucham, ale nie obiecuję, że usłyszę.',
      'No i co się tak gapisz w tę słuchawkę? Gadaj, czego trzeba.', 'Ten od rowerów jeszcze żyje? Nieważne. Nie mów mu, że pytałam. Czego chcesz?'] },
  brat: { name: 'Brat', role: 'spod kosza', tel: 'domowy', face: 'brat' },
  soltys: { name: 'Pan Sołtys', role: 'tablica przy przystanku PKS', tel: '3-12', face: 'key:belly', region: 'wies',
    hello: ['Sołtys, słucham. Tylko szybko, bo zebranie wiejskie o dziesiątej, a ja jeszcze nie wiem, o czym.', 'Halo? A, to ten od gazet z miasta. Dobrze, że jesteś. Gmina ma sprawę.', 'Słucham. Jak w sprawie gęsi, to nie moje. Jak w sprawie gminy, to moje.'] },
  gospodyni: { name: 'Pani Beata', role: 'gospodarstwo pod lasem', tel: '5-40', face: 'key:lady', region: 'wies',
    hello: ['Halo, halo! Beata przy telefonie. Kury znowu się niosą jak szalone, nie mam gdzie jajek dawać.', 'Słucham, synku. Mów głośniej, bo krowa mi ryczy nad uchem.'] },
  traktorzysta: { name: 'Bogdan „Turbo”', role: 'pole za przejazdem', tel: '7-77', face: 'key:gardener', region: 'wies',
    hello: ['Turbo. Znaczy Bogdan, ale Turbo, odkąd na tym traktorze wyprzedziłem karetkę. Na sygnale. Słyszę, że jakiś miastowy na rowerze szybki. No, to zobaczymy.', 'Halo, ja z traktora dzwonię, więc krzyczę. CZEGO?!'] },
  hela: { name: 'Pani Hela', role: 'papierniczy na rogu', tel: '20-20', face: 'key:shopper',
    hello: ['Papierniczy, Hela przy telefonie. Zeszyty, długopisy, znaczki. I plotki, ale te za darmo.', 'Słucham, kochanieńki. Notesik się skończył? Mam takie, że się ich nie da zapisać do końca.'] } };

// Janusz on the earpiece, while you ride: the turbo when you sprint (his pep gives you speed), a car behind, a fall, a checkpoint, the
// finish near, and his talk now and then (the woman from his past, never named)
// Janusz calls you and thinks you called him: little scenes, his line, yours, his (then the click)
export const MIXUP = [
  ['Halo? No słucham, młody, po co dzwonisz?', 'Ale to pan dzwoni, panie Januszu.', 'Co ty gadasz? Ale ty głupi, młody. Nie zajmuj linii. *klik*'],
  ['Tak? Kto mówi? Czego chcesz o tej porze?', 'To pan do mnie zadzwonił...', 'Ja? Ja nie dzwonię do ludzi, ludzie dzwonią do mnie. Głupi jesteś, młody. *klik*'],
  ['No co tam, młody? Coś się stało, że dzwonisz?', 'Nic, to pan zadzwonił.', 'Aha. No to dobrze, że nic. Ale nie dzwoń bez powodu, bo mi klej zasycha. *klik*'],
  ['Halo, warsztat! Mów szybko, bo mam klienta.', 'Panie Januszu, to ja, jadę. Pan dzwonił.', 'Młody, ja nie mam czasu na twoje telefony! Szprycha, kto mu dał mój numer? *klik*'],
  ['Halo? Halo! Słyszysz mnie? Bo ja ciebie nie.', 'Słyszę. Pan dzwoni?', 'Nie słyszę, młody, nie słyszę! Zadzwoń później! *klik*'] ];
// Janusz rings by mistake: he talks on (to someone else, about nothing), then sees who he got, and is gone
export const POCKET = [
  ['Krysiu, słuchaj, ten schab to musi być z kością, bo bez kości to nie schab, tylko kotlet...', '...i powiedz szwagrowi, że pompkę mi odda, bo ja wiem, że to on ją ma...'],
  ['No więc mówię mu, panie, ja mam w nogach tyle kilometrów, że do Paryża i z powrotem. Dwa razy. Pod wiatr.', 'A on mi na to, że to niemożliwe. To ja mu na to, że możliwe, bo byłem. W Paryżu. Prawie.'],
  ['...dwa kilo ziemniaków, cebula, masło, i te, no, takie żółte...', '...nie banany, Szprycha, banany są żółte, ale ja mówię o tych drugich żółtych...'],
  ['Panie doktorze, kolano mnie boli tylko jak chodzę, jak jadę rowerem, to nie boli, więc ja będę tylko jeździł.', 'Do sklepu rowerem, do łóżka rowerem, do kościoła... no, do kościoła piechotą, ale szybko.'] ];
// how such a call ends: seldom the same way twice
export const POCKET_END = ['Halo? Czekaj... o kurwa, do młodego mi się wykręciło. *klik*', '*klik*', '...Szprycha, a czemu ten telefon świeci? *szum* *klik*', 'O, młody? Ty to słyszałeś? To zapomnij. Nie znamy się. *klik*',
  '*bateria pada w pół słowa*', 'Halo? Kto tam? A, nieważne. *klik*', '...i to by było na tyle. Beata? Beata?! *długi sygnał*'];
export const RADIO = {
  turbo: ['Dawaj, młody! Teraz albo nigdy! Pedał w podłogę!', 'Jak ja w osiemdziesiątym trzecim na wyścigu dookoła Polski pod Maciejowicami! Kręć!', 'Ty to młody głupi jednak. Ale szybki głupi! Jedź!', 'Wyobraź sobie, że goni cię komornik! Szybciej!', 'Turbo, młody, turbo! Jak w kolarzówce z dopalaczem!', 'Nie myśl, kręć! Myślenie spowalnia, mówię z doświadczenia!'],
  behind: ['Uważaj, młody, za tobą!', 'Auto na ogonie! Nie oglądaj się, tylko zjedź!', 'Coś ci siedzi na plecach, młody. I to nie ja.'],
  fall: ['Wstawaj! Ja w osiemdziesiątym z obojczykiem jechałem jeszcze dwa etapy!', 'Asfalt nie gryzie. Gryzie trochę. Wstawaj!', 'Spokojnie, rower cały? To dobrze. Ty się zagoisz.'],
  check: ['Dobrze idzie! Jeszcze kawałek i będziesz jak ja. Prawie.', 'Punkt zaliczony. Wiesz, ile ja punktów zaliczyłem? Nikt nie liczył, ale dużo.', 'Ładnie, młody. Szprycha, widzisz? Mówiłem, że ma talent.'],
  finish: ['Ostatnia prosta! Tu się wygrywa wyścigi i traci zęby!', 'Meta blisko! Ręce na kierownicy, uśmiech do zdjęcia!', 'Jeszcze chwila! Tak finiszowałem pod Maciejowicami. Bez zęba, ale finiszowałem!'],
  idle: ['Wiesz, młody, kiedyś pewna pani w czerwonej chustce powiedziała, że jestem za szybki. Do dziś nie wiem, o rower jej chodziło czy o co.', 'Słyszysz to? To Szprycha. Śpiewa. Przy klientach mu nie pozwalam.', 'Jak ktoś ci powie kochaniutki takim głosem jak kawa bez cukru, to uciekaj. Albo nie uciekaj. Ja nie uciekłem.',
    'Pamiętaj: nie ma złej pogody, są tylko słabe opony.', 'Kiedyś to były rowery. Stal. I kobiety, co sprowadzały części zza granicy. Nieważne. Jedź.', 'Gdybym miał twoje nogi i moją głowę, to byłbym... no, mną, ale młodszym.', 'Halo? Słyszysz mnie? Bo ja siebie słabo. Szprycha, zabierz tę szlifierkę!'] };

// the calls on the earpiece while you ride: someone needs something now. T takes it; then a clock. kind: what it asks (main.js does it)
export const LIVE = [
  { kind: 'door', who: 'babcia', t: 50, pay: 12, say: 'Kochanie, sąsiadka spod tego domu ze znaczkiem zapomniała gazety. Podjedź i zatrzymaj się przy drzwiach, zanim wyjdzie do kościoła!' },
  { kind: 'dog', who: 'redaktor', t: 60, pay: 15, say: 'Mamy dziurę na drugiej stronie! Pstryknij mi psa, jakiegokolwiek. Masz minutę. Aparat pod Q!' },
  { kind: 'bike', who: 'beczka', t: 45, pay: 18, say: 'Młody, jedzie tam taki jeden w kolarskich gaciach, co nam wisi kasę. Zrzuć go z roweru. Szybko!' },
  { kind: 'parcel', who: 'zaneta', t: 70, pay: 22, say: 'Kochaniutki, na drodze przed tobą leży paczuszka. Podnieś, dowieź pod drzwi ze znaczkiem. I nie otwieraj, bo się obrażę.' },
  { kind: 'rush', who: 'redaktor', t: 40, pay: 15, say: 'Zamykamy numer! Masz czterdzieści sekund do najbliższego punktu kontrolnego, inaczej druk bez ciebie!' },
  { kind: 'trick', who: 'brat', t: 60, pay: 8, say: 'Ej, to ja! Mam kamerę od kolegi. Zrób jakiś trik na skoczni, nagram cię! Nie śmiej się, minutę mam baterii.' }];
export const LIVE_OK = ['Dobra robota. Kasa poszła.', 'O, umiesz. Zapłacone.', 'No proszę. Należy się.'], LIVE_LATE = ['Za późno. Nieważne.', 'Nie zdążyłeś. Trudno, następnym razem.', 'No i po sprawie. Bez ciebie.'];

// the jobs. kind: what it asks; giver; pay; text for the ad and the call; bind (its target on the way), step (watch the run)
export const JOBS = {
  szarlotka: { giver: 'babcia', pay: 25, title: 'SZARLOTKA DLA WNUCZKA', ad: 'Pilnie: kto zawiezie szarlotkę wnuczkowi? Delikatnie, bo się rozpadnie.',
    pitch: 'Upiekłam szarlotkę dla wnuczka, ale nogi już nie te. Zawieziesz? Tylko delikatnie, kochanie. Jedna wywrotka i będzie kruszonka.',
    hint: 'zatrzymaj się przy domu z gwiazdką; wywrotka niszczy ciasto', fail: 'Szarlotka nie przeżyła wywrotki.', done: 'Wnuczek dostał szarlotkę. Babcia przesyła buziaki.' },
  foto: { giver: 'redaktor', pay: 30, title: 'ZDJĘCIE DO GAZETY', ad: 'Redakcja kupi zdjęcie z porannej trasy. Płacimy od ręki.',
    pitch: 'Potrzebuję zdjęcia do jutrzejszego numeru: {what}. Masz aparat, masz rower. Pstryknij z bliska i przywieź.',
    hint: 'klawisz aparatu blisko celu', fail: 'Zdjęcia nie było.', done: 'Zdjęcie poszło na pierwszą stronę.' },
  skrzynki: { giver: 'beczka', pay: 35, title: 'ROBOTA DLA EKIPY', ad: 'Szukamy kogoś do „poprawek” na osiedlu. Dyskrecja. Płacimy gotówką.',
    pitch: 'Kurier Osiedlowy ma za dużo skrzynek na naszej ulicy. Skop trzy. Tylko żeby nikt nie widział. Jak policja zapyta, to nas nie znasz.',
    hint: 'kopnij trzy skrzynki pocztowe', fail: 'Skrzynki zostały całe.', done: 'Trzy skrzynki mniej. Ekipa zadowolona, dzielnicowy mniej.' },
  sluchawka: { giver: 'zaneta', pay: 0, cost: 80, item: 'sluchawka', title: 'SŁUCHAWECZKA Z ZACHODU', ad: 'Sprowadzam rzeczy z zagranicy. Niekradzione. Dyskrecja. Pytać o Żanetę.',
    pitch: 'Mam taką słuchaweczkę. Nie kradziona, tylko przeniesiona. Wkładasz do ucha i masz kogoś na linii, jak jedziesz. Osiemdziesiąt złotych i nie pytaj, skąd.', shop: true,
    done: 'Słuchawka w uchu. Kto zadzwoni, ten zadzwoni.' },
  licznik_ruski: { giver: 'zaneta', pay: 0, cost: 35, item: 'licznik', skin: 'ruski', title: 'LICZNIK ZE WSCHODU', ad: 'Licznik pancerny, prosto zza Buga. Czołg po nim przejechał i dalej liczy.',
    pitch: 'Licznik ze Wschodu. Czerwony jak sztandar. Czołg po nim przejechał i dalej liczy. Trzydzieści pięć, kochaniutki.', shop: true, done: 'Nowy licznik na kierownicy.' },
  licznik_zachodni: { giver: 'zaneta', pay: 0, cost: 55, item: 'licznik', skin: 'zachodni', title: 'LICZNIK Z ZACHODU', ad: 'Licznik podświetlany na niebiesko. Jak w taksówce u szwagra.',
    pitch: 'Z Zachodu. Świeci na niebiesko, jak w taksówce u szwagra. Pięćdziesiąt pięć. Taniej nie będzie, bo cło.', shop: true, done: 'Nowy licznik na kierownicy.' },
  // the village's (taken anywhere, done on a village route; till then they wait in the notebook)
  ogloszenia: { giver: 'soltys', pay: 30, region: 'wies', title: 'OGŁOSZENIA GMINY', ad: 'Gmina szuka kogoś, kto roześle ogłoszenia po skrzynkach. Płaci sołtys, od ręki.',
    pitch: 'Mam ogłoszenie o zebraniu wiejskim. Wsadź je razem z gazetą do czterech skrzynek we wsi. Tylko do skrzynek, nie na wycieraczki, bo krowy zjedzą.',
    hint: 'na wsi: cztery gazety do skrzynek pocztowych', fail: 'Ogłoszenia nie dotarły.', done: 'Ogłoszenia w skrzynkach. Na zebranie przyszło aż sześć osób, rekord.' },
  jajka: { giver: 'gospodyni', pay: 30, region: 'wies', title: 'JAJKA DLA SĄSIADKI', ad: 'Jajka świeże, od szczęśliwych kur. Kto dowiezie sąsiadce? Ostrożnie!',
    pitch: 'Zawieziesz sąsiadce dwie mendle jajek? Tylko ostrożnie, synku. Wywrotka albo skok z tych waszych skoczni i będzie jajecznica w torbie.',
    hint: 'na wsi: dowieź do domu z gwiazdką; wywrotka albo długi skok tłucze jajka', fail: 'Jajka zrobiły się jajecznicą.', done: 'Jajka całe. Sąsiadka zrobiła z nich ciasto i podzieliła się z gospodynią.' },
  wyscig: { giver: 'traktorzysta', pay: 40, region: 'wies', title: 'WYŚCIG Z TRAKTORZYSTĄ', ad: 'Bogdan „Turbo” z traktora mówi, że żaden rower go nie przegoni. Zakład stoi.',
    pitch: 'Ja do młyna jadę codziennie i jeszcze nikt mnie nie przegonił. Przejedź trasę przez wieś szybciej niż ja, to postawię. Nie dasz rady, to stawiasz ty.',
    hint: 'na wsi: dojedź do mety w czasie lepszym niż traktorzysta', fail: 'Traktorzysta był pierwszy przy młynie i śmiał się do obiadu.', done: 'Wygrany zakład. Turbo płaci i mówi, że jutro rewanż.' },
  notes: { giver: 'hela', pay: 0, cost: 60, title: 'WIĘKSZY NOTES', ad: 'Notesy z twardą okładką. Więcej miejsca na sprawy do załatwienia.',
    pitch: 'Mam notes, w którym zmieścisz jedną sprawę więcej. Sześćdziesiąt złotych, ale okładka twarda jak życie.', shop: true } };
const FOTO = [{ k: 'dog', what: 'pies, który goni rowery', aim: 'psa' }, { k: 'kapliczka', what: 'odnowiona kapliczka', aim: 'kapliczkę' }, { k: 'budowa', what: 'budowa na rogu, co stoi', aim: 'budowę' }, { k: 'przystanek', what: 'przystanek, na którym nikt się nie doczekał autobusu', aim: 'przystanek' }];

// the ads of an issue: the jobs not in the notebook, one of each, Hela's notebook while there is room to grow
export function offers(S) { const have = new Set((S.jobs || []).map(j => j.kind)), own = S.owned || {}, out = [];
  for (const k of ['szarlotka', 'foto', 'skrzynki']) if (!have.has(k)) out.push(k);
  if (S.done && (S.done.p4 || Object.keys(S.done).some(id => id[0] === 'w'))) for (const k of ['ogloszenia', 'jajka', 'wyscig']) if (!have.has(k)) out.push(k);   // (the village's, once it is open)
  if (!own.sluchawka) out.push('sluchawka'); else for (const k of ['licznik_ruski', 'licznik_zachodni']) if (own.licznik !== JOBS[k].skin) { out.push(k); break; }
  if ((S.slots || 2) < 4) out.push('notes'); return out; }
// a job as taken: its own details (what to photograph)
export function take(kind) { const j = { kind, id: kind + ':' + Date.now().toString(36), runs: 0 }; if (kind === 'foto') { const f = pickOf(FOTO); j.what = f.what; j.k = f.k; j.aim = f.aim; } return j; }
export const pitchOf = j => JOBS[j.kind].pitch.replace('{what}', j.what || '');
export const lineOf = j => JOBS[j.kind].title + (j.kind === 'foto' ? ': ' + j.what.split(',')[0].toUpperCase() : '');
