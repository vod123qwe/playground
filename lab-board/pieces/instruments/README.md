# Instruments

Dwa instrumenty w jasnym studiu, jeden naraz (pasek ‹ nazwa › na dole, strzałki na klawiaturze): perkusja i drewniany ksylofon. Gra się dotykiem albo kliknięciem w instrument i z klawiatury (litery stoją na instrumencie; w panelu można je schować, na telefonie startują schowane).

**Perkusja (zestaw jak u Toola, Danny Carey):** startuje z trzech elementów (stopa, werbel, hi-hat), „+ …” dokłada kolejny, „−” zdejmuje ostatni, aż do 17. Kolejność: tom, floor tom, crash, ride, drugi tom, druga stopa, china, splash, trzeci i czwarty tom, drugi floor, drugi crash, oktobany (4 tuby), gong na ramie za zestawem. Nowy element spada z góry i osiada, kadr odsuwa się i podnosi, żeby zestaw się mieścił.
Klawisze: Spacja/B stopa, N druga stopa, F/J werbel, H hi-hat (Shift+H albo G otwarty), T Y U I tomy, K L floory, C i X crashe, R ride, E china, W splash, 1–4 oktobany, O gong. Shift = mocne uderzenie (mocniejsza warstwa nagrania, stopa z kliknięciem pałki, werbel z rimshotem). Uderzenie: bęben drga, talerze się kołyszą, hi-hat się domyka, gong buja się powoli na linkach.

**Brzmienie:** jeden profil „Tool” na torze perkusji: półki niskie +3 dB i wysokie +2,5 dB, łagodny kompresor (3,2:1), średni pokój. Tomy to dwa nagrania VCSL (pałeczkami) przestrojone na sześć wysokości, oktobany to wysoki tom przestrojony mocniej (×1,4–2,05). Warstwy siły: soft/mid/hard.

**Ksylofon:** dwie oktawy C5–C7 (25 sztabek z palisandru, krzyżyki w tylnym rzędzie wyżej), pod sztabkami mosiężne rezonatory, dwie pałki: bliższa uderza w sztabkę. Klawisze jak w trackerze: rząd Z…M (z S D G H J jako krzyżyki) i rząd Q…I (z 2 3 5 6 7).

**Dźwięk:** nagrania CC0 w `sounds/` (mono 32 kHz 16 bit, przycięte skryptem w Node): [VCSL](https://github.com/sgossner/VCSL) (stopy, werble, hi-hat, tomy, crash, ride, drugi crash = Suspended Cymbal 2, gong = Gong 1 f/mf, ksylofon), z Freesound: china [RytmenPinnen „China20”](https://freesound.org/people/RytmenPinnen/sounds/102031/) i splash [pjcohen „Zildjian 8 inch K Custom Dark Splash”](https://freesound.org/people/pjcohen/sounds/46647/) (oba CC0, z podglądu HQ mp3 zdekodowanego w przeglądarce). Razem ~3,4 MB.

**Modele i powierzchnie:** w kodzie (three.js): bębny z rantów, śrub i membran, talerze z profilu toczonego (china z podwiniętym brzegiem, wisi do góry nogami), gong jako toczony dysk w drewnianej ramie, ksylofon ze sztabek i rezonatorów. Tekstury rysowane w canvas: słoje drewna, lakier z brokatem, powlekane membrany, toczony brąz. Światło: RoomEnvironment + jedno światło kluczowe z cieniami.

**Panel:** głośność, pokój, litery klawiatury, kolor perkusji (Wine, Black, Ocean, Green, Pearl), światło i jego temperatura.

Ustawienia: `lab.instruments.v1`. Adres: `?look=Drums|Xylophone`, `?kit=3…17`. Plansza: `?thumb=1` pełny zestaw i ksylofon w jednym kadrze (nieruchomo), `?demo=1` pełny zestaw gra groove (bez dźwięku, same ruchy). Do testów: `window.INSTR`.

Wcześniejsza pełna wersja (saksofon, gitara, gra w stylu Guitar Hero, granie we dwoje, scena z postaciami, import MIDI) leży w `F:\AI - Tests\.archive\instruments-full` i w historii gita.
