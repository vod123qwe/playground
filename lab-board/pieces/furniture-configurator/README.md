# 02 · Furniture Configurator

Niska szafka RTV (sideboard), którą buduje się ręcznie w 3D, jak w kreatorze szaf PAX z IKEA. Bazą jest dębowa szafka ze zdjęcia referencyjnego: drzwi, nisza nad szufladami, rant na blacie, czarna stalowa rama.

## Co można robić

- **Ręcznie w 3D (białe uchwyty, siatka 5 cm):** szerokość (prawy bok), wysokość (górna krawędź), przegrody między segmentami, półka w niszy. Przycisk „+” po prawej dodaje segment 40 cm.
- **Klik w front** zaznacza segment (lekko się uchyla) i otwiera pasek: *Door*, *Drawers* (1–4), *Shelves* (0–3), *Niche + drawer* (1–3 szuflady pod otwartą niszą), *Split* (dzieli segment ≥ 60 cm na pół), *Remove* (ostatni segment skraca szafkę, środkowy łączy się z sąsiadem).
- **Customize:** wymiary (szerokość 100–300, wysokość korpusu 35–90, głębokość 30–60, nogi/cokół 0–30 cm), podstawa (stalowa rama / cokół / wisząca), uchwyty (czarna listwa / push to open), rant na blacie, odcień dębu, lakier, scena (ściana z listwą przypodłogową, siatka, ekspozycja, wymiary), path tracing i liczba odbić światła.
- **Warianty** na dole: Sideboard 200 (ze zdjęcia), Media 160, Wide 260.
- **Export:** *Render · 4K* (path traced PNG 3840 × 2160, 300 próbek), *Plan for the joiner* (strona do druku / PDF: rysunek z przodu i z boku z wymiarami, zdjęcie, specyfikacja, lista cięcia z oklejaniem krawędzi, okucia), *Cut list · CSV*.

## Jak to jest zrobione

- **three.js 0.186** + **three-gpu-pathtracer 0.0.25** (z CDN jsDelivr, przez import map). Podczas edycji zwykły podgląd z materiałami PBR i cieniami; gdy nic się nie rusza (0,22 s), obraz przechodzi w path tracing i się doczyszcza (licznik próbek w lewym dolnym rogu).
- **Materiały:** fornir dębowy „Oak Veneer 01” z Poly Haven (CC0, autorka Jenelle van Heerden): kolor i relief 2K, matowość 1K; słoje w skali (kafel 140 cm), kierunek słojów zależny od elementu, przesunięcie tekstury na element. Stal malowana proszkowo, jasna podłoga z siatką co 50 cm, ciepła ściana.
- **Światło:** HDRI „Lebombo” (Poly Haven, CC0, 1K) + ciepłe słońce z lewej z przodu, które rzuca cień na ścianę.
- **Kamera** sama dopasowuje odległość do rozmiaru szafki i do wolnego miejsca obok otwartego panelu. Uchwyty i wymiary przygasają po 2,6 s bez ruchu myszy.

## Pliki

- `index.html` · cały konfigurator
- `assets/oak_diff.jpg`, `oak_nor.jpg`, `oak_rough.jpg` · fornir (CC0)
- `assets/lebombo_1k.hdr` · światło (CC0)

## Testy (28.09.2026)

Przeciąganie uchwytów (szerokość 200 → 225, przegroda 50 → 40, wysokość 50 → 60, półka niszy) z przyciąganiem co 5 cm; zmiana typu i liczby szuflad; dodawanie, dzielenie i usuwanie segmentów (usunięcie ostatniego skraca szafkę); warianty; path tracing (≈ 270 próbek po kilkunastu sekundach); eksport PNG, CSV i planu; panel i telefon 375 px (kamera mieści całą szafkę).

## Pomysły na dalej

Więcej fornirów (orzech, biały dąb), dekoracje w scenie (wazon, książki), głębia ostrości w renderze, przełączanie ujęć kamery, drewniana podłoga i dywan, eksport rysunku do DXF.

## Zmiany (28.09.2026, wieczór)

- **Panel na wspólnym stylu Lab UI** (`../../shared/`): suwaki z edytowalną liczbą, przeciąganiem etykiety, znacznikiem i podwójnym kliknięciem do wartości domyślnej bieżącego wariantu, zwijane grupy.
- **Uchwyty i wymiary płyną:** mają stałe klucze, więc przy zmianie wariantu czy rozmiaru przejeżdżają z poprzedniego miejsca (nowe się pojawiają, zbędne wygasają), zamiast skakać.
- **Podczas przeciągania** kursor znika, chwytany uchwyt robi się ciemny, pozostałe przygasają, a wymiary, które zmieniasz (np. oba sąsiednie segmenty przy przegrodzie, szerokość całości przy boku, wysokość przy górnej krawędzi, wysokość niszy przy półce), ciemnieją i lekko rosną.
- **Warianty można przesuwać** jak w Glass Button: pill idzie za palcem z oporem, po > 44 px przełącza i sprężyście wraca, nazwa wjeżdża z kierunku ruchu.
