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
  hela: { name: 'Pani Hela', role: 'papierniczy na rogu', tel: '20-20', face: 'key:shopper',
    hello: ['Papierniczy, Hela przy telefonie. Zeszyty, długopisy, znaczki. I plotki, ale te za darmo.', 'Słucham, kochanieńki. Notesik się skończył? Mam takie, że się ich nie da zapisać do końca.'] } };

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
  notes: { giver: 'hela', pay: 0, cost: 60, title: 'WIĘKSZY NOTES', ad: 'Notesy z twardą okładką. Więcej miejsca na sprawy do załatwienia.',
    pitch: 'Mam notes, w którym zmieścisz jedną sprawę więcej. Sześćdziesiąt złotych, ale okładka twarda jak życie.', shop: true } };
const FOTO = [{ k: 'dog', what: 'pies, który goni rowery', aim: 'psa' }, { k: 'kapliczka', what: 'odnowiona kapliczka', aim: 'kapliczkę' }, { k: 'budowa', what: 'budowa na rogu, co stoi', aim: 'budowę' }, { k: 'przystanek', what: 'przystanek, na którym nikt się nie doczekał autobusu', aim: 'przystanek' }];

// the ads of an issue: the jobs not in the notebook, one of each, Hela's notebook while there is room to grow
export function offers(S) { const have = new Set((S.jobs || []).map(j => j.kind)), out = [];
  for (const k of ['szarlotka', 'foto', 'skrzynki']) if (!have.has(k)) out.push(k); if ((S.slots || 2) < 4) out.push('notes'); return out; }
// a job as taken: its own details (what to photograph)
export function take(kind) { const j = { kind, id: kind + ':' + Date.now().toString(36), runs: 0 }; if (kind === 'foto') { const f = pickOf(FOTO); j.what = f.what; j.k = f.k; j.aim = f.aim; } return j; }
export const pitchOf = j => JOBS[j.kind].pitch.replace('{what}', j.what || '');
export const lineOf = j => JOBS[j.kind].title + (j.kind === 'foto' ? ': ' + j.what.split(',')[0].toUpperCase() : '');
