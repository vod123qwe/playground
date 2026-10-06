# Card Roll

Portfel: 8 kart płatniczych, przewijanych w jednym z pięciu ruchów. Kawałek planszy labu (WIP, za kłódką).

**Ruchy (Customize → Motion):**
- **Deck** (domyślny): talia kart stojących ciasno jak w kartotece, widziana z góry i lekko od przodu. Wybrana unosi się, rozpycha sąsiadki (tylne odchylają się), lekko odchyla się w tył, ale zostaje w środku talii.
- **Barrel** (startuje ze spacingiem 0.5 i uniesieniem 100): prawdziwa beczka jak picker w iOS. Karty leżą na walcu obok siebie jak klepki (nie nachodzą), te nad i pod wybraną zawijają się po walcu, dalsze chowają się za nim. Wybrana wychodzi z beczki do przodu i obraca się częściowo do patrzącego.
- **Roll**: talia w pętli widziana z góry. Aktywna karta zawsze z przodu (na dole ekranu, na wierzchu); swipe zsuwa ją lekko w dół i wygasza, odsłaniając kolejną; wraca, pojawiając się na końcu talii.
- **Wallet**: kolumna kart; wybrana widoczna cała, reszta pokazuje górne paski.
- **Fan**: wachlarz kart w górę wokół rogu, w pętli: aktywna karta leży z przodu, swipe zsuwa ją w dół i wygasza, odsłaniając kolejną.
- Każda karta podąża za scrollem po swojemu: im dalej od wybranej, tym później, więc talia rusza się falą. Każda przechyla się z własną prędkością (suwak „Tip while scrolling”), a poprzednia opada, gdy nowa się unosi. Bez sprężyn.
- Karty leżą warstwami jak papier (z-index), więc nigdy się nie przenikają.
- **Materiał:** Frosted (domyślnie: prawie przezroczysta tafla, mocny blur 28px tego, co pod spodem) albo Solid.
- Ostrość: rolka skalowana przez `zoom`, nie `scale`, więc tekst i logo nie są rozmyte.

**Jak działa**
- Scroll, przeciąganie albo strzałki kręcą rolką. Po zatrzymaniu rolka dosiada do najbliższej karty, a ta unosi się na wierzch.
- Karty z tyłu chowają się w górę i ściskają w perspektywie, karty z przodu nachodzą na siebie jak w portfelu (widać pasek z numerem i logo). Wszystkie 8 zostaje w kadrze, bez obrotu na 360°.
- Klik w kartę na wierzchu wyciąga ją na środek (lekko większa, idzie za kursorem, światło po niej przesuwa się), reszta się rozmywa. Klik obok, scroll albo Escape chowa ją z powrotem. Klik w inną kartę najpierw do niej przewija.
- Karty mają grubość (dwie warstwy krawędzi pod spodem), ziarno, chip, znak zbliżeniowy i połysk zależny od kąta.

**Karty:** Halden (slate, Visa), Northwind Reserve (czarny metal, Mastercard), Kite (koral, Visa), Fern (zieleń z poziomicami, Mastercard), Lumen (perła, Visa), Nova (aurora, Mastercard), Atlas (piasek, Amex), Volt (grafit z limonką, Mastercard). Banki wymyślone, logotypy sieci prawdziwe (ćwiczenie).

**Customize:** widok z góry, odstęp kart, promień rolki, podwinięcie, prędkość scrolla, uniesienie karty, rozmiar wyciągniętej, rozmycie reszty, podążanie za kursorem, rozmiar.
Ustawienia: `lab.card-roll.v1`, tryb jasny/ciemny w `.mode`.

**Plansza:** `?thumb=1` nieruchoma rolka (trzecia karta na wierzchu), `?demo=1` rolka sama się kręci i co drugi obieg wyciąga kartę. Ramka 320:440.

Do testów jest `window.ROLL` (`turnTo`, `open`, `close`, `pos`).
- **Blur with depth:** im dalej z tyłu karta, tym mocniej rozmyta, i coraz szybciej z głębią (progresywny blur do 18 px, suwak do 3×, we wszystkich trybach).

**Ustawienia startowe (strojone przez Jarka):**
- Deck: widok z góry 52°, spacing 1.6, uniesienie 47, rozmycie w głębi 2.85.
- Roll: widok z góry 40°, spacing 1.9, uniesienie 34, rozmycie w głębi 0.6.
- Wspólne: tip 0.6, scroll 1.5, wyciągnięta 1.44×, blur reszty 16.5, bez podążania za kursorem, karty Solid.
- Każdy ruch startuje ze swoim zestawem (widok, spacing, uniesienie, rozmycie w głębi) przy przełączeniu.

