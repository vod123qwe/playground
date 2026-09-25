# 01 · Glass Button

Pierwszy eksperyment labu. Szklany przycisk „Ask agents” z menu, studium po ujęciu znalezionym na recent.design, dalej rozwijane po zdjęciach fizycznych przycisków z akrylu i ujęciu „Liquid glass”.

## v5 (2026-09-25): panel „Tune”, dowolna bryła, szklana kulka, tła i upload

Cała scena to mały ray tracer w jednym shaderze WebGL2 (GLSL 300 es). DOM-owy `<button>` zostaje prawdziwą, dostępną kontrolką (fokus, klawiatura, menu) i silnikiem layoutu: jego rozmiar dopasowuje się do napisu (auto layout), a shader co klatkę czyta z niego geometrię.

**Bryła** to pole odległości (SDF) śledzone krokami (sphere tracing): obrys to prostokąt z zaokrąglonymi rogami (aż do pełnej pigułki), a na nim profil wysokości od góry i od spodu. Kopuła > 0 daje soczewkę wypukłą, kopuła < 0 wklęsłą misę; przy wklęsłości ścianka sama się podnosi, żeby zawsze był rant.

**Panel „Tune”** (przycisk w prawym górnym rogu; na telefonie wysuwa się od dołu):
- *Presets*: M&M (domyślny), Pebble, Slab, Dish (wklęsła), Droplet (woda, IOR 1,33), Crystal (IOR 2,2, mocna dyspersja).
- *Shape*: rogi, kopuła (wypukła / wklęsła), ścianka, spód, profil (1 = stożek, 2 = łuk koła, więcej = płaski wierzch z ostrzejszym brzegiem), zaokrąglenie krawędzi, uniesienie nad stroną.
- *Optics*: współczynnik załamania, dyspersja, zmatowienie (frost), kolor i siła zabarwienia szkła.
- *Light*: za kursorem albo ręcznie (kąt, wysokość), siła odblasku, odbić, tęczy na rancie i cienia.
- *Bead*: pokaż / ukryj, rozmiar, zatopienie w szkle, zadymienie, wielkość gwiazdki, ruch gradientu.
- *Content*: tekst przycisku, kolor i krycie nadruku, strzałka.
- *Layout*: skala, wysokość, paddingi, odstęp, grubość fontu (Inter Tight 400–600).
- *Background* (na górze panelu): 11 teł do testowania załamania, rysowanych w canvasie bez zewnętrznych plików: Grid, Grid dark, Article (kolumny tekstu, jak soczewka nad gazetą), Type (wielkie litery), Stripes, Checker, Halftone, Rings, Mesh (kolorowe plamy), Night (bokeh świateł), Sunset (synthwave). Do tego **Upload**: własny obrazek albo wideo, także przeciągnięciem na stronę albo wklejeniem ze schowka. Plik zostaje w przeglądarce, nigdzie nie jest wysyłany ani zapamiętywany. Suwak *Image scale* powiększa tło, *Grid overlay* dokłada siatkę na dowolne tło. Poza ekranem tło odbija się lustrzanie, więc przy obrocie „podłoga” trwa dalej. Odbicia w szkle i kolor nadruku dopasowują się do średniej jasności tła.
- „Reset all” i „Copy settings” (kopiuje do schowka JSON z różnicami względem domyślnych). Ustawienia zapisują się w przeglądarce (localStorage).

**Kulka** jest z przezroczystego, lekko przydymionego szkła i działa jak soczewka kulista: pokazuje odwróconą i powiększoną stronę za sobą. Gwiazdka leży na płaszczyźnie przez jej środek, a jej gradient obraca się za światłem, przesuwa z kątem patrzenia jak hologram i lekko „oddycha”.

**Reszta** bez zmian od v4: nadruk (napis i strzałka) na górnej powierzchni, ostry i nad refrakcją; do dwóch odbić wewnętrznych przy rancie; wyjście z trzema IOR (rozszczepienie); cień z kaustyką (wypukła skupia światło, wklęsła rozprasza je w pierścień); obrót 3D środkowym przyciskiem myszy / Alt / dwoma palcami, „reset view” albo R / 0. **Zoom**: kółko myszy (albo pinch na trackpadzie) przybliża do miejsca pod kursorem, od 0,5× do 8×; na dotyku szczypanie, na klawiaturze + i -. Przy zbliżeniu nadruk jest przerysowywany w wyższej rozdzielczości (do 4096 px), żeby został ostry.

**Wydajność** (ważne na Windows, gdzie WebGL idzie przez ANGLE/D3D):
- pętle mają długości zależne od uniformu `uOne`, bo kompilator D3D rozwijałby stałe pętle w nieskończoność (kompilacja trwała ponad minutę i kończyła się utratą kontekstu);
- nadruk jest czytany przez `textureLod` (bez pochodnych w rozgałęzieniach);
- kulka jest liczona w jednym miejscu kodu;
- shader kompiluje się w tle (`KHR_parallel_shader_compile`), a do tego czasu widać zwykłą pigułkę z CSS;
- 4 promienie na piksel tylko na krawędziach bryły (tam, gdzie sąsiednie piksele trafiają w co innego);
- rozdzielczość sama spada, gdy klatki są wolne; utrata kontekstu WebGL wraca do wersji CSS.

`?still=1&bare=1`: zamrożone światło i czas, domyślne ustawienia, bez chrome'u i panelu; z tego robiona jest miniatura (`../../thumbs/glass-button.jpg`, headless Edge 920×520 @2x) i jej mapa głębi.

Poprzednie wersje są w historii gita: v1 rtęć, v2 szklana kopułka w płaskiej pigułce, v3 wypukła płyta nad „nadrukiem” (napis pod szkłem wyglądał nienaturalnie), v4 analityczna kapsuła M&M z obrotem 3D.
