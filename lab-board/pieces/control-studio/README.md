# Control Studio

Narzędzie do modelowania okrągłych kontrolek w stylu skeuomorficznym. Kontrolka to stos warstw od zewnątrz do środka: panel, szczelina ze światłem, pokrętło, okrąg w okręgu i tak dalej. Termostat z laba jest tu presetem.

## Jak to działa

Każda warstwa ma:

- **promień** (gdzie zaczyna się jej zewnętrzna krawędź) i **wysokość** (powyżej lub poniżej panelu);
- **lico**: płaskie, wypukłe albo wklęsłe (Dome / dish), plus **Flatness**, czyli jak płasko ma być na środku;
- **krawędź**: Rounding (0 to ostre ścięcie, 1 to pełny łuk), Reach (jak daleko sięga zaokrąglenie) i sposób spotkania z warstwą obok:
  - **Flows**: stopa też się zaokrągla, obie warstwy tworzą jedną powierzchnię;
  - **Sharp**: warstwa stoi na tej obok jak osobny element;
  - **Apart**: cienka szczelina między nimi, czyli dwie części;
- **rodzaj**: Solid albo Slot with light (światło na dnie, lampy oświetlające ścianki, mgiełka, energia);
- **materiał**: matowy plastik, ceramika, aluminium, guma albo szkło, z kolorem i ziarnem;
- **detale**: radełko na boku, kropki, znacznik;
- **Turns with the value**: czy warstwa obraca się razem z wartością.

## Ekran

- **Lewa kolumna**: lista warstw. „+ Circle inside” dodaje okrąg w wybranej warstwie, Delete (albo klawisz Delete) ją usuwa.
- **Środek**: podgląd 3D. Kliknięcie wybiera warstwę, przeciąganie obraca widok, kółko przybliża, podwójne kliknięcie wraca na wprost.
- **Pod spodem**: przekrój z boku z przewyższoną wysokością i trzema uchwytami:
  - kropka zmienia promień i wysokość;
  - romb zmienia zasięg zaokrąglenia;
  - kwadrat wybrzusza albo wgłębia lico.
  Z Altem ruch jest dokładniejszy. Kliknięcie w bryłę albo w małą kropkę innej warstwy ją wybiera.
- **Prawa kolumna**: wszystkie ustawienia wybranej warstwy, a pod nimi zakres kontrolki (od, do, krok, kąt), odczyt i oświetlenie sceny.
- **Edit / Preview** (albo klawisz P): Preview pokazuje samą kontrolkę i pozwala nią kręcić.

## Wynik

- **Image**: PNG z odczytem, w 1,5× rozdzielczości ekranu.
- **Video**: 6 sekund webm; wartość przejeżdża do góry i z powrotem, a widok lekko się unosi i obraca.
- **Control**: jeden plik HTML z silnikiem i projektem w środku. Działa sam (three.js z CDN), obsługuje przeciąganie, kółko i klawiaturę, a `dial.on('change', v => …)` daje wartość.

## Scena i warstwa (09.11.2026)

Prawy panel ma dwie zakładki.

- **Scena** to ustawienia całej kontrolki:
  - **wykończenie**: materiał, kolor i ziarno dla wszystkich warstw, plus tło;
  - **światło**: krążek słońca (przeciągasz; środek to światło z góry, krawędź to nisko z boku), siła, miękkość cieni, odblaski (od ostrych do miękkich), światło otoczenia i ekspozycja;
  - **światło w szczelinie**;
  - **zakres kontrolki**.
- **Warstwa** to sam kształt, czyli promień, wysokość, krawędź, lico i detale. Materiał warstwa bierze ze sceny, a suwak Tone robi ją odrobinę jaśniejszą albo ciemniejszą. „Own material” daje jej własny materiał (np. szkło w środku), a na liście warstw dostaje wtedy znaczek „own”.

**Studio quality** (przycisk przy Edit / Preview) dopracowuje obraz, gdy nic się nie rusza. Składa 128 klatek: kamera przesuwa się w każdej o ułamek piksela, a światło pada z małej tarczy zamiast z punktu. Wychodzą gładkie krawędzie i fizycznie miękkie cienie. W rogu podglądu widać postęp. Obraz z przycisku Image zawsze renderuje się w tej jakości.

## Pliki

- `engine.js`: silnik, `createDial(host, design, opt)`, presety i profil przekroju.
- `index.html`: studio. Stan żyje w localStorage (`lab.control-studio.v1`).
- `?thumb=1&preset=Night` daje statyczny render presetu (do miniatur).

Presety: Thermostat, Night, Aluminium, Graphite, Braun, Camera ring.
