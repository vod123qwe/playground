# Line Studio

**W budowie:** za hasłem (`shared/lab-lock.js`), na planszy z kłódką (`locked:true`).

Ryciny w stylu planszy technicznej: cienkie linie na spokojnych wypełnieniach, **bez kropek w tle i bez napisów wokół ilustracji** (decyzja Jarka). Pigułka wariantów na dole przełącza ryciny.

**Shelf (Fig 5.1):** kasety VHS stoją na półce grzbietem do przodu (okienko ze szpulkami od boku, naklejka „TAPE 0X · E-180 · SP” wzdłuż grzbietu), za rzędem podpórka, w regale otwory na półki. Najechana kaseta wysuwa się trochę i jaśnieje. Złap i przeciągnij: kaseta wychodzi przed półkę i jedzie za kursorem, pozostałe rozsuwają się i robią lukę tam, gdzie ją trzymasz; puść, a wsunie się w lukę, podpórka dosunie się do końca rzędu. Kliknięcie bez przeciągania wysuwa kasetę do połowy (jakby czytać grzbiet), drugie ją wsuwa.

**Carousel (Fig 5.2):** cover flow jak slider w sekcji hero (wg szkicu Jarka): kasety magnetofonowe (naklejka „MIXTAPE 0X · SIDE A/B · C-60”, okienko ze szpulkami i taśmą, otwór na głowicę, śrubki) w rzędzie przez całą stronę, z lewej do prawej, lekko wznoszącym się w prawo, bez podstawki. Środkowa stoi frontem do widza, wysunięta do przodu i jasna; pozostałe obrócone bokiem (ok. 66°), z większym odstępem. Rząd jest bez końca: kasety krążą w pętli, przeskok z jednego końca na drugi dzieje się poza kadrem, więc można przewijać w nieskończoność w obie strony. Kółko myszy albo przeciąganie przesuwa rząd; po puszczeniu zatrzymuje się tak, że na środku zawsze stoi jedna kaseta. Kliknięcie innej przesuwa do niej. Strzałki ← → też. (Wcześniej: krąg na obrotnicy, potem skośny rząd w tacce, odrzucone.)

**Kolory karuzeli:** bez kropek na tle; jak przyciski labu w ciemnym trybie: tło #0e0e10, kasety #1c1c1f, jasne #f2f2f0 (w jasnym: tło #f3f2ee, kasety białe). Każda rycina może mieć własną paletę (`pal`) i tło bez kropek (`nodots`).

**Cranes (Fig 5.3):** kółko i krzyżyk na zabudowanej platformie z suwnicami (wg wzoru Jarka, „jak dźwigi na statkach”). Platforma: cokół, śruby, kratki wentylacyjne, pulpit z przyciskami i ekranikiem, 9 gniazd z podwójnym obramowaniem i narożnikami, szyny z podziałką po obu bokach, zatoczki z rzędem pudeł (paski przy krawędzi). Dwie suwnice na tych samych szynach: krzyżyki parkują z przodu, kółka z tyłu; wieże na kołach z drabinkami, belka z łańcuchem kabla, wózek, teleskopowa rura (nie rwie się przy opuszczaniu), chwytak z dwoma tłokami i czterema palcami. Tura: suwnica jedzie nad swój rząd pudeł, opuszcza chwytak, palce zaciskają się na pudle, podnosi; potem idzie za myszą nad pole pod kursorem; klik opuszcza pudło do gniazda, palce się otwierają, z gniazda unosi się lekki dymek; suwnica wraca na postój, rusza druga. Trzy w rzędzie: rozjaśnienie, linia przez trójkę, pudła zapadają się w gniazda, zatoczki się uzupełniają, gra od nowa (remis też). Ruch spokojny (wolniej niż przesuwanie kaset), z pauzą na chwyt i puszczenie. Panel: „The noughts crane plays itself”. Kolory jak kasety, bez kropek.

**Widok (wszystkie ryciny):** przeciąganie po pustym tle obraca kąt (w poziomie i w pionie), kółko myszy przybliża (na karuzeli Ctrl + kółko albo szczypanie, bo kółko ją obraca), przyciski − / + / ⟲ w prawym dolnym rogu i klawisze + − 0. Domyślnie cała wizualizacja ok. 30% mniejsza niż pierwsza wersja.

**Ruch:** bez sprężyn i bez gumy (Jarek: „za agresywne”, „zbyt duży rubber”): każda wartość dojeżdża do celu i zwalnia, nic nie przestrzeliwuje. Suwak Speed w panelu.

**Panel:** Shelf: liczba kaset, wysuwanie przy najechaniu; Carousel: liczba kaset (9–31, domyślnie 21); wspólne: Speed, przechylanie od kursora. Ustawienia w `lab.line-studio.v4` (ostatnia rycina też).

**Jak to jest narysowane (three.js 0.186, kamera ortograficzna):** każda część to wypełnienie (Lambert, `polygonOffset`) plus `EdgesGeometry` jako linie; detale to odcinki na ścianach; naklejki to tekstury z canvasu (biały tekst, kolor nadaje materiał). Najechanie i łapanie: raycaster po bryłach. Dark / Light zmienia paletę materiałów; `body.dark` też, bo wspólny przełącznik Light / Dark go czyta.

**Na planszy:** `?thumb=1` (opcjonalnie `&mode=light`, `&fig=Carousel`), `?demo=1` ryciny same się ruszają. Miniatura: headless Edge z WebGL programowym (`--use-angle=swiftshader --enable-unsafe-swiftshader`), 520 × 390 @2x; w headless animacje nie zdążają (karuzela bez wysuniętej kasety), dlatego miniatura to półka.

Historia: studio z obrotowym stołem → stos VHS → półka VHS + karuzela kaset (05.10.2026). Czas animacji z `performance.now()`.
