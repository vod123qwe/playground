# Line Interactions

**Na planszy:** odblokowany kafel (`fresh:true`). Okładka i podgląd na żywo pokazują Pillars w trybie jasnym, w ustawieniach Jarka (Rounded, Square, 9 w rzędzie, zasięg 0,64, wysokość 1,35, fala 0,958; to też domyślne ustawienia): `?thumb=1&fig=Pillars&mode=light` dla miniatury i `?demo=1&fig=Pillars&mode=light`, gdzie kursor sam wędruje po polu i ciągnie za sobą falę. Blocks też ma swoje demo (`&fig=Blocks`). W trybie planszy rysunek idzie w ramce 4:3 miniatury, przyciętej jak obrazek, więc podmiana obrazka na podgląd niczego nie przesuwa.

(Dawniej Line Studio; nazwa zmieniona 06.10.2026. Folder i klucz ustawień zostały: `pieces/line-studio`, `lab.line-studio.v4`, żeby nie zgubić linków ani zapisanych ustawień.)

**W budowie:** za hasłem (`shared/lab-lock.js`), na planszy z kłódką (`locked:true`).

Ryciny w stylu planszy technicznej: cienkie linie na spokojnych wypełnieniach, **bez kropek w tle i bez napisów wokół ilustracji** (decyzja Jarka). Pigułka wariantów na dole przełącza ryciny.

**Shelf (Fig 5.1):** kasety VHS stoją na półce grzbietem do przodu (okienko ze szpulkami od boku, naklejka „TAPE 0X · E-180 · SP” wzdłuż grzbietu), za rzędem podpórka, w regale otwory na półki. Najechana kaseta wysuwa się trochę i jaśnieje. Złap i przeciągnij: kaseta wychodzi przed półkę i jedzie za kursorem, pozostałe rozsuwają się i robią lukę tam, gdzie ją trzymasz; puść, a wsunie się w lukę, podpórka dosunie się do końca rzędu. Kliknięcie bez przeciągania wysuwa kasetę do połowy (jakby czytać grzbiet), drugie ją wsuwa.

**Carousel (Fig 5.2):** cover flow jak slider w sekcji hero (wg szkicu Jarka): kasety magnetofonowe (naklejka „MIXTAPE 0X · SIDE A/B · C-60”, okienko ze szpulkami i taśmą, otwór na głowicę, śrubki) w rzędzie przez całą stronę, z lewej do prawej, lekko wznoszącym się w prawo, bez podstawki. Środkowa stoi frontem do widza, wysunięta do przodu i jasna; pozostałe obrócone bokiem (ok. 66°), z większym odstępem. Rząd jest bez końca: kasety krążą w pętli, przeskok z jednego końca na drugi dzieje się poza kadrem, więc można przewijać w nieskończoność w obie strony. Kółko myszy albo przeciąganie przesuwa rząd; po puszczeniu zatrzymuje się tak, że na środku zawsze stoi jedna kaseta. Kliknięcie innej przesuwa do niej. Strzałki ← → też. (Wcześniej: krąg na obrotnicy, potem skośny rząd w tacce, odrzucone.)

**Kolory karuzeli:** bez kropek na tle; jak przyciski labu w ciemnym trybie: tło #0e0e10, kasety #1c1c1f, jasne #f2f2f0 (w jasnym: tło #f3f2ee, kasety białe). Każda rycina może mieć własną paletę (`pal`) i tło bez kropek (`nodots`).

