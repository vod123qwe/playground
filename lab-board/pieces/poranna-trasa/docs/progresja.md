# Progresja: dom, mapa, poziomy

Stan: etap 1 zrobiony w v89 (2026-10-01): mapa, 4 odcinki w peryferiach, meta, gazeta, gwiazdki, zapis. Dalej etap 2. Decyzje Jarka z rozmowy oznaczone jako **[decyzja]**, moje propozycje jako **[propozycja]**.

## Cel

Koniec z jazdą w kółko. Gra ma kierunek: każdy poranek to trasa z metą, poziomy są coraz trudniejsze i wyglądają inaczej, a jazda jest najważniejsza **[decyzja]**. Prenumeraty, historie i frakcje dokładamy później, na tym szkielecie.

## Pętla gry

1. **Dom** **[decyzja]**: gra startuje z domu. Tu jest kosz z bratem, garaż i rodzina. Dom to baza, do której się wraca.
2. **Mapa** **[decyzja]**: między poziomami widok z góry, podzielony na regiony. Pierwszy region to peryferia miasteczka, tam gdzie mieszkasz.
3. **Poziom**: trasa w danym regionie, od startu do mety.
4. **Meta**: gazeta z podsumowaniem, potem z powrotem na mapę.

## Mapa **[propozycja]**

- Pikselowy widok z góry jak mapa świata w starych platformówkach: regiony jako plamy terenu, poziomy jako punkty połączone drogami.
- Dom zawsze jest punktem na mapie (powrót do bazy).
- Rozwidlenia dróg na mapie to **wybór odnogi** **[decyzja]**: np. z peryferii przez park (skocznie, trawa, mało aut) albo przez centrum (ruch, lepsza stawka).
- Przy punkcie: gwiazdki zdobyte na tym poziomie i ikonka zapowiedzi (deszcz, roboty, festyn).
- Region odblokowuje się gwiazdkami z poprzedniego.

Regiony po kolei **[decyzja: kolejność Jarka]**:

| # | Region | Wygląd | Jazda |
|---|---|---|---|
| 1 | Peryferia miasteczka (tu mieszkasz, dom) | domki z ogródkami, to co jest teraz | spokojnie, mało aut, psy |
| 2 | Wieś | polne drogi, gospodarstwa, sady, kapliczki | górki, błoto, traktor, kury, gęsi |
| 3 | Znów peryferia (druga strona miasteczka) | nowsze osiedle domków, budowy, przemysłówka na skraju | roboty drogowe, ciężarówki, szersze ulice |
| 4 | Miasto | kamienice, bloki, kostka, rynek, targ | duży ruch, autobus, krawężniki, schody, stragany |
| 5 | Leśna droga | ścieżki w lesie i między nimi, domki letniskowe, pole namiotowe | korzenie, wąskie ścieżki, skróty, rzut do domków i do ludzi w namiotach |

(Kolejne regiony do dopisania.)

## Poziom **[decyzja + propozycja]**

- **Dni stałe, detale losowe** **[decyzja]**: układ trasy dla poziomu zawsze ten sam (da się wyuczyć i pobić rekord), auta, psy i przechodnie za każdym razem trochę inaczej.
- Start na początku trasy, meta z bramą „META” na końcu. Po mecie można dalej jechać tylko na tor przeszkód (bonus) albo na mapę.
- Trudność rośnie z poziomem: dłuższa trasa, więcej aut, szybsze tempo, więcej typów przeszkód.
- Duch najlepszego przejazdu (to, co już działa w grze przez sieć) **[propozycja, później]**.

### Przeszkody wg poziomów **[propozycja]**

- Od początku: auta, psy, kałuże, krawężniki, zaparkowane auta.
- Średnie: roboty drogowe z objazdem chodnikiem, skocznia z desek, studzienka bez pokrywy, hulajnogi, kosiarka, wąski mostek, schody.
- Trudne: śmieciarka cofająca, przejazd kolejowy z rogatkami, rozkopany pas, festyn na ulicy, gęsi na drodze, wiatr spychający na zakrętach.

## Meta: gazeta **[propozycja]**

