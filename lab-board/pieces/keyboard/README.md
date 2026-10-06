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
- Przeciąganie tła obraca widok, a kółko myszy albo − / + przybliża.

**Dźwięk:** syntezowany w przeglądarce, bez plików.
- Charakter do wyboru: Soft (domyślny), Thock albo Crisp.
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
