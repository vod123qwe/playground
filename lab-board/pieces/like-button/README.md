# Like Button

Przycisk „Like” z sercem, w którym polubienie ma być małą nagrodą. Jasny, minimalny: biała pigułka bez cienia na ciepłym jasnym tle, serce z obrysem, napis Like i licznik.

## Moment polubienia (od dotyku do końca)

1. **Wciśnięcie**: serce lekko się zapada (Press dip, domyślnie 8%), przycisk odrobinę się kurczy.
2. **Puszczenie**: kolor nalewa się do serca od dołu falującą powierzchnią (Fill time 300 ms, Wave). Fala słabnie, im serce pełniejsze.
3. **Pełne serce**: małe, miękkie odbicie na sprężynie. Serce skaluje się zawsze tak samo w obu osiach, więc nie rozciąga się i nie traci proporcji (uwaga Jarka 05.10: „ma być zawsze proporcjonalne, zmiana kształtu bardzo subtelna”).
4. **Wybuch**: pierścień w kolorze serca i dwa kręgi kropek (Confetti, Heart albo Mono).
5. **Serduszka**: kilka małych serduszek odpływa w górę z lekkim kołysaniem.
6. **Licznik**: zmieniające się cyfry przewijają się w górę na sprężynie.

**Cofnięcie** jest spokojne: serce szybko się opróżnia, licznik przewija się w dół, bez wybuchu.

## Panel i presety

Customize (prawy górny róg) otwiera wspólny panel labu (`shared/lab-ui`): Presets, Look (kolor serca, tło, rozmiar), Timing (tempo), **Press** (o ile kurczy się cała pigułka, Button shrink w %, i o ile zapada się serce, Heart dip; easing i czas wciśnięcia: Smooth, Snappy, Soft, Linear; easing i czas powrotu pigułki: Spring, Bouncy, Smooth, Snappy; serce zapada się po tej samej krzywej co pigułka, a wraca na sprężynie z grupy Bounce), Liquid fill, Bounce, Burst, Floating hearts, Count. Opcje danej warstwy pokazują się tylko, gdy jest włączona. Reset all i Copy settings (JSON różnic). Ustawienia zostają w przeglądarce (`lab.like-button.v1`).

Presety (strzałki ‹ › na dole, klawisze ← →; 05.10.2026 Jarek zostawił tylko swoje dwa, ustawione w panelu): **Classic** (domyślny: zapadnięcie 12%, bez płynu, sztywniejsze odbicie ×2, wybuch ×1,2 z 7 kropkami, bez serduszek, licznik od 364) i **Liquid** (płyn 500 ms, 24 kropki w odcieniach serca, bez serduszek). Reset to Classic wraca do Classic, kolor serca, tła i rozmiar zostają.

**Light / Dark** na górze na środku: ciemne tło, ciemna pigułka, jasny napis i obrys, ciemny panel (wariant `lab-ui dark`); każdy tryb pamięta swój kolor tła (Background w panelu zmienia tło bieżącego trybu). Tryb zapisuje się osobno (`lab.like-button.v1.mode`), nie zmienia go preset.

## Próba kroju dla całego labu (05.10.2026)

Grupa **Typeface** na górze panelu przełącza krój całej strony (przycisk, licznik, pigułki, panel): Inter (obecny), SF Pro (systemowy: prawdziwe SF tylko na Apple, na Windowsie Segoe UI; Apple nie pozwala osadzać SF na stronach), Geist, Instrument Sans, Albert Sans, Public Sans (Google Fonts). Wybór zapisuje się w `lab.like-button.v1.font`. Zwycięzca ma potem przejść na wszystkie podstrony labu.

## Technika

SVG serca (obrys + płyn przycięty do kształtu serca), canvas nad sercem na pierścień, kropki i serduszka; jedna pętla klatek tylko na czas animacji. Prawdziwy `<button aria-pressed>`: klawiatura (Space, Enter), czytniki ekranu słyszą licznik (aria-live). `prefers-reduced-motion` wyłącza płyn, odbicie i drobinki.

Podgląd z konsoli: `LIKE.at(ms)` zamraża zegar i pokazuje moment ms po polubieniu (kolejne wywołania przesuwają dalej), `LIKE.live()` puszcza czas. `?thumb=1`: miniatura na planszę (bez chrome, większy przycisk, zamrożony moment wybuchu); `thumbs/like-button.jpg` zrobiona headless Edge 660×920.
