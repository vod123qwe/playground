# Variant Pill

Przełącznik wariantów labu jako osobny eksperyment, podany jak Like Button: jedna pigułka ‹ Nazwa › na środku spokojnej strony, Light / Dark u góry, Customize w prawym górnym rogu.

**Trzy drogi zmiany wariantu:** strzałki; złapanie pigułki i przeciągnięcie (idzie za palcem z oporem, sprężyście wraca, po przekroczeniu progu przełącza: w lewo następny, w prawo poprzedni); kliknięcie w nazwę, po którym pigułka rośnie w górę w panel ze wszystkimi wariantami (morfing: jeden kształt od obrysu pigułki do panelu), opcje wjeżdżają po kolei, obecna ma znaczek, a wybór, Esc albo kliknięcie obok zwija panel w pigułkę. Klawiatura: Enter lub spacja na nazwie, strzałki w menu.

**Intro przy pierwszym wejściu:** pigułka sama daje się naciągnąć w lewo, sprężyście wraca na następny wariant, chwila przerwy, potem w prawo i z powrotem na ten sam. Raz na przeglądarkę (`.introSeen`), nie w `?thumb` i `?demo`, bez ruchu przy ograniczonym ruchu w systemie. Można je wyłączyć albo odtworzyć przyciskiem Play intro.

**Rozciąganie (Stretch) i wciśnięcie (Press lift):** po wciśnięciu pigułka lekko rośnie (Press lift, domyślnie 1,06). Pociągnięta idzie za palcem w bok z oporem, a jej kształt lekko się poszerza, tym bardziej, im dalej ją ciągniesz, a strzałki rozchodzą się razem z krawędziami; nazwa zostaje ostra (kształt to `::before`). Po puszczeniu oba sprężyście wracają. Stretch od 0 do 1, domyślnie 0,6. Prosto, celowo: model kropli i rozciąganie w 2D były nienaturalne.

**Customize:** ekran zostaje pełnoekranowy, bez overlayu. Po kliknięciu scena morfuje w zaokrąglony box, a obok wjeżdża karta z ustawieniami w stylu `lab-ui soft`: suwak to wypełniony pasek, przełącznik to switch, wybór to tor z przesuwanym kciukiem, na dole przyciski jako pigułki.

**Panel (Tune):** Content (liczba wariantów 2–8, domyślnie 3, strzałki, intro, Play intro), Look (rozmiar, rogi menu), Swipe (rozciąganie, opór, próg przełączenia, czas powrotu, odbicie), Menu (czas morfingu, przestrzał, wjazd opcji po kolei). Reset i Copy settings. Ustawienia w `lab.variant-pill.v1`, tryb w `.mode`.

**To ten sam komponent co w Glass Button, Furniture Configurator i Like Button** (`shared/lab-ui.js`, `LabUI.variants` z `items`, `current`, `onPick` i opcjonalnym `cfg`); strojenie tutaj zmienia tylko tę stronę, domyślne wartości są wspólne.

**Na planszy:** miniatura `?thumb=1` (sama pigułka w spoczynku), podgląd po najechaniu `?demo=1` (ślad palca: przeciągnięcie, strzałka, otwarcie menu i wybór, w pętli; pigułka niżej, żeby menu miało miejsce).
