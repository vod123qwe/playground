# Regiony i trasy

Stan: plan (2026-10-01), realizowany po kolei. Zasada (Jarek): w regionie kilka tras, które lekko się różnią; region to nowe miejsce, które różni się mocno (wygląd, jazda, utrudnienia, persony, zlecenia).

## Jak trasy różnią się w regionie

Ten sam świat regionu, ale: kierunek, długość (pół pętli, pętla, półtorej), inny start i meta, inne zestawy utrudnień, czasem objazd (zamknięta ulica wymusza skrót), później też pora dnia (świt z latarniami, ranek, przedpołudnie).

## Regiony (6) i trasy (24)

| # | Region | Wygląd | Jazda i utrudnienia | Persony i zlecenia | Trasy |
|---|---|---|---|---|---|
| 1 | Peryferie | domki z ogródkami, dom gazeciarza | psy, auta, krawężniki | Janusz, babcia, Hela, ekipa spod beczki | 4 (są) |
| 2 | Wieś | polne i asfaltowe drogi bez chodników, gospodarstwa, stodoły, sady, topole, kapliczki, przystanek PKS | błoto, gęsi i kury na drodze, traktor i kombajn, psy z łańcuchów, górki | sołtys (tablica ogłoszeń), gospodyni (jajka: delikatna dostawa), traktorzysta (wyścig z traktorem), pan z przyczepy | 4: Polna droga, Przez sady, Za traktorem, Targowy poranek |
| 3 | Druga strona | nowe osiedle szeregowców, budowy, magazyny, tory | roboty drogowe z objazdem, ciężarówki, dziury, przejazd kolejowy z rogatką | kierownik budowy, deweloper, siedziba Kuriera Osiedlowego (wojna gazet) | 4 |
| 4 | Miasto | kamienice, rynek, bloki z wielkiej płyty, kostka brukowa, schody | duży ruch, autobusy, krawężniki, schody, targ | redakcja, posterunek główny (dyżurny), bazar Żanety | 5 |
| 5 | Leśna droga | ścieżki między drzewami, domki letniskowe, pole namiotowe, jezioro | korzenie, piach, wąskie kładki, skróty | leśniczy, harcerze, wędkarz; gazety do domków i namiotów | 4 |
| 6 | Wzgórza | serpentyny, kamieniołom, punkt widokowy | długie podjazdy i zjazdy, wiatr | „wielki wyścig” na koniec, mistrz z przeszłości Janusza | 3 |

## Technicznie

- Świat budowany dla regionu: `createTrack` dostaje opis regionu (kształt pętli, przekrój drogi, rodzaje zabudowy, paleta, gęstość, co stoi przy drodze, czy jest dom gazeciarza).
- Zmiana regionu: zapis stanu i przeładowanie strony z `?region=...&poziom=...` (pewne, bez sprzątania świata); w regionie trasy zmieniają się bez przeładowania.
- Start trasy: w peryferiach z domu; w innych regionach z miejsca startu regionu (np. przystanek PKS na wsi).

## Mapa (nowy wygląd)

Mapa jako mała makieta 3D w pikselach (ta sama grafika co gra): każdy region to kawałek terenu z małymi budynkami z generatorów gry (domki, stodoły, kamienice, drzewa), drogi między nimi, punkty tras jako chorągiewki, region zablokowany pod mgłą. Kamera z góry pod kątem, lekki ruch. Regiony odblokowane widać w kolorze, przyszłe w szarości.

## Kolejność

1. Infrastruktura regionów (opis regionu w `createTrack`, przeładowanie, start bez domu) i pierwsza wersja Wsi (kształt, droga bez chodnika, wiejska zabudowa, pola blisko).
2. Wieś: gęsi, traktor, błoto, kapliczki, przystanek PKS; 4 trasy; persony wiejskie i ich zlecenia.
3. Nowa mapa (makieta 3D).
4. Kolejne regiony, każdy z trasami, utrudnieniami i personami.
