# Badge

**Gotowy:** odblokowany na planszy (`fresh:true`), z podglądem na żywo po najechaniu (`?demo=1`). Pomysł Jarka (06.10.2026). Inspiracja: patterny z pasów w identyfikacjach wizualnych, w których ukośne linie zamieniają kolory pasów miejscami, oraz ściany z geometrycznych kafli. Żadnej marki ani logo nie kopiujemy.

**Co to jest:** plakietka na smyczy wisi na środku strony.
- Dwie taśmy schodzą z góry, szeroko rozstawione, i łączą się w metalowym zacisku.
- Plakietka wisi na kółku przełożonym przez szczelinę.
- Możesz złapać plakietkę w dowolnym miejscu albo złapać taśmę, pociągnąć i puścić. Plakietka buja się i obraca wokół kółka, a taśmy luzują się i napinają.
- Tap w plakietkę (bez przeciągania) losuje nowy pattern i lekko ją trąca.

**Fizyka:** prosty świat verlet.
- Plakietka to sztywny zestaw pięciu punktów: cztery rogi i otwór, każdy połączony z każdym.
- Kółko to krótki pręt łączący otwór z zaciskiem.
- Taśmy to łańcuchy po 16 odcinków. Mogą się luzować, ale nie rozciągają się.
- Trzymany punkt plakietki jest ciągnięty do kursora, a ruch rozkłada się na rogi wagami biliniowymi.
- Zmiana rozmiaru okna przesuwa cały świat i nie resetuje bujania.

**Generator patternu:**
- Pasy są w dwóch kolorach. Linie y = f(x) idą w poprzek pasów. Pod nieparzystą liczbą linii kolory pasa się zamieniają (XOR).
- Kształty: Arrows, V, Zigzag, Diamonds, Bowtie, Slant. Liczbę pasów i powtórzeń da się ustawić, a kierunek może być pionowy albo poziomy.
- Faza przesuwa linie, więc kształty powoli dryfują.
- Tył strzałki i krok ukosu to stromy skos szeroki na jeden pas, a nie pionowy skok. Pionowy skok zostawiałby przy dryfie cienkie drzazgi.
- Rysowanie: każdy pas jest pocięty na wąskie plasterki, a ciemne kawałki tworzą jedną ścieżkę wypełnioną raz. Dzięki temu nie ma szwów na łączeniach.

**Formy grafiki** (pasek u góry ma 150 jednostek wysokości, panel: Graphic, Form). Każda kompozycja jest układana z seeda: Shuffle i „New layout” losują nową, a reload zachowuje obecną. Każda forma lekko się rusza z dryfem.
- **Stripes:** generator opisany wyżej. Doszedł kształt Lens: krzywe linie, pasy wybrzuszają się w soczewki.
- **Rays:** cienkie linie z jednego punktu (w środku albo zza prawej krawędzi), pod nimi pastelowe kropki.
- **Threads:** przecinające się duże elipsy, kropki pod spodem.
- **Orbits:** pierścienie stykające się w jednym punkcie albo wysokie elipsy obok siebie, na zmianę ciągłe i przerywane, po nich jadą kropki.
- **Blobs:** pastelowe elipsy dryfujące po polu.
- **Facets:** w każdej kolumnie klepsydra; przewężenie jeździ w górę i w dół, a na wierzchu jest lekki gradient.
- **Tiles:** ściana kwadratowych kafli z prostymi figurami (pas z kołem, romb z kwadratem, ramka, dwa koła, cztery płatki, klepsydra z półkoli, szachownica, ćwiartka koła, pasy, łuk z kołem), płaskie kolory z cienkim obrysem. Tap w kafel losuje tylko ten kafel (z małym „pop”), reszta zostaje. Zestawy kolorów kafli: Playground, Pastel, Earth i Card (paleta karty). Detail to liczba kolumn (3–6).
- **Eye:** oko w kształcie migdała, tęczówka z kreskami (jedna w kolorze karty), mruga co kilka sekund i patrzy za kursorem.

Suwak Detail zmienia liczbę linii, elips, orbit, plam lub kolumn. Palety mają teraz osobny kolor pola grafiki (field), pastel na kropki (dot) i głęboki kolor na kształty (deep). Doszła paleta Lilac.

**Fonty** (panel: Type, Fonts):
- **Editorial:** Instrument Serif + Geist Mono;
- **Grotesk** (domyślny): Google Sans Flex, czyli font głównej planszy labu, + JetBrains Mono;
- **Classic:** Newsreader z kursywą przy roli + IBM Plex Mono.

Domyślnie: Grotesk, paleta Coral, forma Blobs. Wszystkie fonty ładują się przed pierwszym rysowaniem, więc przełączanie jest natychmiastowe.

**Karta:**
- u góry pasek patternu ze szczeliną;
- blok w kolorze karty z przykładowym imieniem i nazwiskiem „Alex Morgan” oraz napisem „Guest” (Instrument Serif);
- rzędy pisane monospace;
- mały znak z trzech kresek z przesuniętym środkiem i napis „lab”.

Wszystko to placeholdery.

**Panel:**
- **Pattern:** kształt, liczba pasów, powtórzenia, dryf, kierunek;
- **Colour:** palety Coral, Sky, Mint, Stone, Night; opcja pasów w kolorze karty;
- **Lanyard:** rozstaw taśm u góry, ciężar, jak długo się buja;
- **Look:** rozmiar;
- na dole przyciski Shuffle i Reset.

Ustawienia zapisują się w `lab.badge.v1`.

**Plansza:**
- `?thumb=1`: plakietka wisi nieruchomo.
- `?demo=1`: co kilka sekund plakietka dostaje lekkie pchnięcie, a co trzecie pchnięcie losuje nowy pattern.

Do testów jest `window.BADGE`.
