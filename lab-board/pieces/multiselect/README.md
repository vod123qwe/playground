# Multiselect

Pole wielokrotnego wyboru z pillami (demo: kraje z flagami). To, co zaznaczysz na liście, wlatuje do pola jako pill. Wszystko porusza się na sprężynach, bez sztywnych przejść.

## Pole
- Zawsze jedna linia. Pille, które się nie mieszczą, chowają się za chipem „+N” (N = ile pilli nie widać w całości, liczone na bieżąco przy przewijaniu). Tap w „+N” rozwija pole do wszystkich pilli (wysokość i pozycje na sprężynach), „Less” zwija.
- Przesuwanie w lewo i prawo: własne przewijanie (nie natywne) dla myszy, palca, touchpada i kółka. Po puszczeniu pęd z wygaszaniem (Glide), na krańcach gumowe odbicie (opór jak w iOS) i sprężyna z powrotem. Brzegi pola zanikają miękko tam, gdzie jest coś do przewinięcia.
- Gesty rozróżniane po pierwszych 6 px: ruch w bok przewija, ruch w górę lub w dół łapie pill. Złapany pill podąża za ręką z lekkim przechyłem; po odciągnięciu o 56 px pole zamyka po nim lukę, a pill czerwienieje. Puszczony daleko albo rzucony (szybciej niż 1100 px/s) znika; puszczony blisko wraca sprężyną na swoje miejsce.
- Tap w pole otwiera listę. Klawiatura: Enter / Spacja / strzałka w dół otwiera, Backspace usuwa ostatni pill, strzałki w bok przesuwają, Tab przechodzi po X-ach (fokus przewija do pilla).

## Lista
- Karta 4 px pod polem, z tym samym zaokrągleniem. Rozwija się z pola (wysokość od zera, miękko), wiersze wsuwają się kolejno (24 ms odstępu).
- Wyszukiwarka na górze (na telefonie bez automatycznego fokusu, żeby nie wyskakiwała klawiatura), strzałki góra/dół, Enter zaznacza, Escape zamyka. Lista zostaje otwarta przy zaznaczaniu kilku pozycji.
- Zaznaczenie: pill wylatuje z flagi wiersza i ląduje na swoim miejscu w polu, a pole przewija się do końca. Odznaczenie: pill znika w wybranym stylu.

## Sposoby znikania (pasek na dole, strzałki na klawiaturze)
Zmiana stylu pokazuje go od razu na ostatnim pillu, który potem wraca.
- **Classic**: zanika i zsuwa się o kilka pikseli (260 ms).
- **Fall**: mały podskok i spadek poza ekran z obrotem; rzucony zachowuje prędkość rzutu.
- **Split**: pęka wzdłuż zygzaka, dwie połówki spadają w przeciwne strony.
- **Pop**: lekko puchnie i pęka na kropki w kolorach swojej flagi, z rozchodzącym się pierścieniem.
- **Dust**: rozsypuje się w pył od lewej do prawej (pill odrysowany do canvasu, piksel po pikselu, a sam znika maską w tym samym tempie).
- **Swirl**: obraca się i kurczy do własnego X, z lekkim rozmyciem.
Przy „zmniejsz ruch” w systemie zawsze Classic, a sprężyny bez odbicia.

## Panel (Customize)
Motyw jasny/ciemny, szerokość pola, Softness (sztywność sprężyn), Bounce (ile przestrzeliwują), Glide (długość pędu), rzucanie pilli i wlatywanie do pola (włącz/wyłącz), grawitacja i obrót przy spadaniu. „Refill the field” dorzuca brakujące kraje startowe.

Ustawienia i wybór: `lab.multiselect.v1` (+ `.sel`). Flagi: [flag-icons](https://github.com/lipis/flag-icons) 7.2.3 z jsDelivr (MIT). Plansza: `?thumb=1` (lista otwarta, bez chrome'u). Do testów: `window.MS`.
