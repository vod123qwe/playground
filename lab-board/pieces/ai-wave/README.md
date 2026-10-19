# AI Wave (draft)

Efekt fali z AirDrop (iOS 17) użyty inaczej: jako znak, że AI pracuje. Ekran aplikacji asystenta (przykładowa treść), u góry kula `<ai-blob>` (domyślnie Glass, w panelu Nebula i Halo; z `../ai-blob/ai-blob.js`). Gdy kula zaczyna myśleć, z niej wychodzi fala światła przez cały ekran: treść pod frontem wygina się jak pod soczewką, brzeg fali jest jasny z tęczowym rozszczepieniem, za nią zostaje odrobina światła. Podczas mówienia lecą słabsze fale, podczas słuchania fala zbiega do kuli. Kliknięcie w ekran wysyła falę z miejsca kliknięcia, Spacja albo „Send a wave” z kuli.

**Jak to działa:** ekran jest rysowany w canvasie 2D (tekstura), fala to shader WebGL2 nad nim: dla każdej fali odległość od frontu w szerokościach pasma, przesunięcie pikseli wzdłuż promienia (pochodna gaussa: przed frontem wypchnięte, za nim wciągnięte, czyli soczewka), czerwony, zielony i niebieski przesunięte trochę różnie (tęcza), kolor brzegu z palety kuli po kącie. Front przechodzi ekran w ok. 0,95 s (lekko przyspiesza), gaśnie przy najdalszym rogu. Do 8 fal naraz.

**Style (pasek na dole):** AirDrop (soczewka + jasny brzeg), Ripple (pociąg wodnych pierścieni za frontem), Glow (samo światło, bez wyginania).

**Panel:** Speed, Width (szerokość pasma, domyślnie 34 px), Bend (siła wygięcia), Rainbow, Light; kiedy fala: przy starcie myślenia, podczas mówienia, do środka przy słuchaniu.

**Lab:** ustawienia `lab.ai-wave.v1`; klawisze 1–5 stany, ← → style, Spacja fala; `?thumb=1` (ekran na cały kadr), `?demo=1` (thinking, speaking, listening w pętli); do testów `window.WAVE`.

**Draft, czyli czego jeszcze nie ma:** fala działa na narysowanej makiecie, nie na prawdziwym DOM (do prawdziwej strony trzeba by renderować ją do tekstury albo użyć filtra SVG); kula sama nie jest wyginana; brak ciemnego motywu.
