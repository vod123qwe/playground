# Klasyk: druga wersja gry, jedna ulica (koncept, 02.10.2026)

Decyzje Jarka (02.10.2026):
- Klasyk to osobna wersja, wybierana przełącznikiem na ekranie startowym. Poranna Trasa zostaje, jak jest.
- Na razie jedna mapa, nowa, tylko dla Klasyka. Dopracowujemy ją, zanim pojawi się druga.
- Fabuła zostaje w miarę ta sama: Trąbka, Janusz (w słuchawce domyślnie cicho), Megafon w tle.
- Psoty u nieabonentów są za punkty. Szkoda u abonenta: rezygnuje.
- Mało gazet i paczki na drodze.
- Sterowanie: gaz, hamulec, skręt, jeden rzut.
- Bez tygodnia i bez trwałych abonentów na razie (to później, jeśli test wypadnie dobrze).

Źródło pomysłu: `benchmark-grywalnosc.md`. Hipoteza testu: rzut cieszy bardziej, kiedy cel widać z wyprzedzeniem, rzuca się zawsze w jedną stronę, a tempo jest w rękach gracza.

## Ulica

Mapa „Ulica Kasztanowa”: długa pętla z łagodnymi zakrętami. **Domy stoją tylko po lewej stronie** (patrząc w kierunku jazdy), a wśród nich dom gazeciarza, zwykły dom w szeregu przy drodze z tabliczką DOM (nie jest abonentem). Start na samej ulicy pod bramą START, jak na automacie, bez uliczki z rondem z Porannej Trasy (v161). Jarek: „nie przywiązujmy się do konceptu poprzedniej wersji, szukajmy nowych rozwiązań”. Po prawej jest **strona przeszkód**: chodnik, pas zieleni, ławki, parking, przystanek, plac zabaw, wykop. Na jezdni dzieje się wszystko i wszędzie.

Rytm ulicy, odcinki po ~150 m, każdy z innym charakterem (do zbudowania etapami):

| Odcinek | Domy (lewa) | Strona przeszkód (prawa) | Na jezdni |
|---|---|---|---|
| 1. Rozgrzewka | trzy łatwe domy blisko drogi, duże skrzynki | trawnik, ławka z emerytem | nic, tylko jazda |
| 2. Sklep i parking | domy z ogródkami, krasnale | parking, auto cofa z miejsca | auta parkujące |
| 3. Plac zabaw | domy z basenikami i zraszaczami | plac zabaw, dzieci wybiegają po piłkę | piłka, rowerek z kółkami bocznymi |
| 4. Roboty | domy za płotem, psy | wykop z koparką, barierki | zwężenie, dziury |
| 5. Przy torach | ostatnie domy | przystanek, ludzie wchodzą na jezdnię | autobus, przejazd z pociągiem |
| Finał | tor treningowy (mamy już finałową prostą: slalom, rowy, tarcze) | | |

## Zasady

- **Abonenci** widoczni z daleka: dom abonenta ma kolorowe drzwi i czerwoną skrzynkę z flagą, a nieabonenta szarą (etap 2).
- **Punkty:** do skrzynki 3, na ganek 2, na trawnik 1. U nieabonentów psoty: szyba +2, krasnal +1, kosz +1, skrzynka +1. U abonenta szkoda (szyba): rezygnuje i już nie liczy się do trasy (to już działa).
- **Gazety:** 10 na start. Paczki z gazetami po stronie przeszkód co ~120 m: trzeba zjechać na prawo, czyli dalej od domów. To ryzyko, a nie prezent.
- **Tempo:** po ruszeniu rower toczy się sam (~4 m/s). Gaz przyspiesza do ~6,6 m/s, hamulec zwalnia do zera (v160: wolniej, decyzja Jarka). Sprint zostaje na proste.
- **Rzut:** jeden. Każdy klawisz rzutu i oba przyciski myszy rzucają zawsze w stronę domów. Kliknięcie: sam leci do celu w ramce. Przytrzymanie: siła, czyli odległość.
- **Kamera:** skośna, z drogą, ustawiona nad stroną przeszkód i patrząca po skosie na domy i drogę przed rowerzystą.
- **Upadki:** jak w Porannej Trasie od v155 (zachwianie przy średnich, upadek przy mocnych), ale bez wstawania pieszo: chwila leżenia i rowerzysta z rowerem wraca na pas, mrugając ~2,5 s bez przewracania (v157).
- **Kamera:** jedna, bez przełączania, zoomu i obrotu (v157).
- **Klawisze w Klasyku:** spacja skacze, V kopie, R od razu od nowa (v164).
- **Zasada Klasyka (Jarek, 02.10):** jazda na najlepszy czas i jak najwięcej akcji za punkty; nic nie może wymagać zatrzymania (złodziej: kop i +5, torebka wraca sama; bez zleceń z rozmową, v172).

