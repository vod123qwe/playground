# Cursors

**W budowie:** za hasłem (`shared/lab-lock.js`), na planszy z kłódką (`locked:true`). Jarek chce to jeszcze dopracować.

Cztery kursory na jednej stronie. Kursor potrzebuje podłoża, więc kafel to cała strona: nagłówek, cztery kafelki z grafiką, podpisy i przyciski „Add”. Light / Dark u góry, Customize w prawym górnym rogu, pigułka wariantów na dole przełącza kursor.

**Pixel** (wg sklepu z pikselowym śladem kursora): za kursorem zostają kratki z siatki (domyślnie 8 px), które maleją i znikają (ok. 0,45 s); ślad ma najwyżej 40 kratek; kliknięcie rozpryskuje 14 pikseli. Kolor ciepła szarość, nałożony trybem „difference”, więc na jasnej stronie wychodzi ciemny, a na grafikach odwraca kolory. Systemowy kursor zostaje.

**Spotlight**: strona pod mgiełką w kolorze tła; kursor niesie miękkie światło, które ją odsłania. Nad elementami do kliknięcia światło rośnie, przy wciśnięciu lekko się kurczy. Światło sprężyście goni kursor.

**Goo**: łańcuch kropli, każda goni poprzednią; filtr „goo” (rozmycie i twarda alfa) zlewa je w jedną kroplę. Białe i w trybie „difference”, więc odwracają to, co przykrywają. Wciśnięcie je nadmuchuje. Systemowy kursor schowany.

**Snap** (jak kursor tabletu): miękka kropka; nad tym, co da się kliknąć (`data-snap`), zmienia się w obrys tego elementu (z marginesem i jego zaokrągleniem), a element lekko przechyla się w stronę kursora (magnes). Sprężyny przenoszą kształt. Systemowy kursor schowany.

**Panel (Tune):** ustawienia kursora, który jest włączony (Pixel: rozmiar piksela, czas znikania, długość śladu, kolor, difference, rozprysk; Spotlight: rozmiar światła, miękka krawędź, mgiełka, podążanie, powiększenie nad elementami; Goo: liczba kropli, rozmiar, podążanie, zlewanie; Snap: kropka, margines obrysu, magnes, sprężyna). „Reset this cursor” i Copy settings. Ustawienia w `lab.cursors.v1`, tryb w `.mode`.

**Na planszy:** `?thumb=1` sama strona bez kursora, `?demo=1` sztuczny kursor krąży po kafelkach, co ~1,9 s klika, co 4,2 s zmienia kursor. Oba rysują stronę w 1040 × 780 i skalują ją do pudełka (wyśrodkowane w CSS), więc miniatura i podgląd to ten sam obraz. Miniatura: headless Edge 520 × 390 @2x z `?thumb=1`.

Na dotyku te kursory nie mają sensu: strona mówi „These cursors want a mouse”.
