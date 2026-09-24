# lab-board

Nieskończona, przesuwana plansza eksperymentów. Jeden plik `index.html`, zero zależności, działa z `file://`.
Mechanika przeniesiona z sekcji Lab na juanmoraromero.com (analiza w pamięci Claude: `reference_lab_board_juanmoraromero.md`).

## Co robi

- **Torus**: kafle mają ręcznie wpisane prostokąty w „klastrze” 3000×2000 jednostek świata. Klaster zawija się w obu osiach, więc można przeciągać bez końca. Skala świata do pikseli: `max(szerokość, 900) / 1380` (było 1728, kafle domyślnie ok. 25% większe).
- **Canvas rysuje, DOM klika**: WebGL maluje kafle, a nad nim leży pula pustych linków `<a>` ustawianych co klatkę w te same miejsca. Dzięki temu działa klik, prawy klik, ctrl-klik w nową kartę, focus i czytniki ekranu. Bez WebGL te same linki dostają okładki jako `background-image` (fallback).
- **Drag**: zaczyna się po 6 px ruchu, wtedy linki dostają `pointer-events: none`, więc puszczenie draga nie klika. Po puszczeniu rozpęd gaśnie 0.92 na 1/60 s i zatrzymuje się poniżej 8 jednostek/s.
- **Kółko = lekki, jednolity zoom, który zostaje.** Scroll przesuwa cel zoomu (±32%, odstępy skalują się razem z kaflami, wokół środka viewportu). Widok goni cel na lekko niedotłumionej sprężynie: w trakcie scrollu płynie za kółkiem, po zatrzymaniu miękko hamuje z odrobiną przestrzelenia i zostaje na osiągniętym poziomie. Pokrętła w `CFG.zoom` (gain, scale, stiffness, damping).
- **Zagięcie**: vertex shader przesuwa kafle w głąb proporcjonalnie do wygładzonej prędkości, najmocniej w środku ekranu (`sin` okno). Fragment shader dodaje aberrację chromatyczną od prędkości i osobną od ruchu kursora nad kaflem.
- **Wejście**: kafle spadają z góry i wygaszają się z opacity, plansza jest przez chwilę „pchnięta” w pionie.
- **Własny kursor** (tylko `pointer: fine`): kropka 8 px, nad kaflem rośnie w pierścień 40 px i lgnie do środka kafla (magnetyzm 0.12), obok pierścienia etykieta „01 Grid Blob”. Wciśnięcie zapada pierścień do kropki, w dragu kropka rozciąga się wzdłuż prędkości, puszczenie daje pulsujący pierścień tym większy, im większy rozpęd. `mix-blend-mode: difference`, więc sam dobiera kolor. Nad nawigacją i kartą wraca kursor natywny.
- **Panel boczny** (wybrany, `CFG.detail = 'panel'`): klik ustawia hash `#/slug`. Panel wjeżdża z prawej (1,4 s, `cubic-bezier(.8,0,.17,1)`), overlay przyciemnia planszę o 25%, drag i kółko są zablokowane. Czysta powierzchnia papieru bez ziarna. Zamiast natywnego paska przewijania cienka wygaszona kreska 2 px przy prawej krawędzi (thumb proporcjonalny do treści, ciemnieje w trakcie scrollu, znika gdy treść mieści się w panelu). W orientacji pionowej ten sam panel jest bottom sheetem na 80% wysokości. Zamyka: Close, klik w overlay, Escape, wstecz.
- **Karta (container transform)** została w kodzie pod `CFG.detail = 'card'` do porównania: kafel rośnie ze swojego miejsca na środek i scrolluje się w sobie. Decyzja Jarka 2026-09-24: zostajemy przy panelu.
- **Efekty hover w WebGL, trzy tryby do testów** (`CFG.hover`, przełącznik `hover · none lift lens focus` w stopce, `?hover=`):
  - `lift` (domyślny): kafel unosi się w stronę kamery (46 px w z), przechyla się tak, że strona pod kursorem się wciska, obraz w środku lekko się przybliża i dryfuje przeciwnie do kursora (paralaksa), miękki połysk pod kursorem, reszta planszy lekko przygasa. Unoszony kafel rysuje się ostatni, więc nachodzi na sąsiadów (z-index). Warstwa DOM ze szkłem idzie za nim przez `matrix3d`, bo `.stage` ma `perspective: 1200px` zgodną z kamerą GL.
  - `lens`: płynna soczewka powiększająca pod kursorem z rozjazdem kanałów na krawędzi, fala rozchodząca się od miejsca wejścia kursora, lekkie wybrzuszenie siatki w stronę kamery.
  - `focus`: cała plansza desaturuje się i przygasa, a najechany kafel wyostrza się z dużych pikseli w ok. pół sekundy.
  - `none`: bez efektu, sam kursor.
  Warstwa przednia kafla wychodzi do DOM tylko wtedy, gdy musi (szkło, wideo albo chipy), inaczej zostaje w GL i dostaje efekty shadera. Pokrętła w `CFG.fx`. Kursor-pierścień z tytułem działa we wszystkich trybach, kwadraty z symbolami dalej wyłączone (`CFG.hoverChips`).
