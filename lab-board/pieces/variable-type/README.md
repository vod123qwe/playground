# Variable Type

Kafel labu: jeden font zmienny pokazany od najspokojniejszej do najbardziej skrajnej wersji. Po lewej litery (`Aa`), po prawej cyfry (`09`), pod nimi kilka kontrolek.

**Font:** Google Sans Flex z Google Fonts (ten sam krój co plansza labu). Pięć osi: waga `wght` 1–1000, szerokość `wdth` 25–151, optical size `opsz` 1–144, zaokrąglenie `ROND` 0–100, pochylenie `slnt` 0 do −10. Alternatywne znaki (OpenType): `ss01` jednopiętrowe a, `ss02` dwupiętrowe g, `zero` przekreślone zero. Osi GRAD w tym pliku nie ma, mimo że API ją przyjmuje. Plik z alfabetem łacińskim waży ok. 1 MB.

**Na scenie (bez przeładowania):**
- sześć stylów: Classic, Elegant (cienki i szeroki, z oddechem między literami, dwupiętrowe g), Friendly (zaokrąglony, jednopiętrowe a), Poster (wąski i czarny), Extended (szeroki, ciężki, pochylony, przekreślone zero), Hairline. Klik morfuje wszystkie osie naraz (ease in-out, 0,9 s), alternatywne znaki podmieniają się w połowie ruchu;
- przycisk Play: style po kolei, w pętli;
- suwaki: Weight, Width, Roundness (wspólne `LabUI.slider`, wygląd `soft`);
- dwa przełączniki znaków: a / a jednopiętrowe, 0 / 0 przekreślone (przyciski rysowane tym samym fontem);
- przeciąganie samych liter: góra i dół = waga, w bok = szerokość; kółko myszy = waga.

**Customize:** optical size, pochylenie, dwupiętrowe g, odstępy między literami, własny tekst (lewy i prawy), czas morfowania, czas postoju w Play, rozmiar. „Copy CSS” kopiuje `font-variation-settings`, `font-feature-settings` i `letter-spacing`.

**Plansza:** `?thumb=1` (opcjonalnie `&style=Elegant` itd.) to miniatura, `?demo=1` podgląd na żywo (Play w pętli). Kafel 520×300, miniatura `thumbs/variable-type.jpg` (1040×600, styl Classic, zrzut z headless Edge).

**Telefon:** litery jedna nad drugą, kontrolki w kolumnie, pasek stylów przewija się w bok i sam pokazuje wybrany styl.

Ustawienia zapisują się w przeglądarce (`lab.variable-type.v1`).