- Nagłówek z Twojej jazdy („Chłopak z peryferii bez jednej wywrotki!”).
- Czas, celność, najdłuższa seria, wywrotki, stłuczone szyby, zarobek.
- **3 gwiazdki**: za czas, za celność, za jazdę bez wywrotki.
- **Zapowiedź na jutro** **[decyzja]**: pogoda i zdarzenia dla kolejnych punktów na mapie, widać je przed wyborem.

## Zdarzenia **[decyzja: zapowiadane]**

Deszcz (ślisko, kałuże), mgła (krótki widok), roboty drogowe (objazd), festyn (ludzie na jezdni), wiatr, wywóz śmieci. Zawsze widoczne na mapie przed wyjazdem, nigdy niespodzianka w trakcie.

## Jak to zbudować (technicznie) **[propozycja]**

- Dziś cały świat to jedna zamknięta pętla z domem doczepionym przy skrzyżowaniu. Poziom może zostać pętlą w środku (cały kod drogi zostaje), tylko z metą przed powrotem na start i z innym kształtem, długością, wyglądem i zestawem przeszkód.
- Przejście dom ⇄ mapa ⇄ poziom: świat budowany od nowa dla każdego poziomu. Najprościej i najpewniej: przeładowanie strony z zapisanym stanem (kasa, rower, części, gwiazdki), przykryte ekranem gazety albo mapy. Minus: gra przez sieć musi się połączyć od nowa przy zmianie poziomu (na start: sieć tylko w trybach swobodnych).

## Etapy

1. **Szkielet**: mapa z regionem Peryferie (3 poziomy + dom), start i meta, gazeta z gwiazdkami, zapis postępu, przejścia dom → mapa → poziom → gazeta → mapa.
2. **Nowe przeszkody**: roboty z objazdem, skocznie, studzienki, schody, mostek, rozłożone po poziomach.
3. **Region 2 (Park i jezioro)**: nowy wygląd i jego przeszkody.
4. **Zdarzenia** zapowiadane na mapie.
5. Kolejne regiony.
6. Potem: prenumeraty, różne gazety, historie, policja z mechaniką (frakcje), duch rekordu.

## Kolejka dopieszczania (Jarek, po v89: „na spokojnie, po kolei”)

1. **Mapa ładniejsza**: mini budowle 3D (izometryczny widok z góry), obszar miasteczka z wyraźnie podzielonymi dzielnicami i peryferiami.
2. **Gazeta na mecie**: wygląda jak prawdziwa gazeta złożona na pół; na pierwszej stronie zajawka fabularna (krótki artykuł o Twoim poranku i o tym, co się działo w okolicy), wynik w artykule; statystyki osobno (np. tabela na odwrocie albo osobna karta).
3. **Pory dnia**: świt, poranek, dzień; o świcie zapalone latarnie, okna, światła aut.
4. **Różnorodność budynków**: bloki i inne budynki w kolejnych poziomach, nie tylko domki.

## Otwarte: po co wracać na odcinek (Jarek po v92)

Dziś „Okrążenie od tyłu” to ta sama pętla w drugą stronę, bez własnej nagrody. Propozycje (do wyboru):
- prenumeraty jako farma: zadowoleni prenumeratorzy płacą abonament co poranek w domu; im więcej gwiazdek na odcinku, tym więcej stałych klientów i dochodu;
- każdy odcinek z własną nagrodą za pierwsze i trzecie gwiazdki (części, lakiery, nowe rowery do kupienia u Janusza);
- finał odcinka: ostatnie metry jako tor przeszkód (skocznie, rampy), przejazd przez bramę z zwolnionym tempem, błysk aparatu i to zdjęcie na pierwszej stronie gazety;
- zadania z gazety: ogłoszenia jako zlecenia na następny przejazd (znajdź kota, dowieź paczkę), nagroda w kolejnym wydaniu.

## Pomysły na później

- **Kopanie w skrzynki konkurencji** (Jarek): domy z prenumeratą innej gazety mają swoje skrzynki; można w nie kopnąć (mniej klientów dla konkurencji), ale to czasem wywołuje zdarzenie (sąsiad widział, pościg, zła sława, odwet konkurencji).
- **Policjant z mechaniką** (Jarek): odkupywanie, wpływ na frakcje.
- **Zakupy między poziomami** (Jarek): warsztat dostępny z mapy (zrobione w etapie 1), żeby przygotować się na zapowiedziane zdarzenia.
