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
  hela: { name: 'Pani Hela', role: 'papierniczy na rogu', tel: '20-20', face: 'key:shopper',
    hello: ['Papierniczy, Hela przy telefonie. Zeszyty, długopisy, znaczki. I plotki, ale te za darmo.', 'Słucham, kochanieńki. Notesik się skończył? Mam takie, że się ich nie da zapisać do końca.'] } };

// Janusz on the earpiece, while you ride: the turbo when you sprint (his pep gives you speed), a car behind, a fall, a checkpoint, the
// finish near, and his talk now and then (the woman from his past, never named)
export const RADIO = {
  turbo: ['Dawaj, młody! Teraz albo nigdy! Pedał w podłogę!', 'Jak ja w osiemdziesiątym trzecim na wyścigu dookoła Polski pod Maciejowicami! Kręć!', 'Ty to młody głupi jednak. Ale szybki głupi! Jedź!', 'Wyobraź sobie, że goni cię Mietek z rachunkiem! Szybciej!', 'Turbo, młody, turbo! Jak w kolarzówce z dopalaczem!', 'Nie myśl, kręć! Myślenie spowalnia, mówię z doświadczenia!'],
  behind: ['Uważaj, młody, za tobą!', 'Auto na ogonie! Nie oglądaj się, tylko zjedź!', 'Coś ci siedzi na plecach, młody. I to nie ja.'],
  fall: ['Wstawaj! Ja w osiemdziesiątym z obojczykiem jechałem jeszcze dwa etapy!', 'Asfalt nie gryzie. Gryzie trochę. Wstawaj!', 'Spokojnie, rower cały? To dobrze. Ty się zagoisz.'],
  check: ['Dobrze idzie! Jeszcze kawałek i będziesz jak ja. Prawie.', 'Punkt zaliczony. Wiesz, ile ja punktów zaliczyłem? Nikt nie liczył, ale dużo.', 'Ładnie, młody. Mietek, widzisz? Mówiłem, że ma talent.'],
  finish: ['Ostatnia prosta! Tu się wygrywa wyścigi i traci zęby!', 'Meta blisko! Ręce na kierownicy, uśmiech do zdjęcia!', 'Jeszcze chwila! Tak finiszowałem pod Maciejowicami. Bez zęba, ale finiszowałem!'],
  idle: ['Wiesz, młody, kiedyś pewna pani w czerwonej chustce powiedziała, że jestem za szybki. Do dziś nie wiem, o rower jej chodziło czy o co.', 'Słyszysz to? To Mietek. Znowu je moje pączki.', 'Jak ktoś ci powie kochaniutki takim głosem jak kawa bez cukru, to uciekaj. Albo nie uciekaj. Ja nie uciekłem.',
    'Pamiętaj: nie ma złej pogody, są tylko słabe opony.', 'Kiedyś to były rowery. Stal. I kobiety, co sprowadzały części zza granicy. Nieważne. Jedź.', 'Gdybym miał twoje nogi i moją głowę, to byłbym... no, mną, ale młodszym.', 'Halo? Słyszysz mnie? Bo ja siebie słabo. Mietek, zabierz tę szlifierkę!'] };

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
  notes: { giver: 'hela', pay: 0, cost: 60, title: 'WIĘKSZY NOTES', ad: 'Notesy z twardą okładką. Więcej miejsca na sprawy do załatwienia.',
    pitch: 'Mam notes, w którym zmieścisz jedną sprawę więcej. Sześćdziesiąt złotych, ale okładka twarda jak życie.', shop: true } };
const FOTO = [{ k: 'dog', what: 'pies, który goni rowery', aim: 'psa' }, { k: 'kapliczka', what: 'odnowiona kapliczka', aim: 'kapliczkę' }, { k: 'budowa', what: 'budowa na rogu, co stoi', aim: 'budowę' }, { k: 'przystanek', what: 'przystanek, na którym nikt się nie doczekał autobusu', aim: 'przystanek' }];

// the ads of an issue: the jobs not in the notebook, one of each, Hela's notebook while there is room to grow
export function offers(S) { const have = new Set((S.jobs || []).map(j => j.kind)), own = S.owned || {}, out = [];
  for (const k of ['szarlotka', 'foto', 'skrzynki']) if (!have.has(k)) out.push(k);
  if (!own.sluchawka) out.push('sluchawka'); else for (const k of ['licznik_ruski', 'licznik_zachodni']) if (own.licznik !== JOBS[k].skin) { out.push(k); break; }
  if ((S.slots || 2) < 4) out.push('notes'); return out; }
// a job as taken: its own details (what to photograph)
export function take(kind) { const j = { kind, id: kind + ':' + Date.now().toString(36), runs: 0 }; if (kind === 'foto') { const f = pickOf(FOTO); j.what = f.what; j.k = f.k; j.aim = f.aim; } return j; }
export const pitchOf = j => JOBS[j.kind].pitch.replace('{what}', j.what || '');
export const lineOf = j => JOBS[j.kind].title + (j.kind === 'foto' ? ': ' + j.what.split(',')[0].toUpperCase() : '');