## Przeszkody i zdarzenia (katalog z oceną)

★★★ robimy na pewno, ★★ dobre, ★ może później. Każda rzecz „do ogrania”: da się w nią rzucić, kopnąć, zagadać albo reaguje.

### Strona domów
| Co | Jak gra | Ocena |
|---|---|---|
| Auto wyjeżdża tyłem z podjazdu | zapalają się światła cofania (sygnał), auto wyjeżdża na jezdnię; gazeta w szybę kierowcy: hamuje i przeprasza | ★★★ |
| Zraszacz na trawniku | strumień przecina chodnik i krawędź jezdni: mokro, ślisko; gazeta w zraszacz: obraca się w drugą stronę | ★★★ |
| Kosiarka sąsiada | sąsiad kosi pasami wzdłuż płotu, kosiarka wyrzuca trawę na jezdnię (zielone smugi: poślizg) | ★★ |
| Pies z podwórka | już jest; w Klasyku tylko z tej strony | ★★★ (jest) |
| Krasnale, kosze, skrzynki nieabonentów | cele psot za punkty | ★★★ |
| Sąsiad myje auto | piana na podjeździe, wąż w poprzek chodnika | ★★ |
| Dzieci z pistoletem na wodę | ochlapują (chwilowo gorzej widać), gazetą da się je „trafić” | ★★ |
| Kot przebiega z podwórka | szybki, mały, uskok w bok | ★ |
| **Podwórka do przejechania** (pomysł Jarka) | czasem otwarta brama: wjazd na podwórko, a tam deska na skrzynce, rampa ze zjeżdżalni, niski płot do przeskoczenia na sąsiednie podwórko, podjazd jako zjazd z powrotem na ulicę; skrót z bonusem i gazetą prosto pod drzwi | ★★★ |

### Jezdnia
| Co | Jak gra | Ocena |
|---|---|---|
| Śmieciarka | staje co dwa domy, śmieciarze biegają z koszami w poprzek drogi; gazeta do śmieciarza: łapie | ★★★ |
| Auta, autobus | już są; autobus staje na przystanku i zasłania stronę przeszkód | ★★★ (jest) |
| Deskorolkarz pod prąd | jedzie środkiem, w ostatniej chwili skręca w jedną stronę | ★★ |
| Dziecko na rowerku z kółkami bocznymi | chwieje się, jedzie wolno, trzeba je wyprzedzić | ★★ |
| Opona, piłka, studzienki, dziury | już są | ★★★ (jest) |

### Strona przeszkód
| Co | Jak gra | Ocena |
|---|---|---|
| Paczki z gazetami | jedyne źródło gazet; stoją przy krawężniku i za ławkami | ★★★ |
| Plac zabaw | dzieci wybiegają po piłkę, mama woła; gazeta do mamy na ławce +1 | ★★★ |
| Ławki z emerytami | komentarze po swojemu; gazeta do rąk +1 | ★★★ |
| Spacer z psem na smyczy | smycz w poprzek ścieżki: trzeba objechać albo przeskoczyć | ★★ |
| Parking: auto cofa z miejsca | jak przy garażach w Bronksie | ★★ |
| Wykop z koparką | już są roboty; zwężenie drogi | ★★★ (jest) |
| Przystanek | ludzie wychodzą na jezdnię do autobusu | ★★ |

