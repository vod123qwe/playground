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

Mapa „Ulica Kasztanowa”: długa pętla z łagodnymi zakrętami. **Domy stoją tylko po lewej stronie** (patrząc w kierunku jazdy). Po prawej jest **strona przeszkód**: chodnik, pas zieleni, ławki, parking, przystanek, plac zabaw, wykop. Na jezdni dzieje się wszystko i wszędzie.

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
- **Tempo:** rower toczy się sam (~5 m/s). Gaz przyspiesza do ~8 m/s, hamulec zwalnia do ~2 m/s. Sprint zostaje na proste.
- **Rzut:** jeden. Każdy klawisz rzutu i oba przyciski myszy rzucają zawsze w stronę domów. Kliknięcie: sam leci do celu w ramce. Przytrzymanie: siła, czyli odległość.
- **Kamera:** skośna, z drogą, ustawiona nad stroną przeszkód i patrząca po skosie na domy i drogę przed rowerzystą.
- **Upadki:** jak w Porannej Trasie od v155 (zachwianie przy średnich, upadek przy mocnych), ale bez wstawania pieszo: chwila leżenia i rowerzysta z rowerem wraca na pas, mrugając ~2,5 s bez przewracania (v157).
- **Kamera:** jedna, bez przełączania, zoomu i obrotu (v157).

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
