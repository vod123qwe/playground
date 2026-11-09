# AI Wave

Sama fala z AirDrop (iOS 17), bez telefonu, ekranu asystenta i kuli (zmiana Jarka 06.11.2026). Pierścień światła rozchodzi się po stronie i gaśnie: krawędź biała z tęczą w środku, trochę światła zostaje za nim, lekki cień przed nim, a to, co leży pod nim, wygina się jak pod soczewką.

- Co kilka sekund fala wychodzi ze środka (wyłączalne, odstęp 1,5–8 s); klik albo dotyk puszcza falę z dowolnego miejsca; Spacja ze środka.
- **Jak to działa:** powierzchnia jest rysowana w canvasie 2D (tekstura), fala to shader WebGL2 nad nią: odległość od frontu w szerokościach pasma, przesunięcie pikseli wzdłuż promienia (przed frontem na zewnątrz, za nim do środka), czerwony, zielony i niebieski przesunięte odrobinę inaczej (tęcza), jasna krawędź w kolorach palety zależnych od kąta, poświata za frontem, cień przed. Front przyspiesza i gaśnie przy najdalszym rogu.
- **Panel:** Speed, Width, Bend, Rainbow, Light, pod spodem Plain (czyste tło labu) albo Dots (siatka kropek, żeby było widać wygięcie), fala sama co X s.
- Plansza: `?thumb=1` stopklatka fali (`&t=` moment w sekundach), `?demo=1` same fale.