### Scenki (rzadkie, raz na przejazd)
| Co | Jak gra | Ocena |
|---|---|---|
| Przeprowadzka | wóz meblowy, kanapa na chodniku, tragarze z szafą w poprzek drogi | ★★★ |
| Ślub przed domem | auto z balonami, goście na jezdni, rzut gazetą w bukiet | ★★ |
| Awaria hydrantu | fontanna na skrzyżowaniu, mokro i ślisko | ★★ |
| Kurier Megafonu | jedzie przed tobą i podbiera skrzynki (rywal już jest) | ★★ |

## Co mierzymy w teście

Celność (trafione na rzucone), trafienia do skrzynki na wszystkie, upadki na minutę, gazety zebrane na zużyte i ocena Jarka 1–5: „czy rzucanie jest ciekawsze niż w Porannej Trasie”. Ta sama długość trasy w obu wersjach.

## Etapy

1. **v156, szkielet:** przełącznik wersji na starcie, mapa z domami po jednej stronie, kamera Klasyka, jeden rzut w stronę domów, samotoczący się rower z gazem i hamulcem, 10 gazet i paczki po stronie przeszkód, punkty za szyby nieabonentów.
2. Abonenci widoczni (kolorowe drzwi i skrzynki), krasnale i kosze jako cele psot.
2b. Podwórka do przejechania: otwarte bramy, rampy i deski na podwórkach, przeskok przez płot do sąsiada.
3. Strona domów: auto z podjazdu, zraszacz, kosiarka.
4. Strona przeszkód: plac zabaw, ławki z emerytami, smycz.
5. Śmieciarka i scenka przeprowadzki.

## Zrobione (v158)

Trawniki do jazdy, deski i skocznie między domami, krasnale (+1), wyższy podskok i PRZESKOK +1 (płot, bela, ławka), trzy tory przeszkód (deska, bela, duża skocznia przed autem, slalom, kicker, meta; komplet +6), auta wyjeżdżające z podjazdów (światła cofania jako sygnał, gazeta na szybę +2), zraszacze (poślizg, gazeta obraca strumień +1), śmieciarka z dwoma śmieciarzami (gazeta do śmieciarza +2). Do zrobienia z katalogu: abonenci widoczni kolorem, kosiarka, plac zabaw, ławki z emerytami, smycz, przeprowadzka.

## Zrobione (v162)

Deski przed podjazdami (przeskok nad cofającym autem albo lądowanie na dachu), auta czekają, gdy ulicą jedzie ruch, i nie wjeżdżają w jadące; co trzeci odcinek bez płotów; toczące się opony przez drogę; skocznie nad dzieciakami (+3). Pomysły Jarka z 02.10: „nie zatrzymuje się, mogę speedrunować, ale czasem trudno” — trzymać płynność: przeszkody do przeskoczenia albo objechania, nie ściany.

## Zrobione (v163)

Pościg właściciela po zbitej szybie (5,6 m/s: toczysz się, dogoni; na gazie uciekniesz), emeryci na ławkach, biegacze, pies na smyczy w poprzek chodnika, piłka z trawnika na jezdnię, place zabaw, zaparkowane auta ze skoczniami po drugiej stronie, bez drzew po stronie kamery.

## Poziom 2: Śródmieście (v170)

Miasto za dnia (mapa klasyk2, poziom k2). Kamienice ze sklepami tylko po lewej; po prawej brukowany plac: kioski i budki, ogródki kawiarniane, fontanny, donice, ławki z emerytami, zaparkowane auta ze skoczniami. Życie miasta z Porannej Trasy (przejścia dla pieszych, roboty, taksówki, rusztowania z cegłami) plus Klasyk (śmieciarka, biegacze, pies na smyczy, piłki, opony, pościg za szybę). Bez zraszaczy, podjazdów i krasnali (nie pasują do miasta).

