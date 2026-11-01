# Easing

Kafel labu: dwa ruchy jeden pod drugim, żeby zobaczyć różnicę. Na start u góry Stiff, pod spodem Calm.

**Scena** to tylko dwa rowki z kulkami (bez napisów, strzałek i znaczników), plus Play i pętla na dole. **Curves** (prawy górny róg) otwiera kartę z boku (`lab-ui soft`, scena odsuwa się w lewo; na telefonie wysuwa się od dołu): dla górnej (Top) i dolnej (Bottom) kulki przełącznik presetu (`LabUI.seg`, Custom dochodzi po edycji), wykres, liczby i „Copy CSS”. Esc albo × zamyka.

**Wiersz** (górny A, dolny B):
- u góry scena 3D (three.js 0.186.1), widziana na wprost: strona to ściana, w którą wciśnięty jest miękki rowek. To jedna gładka powierzchnia (siatka nad całym kadrem): ściana płynnie przechodzi w zaokrąglony kanał, bez żadnej krawędzi (nachylenie zero przy ścianie i na dnie, końce zaokrąglają się same, `hgt`). Cieniowanie jest liczone dla każdego punktu i wypieczone (`shade`): zwrot do światła, głębokość i miękki cień górnej krawędzi (marsz promienia w stronę światła); płaska ściana wychodzi dokładnie w kolorze strony, więc nie ma szwu. Błyszcząca kulka leży w rowku, oświetlona naprawdę, z bardzo miękkim cieniem (VSM). Rowek ciągnie się za miejsce startu i mety, żeby przestrzał sprężyny miał miejsce (miękko ściśnięty w ten zapas);
- w karcie Curves wykres wartości w czasie: kropka biegnie po krzywej, blado w tle krzywa sąsiada; oba wykresy mają wspólną oś czasu, więc różnica w długości jest widoczna;
- liczby krzywej i „Copy CSS” (`cubic-bezier` albo dla sprężyny `linear()` próbkowane z krzywej);

**Presety:** Stiff (liniowo, 300 ms), Snappy (ease out cubic, 280 ms), Bounce (sprężyna, response 0,5 s, bounce 0,5), Calm (ease out quart, 1300 ms). Krzywe czasowe są zapisane jako `cubic-bezier` + czas (Stiff ma uchwyty na prostej, więc nadal jest liniowy).

**Edycja chwytem:** krzywa czasowa ma dwa uchwyty `cubic-bezier` i punkt końcowy (w bok = czas, 60–3000 ms); sprężyna ma jeden uchwyt na szczycie (góra i dół = przestrzał 1–45%, bok = kiedy szczyt). Pierwszy ruch robi z presetu kopię „Custom” (preset zostaje nietknięty, Custom dochodzi na końcu listy). Puszczenie uchwytu odgrywa oba. Klawiatura: Tab do uchwytu, strzałki, Shift × 10. W trakcie ciągnięcia oś czasu stoi, po puszczeniu się przelicza.

**Odtwarzanie:** „Play both”, Spacja albo klik w scenę 3D: tam, następnym razem z powrotem. Obok przycisk pętli: tam i z powrotem z pauzą 600 ms na końcach, aż do wyłączenia (pamiętany). Pętla liczy wszystko z jednego zegara w pętli klatek (bez osobnego timera); w pauzie nic się nie przerysowuje. Zmiana presetu i puszczenie uchwytu puszczają oba od startu.

**Plansza:** `?thumb=1` miniatura (Stiff i Calm u celu), `?demo=1` podgląd: pary presetów tam i z powrotem po kolei. Ustawienia w `localStorage` pod `lab.easing.v2`.
