# 01 · Glass Button

Pierwszy eksperyment labu. Szklany przycisk „Ask agents” z menu, studium po ujęciu znalezionym na recent.design, v3 po zdjęciach fizycznych przycisków z akrylu i ujęciu „Liquid glass”.

## v3 (2026-09-25): prawdziwa bryła szkła

Cała scena to jeden shader WebGL2. DOM-owy `<button>` zostaje jako prawdziwa, dostępna kontrolka (fokus, klawiatura, menu), ale jest niewidoczny i podaje shaderowi tylko geometrię: pigułkę, kulkę, napis i strzałkę.

- **Nadruk pod szkłem**: tło strony, delikatna siatka, ramka, ciemny napis i strzałka rysowane do tekstury 2D (Inter Tight 500), plus analityczna kulka z gwiazdką. Wszystko to leży *pod* szkłem.
- **Szkło jak M&M**: kapsuła, której przekrój w krótkiej osi to łuk koła (grubość 0,82 promienia), więc jest wypukła na całej szerokości, stroma przy brzegu i płaska w środku. Promienie załamują się przez nią do nadruku (trzy współczynniki załamania na kanały), więc środek lekko powiększa, a brzeg ściska.
- **Lustrzane kopie przy krawędzi**: wzdłuż rantu szkło pokazuje złożoną, odbitą kopię tego, co jest w środku, jak na zdjęciu fizycznych przycisków.
- **Powierzchnia**: odbicie studia rosnące przy kątach ślizgowych, światło kluczowe i wąski błysk, tęczowe iskry na rancie od strony światła, jasna sama krawędź.
- **Cień z kaustyką**: szkło rzuca miękki cień w stronę przeciwną do światła, a w jego środku skupione światło.
- **Kulka i gwiazdka w 3D**: ciemna szklana kula z blaskiem, ciemnym rdzeniem, jasnym rantem i światłem zebranym u dołu; w środku wypukła czteroramienna gwiazdka (superelipsa, wysokość z odległości od brzegu, własne normalne i połysk), gradient ciepły → biały → niebieski, lekko głębiej niż powierzchnia kuli.
- **Mysz**: kursor jest jednocześnie widzem i światłem, więc załamanie, lustrzane pasy, odblaski, iskry i cień przesuwają się z ruchem. Bez kursora światło powoli dryfuje. Wciśnięcie spłaszcza szkło i wprawia je w drżenie.
- **Menu**: jasna szklana lista (Research, Design, Build) z ciemnym tekstem, klawiatura: strzałki, Enter, Escape.
- `?still=1&bare=1`: zamrożone światło i czas, bez chrome'u; z tego robiona jest miniatura (`../../thumbs/glass-button.jpg`, headless Edge 920×520 @2x) i jej mapa głębi.
- Bez WebGL2: zwykła matowa pigułka w CSS.

Poprzednie wersje (v1 rtęć, v2 szklana kopułka w płaskiej pigułce) są w historii gita.