Mechaniki: dwie prenumeraty (Trąbka i Wieści, abonent chce swoją, X przełącza, zły tytuł psuje serię), kurier konkurencji, PILNE (też na Kasztanowej: abonent przed tobą chce gazetę w 12 s, +5), seria trafień z mnożnikiem (była w grze), finał w korytarzu barierek z falą opon i piłek (v169).

Do rozważenia: tramwaj przez środek placu, dostawczaki w drugim rzędzie, kelner z tacą (gazeta na tacę), gołębie na placu.

## Poziomy 2 i 3: Wieś i Park (v176)

Śródmieście odstawione (za dużo skręcania, same skrytki, betonowo i pusto). Zostaje w kodzie jako mapa `miasto/klasyk2`, poziom `k9` oznaczony jako „wkrótce”.

- **Kamera Klasyka patrzy na stronę domów**: druga strona to wąski pas przy krawężniku, więc to, co ma budować klimat, stoi po stronie domów, a po drugiej tylko to, co widać i co przeszkadza (żywopłoty, bele, ptaki, spacerowicze).
- **k2 Wieś** (`wies/klasyk`): własna pętla z długimi łukami, chałupy przeplatane polami i gospodarstwami (bramy ze skrzynką), pastwisko za płotem z krowami, studnia, staw, kapliczki i bele przy krawężniku, gęsi, stada kur na poboczu (wjazd: KO-KO-KO! +1).
- **k3 Park** (`peryferia/park`): wille, co 150 m 50 m parku bez domów (żwirowa alejka, klomby, latarnie, staw, fontanna, altana, drzewa w głębi), wózek z lodami, żywopłoty przy drugim krawężniku, spacerowicze na obu chodnikach (wpadnięcie = zderzenie), stada gołębi (wjazd: GOŁĘBIE! +1). Dwie prenumeraty.

## Abonenci i medale (v177)

- Abonent widoczny z daleka: drzwi w kolorze jego gazety (nieoświetlony kolor, biała ramka) i skrzynka na słupku w tym kolorze z czerwoną chorągiewką. Nieabonent: ciemne drzwi (cel na szybę).
- Medal z gwiazdek: 1 = brąz, 2 = srebro, 3 = złoto (czas, gazety i celność, bez wywrotki). Na mecie w „W liczbach”: medal i punkty z przejazdu (przyrost od startu) z rekordem.
- Menu Klasyka: przyciski otwartych poziomów z medalem (np. KLASYK 2: WIEŚ · SREBRO).

## Tydzień pracy (v178, wariant łagodny)

- Każdy przejazd poziomu do mety to dzień: poniedziałek, wtorek… niedziela (dzień w pasku poziomu). Ci sami abonenci dzień po dniu (zapis `week[idPoziomu]` w zapisie kampanii).
- Abonent bez gazety pierwszy raz: czerwona ramka drzwi (ostatnia szansa). Drugi dzień z rzędu: rezygnuje (ciemne drzwi).
- Dzień bez pudła (każdy abonent dostał gazetę): wraca jeden abonent (losowy dom bez prenumeraty).
- Niedziela zaliczona: TYDZIEŃ ZALICZONY, +25 zł, nowy tydzień z nowym rozkładem. Mniej niż 3 abonentów: tydzień od nowa.
- Na mecie ramka „Tydzień” w „Twojej trasie”: ilu zostało, ilu zrezygnowało, ilu ma ostatnią szansę, kto wrócił, jaki dzień jutro.

## Poziom 4: Deptak (v179)

