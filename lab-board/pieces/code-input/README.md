# Code Input

**Gotowy:** odblokowany na planszy (`fresh:true`), z podglądem na żywo po najechaniu (`?demo=1`). Pomysł Jarka (06.10.2026): pole na kod SMS przy rejestracji z subtelnym feelingiem walidacji.

Pole na kod jednorazowy, bez żadnej kopii poza werdyktem. Dwa zaokrąglone boksy po trzy sloty, rozdzielone cienkimi dividerami; pusty slot ma małą gwiazdkę (szyfr), która obraca się i znika, gdy wchodzi cyfra, i wraca przy czyszczeniu.

**Jak działa:**
- Wpisujesz kod cyfra po cyfrze albo wklejasz go w całości. Każda cyfra wsuwa się do swojego pola, a kursor przechodzi dalej.
- Po ostatniej cyfrze pole na chwilę przygasa („sprawdzanie”, 380 ms). Potem przychodzi werdykt.
- **Zły kod:**
  - rząd robi krótki shake lewo-prawo; każde wychylenie jest mniejsze od poprzedniego (8 px, 4 wychylenia, 440 ms);
  - pola i cyfry robią się czerwone, pojawia się komunikat „That code didn’t work. Try again.”;
  - po krótkiej pauzie cyfry znikają po kolei od prawej, a kursor wraca do pierwszego pola;
  - komunikat zostaje, dopóki nie zaczniesz wpisywać od nowa;
  - na telefonie jest krótka wibracja (opcja w panelu).
- **Dobry kod:** pola robią się zielone i pojawia się „Verified”, a po chwili pole zaczyna od nowa.

**Technicznie:**
- Pod polami leży jedno prawdziwe `<input>` (`inputmode="numeric"`, `autocomplete="one-time-code"`), więc działa klawiatura numeryczna, autouzupełnianie kodu z SMS i wklejanie. Pola tylko je rysują.
- Kursor zawsze stoi na końcu kodu.
- Komunikat ma `aria-live`.
- Przy `prefers-reduced-motion` nie ma shake'a ani animacji cyfr, zostają same kolory i komunikat.

**Panel:**
- **Code:** liczba cyfr (4, 5 lub 6), podział na pół, wynik (Wrong, Right albo In turn, czyli na zmianę);
- **Shake:** wychylenie, liczba wychyleń, czas;
- **Beat:** sprawdzanie, ile trzyma się czerwień, odstęp przy czyszczeniu po kolei, wibracja;
- **Look:** rozmiar.

Ustawienia zapisują się w `lab.code-input.v1`, a tryb jasny lub ciemny w `.mode`.

**Plansza:**
- `?thumb=1`: cztery cyfry wpisane, kursor na piątym polu.
- `?demo=1`: startuje z tego samego stanu co miniatura (4829), dopisuje resztę, kod zostaje odrzucony i wszystko powtarza się w pętli.

Do testów jest `window.CODE`.