- **Profile overlayu** (`CFG.overlay`, przełącznik `overlay · …` w stopce, `?overlay=`). Wszystko w DOM nad planszą i warstwami kafli, pod przyciemnieniem, panelem i kursorem, z `pointer-events: none`, więc nie rusza klikania ani szkła:
  - `static`: dotychczasowe statyczne ziarno SVG (domyślny, wygląd bez zmian).
  - `off`: czysto, bez ziarna.
  - `film`: żywe ziarno skaczące 24 klatki na sekundę + delikatna winieta.
  - `crt`: linie kineskopu co 3 px, maska luminoforu RGB, słabe ziarno, mocniejsza winieta.
  - `tv`: linie, jasny pas przetaczający się w dół co 7 s, ziarno 30 kl/s, winieta.
  - `dither`: uporządkowany raster Bayera 4×4 (1 komórka = 1 px), w trybie ciemnym jasne punkty.
  - `live`: w spoczynku prawie nic, przy przeciąganiu, rozpędzie i zoomie ziarno i linie narastają, po zatrzymaniu miękko gasną (szybki atak, wolne wygaszanie; sygnał = prędkość kamery + siła zagięcia + sprężyna zoomu).
  Wartości krycia w `OVERLAYS`. Przy `prefers-reduced-motion` ziarno stoi, a pas TV jest wyłączony. Winieta w jasnym motywie jest słabsza.
