# 01 · Glass Button

Pierwszy eksperyment labu. Szklany przycisk „Ask agents” z menu, studium po ujęciu znalezionym na recent.design. v2 (2026-09-25): szklana kopułka zamiast rtęci, przechylanie w 3D, Inter Tight.

- **Szkło**: matowa pigułka (`backdrop-filter: blur + saturate`), jasny rant, wewnętrzne cienie, miękki cień pod spodem.
- **Światło za kursorem**: plama światła na szkle podąża za kursorem; szkło budzi się już ok. 140 px przed dotknięciem i lekko ciągnie się do kursora (maks. 6 px).
- **Tęczowy rant**: cienkie spektralne przebłyski (conic-gradient maskowany do obrysu) krążą powoli wokół krawędzi i przechylają się w stronę kursora.
- **Błysk**: jedno przejście jasnego pasa po szkle, gdy kursor dociera do przycisku i po kliknięciu.
- **Poświata**: kolorowe światło rzucone przez szkło na tło, przesuwa się z kursorem.
- **Soczewka = gruba szklana kopułka** (v2, po drugiej analizie wideo): shader WebGL z profilem kaboszonu (płasko w środku, stromo przy brzegu). Przez szkło widać ciemne smugi „pokoju” za soczewką, powiększone i wygięte, z rozszczepieniem światła na trzy współczynniki załamania, więc brzegi smug opalizują. Rant to srebrny, zaokrąglony pierścień z cienką ciemną linią od środka i kilkoma wąskimi tęczowymi iskrami przy świetle. Soczewka „patrzy” w stronę kursora (kierunek widzenia i światło kluczowe idą za myszą, także z daleka), bez kursora powoli dryfuje sama. Naciśnięcie wprawia szkło w lekkie drżenie. Cień soczewki na pigułce przesuwa się przeciwnie do światła.
- **Gwiazdka**: gradient po skosie (ciepły róg, biały środek, niebieski dół), kąt gradientu idzie za kursorem, ciepły kolor oddycha od czerwieni do bursztynu; leży odrobinę głębiej niż szkło (paralaksa 1–2 px). Bez WebGL zostaje gradient CSS.
- **Pigułka w lekkiej przestrzeni**: przechyla się do kursora (do 9° / 7° w perspektywie 900 px), ma drugą linię rantu kilka px od krawędzi (grubość szkła), jaśniejsze brzegi (wypukłość) i biały odblask rantu w miejscu kursora.
- **Typografia**: Inter Tight 500, mniejszy stopień i większe paddingi (wysokość 3,1 em, lewy margines 0,5 em, prawy 1,2 em, odstęp 0,62 em), proporcje zmierzone z wideo.
- **Menu**: szklana lista (Research, Design, Build), otwierana kliknięciem albo strzałką w dół, obsługa klawiatury (strzałki, Enter, Escape), wybór zmienia etykietę.
- `?still=1&bare=1` zatrzymuje jedną ładną klatkę bez chrome'u; z niej powstaje miniatura (`../../thumbs/glass-button.jpg`, zrzut headless Edge 920×520 @2x) i jej mapa głębi.