- Mapa `peryferia/deptak`: wydłużona pętla, pensjonaty w pastelach po stronie domów (środek pętli), za nimi morze: płaska tafla w środku pętli, piasek schodzi do wody.
- Co 120 m 45 m plaży bez domów; tam woda podchodzi blisko (zatoczka), żeby kamera ją widziała. Parawany, parasole z leżakami, wieża WOPR, jedno molo z altanką, żaglówki.
- Promenada: budki GOFRY, LODY, RYBA, KUKURYDZA, PAMIĄTKI, FRYTKI. Turyści na obu chodnikach, mewy (MEWY W GÓRĘ! +1).
- Teren po stronie morza płaski (bez pagórków pod wodą), bez lasów, stawów i ścieżek w środku pętli.
- v180: mewa co 13–23 s nurkuje z boku morza (KRAA!, cień na nim rośnie przez 1,7 s); podskok w ostatniej chwili = UNIK MEWY +2, inaczej porywa jedną gazetę z torby. Rolkarze (4) przy krawężniku promenady, w obie strony, zygzakiem: przeskok = NAD GŁOWAMI +3, wpadnięcie = zderzenie.
- Do rozważenia dalej: lody do zrzucenia z wózka, piłka plażowa przez drogę.

## Uzupełnienie poziomów (v182)

- Wieś: co 22–36 s stado 4 krów z rolnikiem przechodzi przez drogę 24–32 m przed nim (MUU!). Przemknięcie blisko (< 2,6 m) bez zderzenia, kiedy stado jest na jezdni: MIĘDZY KROWAMI +2. Wpadnięcie: zderzenie.
- Park: co 28–44 s wycieczka (pani i 6 dzieci na rowerkach) jedzie gęsiego przy dalszym krawężniku 2,8 m/s. Wyprzedzenie całej bez zderzenia: WYCIECZKA WYPRZEDZONA +3.

## Poziom 5: Zima (v183)

- Mapa `peryferia/zima` (flaga `winter`): po budowie wszystko, co zielone, przechodzi w śnieg (materiały i kolory wierzchołków; trawa bez tekstury), dachy białe, liście w rynsztokach jako zaspy, szare niebo i jasna mgła, pada śnieg (900 płatków wokół niego).
- Lód: plamy co 30–60 m na jezdni (`track.iceAt`). Na lodzie: przyspieszanie i hamowanie ×0,12, skręt ×0,2, bez prowadzenia wzdłuż drogi. ŚLIZG! przy wjeździe, PO LODZIE +1 przy zjeździe bez wywrotki.
- Bałwany zamiast krasnali (ta sama zasada punktów), sanki z dziećmi zamiast opon (kolizja: wywrotka, przeskok: bez kary), śmieciarka jako pomarańczowy pług z lemieszem.

## Osobna gra i optymalizacja (v184–v185)

- v184: Klasyk wydzielony z poranna-trasa do własnego folderu `gazeciarz` (port 8806), `src/edition.js` = `klasyk`, własny zapis `gz.save` (za pierwszym razem przejmuje wyniki poziomów k z `pt.save`, jeśli ten sam adres).
- v185, pomiar na Kasztanowej (jedna klatka z cieniami): było 6140 wywołań rysowania i 3,75 mln trójkątów, jest około 3450 i 2,2 mln (−44% i −41%); pobieranie 30 MB → około 21 MB.
  - modele ludzi: tylko 9 potrzebnych (bez brawlera, nastolatka, dziecka, mamy, staruszka, pana z psem);
  - ludzie i duże zestawy (np. rowery) dalej niż 55 m od gracza nie są rysowane, ludzie rzucają cień tylko do 25 m, drobne rekwizyty (promień < 0,45 m) bez cienia;
  - nieruchome części ulicy scalone po materiale (kolor, tekstura, tryb) w kwadratach 48 m; nietknięte: szyby, skrzynki, rzeczy do strącenia, paczki, auta, rampy, wszystko z `keep`;
  - każde auto scalone po materiale we własnym układzie (koła osobno, kierunkowskazy dalej migają, bo zmieniają materiał);
  - bez rowerów w ogródkach (w Klasyku nie ma chodzenia, więc nie da się ich wziąć).
- Dalej do zrobienia: odchudzenie modeli ludzi (MakeHuman ma po ~5 tys. trójkątów na część), scalanie domów z szybami (szyby jako osobne), wycięcie z kodu modułów Porannej Trasy (walka, zlecenia, sklep, garaż, multiplayer).
