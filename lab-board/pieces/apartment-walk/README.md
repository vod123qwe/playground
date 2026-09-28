# 03 · Apartment Walk

Mieszkanie (typ 15, 4 piętro) przeniesione z rzutu do 3D w prawdziwych centymetrach. Bryła (ściany, filary, otwory, balkony, sufit) plus stolarka: drzwi wewnętrzne, okna i drzwi balkonowe, balustrady. Można je oglądać z góry albo wejść do środka i chodzić na wysokości oczu.

## Co można robić

- **Overview:** orbita nad bryłą (przeciąganie, kółko), nazwy pomieszczeń z metrażem. *Cut the walls at* przycina ściany na dowolnej wysokości (40–255 cm), a przekrój jest czarny jak na rzucie. Podwójne kliknięcie (na telefonie podwójne stuknięcie) w podłogę wchodzi w tryb spaceru w tym miejscu.
- **Walk:** kamera na wysokości oczu (165 cm). WASD albo strzałki, przeciąganie myszą rozgląda się, Shift przyspiesza, M przełącza tryb. Na telefonie gałka po lewej i przeciąganie palcem. Ściany, balustrady, szyby i zamknięte skrzydła zatrzymują (ciało to okrąg 22 cm); wejście w zamknięte drzwi je otwiera. Na górze widać nazwę pomieszczenia, w rogu minimapę (kliknięcie w nią przenosi w to miejsce).
- **Customize:** przycięcie ścian, nazwy pomieszczeń, wyróżnienie grubych ścian, rzut na podłodze (do porównania z modelem) i jego krycie, wysokość oczu, prędkość, pole widzenia, sufit, kierunek słońca, ekspozycja.

## Stolarka i balkony (decyzje Jarka, 28.09.2026)

- **Drzwi wewnętrzne:** Porta Vector Premium model V, bezprzylgowe 80, białe, pełne (dwa frezowane panele, każdy z podwójną linią), ościeżnica z opaskami. Klamki Metal-Bud Rumba z kwadratowym szyldem, nikiel satyna velvet. Kierunek otwierania i strona zawiasów z łuków na rzucie.
- **Ukryte drzwi** w pralni (dawna druga toaleta) i spiżarni (dawna garderoba): skrzydło w kolorze ściany, w jej płaszczyźnie, z cienką szczeliną. Klamka Rumba jak w pozostałych (założenie).
- **Okna i drzwi balkonowe:** od środka białe ramy i białe klamki, od zewnątrz grafit. Salon (270): trzy skrzydła, lewe stałe, środkowe i prawe otwierane do środka na oścież. Sypialnia 1 (270): trzy skrzydła, prawe otwierane. Pozostałe drzwi balkonowe: jedno skrzydło otwierane (w 180 drugie stałe). Okno w sypialni (O25): poprzeczka na 94 cm, pod nią pozioma szyba uchylna od góry, nad nią dwie stałe.
- **Profile okien (sprawdzone z rysunkami przekrojów REHAU SYNEGO, typowy PVC 80 mm):** rama widoczna 5 cm (kolejne 1,5–2 cm pod tynkiem), skrzydło okienne 5,7 cm, skrzydło drzwiowe 8,4 cm, szyba stała tylko w listwie 2 cm (bez skrzydła), słupek stały 9,6 cm, słupek ruchomy pary skrzydeł 5 cm. Razem przy obwodzie ok. 11 cm w oknie i 13,5 cm w drzwiach (katalog: 117 i 144 mm z częścią pod tynkiem), między skrzydłami pary 16 / 22 cm (katalog: 164 / 218 mm).
- **Balustrady:** szklane panele ok. 115 cm między aluminiowymi słupkami, pochwyt. Balkon salonu przezroczysty, balkony sypialni i pokoju dziecka mleczne. Boki balkonów sypialni stoją na filarach 25 cm od krawędzi okna (na rzucie dotykają okna, a balustrada na nie nachodziła).
- **Sterowanie:** kliknięcie skrzydła albo E otwiera i zamyka; wejście w zamknięte drzwi (także balkonowe) je otwiera. Nad tym, co się otwiera, kursor zmienia się w dłoń (ta sama co w Glass Button: przechyla się z ruchem, przy kliknięciu się zaciska). Panel: Doors → As left / Open / Closed.
- **Spacja + przeciąganie** (Overview): przesuwa model po podłodze, z dłonią w miejscu kursora. Podpowiedź sterowania stoi nad przełącznikiem Overview / Walk.

