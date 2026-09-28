# Lab UI · wspólne kontrolki paneli

Jeden styl suwaków, pól wartości i ustawień dla wszystkich kafli labu (na razie Glass Button i Furniture Configurator). Podgląd na żywo: `shared/ui-kit.html`.

**Podpięcie:** `<link rel="stylesheet" href="../../shared/lab-ui.css">`, `<script src="../../shared/lab-ui.js"></script>`, klasa `lab-ui` (albo `lab-ui dark`) na panelu, `--ui-pad` = boczny padding panelu (linie między grupami idą wtedy od krawędzi do krawędzi).

**Buildery (`LabUI`):** `group(panel, title, { open, key })`, `slider(parent, { label, min, max, step, unit, value, def, format, onInput, onChange })`, `seg(...)`, `check(...)`, `color(...)`. Każdy zwraca `{ row, set, get }`; suwak też `input` i `setDef(v)` (znacznik i podwójne kliknięcie idą za wybranym wariantem).

**Suwak:** tor 4 px, wypełnienie w kolorze tuszu, biała kulka 18 px z obrysem 1 px; najechanie: 5 px halo; wciśnięcie: kulka rośnie o 18% i otwiera się miękkie halo 9 px (0,2 s z lekkim dociągnięciem, powrót 0,42 s). Klikalny cały pas 24 px (WCAG 2.2, 2.5.8); na dotyku 44 px i kulka 26 px. Znacznik 2 × 10 px w miejscu wartości domyślnej (znika, gdy wartość na nim stoi).

**Zachowanie:** klawiatura natywnego suwaka (strzałki, Page Up/Down, Home/End); liczbę po prawej można kliknąć i wpisać (Enter, Esc, ↑ ↓, Shift × 10); przeciągnięcie etykiety zmienia wartość (cały zakres ≈ 240 px, Alt: dokładniej; na dotyku wyłączone, żeby nie blokować przewijania); podwójne kliknięcie wraca do wartości domyślnej; czytniki ekranu słyszą wartość z jednostką (aria-valuetext); ograniczony ruch wyłącza animacje.

**Źródła:** NN/g (reguły suwaków), Smashing Magazine (idealny suwak), WAI-ARIA APG (wzorzec slider), WCAG 2.2 2.5.8 (rozmiar celu), Material 3 (grubszy tor, 2024), Figma/Blender (przeciąganie etykiety, domyślna wartość).
