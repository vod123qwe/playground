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
- **Popup z eksperymentem** (domyślny od 2026-09-25, `CFG.detail = 'play'`): klik w kafel otwiera biały popup na 80% ekranu (na telefonie prawie pełny ekran), który wyrasta z klikniętego kafla. W środku żywy eksperyment w iframe (`piece.live` + `?bare=1`, bez własnej nawigacji), więc można się nim bawić bez wychodzenia z labu. Do czasu załadowania widać rozmytą miniaturę. Nagłówek: numer, tytuł, rodzaj i rok, `open ↗` w nowej karcie, `code`, krzyżyk. Zamyka: krzyżyk, klik w tło, Escape (gdy fokus nie jest w iframe), wstecz. Kafle bez `live` dalej otwierają panel boczny.
- **Panel boczny** (`CFG.detail = 'panel'`, fallback dla kafli bez `live`): klik ustawia hash `#/slug`. Panel wjeżdża z prawej (1,4 s, `cubic-bezier(.8,0,.17,1)`), overlay przyciemnia planszę o 25%, drag i kółko są zablokowane. Czysta powierzchnia papieru bez ziarna. Zamiast natywnego paska przewijania cienka wygaszona kreska 2 px przy prawej krawędzi (thumb proporcjonalny do treści, ciemnieje w trakcie scrollu, znika gdy treść mieści się w panelu). W orientacji pionowej ten sam panel jest bottom sheetem na 80% wysokości. Zamyka: Close, klik w overlay, Escape, wstecz.
- **Karta (container transform)** została w kodzie pod `CFG.detail = 'card'` do porównania: kafel rośnie ze swojego miejsca na środek i scrolluje się w sobie. Decyzja Jarka 2026-09-24: zostajemy przy panelu.
- **Efekty hover w WebGL, trzy tryby do testów** (`CFG.hover`, przełącznik `hover · none lift lens focus` w stopce, `?hover=`):
  - `lift` (domyślny): kafel unosi się w stronę kamery (46 px w z), przechyla się tak, że strona pod kursorem się wciska, obraz w środku lekko się przybliża i dryfuje przeciwnie do kursora (paralaksa), miękki połysk pod kursorem, reszta planszy lekko przygasa. Unoszony kafel rysuje się ostatni, więc nachodzi na sąsiadów (z-index). Warstwa DOM ze szkłem idzie za nim przez `matrix3d`, bo `.stage` ma `perspective: 1200px` zgodną z kamerą GL.
  - `lens`: płynna soczewka powiększająca pod kursorem z rozjazdem kanałów na krawędzi, fala rozchodząca się od miejsca wejścia kursora, lekkie wybrzuszenie siatki w stronę kamery.
  - `focus`: cała plansza desaturuje się i przygasa, a najechany kafel wyostrza się z dużych pikseli w ok. pół sekundy.
  - `none`: bez efektu, sam kursor.
  Warstwa przednia kafla wychodzi do DOM tylko wtedy, gdy musi (szkło, wideo albo chipy), inaczej zostaje w GL i dostaje efekty shadera. Pokrętła w `CFG.fx`. Kursor-pierścień z tytułem działa we wszystkich trybach, kwadraty z symbolami dalej wyłączone (`CFG.hoverChips`).
- **Układy przestrzenne** (`CFG.layout`, grupa `space` w pasku i w panelu, `?space=`). Kafle przestają leżeć na płaszczyźnie i dostają pozycję i obrót w 3D (vertex shader: pitch, yaw, roll), a pula linków DOM dostaje rzut prostokąta kafla na ekran, więc klik i hover działają dalej. Kafle rysują się od najdalszego do najbliższego, dalekie i bardzo bliskie gasną we mgle:
  - `plane`: dotychczasowa płaska plansza.
  - `field`: pole głębi, 34 kafle rozsiane w bryle 5200 px głębokości; scroll = lot, powolny dryf w przód, drag = rozglądanie z paralaksą; bliskie przelatują obok kamery poza ekran.
  - `tunnel`: korytarz z kaflami na ścianach, podłodze i suficie (9 na ścianę co 760 px); scroll albo drag w pionie = lot, drag w poziomie obraca tunel wokół osi.
  - `ring`: karuzela, trzy rzędy na walcu; drag w poziomie albo scroll kręci, drag w pionie przewija rzędy bez końca.
  - `sphere`: kula z 54 kaflami rozłożonymi spiralą Fibonacciego; drag obraca, scroll przybliża, powolny obrót sam z siebie.
  - `stack`: stos w głąb, kafle co 1100 px, najbliższy wylatuje poza ekran; scroll albo drag w pionie = następny, drag w poziomie lekko przesuwa.
  Na telefonie lot to przeciągnięcie w górę, a pinch przysuwa kamerę. Szkło i wideo na karcie Portfela działają tylko na `plane`. Pokrętła w `CFG.space`.
