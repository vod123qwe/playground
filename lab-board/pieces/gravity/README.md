# Gravity

Element zawieszony w środku ekranu, na który spadają rzeczy: kulki i bryły, a na życzenie płachta materiału. Prawdziwa fizyka (Rapier 0.21, WASM z CDN), grafika three.js (realistyczne 3D: światło studyjne z RoomEnvironment, cienie, szkło z transmisją).

**Element w środku:** kula, blob, torus, kostka, płyta, misa. Unosi się (powolne falowanie w górę i w dół).
- **Hard / Bouncy / Absorbing:** jedna bryła kinematyczna, kształt jako collider (kula, zaokrąglony prostopadłościan albo siatka trójkątów). Bounce = odbijalność, Grip = tarcie; Absorbing bierze minimum odbijalności z kontaktu, Bouncy maksimum.
- **Jelly (prawdziwa galareta):** ciało miękkie z połączonych punktów (wierzchołki zgrubnej wersji kształtu). Każdy punkt to mała kula kinematyczna, więc spadające rzeczy odbijają się od ruchomej powierzchni. Punkty ciągną sprężyny do miejsca i do sąsiadów; uderzenie i ciężar leżących rzeczy je wgniatają, a wgniecenie rozchodzi się falą. Gładką powierzchnię liczy się z 8 najbliższych punktów (łagodne ważenie). Softness = miękkość.

**Spadają:** kulki (szkło, guma w kolorach, metal), bryły (zaokrąglone kostki, kapsułki, walce) albo mieszanka. Ilość na sekundę, rozmiar, grawitacja. (Konfetti usunięte.)

**Płachta (Cloth):** siatka 30×30 połączonych punktów (Verlet): wiązania wzdłuż, w poprzek, na skos i co drugie (sztywność zginania). Każdy punkt jest trzymany na zewnątrz tego, co spotka: bryły w środku (każdy kształt, też galareta), podłogi, ścian i spadających rzeczy, przez zapytanie fizyki o najbliższą powierzchnię (`world.projectPoint`). Jedwab się leje, bawełna fałduje sztywniej, guma się rozciąga. Rozmiar, kolor, „Drop a sheet” / „Take it away”.

**Powierzchnia:** Glass, Rubber, Ceramic, Chrome i kolor. (X-ray usunięty.)

**Światło:** kierunek z boku i z góry, siła, od chłodnego do ciepłego, światło pokoju, cienie.

**Ręka:** lewy przycisk przesuwa bryłę, a puszczona w ruchu leci (rzut: grawitacja, podłoga, ściany); prawy przycisk obraca ją w 3D; klik bez przeciągania zrzuca garść kulek; podwójny klik unosi ją z powrotem na środek i prostuje. Clear w panelu czyści spadające. Kamera stoi.

**Pokój:** widoczna podłoga (łapie cienie) i niewidzialne ściany.

**Wydajność:** szkło z prawdziwym załamaniem tylko na bryle (spadające szkło bez dodatkowego przebiegu sceny), rozdzielczość do 1,5×, mapa cieni 1024, bez CCD; kula i blob sztywne rysowane z gęstej siatki, fizyka z lżejszej.

Ustawienia: `lab.gravity.v1`, tryb jasny/ciemny w `.mode`.

**Plansza:** `?thumb=1` nieruchomy kadr z kilkoma rzeczami (ustalony los), `?demo=1` ten sam kadr, potem spadanie. Przez adres można ustawić `shape`, `feel`, `surface`, `drop`, `dropMat`, `cloth`, a `sheet` zrzuca płachtę w kadrze startowym (np. `?demo=1&feel=jelly&surface=rubber`).

Do testów: `window.GRAVITY` (`spawn`, `drops`, `world`, `jelly`).