## Skąd są wymiary

- **Ściany prosto z rysunku:** `tools/extract_plan.py` czyta rzut z meblami (`assets/plan.webp`), bierze ciemne piksele, usuwa cienkie linie (meble, skrzydła drzwi, teksty, wymiarowanie), zamienia plamy na wielokąty i przelicza na cm. Szachty narysowane jako obrysy stają się pełne.
- **Wyprostowane obrysy:** każda krawędź ściany jest przyciągana do jednego z czterech kierunków budynku (osie rysunku, elewacja 52,2°, ściana kuchni −37,8°), położenie liczone ze wszystkich pikseli krawędzi, narożniki ostre (bez schodków pikseli i zaokrągleń). Jeden obrys na cały mur, więc lica biegną bez szwów; nadproża, podokienniki, podłoga i strop dociągnięte do tych samych płaszczyzn.
- **Skala 1 cm = 1,209 px**, sprawdzona trzema wymiarami z rzutu: sypialnia 375 × 372 cm i łazienka 166 cm (wszystkie dają 1,208–1,210). Metraż sypialni z modelu: 13,9 m² (375 × 372 = 13,95).
- **Otwory zmierzone wzdłuż ścian** i porównane z rzutem architekta: w elewacji 268, 88, 178, 88 i 112 cm (w rzucie O17 270, O22 90, O25 180, O21 90). Drzwi wewnętrzne 78–79 cm (skrzydło 80), wejściowe 87 cm.
- **Wysokości:** w świetle 2,55 m (Hn/Hb z rzutu), drzwi balkonowe i okna od podłogi 242 cm, okno O25 w sypialni od 30 do 235 cm (HP 30), otwór drzwi wewnętrznych 208 cm (skrzydło 203,7 + ościeżnica), wejściowe 210 cm.
- **Nadproża i podokienniki** biorą grubość z muru po obu stronach otworu (mediana z przekrojów) i lekko na niego zachodzą, więc licują ze ścianą.
- **Grube ściany** (zewnętrzne, konstrukcyjne, szachty) i działowe rozpoznane po grubości na rysunku (≥ ok. 15 cm), a nie z projektu konstrukcji.
- **Metraże** liczone do lic ścian, z pikseli: razem ok. 91 m² pomieszczeń, balkony osobno.

## Założenia do sprawdzenia

- Które skrzydła w sypialniach są otwierane (poza salonem i oknem O25) przyjęte z łuków na rzucie.
- Balkony wyrysowane ręcznie z obrysu na rzucie (głębokość 150 cm, długości 550 / 602 / 367 cm). Balustrada szklana 105 cm.
- Drzwi wejściowe: gładkie grafitowe skrzydło (model nieznany).
- Brak mebli i instalacji.

## Pliki

- `index.html` · widok (three.js 0.186 z jsDelivr)
- `apartment.json` · dane mieszkania w cm (generowane)
- `tools/extract_plan.py` · rysunek → dane (`python tools/extract_plan.py`, z `--debug` zapisuje też podgląd ścian)
- `assets/plan.webp` · rzut z meblami (źródło)

## Testy (28.09.2026)

Wszystkie pomieszczenia i trzy balkony osiągalne ze startu przy wejściu (przeszukanie siatki co 8 cm). Ściany zatrzymują w odległości promienia ciała (sypialnia: 41–370 cm przy licach 19 i 392 cm). Gałka na telefonie (375 px), minimapa, nazwa pomieszczenia, przejście Overview ↔ Walk, przycięcie ścian.
