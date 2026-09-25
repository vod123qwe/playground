# 01 · Glass Button

Pierwszy eksperyment labu. Szklany przycisk „Ask agents” z menu, studium po ujęciu znalezionym na recent.design, dalej rozwijane po zdjęciach fizycznych przycisków z akrylu i ujęciu „Liquid glass”.

## v4 (2026-09-25): prawdziwe 3D, napis na szkle

Cała scena to mały ray tracer w jednym shaderze WebGL2 (GLSL 300 es). DOM-owy `<button>` zostaje jako prawdziwa, dostępna kontrolka (fokus, klawiatura, menu), ale jest niewidoczny i podaje shaderowi tylko geometrię: pigułkę, kulkę, napis i strzałkę.

- **Bryła jak M&M**: kapsuła leżąca na stronie, wysoka kopuła na górze (0,72 promienia), płaskie dno (0,26). Przecięcie promienia liczone dokładnie (analitycznie), bez marchingu: górna i dolna połówka to ta sama kapsuła przeskalowana w osi z.
- **Załamanie przez objętość**: promień wchodzi w szkło, może odbić się w środku do dwóch razy (całkowite wewnętrzne odbicie przy rancie, stąd złożony, lustrzany pas strony przy krawędzi), wychodzi z trzema współczynnikami załamania (rozszczepienie na kanały) i trafia w stronę: gradient, siatka, ramka, cień z kaustyką. Delikatny chłodny odcień rośnie z grubością szkła.
- **Napis i strzałka na wierzchu**: nadruk (tekstura z Inter Tight 500) rzutowany z góry na górną powierzchnię, jak farba na akrylu. Jest ostry i leży nad tym, co robi szkło, więc czyta się jak interfejs, a nie jak coś pod szybą.
- **Kulka osadzona w szkle**: ciemna szklana kula, której czubek wystaje ponad kopułę. W środku, na płaszczyźnie przez jej środek, wypukła czteroramienna gwiazdka (superelipsa z własnymi normalnymi), gradient ciepły → biały → niebieski. Z boku widać ją pod kątem.
- **Powierzchnia**: odbicie „studia” (softbox od strony światła i długi pasek), Fresnel, światło kluczowe i wąski błysk, tęczowe iskry na rancie od strony światła.
- **Obrót 3D**: przytrzymaj kółko myszy (albo Alt) i przeciągnij, na dotyku dwa palce. Poziom zawsze zostaje poziomem. Widok zostaje tam, gdzie go zostawisz; wraca po kliknięciu „reset view” albo klawiszem R / 0. Kursor dodatkowo lekko przechyla widok i steruje światłem.
- **Wygładzanie**: 4 promienie na piksel na obiekcie, 1 na tle.
- **Menu**: jasna szklana lista (Research, Design, Build) z ciemnym tekstem, klawiatura: strzałki, Enter, Escape.
- `?still=1&bare=1`: zamrożone światło i czas, bez chrome'u; z tego robiona jest miniatura (`../../thumbs/glass-button.jpg`, headless Edge 920×520 @2x) i jej mapa głębi.
- Bez WebGL2: zwykła matowa pigułka w CSS.

Poprzednie wersje są w historii gita: v1 rtęć, v2 szklana kopułka w płaskiej pigułce, v3 wypukła płyta szkła nad „nadrukiem” (napis był pod szkłem, co wyglądało nienaturalnie).
