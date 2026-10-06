# Keyboard

**W budowie:** za hasłem (`shared/lab-lock.js`), na planszy z kłódką (`locked:true`, `fresh:true`). Wydzielona 06.10.2026 z Line Interactions na prośbę Jarka.

**Co to jest:** płaska, niskoprofilowa klawiatura w stylu liniowym: niskie klawisze w aluminiowej płycie, obrys każdej nasadki i nadruk fontem labu (Geist).

**Układ jak w płaskich klawiaturach z klawiszami command i option:**
- rząd funkcyjny o połowie wysokości: esc, F1–F12, Touch ID;
- cyfry z delete, tab, caps lock z return, shift;
- dolny rząd: fn, control, option, command, spacja, command, option;
- strzałki w odwróconym T z połówek klawiszy.

**Interakcja:**
- Najechanie tylko rozjaśnia klawisz, bez dźwięku (zasada Jarka: gdzie się klika, dźwięk tylko przy kliknięciu).
- Klik myszą albo własna klawiatura wciska klawisz z miękkim klikiem, a puszczenie daje cichszy klik.
- Nasadka ugina się od góry, a dół zostaje na płycie, więc linia styku jest zawsze narysowana.
- Widok na wprost i lekko z góry; przeciąganie tła obraca go tylko trochę (do ok. 29° w bok, odrobinę wyżej/niżej), ↻ wraca; kółko albo − / + przybliża.
- Jasna klawiatura ma jasny wyświetlacz (blady panel, ciemne litery), ciemna ciemny.
- Domyślny klik: Crisp.

**Listwa sterowania (06.10.2026, pomysł Jarka plus dodatki z przeglądu klawiatur z ekranami i pokrętłami):** pas płyty za rzędem funkcyjnym.
- **Suwak wyciszenia ze szczeliną i diodą:** dioda świeci na zielono, gdy dźwięk jest włączony. Klik przełącza suwak, a ekran pokazuje „MUTED” albo „SOUND ON”.
- **Ekran:** ciemne szkło w ramce, tekst w Geist Mono. Trzy ekrany do przełączania:
  - Type: to, co piszesz, z migającym kursorem i tempem pisania (WPM);
  - Stats: WPM, liczba naciśniętych klawiszy, rodzaj kliku, głośność;
  - Clock: godzina z migającym dwukropkiem i data.
  Na chwilę wskakują też komunikaty: pasek głośności przy kręceniu pokrętłem, „CLICK · …”, „CAPS LOCK ON/OFF”, „LIGHT/DARK”.
- **Dwa okrągłe przyciski:** lewy zmienia ekran, a prawy zmienia klik (Soft, Thock, Crisp).
- **Pokrętło głośności:** wystający bęben z karbowaniem, kreską na górze i skalą wokół (zakres 270°). Kręci się przeciąganiem albo kółkiem myszy nad nim. Co 5% słychać ząbek (detent).
- **Boczny suwak na prawej krawędzi płyty:** przełącza tryb jasny i ciemny.
- **Dioda Caps Lock na klawiszu:** świeci po włączeniu i jest zsynchronizowana ze stanem prawdziwej klawiatury.
- **Podświetlenie reagujące:** wciśnięty klawisz rozjaśnia się od razu i powoli gaśnie, a od niego po sąsiednich klawiszach rozchodzi się pierścień światła. Wyłącza je opcja „Light that answers the keys”.
- **Pisanie:** Shift i Caps Lock zmieniają wielkość liter, Backspace kasuje znak, Return czyści linię.

**Dźwięk:** syntezowany w przeglądarce, bez plików.
- Charakter do wyboru: Soft, Thock albo Crisp (domyślny).
- Na wyjściu jest filtr dolnoprzepustowy około 5,2 kHz i kompresor.
- Panel aplikacji Claude wycisza audio, więc słychać tylko w zwykłej przeglądarce.

**Panel:**
- Keys: Travel (jak głęboko ugina się klawisz);
- Sound: włączony/wyłączony, Volume, Click, przycisk Test.

Ustawienia zapisują się w `lab.keyboard.v1`, a tryb jasny lub ciemny w `.mode`.

**Plansza:**
- `?thumb=1`: nieruchoma klawiatura.
- `?demo=1`: klawisze same piszą kilka słów, bez dźwięku.
- W trybie planszy rysunek idzie w ramce 450:240, przyciętej jak obrazek.

Do testów jest `window.KEYS`.