- **Backup**: `index.backup-2026-09-24.html` = stan sprzed efektów hover (zoom, szkło, warstwy, symbole wyłączone). Otwiera się tak samo jak `index.html`.
- **Okładki, trzy warianty** (`CFG.covers`, przełącznik w stopce i parametr `?covers=`): `circle` = nasycone pole koloru z jednym miękkim kołem-superelipsą w siostrzanym tonie (duch arkusza „Color” z Material); `mixed` = to samo pole, ale figura z zestawu koło / trójkąt / X / ring / plus / romb / półkole / pigułka / ćwiartka, przydzielana deterministycznie po indeksie; `motif` = szkice proceduralne z v1 z numerem i tytułem. Palety par kolorów w `PAIRS`, zestaw figur w `SHAPES`. Warianty kształtowe nie mają tekstu na kaflu, numer i słowa pojawiają się na hover.
- **Motyw jasny / ciemny** (`CFG.theme`, przełącznik w stopce, `?theme=dark`): tokeny kolorów na `:root`, nadpisane pod `[data-theme="dark"]` (grafit #161616, tusz jasny, słabsze ziarno, mocniejszy dim). Skrypt w `<head>` ustawia motyw z adresu przed pierwszym malowaniem.
- **Miniatury jako warstwy**: kafel może mieć `back` (kolor), `front` (PNG z przezroczystością + pozycja jako ułamki kafla) i `video`. Gdy kafel nie jest najechany, WebGL rysuje kompozyt (tło + front). Na hover WebGL rysuje tylko tło (albo klatki wideo), a front przenosi się do DOM nad planszę, żeby słowa mogły wchodzić między warstwy. Dziś: grid-blob (telefon z ramieniem na #252525), portfel (karta „Find shelter” nad wideo lasu, las ze zdjęcia usunięty), type-tokens (logo na granacie). Kronika zostaje płaskim PNG. Eksport przez MCP `get_screenshot(contentsOnly)` jest 1:1, finalne okładki eksportować 2× z Figmy.
- **Wideo na hover + liquid glass**: `video` w PIECES (`thumbs/portfel.mp4`, plik od Jarka). Element `<video>` powstaje przy pierwszym najechaniu, gra zapętlony i wyciszony, klatki idą do tekstury WebGL co klatkę; zjazd pauzuje. Karta „Find shelter” nad wideo jest szkłem: warstwa `front.glass` (promień 30 z Figmy) → na hover DOM `.glass` z `backdrop-filter: blur(9px) saturate(1.45)`, chłodny tint, jasny rant i refrakcyjny cień wewnętrzny; w stanie idle to samo malowane statycznie w kompozycie (`paintGlass`). PNG karty zawiera tylko treść (eksport 2× z klona bez fillu i efektów, klon usunięty).
- **Bez miniatury = szare ciemne tło** (`CFG.covers = 'plain'`, kolor `CFG.plain` #262626). Warianty `circle` / `mixed` / `motif` zostały w przełączniku do porównań.
- **Typografia**: Google Sans Flex (variable, wagi 400–800) w całym pliku, także na okładkach.

## Wersja publiczna (podgląd „jak finalnie”)

- Live: https://vod123qwe.github.io/playground/lab-board/ (GitHub Pages z gałęzi `main`).
- Domyślnie: motyw ciemny, hover `lift`, overlay `live`, miniatury na wszystkich kaflach.
- Nawigacja u góry: tylko `lab board` po lewej i `contact` po prawej.
- **Ukryte opcje**: słowo `options` w prawym dolnym rogu (albo klawisz O) otwiera panel z przełącznikami okładek, hovera, overlayu i motywu. Wybór zapisuje się w adresie, więc link z parametrami otwiera tę samą konfigurację.
- **Telefon**: przeciąganie jednym palcem przesuwa planszę, dwa palce robią pinch-zoom (z tą samą sprężyną co kółko), tap otwiera panel jako bottom sheet. Efekty hover i wideo odpalają się tylko myszą, na dotyku kafle są statyczne.

## Miniatury przykładowe

8 kafli ma referencje wizualne dostarczone przez Jarka (`thumbs/ref/`): zrzuty cudzych prac (interfejs Framera, LAM, aevion / Riotters, portfolio Maksyma Bleibtgleicha, noho, Pasticcino World Tour, dwie ilustracje). To WYŁĄCZNIE placeholdery podglądu, nie realizacje Jarka i nie mają związku z tytułami projektów na kaflach. Przed udostępnieniem strony komukolwiek albo przed portfolio trzeba je zastąpić własnymi okładkami.

Obrazy mają 4:3, kafle są panoramiczne, kwadratowe albo pionowe, więc każdy dostał kafel o najbliższych proporcjach i punkt kadru `focus:[x, y]` w PIECES (shader kadruje wokół niego, panel projektu pokazuje pełny obraz):

| kafel | referencja | focus |
|---|---|---|
| typestorm | interfejs „Ask Framer” z poświatą | 0.5, 0.6 |
| lottie-studio | LAM, wielki napis | 0.5, 0 |
| parkove | aevion, dron | środek |
| contrast-audit | ilustracja, dwie postacie | 0.5, 0.3 |
| audit-suite | noho, meble | środek |
| spellbeat | Pasticcino, wnętrze pociągu | 0.5, 0.55 |
| meander (kwadrat) | Maksym Bleibtgleich, portfolio z rozmyciem | środek |
| wiredraft (pion) | ilustracja z kwiatem | 0.47, 0.5 |

Pozostałe 6 kafli (win98-music, emilka, stickies, runebound, cardrush, file-audit) jest ciemnoszarych, zdjęcia ze stocka usunięte. Cztery kafle z Figmy bez zmian (telefon, Echo Peak, karta „Find shelter” z wideo lasu, logo FIA).

## Pokrętła

Wszystko w obiekcie `CFG` na górze skryptu. Najciekawsze:

| klucz | co robi | wartość |
|---|---|---|
| `bend` | amplituda zagięcia jako ułamek wysokości viewportu | 0.85 |
| `strengthDragGain` | wzmocnienie zagięcia w trakcie draga | 12.5 |
| `strengthCoastGain` | wzmocnienie zagięcia przy rozpędzie (oryginał: 1) | 4 |
| `momentumDecay` | gaśnięcie rozpędu na 1/60 s | 0.92 |
| `aberrThreshold`, `aberrScale` | od jakiej prędkości i jak mocno rozjeżdżają się kanały | 0.006, 0.42 |
| `hoverGain`, `hoverMax`, `hoverDecay` | rozjazd kanałów od ruchu kursora nad kaflem | 15e-5, 0.03, 0.86 |
| `cursor.ring`, `cursor.magnet`, `cursor.pulseMax` | rozmiar pierścienia, siła lgnięcia, maks. puls na puszczeniu | 40, 0.12, 1.2 |
| `card.openPush` | impuls zagięcia pola, gdy karta odrywa się z planszy | 0.18 |
| `detail` | `panel` albo `card` | panel |
| `covers` | `plain`, `circle`, `mixed` albo `motif` | plain |
| `hover` | `none`, `lift`, `lens` albo `focus` | lift |
| `overlay` | `static`, `off`, `film`, `crt`, `tv`, `dither` albo `live` | static |
| `fx.lift`, `fx.tilt`, `fx.parallax` | uniesienie w px, przechył (z na px), dryf obrazu | 46, 0.12, 0.016 |
| `fx.bulge`, `fx.bulgeR` | wybrzuszenie soczewki i jego promień w px | 34, 150 |
| `fx.pixelStart`, `fx.pixelEase` | startowy rozmiar piksela i tempo wyostrzania | 26, 0.075 |
| `theme` | `light` albo `dark` | light |
| `words.step`, `words.hold` | co ile px ruchu nowe słowo, ile ms słowo zostaje | 44, 900 |

W konsoli: `LB.state()` pokazuje tryb, kamerę i siłę zagięcia; `LB.push(vx, vy)` pcha planszę.

## Treść

Miniatury docelowo z Figmy: plik Playground, strona „portfolio”, ramka „Lab board · thumbnails”. Komponenty `thumb/NN-slug` w rzędzie na dole (tam wrzucasz obraz), siatka wyżej to instancje-podgląd 1:1 z klastrem. Eksport slotu po nazwie → `thumbs/<slug>.png` → `PIECES[].image` (pole jeszcze nieobsługiwane w kodzie, okładki są proceduralne).

Kafle to placeholdery: nazwy i jednozdaniowe opisy eksperymentów z tego workspace, okładki malowane proceduralnie na Canvas 2D.
Opisy i lata do sprawdzenia przed użyciem gdziekolwiek publicznie. Linki „View code” są tylko tam, gdzie repo jest znane.

## Znane ograniczenia

- Panel podglądu w aplikacji Claude dławi klatki, więc rozpęd i wejście wyglądają tam wolniej niż w zwykłej przeglądarce.
- Kolejność Tab po linkach zmienia się wraz z recyklingiem slotów. Do poprawy, jeśli to pójdzie do portfolio.
- Karta wraca do miejsca kafla policzonego w momencie zamknięcia. Plansza jest wtedy zablokowana, więc to to samo miejsce, ale po zmianie rozmiaru okna kafel może być poza ekranem i wtedy karta po prostu gaśnie.
- Bez WebGL nie ma zagięcia ani aberracji, jest tylko przesuwana plansza.
