# Orbit Gallery

Galeria, w którą się wlatuje (inspiracja: cosmos.so). Pierścienie okrągłych zdjęć leżą na jednej płaszczyźnie, jeden wewnątrz drugiego, wokół hasła w środku. Wszystkie kręcą się w tę samą stronę, tym wolniej, im bliżej tekstu, każdy odrobinę w swoim tempie. Wewnętrzne są mniejsze i przykryte delikatną nakładką w kolorze tła.

Scroll to wlatywanie: płaszczyzna się przybliża, pierścienie rozchodzą się na zewnątrz i znikają za krawędziami, a ze środka (spod tekstu) wyłaniają się kolejne. Hasło znika, przychodzi następne. Scroll mocniej rozkręca pierścienie, potem obrót wraca do spokojnego tempa (opór, bez sprężyny).

- Pierścień k ma promień `ratio^(k - zoom)` pierścienia zewnętrznego, więc krok przybliżenia przenosi każdy pierścień na miejsce poprzedniego (pętla bez szwu). Każdy ma tyle samo zdjęć, każde wielkości swojej części obwodu, więc odstępy są proporcjonalne aż do środka.
- Środek zostaje wolny na tekst; pierścienie wyłaniają się z jego brzegu.
- Zdjęcia: Picsum (zdjęcia z Unsplash, licencja Unsplash), id 10–85, ładowane z sieci przez stronę; nic nie jest trzymane w repo. Do czasu wczytania koło ma miękki kolor.
- Hasła to neutralny placeholder (do podmiany w `LINES`).
- Gdy nic się nie rusza (np. miniatura), strona przestaje rysować klatki.

**Domyślnie (ustawienia Jarka):** okrągłe orbity, zdjęcia squircle, każdy pierścień do środka 0,63×, rozmiar 0,44, równe odstępy (scatter 0), wewnętrzne kręcą się wyraźnie wolniej (0,22), scroll rozkręca 0,8×, nakładka 0,33, hasło litera po literze.

**Customize:**
- **Rings:** owalne albo okrągłe; zdjęć w pierścieniu; ile mniejszy każdy kolejny do środka; nakładka na wewnętrznych.
- **Turning:** obrót własny, jak wolne są wewnętrzne, jak mocno scroll rozkręca.
- **Pictures:** rozmiar (część miejsca na pierścieniu), Scatter (0 = równo), kształt: koło, squircle, kwadrat, pastylka, mieszane.
- **Words → Come in:** Fly in (rośnie z przybliżeniem), Word by word, From a blur, Letters (domyślnie).

Ustawienia: `lab.orbit-gallery.v2`, tryb jasny/ciemny w `.mode`. Poprzednia wersja (pierścienie w głębi 3D) była na `v1`.

**Plansza:** `?thumb=1` pierwsze hasło w pierścieniach, nieruchomo; `?demo=1` od tego kadru w głąb przez wszystkie hasła i z powrotem. Miniatura do zrobienia na nowo, gdy projekt będzie dopracowany.

Do testów: `window.ORBIT`.
