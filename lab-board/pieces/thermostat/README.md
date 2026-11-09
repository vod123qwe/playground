# Thermostat

Działające pokrętło termostatu według projektu z Figmy (UI Practice, „Playground #1 · Skeuomorphism controls”: jasny 444:4484 domyślny, ciemny 444:4368), zbudowane jako prawdziwy obiekt 3D (three.js), a nie płaskie warstwy.

- **Osadzenie (07.11, po uwagach Jarka, wzór: pierścienie aparatów iPhone, Braun):** pokrętło siedzi w głębi, we wnęce wyciętej w płaskiej płycie: precyzyjna faza w dół, prosta ścianka, kanał ze światłem na dnie; lico pokrętła 7 px pod płytą. Bez wypukłego rantu na zewnątrz. Materiał: matowy, piaskowany plastik (nie metal), cienki lakier łapiący krawędzie, drobne ziarno w shaderze (normalna i kolor), osadzone na samej części, więc ziarno pokrętła obraca się z nim.
- **Światło:** pasek jak LED pod dyfuzorem (środek prawie biały, kolor dookoła) + 12 świateł punktowych wzdłuż świecącego łuku, każde w kolorze swojego fragmentu: naprawdę oświetlają ściankę wnęki, bok, radełko i fazę pokrętła (przebłyski przesuwają się przy obracaniu).
- **Dźwięk:** stłumione, krótkie tyknięcie (szum przez filtr dolnoprzepustowy + cichy niski „korpus”).
- **Bryły wcześniej (profile toczone, jednostki = px projektu):** obudowa z miękkim rantem i fazą schodzącą do kanału, w którym świeci łuk; pokrętło z fazowaną górną krawędzią, delikatnym radełkiem na boku (180 żeberek, głębsze w środku wysokości) i wklęsłą tarczą z podniesionym rantem; wciśnięte kropki i świecący znacznik obracają się z pokrętłem, światło zostaje w miejscu. Materiały: plastik z lekkim lakierem (clearcoat), otoczenie RoomEnvironment, światło kluczowe z prawej u góry z miękkimi cieniami, stół w dokładnym kolorze strony.
- **Łuk:** shader na pierścieniu w kanale (kometa od początku skali do wartości) + dwie warstwy poświaty, miękko wygaszone za czubkiem. Jasny: jak w Figmie, limonka → żółty → pomarańcz. Ciemny: z ciemności przez niebieski do koloru ciepła na czubku (niebieski przy 8°, pomarańcz ~21°, czerwień 28°).
- **Obsługa:** przeciąganie wokół pokrętła, kółko/touchpad, strzałki (±0,5°), PageUp/PageDown (±2°), Home/End; zakres 8–28 °C, krok 0,5°, ciche kliknięcie przy każdym kroku, pokrętło dojeżdża na sprężynie i lekko pochyla się do kursora (widać boki i głębię). Stuknięcie w środek: Celsius ↔ Fahrenheit. `role="slider"`.
- **Liczba:** każda cyfra to osobna kolumna 0–9, przewijana na sprężynie do nowej wartości (szybkie kręcenie płynnie przechodzi przez cyfry pośrednie), wygaszana u góry i dołu zamiast ucinania.
- **Fonty:** zamienniki Unbounded i JetBrains Mono (w Figmie płatne Monument Extended i PP Fraktion Mono).
- **Panel:** jasny/ciemny, jednostka, poświata, kliknięcia, pochylanie. `?thumb=1` (`&theme=dark`) stopklatka 21°, `?demo=1` samo się kręci. Do testów: `window.DIAL`.

## Edycja kształtu, mgiełka, materiał (07.11)
- **Edit shape** (przycisk na dole): najechanie na okrąg podświetla go przerywaną linią i otwiera obok kartę: Panel edge, Recess floor, Knob edge, Dish edge (Round: od ostrej fazy do pełnego łuku; Reach: jak daleko sięga zaokrąglenie, do ~4× więcej niż na start: w poziomie rozlewa się szeroko, w pionie tyle, ile pozwala wnęka) i Dish (Depth, Spread: wąsko i stożkowo albo szeroko i płasko). W trybie edycji pokrętło się nie kręci; Esc zamyka kartę, drugi Esc wychodzi z edycji. Kształt zapisuje się w przeglądarce; „Reset the shape” w panelu.
- **Mgiełka:** miękkie obłoczki (jak dymek w żurawiach z Line Studio) snują się po kanale, podświetlone kolorem światła w swoim miejscu; przy każdym kroku buchnie trochę przy czubku. Suwak „Haze in the light”.
- **Światło:** łuk świeci od początku skali, słabo przy starcie (miękkie wejście) i pełną mocą przy czubku; 18 lamp o łagodnym spadku, podniesionych nad dno kanału, bez gorących plam.
- **Materiał:** suwaki Grain (siła ziarna) i Grain size.
- **Odczyt:** opcja Printed / Engraved (wgłębiony w tarczę, w kolorze jej powierzchni, z jasnym dolnym i ciemnym górnym brzegiem).

## Edycja w 3D, warstwy, światło (07.11, później)
- **Edit shape:** edytor przypięty z lewej: okręgi po nazwie (Panel edge, Recess floor, Knob edge, Dish edge, Dish), najechanie na bryłę podświetla okrąg przerywaną linią w 3D, kliknięcie go wybiera (nic nie przeskakuje samo). Wybrany okrąg zaznacza się delikatnie i gaśnie, gdy przesuwasz suwak (wraca po chwili). Przeciąganie obraca całą scenę w 3D, kółko przybliża, dwuklik wraca do widoku z góry; odczyt chowa się, gdy widok jest obrócony.
- **Layers:** każda krawędź jest „Joined” (zaokrąglenie płynnie przechodzi w sąsiednią powierzchnię) albo „Separate” (osobna warstwa: mały stopień 1,8 px między nią a sąsiadem, jak pierścienie aparatu).
- **Światło (grupa Light):** Brightness, Haze (więcej mgiełki niż wcześniej), Haze size, Energy (zapętlona animacja: jaśniejsze fale płyną wzdłuż łuku od startu do czubka, pod nimi wolny oddech; lampy pulsują z nimi), Energy speed.
