# 03 · Apartment Walk

Mieszkanie (typ 15, 4 piętro) przeniesione z rzutu do 3D w prawdziwych centymetrach. Na razie bryła: ściany, filary, otwory, balkony, sufit. Można je oglądać z góry albo wejść do środka i chodzić na wysokości oczu.

## Co można robić

- **Overview:** orbita nad bryłą (przeciąganie, kółko), nazwy pomieszczeń z metrażem. *Cut the walls at* przycina ściany na dowolnej wysokości (40–255 cm), a przekrój jest czarny jak na rzucie. Podwójne kliknięcie (na telefonie podwójne stuknięcie) w podłogę wchodzi w tryb spaceru w tym miejscu.
- **Walk:** kamera na wysokości oczu (165 cm). WASD albo strzałki, przeciąganie myszą rozgląda się, Shift przyspiesza, M przełącza tryb. Na telefonie gałka po lewej i przeciąganie palcem. Ściany i balustrady zatrzymują (ciało to okrąg 22 cm), a drzwi i drzwi balkonowe są otwarte. Szyba, do której podchodzisz, znika, jakby drzwi się otwierały. Na górze widać nazwę pomieszczenia, w rogu minimapę (kliknięcie w nią przenosi w to miejsce).
- **Customize:** przycięcie ścian, nazwy pomieszczeń, wyróżnienie grubych ścian, rzut na podłodze (do porównania z modelem) i jego krycie, wysokość oczu, prędkość, pole widzenia, sufit, kierunek słońca, ekspozycja.

## Skąd są wymiary

- **Ściany prosto z rysunku:** `tools/extract_plan.py` czyta rzut z meblami (`assets/plan.webp`), bierze ciemne piksele, usuwa cienkie linie (meble, skrzydła drzwi, teksty, wymiarowanie), zamienia plamy na wielokąty i przelicza na cm. Szachty narysowane jako obrysy stają się pełne.
- **Skala 1 cm = 1,209 px**, sprawdzona trzema wymiarami z rzutu: sypialnia 375 × 372 cm i łazienka 166 cm (wszystkie dają 1,208–1,210). Metraż sypialni z modelu: 13,9 m² (375 × 372 = 13,95).
- **Otwory zmierzone wzdłuż ścian** i porównane z rzutem architekta: w elewacji 268, 88, 178, 88 i 112 cm (w rzucie O17 270, O22 90, O25 180, O21 90). Drzwi wewnętrzne 78–79 cm (skrzydło 80), wejściowe 87 cm.
- **Wysokości:** w świetle 2,55 m (Hn/Hb z rzutu), drzwi balkonowe i okna od podłogi 242 cm, okno O25 w sypialni od 30 do 235 cm (HP 30), drzwi wewnętrzne 205 cm, wejściowe 210 cm.
- **Grube ściany** (zewnętrzne, konstrukcyjne, szachty) i działowe rozpoznane po grubości na rysunku (≥ ok. 15 cm), a nie z projektu konstrukcji.
- **Metraże** liczone do lic ścian, z pikseli: razem ok. 91 m² pomieszczeń, balkony osobno.

## Założenia do sprawdzenia

- Podział otworów w elewacji na część stałą i drzwi nie jest odwzorowany (jedna szyba z ramą i słupkiem w szerokich otworach).
- Balkony wyrysowane ręcznie z obrysu na rzucie (głębokość 150 cm, długości 550 / 602 / 367 cm). Balustrada szklana 105 cm.
- Wysokość nadproży drzwi wewnętrznych (205 cm) przyjęta typowo, rzut jej nie podaje.
- Brak stolarki drzwiowej, mebli i instalacji.

## Pliki

- `index.html` · widok (three.js 0.186 z jsDelivr)
- `apartment.json` · dane mieszkania w cm (generowane)
- `tools/extract_plan.py` · rysunek → dane (`python tools/extract_plan.py`, z `--debug` zapisuje też podgląd ścian)
- `assets/plan.webp` · rzut z meblami (źródło)

## Testy (28.09.2026)

Wszystkie pomieszczenia i trzy balkony osiągalne ze startu przy wejściu (przeszukanie siatki co 8 cm). Ściany zatrzymują w odległości promienia ciała (sypialnia: 41–370 cm przy licach 19 i 392 cm). Gałka na telefonie (375 px), minimapa, nazwa pomieszczenia, przejście Overview ↔ Walk, przycięcie ścian.
