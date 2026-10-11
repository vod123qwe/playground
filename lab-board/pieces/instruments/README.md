# Instruments

Trzy instrumenty w jasnym studiu, jeden naraz (pasek ‹ nazwa › na dole, strzałki na klawiaturze): perkusja, drewniany ksylofon, saksofon tenorowy. Gra się dotykiem albo kliknięciem w instrument i z klawiatury (litery stoją na instrumencie; w panelu można je schować, na telefonie startują schowane).

**Perkusja:** startuje z trzech elementów (stopa, werbel, hi-hat), przyciskiem „+ …” dochodzą kolejne, po jednym, aż do 9 (tom, floor tom, crash, ride, bongosy, konga); „−” zdejmuje ostatni. Nowy element spada z góry i osiada, kadr odsuwa się, żeby zestaw się mieścił. Klawisze: Spacja/B stopa, F/J werbel, H hi-hat (Shift+H albo G otwarty), T tom, Y floor tom, C crash, R ride, O bongosy, P konga. Uderzenie: bęben drga (sprężyna), talerze się kołyszą, hi-hat się domyka; zamknięty hi-hat ucisza otwarty.

**Ksylofon:** dwie oktawy C5–C7 (25 sztabek z palisandru, krzyżyki w tylnym rzędzie wyżej), pod sztabkami mosiężne rezonatory, dwie pałki: bliższa uderza w sztabkę. Klawisze jak w trackerze: rząd Z…M (z S D G H J jako krzyżyki) i rząd Q…I (z 2 3 5 6 7).

**Saksofon:** trzy tryby w pasku nad pigułką.
- **Keys:** te same dwa rzędy klawiszy (od C3 na Z) albo klawiatura dotykowa na ekranie (dwie oktawy, przeciąganie palcem gra legato); dźwięk trwa, dopóki trzymasz (pętla w środku nagrania), klapki zamykają się zależnie od wysokości.
- **Melody:** stare, wolne melodie (The Saints, Ode to Joy) i własny blues lick; każdy klawisz, tap w saksofon albo klawisz na ekranie gra następną nutę tak długo, jak trzymasz; następna nuta świeci na klawiaturze.
- **Breath:** mikrofon (pyta o zgodę); głośność dmuchania = głośność saksofonu, klawisze wybierają nutę, bez klawisza gra ostatnia.

**Utwory (♪ Play a song):** jak Guitar Hero, ale nic nie gra samo: nuty spadają do linii trafień, każdą grasz sam (klawisz, tap w instrument albo w tor). Przed startem 4 kliknięcia metronomu; tempo 50, 75 albo 100%. Ocena: Perfect do 60 ms, Good do 140 ms, przepuszczona = Miss; combo mnoży punkty do ×4; na końcu karta: gwiazdki (95/80/50% celności), celność, najlepsze combo, rekord (zapisany na urządzeniu osobno dla każdego tempa, `lab.instruments.v1.best`).
- **Plansza do gry (wszystkie instrumenty tak samo):** tylko tory, których utwór potrzebuje, od lewej do prawej, każdy na klawiszu ze środkowego rzędu (3 tory: F G H, 5: D F G H J, do 10: A…;, powyżej 10: rząd cyfr); te same litery na klawiszach-torach pod linią (na telefonie do stukania). Wciśnięty klawisz-tor zapada się i bierze kolor toru; reaguje też na uderzenie klikiem w sam instrument. Na planszy linie taktów i gniazda na linii trafień.
- **Twój ślad:** każde trafienie zostawia kreskę w torze (wyżej = za wcześnie, niżej = za późno) z napisem „early/late X ms”; pod wynikiem pasek celności: kropki w lewo (wcześnie) i w prawo (późno) gasną po 4 s; na karcie wyniku średnie przesunięcie („right on the beat” albo „a touch early/late”).
- **Perkusja:** brakujące elementy zestawu dokładają się same. Rytmy (same partie perkusji, uproszczone): We Will Rock You, Billie Jean, Another One Bites the Dust, Seven Nation Army, In the Air Tonight (przejście na tomach), Can’t Stop, Back in Black.
- **Ksylofon:** nuty spadają na klawiaturę ekranową C5–C7 (pod nią rząd klawiszy Z…/Q…): Für Elise, In the Hall of the Mountain King (trzy razy, coraz szybciej), Flight of the Bumblebee (zawężony do 12 półtonów, F5–E6, na rząd cyfr).
- **Saksofon:** jak ksylofon, od C3, długie nuty z ogonem (na czas utworu zawsze tryb Keys): When the Saints, The Entertainer, St. Louis Blues (początek, uproszczony).
Melodie tylko z domeny publicznej (Beethoven, Grieg, Rimski-Korsakow, Joplin 1902, Handy 1914, tradycyjne); przy współczesnych utworach wyłącznie rytm perkusji, bez melodii.

**Dźwięk:** prawdziwe nagrania z [Versilian Community Sample Library](https://github.com/sgossner/VCSL) (CC0): 33 pliki w `sounds/`, przycięte do mono 32 kHz 16 bit (skrypt w Node, ~4,3 MB). Wysokości: ksylofon brzmi oktawę wyżej niż nazwy plików; saksofon ma nazwy w konwencji Yamaha (A#1 = B♭2). Brakujące wysokości = najbliższe nagranie z inną prędkością odtwarzania. Szyna: kompresor + mały pokój (pogłos z wygenerowanej odpowiedzi impulsowej).

**Stopa:** czarna membrana z otworem, bez napisów.

**Modele i powierzchnie:** w kodzie (three.js): bębny z rantów, śrub i membran, talerze z profilu toczonego, saksofon jako stożkowa rura po krzywej + czara na tokarce, ksylofon ze sztabek i rezonatorów. Tekstury rysowane w canvas: słoje drewna, lakier z brokatem, powlekane membrany (wytarte w środku), toczony brąz z mapą chropowatości; światło z RoomEnvironment + jedno światło kluczowe z cieniami. Plan: podmiana na modele z Blendera (MCP), gdy będzie połączony.

**Panel:** głośność, pokój, litery klawiatury, kolor perkusji (Wine, Black, Ocean, Green, Pearl), wykończenie saksofonu (Gold, Silver, Black), światło i jego temperatura.

Ustawienia: `lab.instruments.v1`. Adres: `?look=Drums|Xylophone|Saxophone`, `?kit=3…9`, `?mode=keys|melody|breath`.

**Plansza:** `?thumb=1` wszystkie trzy w jednym kadrze (nieruchomo), `?demo=1` perkusja gra groove (bez dźwięku, same ruchy). Do testów: `window.INSTR`.