**Przełącznik wariantów:** pastylka na dole na środku (wspólne `LabUI.variants`: strzałki, swipe, menu); to samo co w panelu.

**Jakość:** karty rysowane w 2× rozdzielczości (`--q`, `Q`) i pomniejszane, więc wyciągnięta karta nie mydli się.
**Grubość:** usunięta (warstwy krawędzi dawały ostry, mocny border); zostaje miękkie fazowanie frontu.

**Karty:** jeden zestaw, gradientowy: gładkie nowoczesne gradienty i jeden duży kształt wygaszany alfą do zera (pierścień, kula światła, łuki, słoje, fala), ziarno prawie niewidoczne. Emerald, Midnight, Sunset, Ice, Graphite, Lilac, Ocean, Volt. (Zestaw Grain usunięty.)

**Wypukłość:** front lekko wypukły (fazowanie: jasny brzeg u góry, cień u dołu i po bokach), subtelny połysk na styku frontu z krawędzią.

**Frosted glass (osobna grupa w panelu):** Frost (blur tła, domyślnie 40 px), Milk (mleczność szronu), Card colour (ile koloru karty zostaje), Colour through (nasycenie tego, co prześwituje), Lens edge (siła soczewkowej krawędzi: pas przy brzegu z jaśniejszym, mniej rozmytym tłem i jasną obwódką), Lens width (szerokość pasa), Grain (domyślnie prawie zero).
Preset: ustaw i kliknij Copy settings, wynik (tylko zmiany względem domyślnych) można wkleić jako nowe DEF.
- **Refrakcja (Chrome/Edge):** pas przy krawędzi szkła wygina tło (filtr SVG feDisplacementMap jako backdrop-filter, mapa liczona z zaokrąglonego prostokąta). Lens edge = siła wygięcia, Lens width = szerokość pasa. W Safari zostaje jaśniejszy pas bez wygięcia.
- **Preset Frosted (Jarek):** przełączenie na Frosted ustawia Frost 10, Colour through 1.5, Milk 0, Card colour 0.22, Lens edge 0.08, Lens width 3, Blur the rest 13, Drawn out 1.24, Follow the pointer włączone (FROST w kodzie). Ruch i rozmiar zostają bez zmian.
- **Refraction / Bezel (liquid glass, Chrome/Edge):** cała tafla wygina tło (feDisplacementMap w backdrop-filter `#glassF`), mocniej w pasie przy krawędzi (Bezel), potem szron (Frost). Refraction = siła w px. Lens edge/Lens width to sam połysk krawędzi: cienka jasna linia gradientowa (najjaśniej góra i lewo), bez ciemnego cienia.

**Presety Frosted per ruch (Jarek, `GLASS` w kodzie):** wybranie Frosted albo zmiana ruchu przy Frosted wczytuje bazę dla danego ruchu.
- Wspólne szkło (FROST, też dla Barrel): Frost 11, Colour through 1.9, Milk 0.14, Card colour 0, Grain 0, Lens edge 0, Lens width 8.5, Refraction 74, Bezel 31, Blur the rest 8, Drawn out 1.2, Follow on, Size 0.65.
- Roll: Refraction 53, Bezel 22, widok 40°, spacing 2.6, blur głębi 0.25, uniesienie 57.
- Deck: widok 50°, spacing 1.6, blur głębi 0.45, uniesienie 47.
- Fan: widok 20°, spacing 1, blur głębi 1.2, uniesienie 47, Blur the rest 8.5, Drawn out 1.18.
- Wallet: Frost 13, Colour through 1.6, Milk 0.12, Grain 0.04, Lens edge 0.01, Refraction 36, widok 16°, spacing 1, blur głębi 0.4, uniesienie 0, Blur the rest 6.5, Drawn out 1.14.

**Przełącznik Color / Frost:** obok pastylki wariantów na dole; to samo co Look → Cards w panelu (Frost wczytuje preset ruchu).
**Cover na planszy:** `?thumb=1` / `?demo=1` pokazują szklaną talię Deck (preset Frosted) na ciemnym tle; `?mode=light` dla jasnego.

**Wydajność (telefon):** na ekranach 2-3× karty idą w 1× (Q), bo ekran i tak jest ostry; załamanie światła (#glassF) tylko na karcie na wierzchu; karta głęboko w rozmyciu nie liczy szronu tła; style pisane tylko przy zmianie (put/cls), rozmycie w krokach 0,25 px.