- **Pasek review wybiera grupę**: przycisk po lewej (`space ▾`, `hover ▾`, `overlay ▾`) ustala, co zmieniają strzałki ‹ ›. Startuje na `space`.
- **Efekty głębi (zdjęcia 3D w stylu Facebooka)**: 10 kafli ma mapy głębi w `thumbs/depth/` (skala szarości, jasne = blisko), wygenerowane lokalnie modelem Depth Anything V2 Small (ONNX, Apache 2.0) skryptem poza repo; Echo Peak i telefon z Figmy też. Na tych kaflach działa sześć dodatkowych trybów hover:
  - `depth`: paralaksa z mapy głębi (3 kroki doprecyzowania, bliższe plany jadą z kursorem, dalsze przeciwnie) + lekkie uniesienie kafla.
  - `topo`: głębia + poziomice z mapy głębi, co czwarta grubsza, najmocniejsze przy kursorze (limonkowe na przyciemnionym obrazie).
  - `scan`: skan LIDAR, jasna linia przechodzi od bliskiego do dalekiego planu co ok. 2,4 s, nieprzeskanowana część to chmura punktów.
  - `dof`: ostrość na głębokości pod kursorem, reszta rozmyta 9-próbkowym dyskiem.
  - `light`: kursor jak lampka, normalne z gradientu głębi, rozproszone światło + delikatny połysk.
  - `relief`: siatka kafla (40×40) wypychana w przód według głębi w vertex shaderze + mocniejszy przechył. Kompilowany tylko, gdy GPU obsługuje tekstury w vertex shaderze.
  Kafle bez mapy głębi w tych trybach tylko się unoszą. Pokrętła: `CFG.fx.depth`, `depthLift`, `relief`, `reliefTilt`.
- **Telefon**: przytrzymanie kafla (240 ms) włącza podgląd efektu hover pod palcem, palec steruje nim bez przesuwania planszy, puszczenie nie otwiera projektu. Szybki tap otwiera projekt jak dotąd. W menu `motion · gyro` przechylanie telefonu steruje efektami głębi na wszystkich widocznych kaflach (iOS pyta o zgodę na czujnik ruchu).
- **Menu review**: pasek na dole (‹ nazwa efektu › i przycisk z suwakami) przełącza tryby hover jednym kciukiem; środek paska albo suwaki otwierają panel ze wszystkimi opcjami (hover, motion, overlay, covers, theme) i krótkim opisem wybranej opcji. Na telefonie to arkusz od dołu z dużymi przyciskami, na desktopie karta z prawej. Skróty: ← → zmienia hover, O otwiera panel, Escape zamyka. `?review=0` chowa pasek.
- **Profile overlayu** (`CFG.overlay`, przełącznik `overlay · …` w stopce, `?overlay=`). Wszystko w DOM nad planszą i warstwami kafli, pod przyciemnieniem, panelem i kursorem, z `pointer-events: none`, więc nie rusza klikania ani szkła:
  - `static`: dotychczasowe statyczne ziarno SVG (domyślny, wygląd bez zmian).
  - `off`: czysto, bez ziarna.
  - `film`: żywe ziarno skaczące 24 klatki na sekundę + delikatna winieta.
  - `crt`: linie kineskopu co 3 px, maska luminoforu RGB, słabe ziarno, mocniejsza winieta.
  - `tv`: linie, jasny pas przetaczający się w dół co 7 s, ziarno 30 kl/s, winieta.
  - `dither`: uporządkowany raster Bayera 4×4 (1 komórka = 1 px), w trybie ciemnym jasne punkty.
  - `live`: w spoczynku prawie nic, przy przeciąganiu, rozpędzie i zoomie ziarno i linie narastają, po zatrzymaniu miękko gasną (szybki atak, wolne wygaszanie; sygnał = prędkość kamery + siła zagięcia + sprężyna zoomu).
  Wartości krycia w `OVERLAYS`. Przy `prefers-reduced-motion` ziarno stoi, a pas TV jest wyłączony. Winieta w jasnym motywie jest słabsza.
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
- **Opcje**: na czas review zamiast ukrytego `options` jest widoczny pasek review (patrz wyżej). Wybór zapisuje się w adresie, więc link z parametrami otwiera tę samą konfigurację.
- **Telefon**: przeciąganie jednym palcem przesuwa planszę, dwa palce robią pinch-zoom (z tą samą sprężyną co kółko), tap otwiera panel jako bottom sheet. Efekty hover i wideo odpalają się tylko myszą, na dotyku kafle są statyczne.

## Zawartość labu

Od 2026-09-25 plansza jest wyczyszczona z placeholderów. Jest na niej jeden prawdziwy eksperyment:

- **01 · Glass Button** (`pieces/glass-button/`): przycisk jako prawdziwa, śledzona promieniami soczewka ze szkła (napis nadrukowany na wierzchu, osadzona kulka z gwiazdką); środkowym przyciskiem myszy można go obracać w 3D. Miniatura to zrzut z tej strony (`thumbs/glass-button.jpg`) z mapą głębi, więc działają na nim też tryby `depth`, `topo`, `scan`, `dof`, `light` i `relief`.

Pozostałe 17 prostokątów klastra to puste, nieklikalne sloty (`{ empty:true }` w PIECES, kolor `CFG.plainEmpty`) na kolejne eksperymenty. Nowy eksperyment: folder w `pieces/<slug>/`, zrzut `?still=1&bare=1`, wpis w PIECES w miejsce pustego slotu.

Stan z 18 placeholderami, referencjami, mapami głębi i warstwami z Figmy jest w tagu gita `lab-board-placeholders-2026-09-25`.

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
| `space` (URL) | `plane`, `field`, `tunnel`, `ring`, `sphere`, `stack` | plane |
| `hover` | `none`, `lift`, `lens`, `focus`, `depth`, `topo`, `scan`, `dof`, `light`, `relief` | lift |
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
