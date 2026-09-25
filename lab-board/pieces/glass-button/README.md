# 01 · Glass Button

Pierwszy eksperyment labu. Szklany przycisk „Ask agents” z menu, studium po ujęciu znalezionym na recent.design.

- **Szkło**: matowa pigułka (`backdrop-filter: blur + saturate`), jasny rant, wewnętrzne cienie, miękki cień pod spodem.
- **Światło za kursorem**: plama światła na szkle podąża za kursorem; szkło budzi się już ok. 140 px przed dotknięciem i lekko ciągnie się do kursora (maks. 6 px).
- **Tęczowy rant**: cienkie spektralne przebłyski (conic-gradient maskowany do obrysu) krążą powoli wokół krawędzi i przechylają się w stronę kursora.
- **Błysk**: jedno przejście jasnego pasa po szkle, gdy kursor dociera do przycisku i po kliknięciu.
- **Poświata**: kolorowe światło rzucone przez szkło na tło, przesuwa się z kursorem.
- **Soczewka z rtęci**: mały shader WebGL: kula odbija „studio” (pasek światła u góry, ciepły i chłodny bok), powierzchnia faluje jak płyn, blask jedzie za kursorem, a naciśnięcie wprawia metal w drżenie. Gwiazdka nad nią ma obracający się gradient. Bez WebGL zostaje gradient CSS.
- **Menu**: szklana lista (Research, Design, Build), otwierana kliknięciem albo strzałką w dół, obsługa klawiatury (strzałki, Enter, Escape), wybór zmienia etykietę.
- `?still=1&bare=1` zatrzymuje jedną ładną klatkę bez chrome'u; z niej powstaje miniatura (`../../thumbs/glass-button.jpg`, zrzut headless Edge 920×520 @2x) i jej mapa głębi.