**Cranes (Fig 5.3):** (06.10.2026, wersja miękka: wszystkie części mają zaokrąglone narożniki w rzucie i pionowe linie konturu jak Blocks i Pillars; ruch na każdej osi rozpędza się i hamuje płynnie, bez przestrzelenia (krytycznie tłumione podążanie), najwolniej most, potem wózek i głowica, najszybciej palce; tempo z suwaka Speed). Później tego dnia, na prośbę Jarka „to musi być w pełni geometryczne”: same czyste bryły, bez ozdobników. Usunięte: łańcuch kabla, podziałki na belce i przy szynach, drabinki, koła wózków, kołnierze, tłoki, szczeliny, obejma rury, śruby, kratki, pulpit, odboje, kreskowanie zatoczek i narożniki gniazd. Chwytak to teraz płyta i dwie szczęki, które zamykają pudło z boków (pudła w zatoczce stoją co 1,85, żeby szczęki się mieściły). Kolejne poprawki: części stykają się płaszczyznami zamiast się przenikać, więc linie styku są widoczne (wózek na szynie, wieża na wózku, most na wieżach, wózek mostu jedzie po wierzchu belki, rękaw wisi przed belką nad hakiem, rura dochodzi do płyty, szczęki do jej spodu). Wieże są smuklejsze (0,64) od głębokości mostu (0,86), więc chowają się pod nim. Gniazdo pod kursorem pokazuje przerywany zarys pudła tam, gdzie pudło wyląduje: rośnie od 82% do pełnego rozmiaru, lekko oddycha, a przerywana linia celownicza biegnie w dół od chwytaka. Opis niżej dotyczy starszej, bogatszej wersji kółko i krzyżyk na zabudowanej platformie z suwnicami (wg wzoru Jarka, „jak dźwigi na statkach”). Platforma: cokół, śruby, kratki wentylacyjne, pulpit z przyciskami i ekranikiem, 9 gniazd wpuszczonych w platformę (06.10.2026): każde to płytki lej ze skośnymi ściankami, na dnie zapadnia z dwóch klap, pod nią szyb; wokół obramowanie i narożniki, szyny z podziałką po obu bokach, zatoczki z rzędem pudeł (paski przy krawędzi). Dwie suwnice na tych samych szynach: krzyżyki parkują z przodu, kółka z tyłu; wieże na kołach z drabinkami, belka z łańcuchem kabla, wózek, teleskopowa rura (nie rwie się przy opuszczaniu), chwytak: szeroka płyta z czterema szczelinami i dwoma tłokami, cztery palce na suwakach w szczelinach, po jednym na środku każdego boku pudła; otwarte stoją na końcach szczelin (nie odstają od płyty), zamknięte leżą płasko na ściankach. Wszystkie łączenia mają zakładkę zamiast styku płaszczyzn (wieża wchodzi w belkę, rura w płytę, belka wystaje za wieże), a na styku wieży z wózkiem i z belką są kołnierze, żeby żadne dwie krawędzie nie nakładały się na siebie. Rząd pudeł w zatoczce ma odstęp na palce. Tura: suwnica jedzie nad swój rząd pudeł, opuszcza chwytak, palce zaciskają się na pudle, podnosi; potem idzie za myszą nad pole pod kursorem; klik opuszcza pudło do gniazda, palce się otwierają, z gniazda unosi się lekki dymek; suwnica wraca na postój, rusza druga. Trzy w rzędzie: rozjaśnienie, linia przez trójkę; potem wszystkie zapadnie otwierają się w dół, pudła wpadają do ognia, z gniazd bije ciepłe światło (poświata na dnie szybów i ciepłe, addytywne sprite'y), po chwili unosi się dym, klapy się zamykają, zatoczki się uzupełniają i gra od nowa (remis też). Do testów: `FIG.win()` wygrywa partię, `FIG.tick()` liczy i rysuje jedną klatkę (panel przeglądarki dławi animację, więc czas trzeba symulować). Ruch spokojny (wolniej niż przesuwanie kaset), z pauzą na chwyt i puszczenie. Panel: „The noughts crane plays itself”. Kolory jak kasety, bez kropek.

**Widok (wszystkie ryciny):** przeciąganie po pustym tle obraca kąt (w poziomie i w pionie), kółko myszy przybliża (na karuzeli Ctrl + kółko albo szczypanie, bo kółko ją obraca), przyciski − / + / ⟲ w prawym dolnym rogu i klawisze + − 0. Domyślnie cała wizualizacja ok. 30% mniejsza niż pierwsza wersja.

**Ruch:** bez sprężyn i bez gumy (Jarek: „za agresywne”, „zbyt duży rubber”): każda wartość dojeżdża do celu i zwalnia, nic nie przestrzeliwuje. Suwak Speed w panelu.

**Panel:** Shelf: liczba kaset, wysuwanie przy najechaniu; Carousel: liczba kaset (9–31, domyślnie 21); wspólne: Speed (przechylanie widoku od kursora usunięte 06.10.2026). Ustawienia w `lab.line-studio.v4` (ostatnia rycina też).

**Jak to jest narysowane (three.js 0.186, kamera ortograficzna):** każda część to wypełnienie (Lambert, `polygonOffset`) plus `EdgesGeometry` jako linie; detale to odcinki na ścianach; naklejki to tekstury z canvasu (biały tekst, kolor nadaje materiał). Najechanie i łapanie: raycaster po bryłach. Dark / Light zmienia paletę materiałów; `body.dark` też, bo wspólny przełącznik Light / Dark go czyta.

**Na planszy:** `?thumb=1` (opcjonalnie `&mode=light`, `&fig=Carousel`), `?demo=1` ryciny same się ruszają. Miniatura: headless Edge z WebGL programowym (`--use-angle=swiftshader --enable-unsafe-swiftshader`), 520 × 390 @2x; w headless animacje nie zdążają (karuzela bez wysuniętej kasety), dlatego miniatura to półka.

Historia: studio z obrotowym stołem → stos VHS → półka VHS + karuzela kaset (05.10.2026). Czas animacji z `performance.now()`.

**Kształty (Fig 6, 06.10.2026):** trzy proste bryły geometryczne w tym samym liniowym stylu, które reagują na kursor (Layers, Cube, Coil i Globe były, ale Jarek je odrzucił). Wszystkie mają spokojne wygładzanie bez gumy, a to, na czym jest kursor, ma jasne linie.
- **Blocks:** taca z zaokrąglonymi klockami, tyle ile chcesz: Columns i Rows w panelu (do 24×24). Na każdym klocku jest mały krzyżyk.
  - Kursor podnosi łagodny pagórek, najwyżej klocek pod kursorem. Szerokość pagórka ustawia suwak Reach.
  - Klik wciska klocek jak klawisz i puszcza po tacy falę w kształcie pierścienia, która po drodze podnosi kolejne klocki.
  - Profil wysokości do wyboru: Random, Flat albo Steps.
  - Wcześniejsze odbicia pod spodem i zapadanie się sąsiadów są usunięte (Jarek ich nie czuł).
- **Fan:** pionowe karty w linii (Line) albo w kole (Circle). Łuk, spirala i efekt domina były, ale Jarek je usunął.
  - W panelu: liczba kart (5–40), odstęp (Spacing) i profil wysokości (Rising, Even, Wave).
  - Kursor wywołuje falę: bliskie karty unoszą się i odchylają. Krzywa jest podniesiona do potęgi (Focus, 1–8, domyślnie 3,5), więc karta pod kursorem wychodzi wyraźnie wyżej od sąsiadów, a tylko ona ma jasne linie. Wysokość ustawia Lift (domyślnie 0,9). Najechanie liczy się na niewidocznych kopiach kart w pozycji spoczynkowej, więc odchylające się sąsiadki nie przechwytują kursora. Wskazana karta zostaje wybrana, dopóki kursor jest w jej obrysie razem z podniesieniem i nic nie stoi bliżej, więc podnosząc się, nie oddaje najechania karcie za sobą.
- **Pillars:** pole słupków na płycie, a kursor działa jak magnes z gasnącą falą.
  - W panelu: kształt słupka (Square, Rounded, Round, Hex, Slab), układ pola (Square, Circle, Diamond, Ring, Cross), gęstość (7–17 w rzędzie), zasięg magnesu, wysokość i długość fali.
  - Płyta pod spodem dopasowuje się do pola: okrągła pod kołem i pierścieniem, obrócona pod rombem.

Zaokrąglone bryły mają obrys góry i dołu oraz dwie pionowe linie konturu, przeliczane co klatkę z kierunku kamery (`updateSils`).

**Keyboard:** przeniesiona do osobnego projektu `pieces/keyboard` (06.10.2026, prośba Jarka).

**Dźwięki (wszystkie figury liniowe):** syntetyzowane w przeglądarce, bez plików, bardzo ciche. Przeglądarka pozwala im zagrać dopiero po pierwszym kliknięciu albo naciśnięciu klawisza.
- **Klawisz:** krótki szum przez filtr pasmowy i miękkie niskie stuknięcie, a przy dużych klawiszach niżej.
- **Przejazd kursorem:** malutki dźwięk sinusa ze skali pentatonicznej, tylko tam, gdzie jest samo najechanie bez klikania (zasada Jarka: gdzie się klika, dźwięk tylko przy kliknięciu).
  - Fan: mała karta wysoko, duża nisko.
  - Pillars: od słupka do słupka.
- **Blocks przy kliknięciu:** miękkie stuknięcie.
- **Cranes:** tyknięcie, gdy szczęki chwytają pudło, i niski odgłos, gdy pudło ląduje w gnieździe.

W panelu jest grupa Sound: włącz/wyłącz, głośność i przycisk Test, który odgrywa klik i dwa tyknięcia. Ustawienia zapisują się w `sound`, `vol`.

Pierwsza wersja była za cicha (Jarek: „nie słyszę dźwięków”), więc poziomy podniesiono. Na wyjściu przy głośności 0,85 jest teraz: klik około −6 dBFS, duży klawisz −4, tyknięcie −16,5, stuknięcie −11, lądowanie pudła −10. Na końcu jest kompresor, żeby kilka dźwięków naraz nie przesterowało. Kontekst audio powstaje przy pierwszym kliknięciu albo klawiszu, wewnątrz gestu.

**Charakter kliku (06.10.2026, druga runda):** Jarek słyszy dźwięk w zwykłej przeglądarce (panel w aplikacji Claude wycisza audio) i chciał kliki delikatniejsze, stłumione i przyjemne dla ucha.
- **Soft (domyślny):** stłumione stuknięcie, szum przez filtr dolnoprzepustowy i okrągłe, niskie puknięcie.
- **Thock:** głębszy i okrąglejszy.
- **Crisp:** jaśniejszy, ale wciąż łagodny.

Na całości jest filtr dolnoprzepustowy około 5,2 kHz, który zdejmuje syk. Tyknięcia są niższe (od 520 Hz), mają miękki start (6 ms) i delikatnie opadają. Poziomy przy głośności 0,6: klik około −17 dBFS, puszczenie około −32, tyknięcie około −27. W panelu w grupie Sound jest wybór Click; zmiana od razu odgrywa próbkę.

**Drewniane dźwięki (06.10.2026, trzecia runda, wybór Jarka „drewniane, ciepłe”):** w Line Interactions dźwięki są tylko przy najechaniu (Fan, Pillars) i przy kliknięciu w Blocks oraz w dźwigach.
- Każdy dźwięk to krótkie, okrągłe stuknięcie jak pałeczką w drewniany klocek:
  - niska podstawa ze skali pentatonicznej od 196 Hz, lekko opadająca;
  - drugi składnik w niecałkowitym stosunku 2,76, który gaśnie pierwszy (to brzmi jak drewno, a nie dzwon);
  - odrobina filtrowanego szumu jako uderzenie.
- Blocks przy kliknięciu i lądowanie pudła w dźwigach mają głębsze puknięcie.
- Poziomy przy głośności 0,6: najechanie około −20 dBFS, kliknięcie −14, lądowanie −12.
- Wybór Click zniknął z panelu Line Interactions (był dla klawiatury, która ma teraz swój projekt). Test odgrywa trzy tyknięcia i puknięcie.