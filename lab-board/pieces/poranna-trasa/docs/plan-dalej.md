# Poranna Trasa: co dalej (burza mózgów i plan)

Stan: 2026-09-30, wersja 15. Dokument do decyzji; nic z tego nie jest jeszcze zbudowane, chyba że napisano inaczej.

**Decyzje Jarka (2026-09-30):**
- walka: w rytmie, czytelna (punkt 1, rekomendacja);
- kolejność: najpierw walka, potem rywale (rywal z torbą, gang na rowerach);
- progresja: na razie sam wynik; później może miejsca odbioru gazet i sklepy rowerowe (wydać kasę na ulepszenia i kupić jakiś prezent);
- multiplayer: po rdzeniu gry.

> **Kierunek gry i kolejność prac: `docs/wizja.md`** (roguelite, sklep na trasie, loteria po runie). Ten plik to zbiór szczegółowych pomysłów; gdy się różnią, wygrywa wizja.

## 1. Walka: dlaczego dziś jest nieczytelna i co zmienić

**Co jest nie tak (z Twojej oceny i z testów botami):**
- dzieje się za szybko: prosty trafia po ~0,15 s, przeciwnik rzuca serie, nie ma chwili na reakcję;
- nie widać ciosów: z widoku z oczu ręce przeciwnika są blisko, animacja ciosu jest krótka, a gwiazda mówi tylko „skąd”, nie „kiedy”;
- nie wiadomo, jak się bronić: blok, kontra i unik są opisane tylko w oknie pomocy.

**Propozycja: walka „w rytmie”, czytelna jak w grach rycerskich (rekomendacja).**
- Wolniej i jeden atak naraz: każdy cios przeciwnika ma zamach 0,5–0,7 s (widać, jak odciąga rękę i się pochyla), potem cios; między atakami przerwa na Twój ruch.
- Trzy fazy każdego ataku, pokazane na ekranie:
  1. **zapowiedź** (strzałka na gwieździe po stronie ciosu zapala się na żółto, przeciwnik świeci na krawędzi);
  2. **okno kontry** (strzałka na zielono, krótki dźwięk, na moment lekkie zwolnienie czasu): PPM w tym momencie = kontra;
  3. **trafienie** (za późno: dostajesz).
- Unik czytelny: Shift + kierunek przeciwny do strzałki. Udany unik: przeciwnik się odsłania na chwilę (bonus do ciosu).
- Ty: cios ma koszt oddechu, seria trzech ciosów męczy; trafiony w zamach przeciwnik się zatacza.
- Widok: domyślnie zza pleców (lepiej widać obu), z oczu jako opcja (V). W widoku z oczu przeciwnik trochę dalej, a jego ręce kontrastowe.
- **Pierwsza bójka = krótki trening:** trzy kroki z podpowiedziami („zablokuj, gdy zielone”, „zrób unik”, „uderz, gdy się odsłoni”), w spokojnym tempie; potem normalnie.
- Poziomy przeciwników: cherlak (wolny, prosty), osiedlowy kozak (szybszy, finty), szwagier (mocny, wolny, trudno go przewrócić).

**Alternatywy:**
- Bijatyka z boku (jak klasyczne chodzone bijatyki): prostsza do czytania, ale gubi widok z oczu, który Ci się podobał.
- Wydarzenia z przyciskami (naciśnij X w porę): najczytelniejsze, najmniej swobody, szybko się nudzi.

## 2. Konkurencja: inni gazeciarze i gang

- **Rywal gazeciarz:** jeździ po trasie z torbą i rozwozi gazety (czasem do „Twoich” skrzynek). Jak Ci się skończą gazety, możesz go dogonić i skopać: spada z roweru, a torba wysypuje się na drogę (zbierasz 5–10 gazet). Albo zaczepić pieszo: bójka o torbę.
- **Gang gazeciarzy na rowerach:** czasem, gdy napadniesz rywala, wraca z kolegami (2–4 rowery). Gonią Cię i próbują zepchnąć:
  - zamiast jednego kopa: **pasek równowagi** na rowerze; ich kopnięcia i zajeżdżanie drogi go zbijają, a pusty pasek oznacza wywrotkę;
  - Ty kopiesz ich na bok (lewo/prawo), też mają pasek; zrzucony kolega odpada;
  - ucieczka: skocznie, wąskie przejścia, szybka jazda z górki, skróty przez podwórka;
  - wygrana: ostatni zostawia stertę gazet i ucieka z tekstem („MAMY CIĘ NA OKU!”);
  - przegrana: zabierają część gazet albo kasę (jak po przegranej bójce).
- Klimat: teksty januszowe i czarny humor („TO NASZ REWIR, KOLEGO!”, „ŻŁÓB SOBIE WŁASNĄ TRASĘ!”).

## 3. Świat: skrzyżowania i więcej miejsca

- **Skrzyżowania z bocznymi ulicami:** na pętli 3–4 skrzyżowania w kształcie T i X; z bocznych uliczek wyjeżdżają auta (czasem bez patrzenia), stoi znak STOP, przechodnie przechodzą przez pasy. Boczna uliczka to krótki ślepy zaułek z kilkoma domami (nowi prenumeratorzy, skrót).
- Przejazd kolejowy z opuszczanym szlabanem i pociągiem (rzadko, efektowny).
- Mostek nad strumykiem, park z alejką i ławkami (kaczki, staruszki karmiące gołębie), plac zabaw.
- Mały sklepik osiedlowy (poranna kolejka po bułki), kiosk.
- Śmieciarka i mleczarz: wolne pojazdy do wyprzedzenia albo do wykorzystania (jedziesz za nimi w cieniu).
- Pogoda i pora: mgła o świcie, deszcz (śliska droga, kałuże chlapią), wschód słońca w trakcie trasy.

## 3b. Miejsca specjalne i eventy (burza mózgów, do rozkminki)

Pomysł Jarka: kilka wyjątkowych budynków na trasie, każdy z własną sytuacją, zabawną i z kilkoma zakończeniami. Wspólny szkielet: miejsce ma wyzwalacz (podjeżdżasz, rzucasz gazetą, ktoś cię widzi), krótką scenkę z wyborem (2–3 odpowiedzi klawiszami 1/2/3) i losowane zakończenie zależne od wyboru i stanu gracza (kasa, HP, reputacja).

- **Magazyn gazet (hurtownia):** miejsce doładowania torby. Magazynier z humorami: raz daje ekstra paczkę, raz każe czekać, aż skończy kawę (mini-czekanie albo przekupstwo drożdżówką). Może tu wisieć tablica z „zleceniem dnia”.
- **Policja na parkingu:** radiowóz stoi przy sklepie. Jeśli zobaczą bójkę albo rozbitą szybę, zatrzymują cię. Rozmowa z wyborami: tłumaczysz się („to on zaczął”), zagadujesz („panie władzo, gazetka gratis?”), uciekasz. Zakończenia: mandat, pouczenie, konfiskata paczki, każą ci dowieźć gazetę do komisariatu, pościg (radiowóz jedzie za tobą, trzeba zgubić go w bocznej uliczce), albo policjant okazuje się szwagrem i puszcza wolno. Im więcej wpadek, tym mniej cierpliwi.
- **Kościół:** rano msza, przed wejściem babcie. Trafisz gazetą w drzwi w trakcie: ksiądz wychodzi z kazaniem na temat młodzieży. Delikatny ton, żarty o sytuacji, nie o wierze. Zakończenia: pokuta (dowieź gazety za darmo trzem babciom), błogosławieństwo (tarcza na jedną wywrotkę), albo babcie z parasolkami.
- **Szkoła:** dzwonek, tłum dzieci na pasach, pani woźna z miotłą. Event „wagary”: jeden uczeń prosi o podwiezienie i ucieka ze szkoły, a za tobą rusza dyrektor. Albo gazeta w okno pokoju nauczycielskiego: kartkówka dla gazeciarza (quiz z trzema absurdalnymi pytaniami).
- **Nawiedzony dom:** zarośnięty, ciemne okna, skrzypiąca furtka. Rzucisz gazetą: w oknie zapala się światło, drzwi same się otwierają. Dłuższy event: wchodzisz na nogach (krótki korytarz, gasnąca latarka, odgłosy), kilka zakończeń: duch prenumerator zamawia gazetę na wieczność (stały bonus), okazuje się, że to dziadek w prześcieradle straszący dla zabawy, gonią cię nietoperze, albo znajdujesz skrzynię z kasą. Rzadko, w nocy albo o świcie we mgle.
- **Dalsze pomysły tej samej rodziny:** sklep rowerowy (ulepszenia), kiosk z plotkami (podpowiedzi o eventach), budowa z dźwigiem, weselna sala z orkiestrą rano po imprezie.

Do decyzji: ile tych miejsc na pętlę (propozycja 3–4, losowane z puli), czy scenki mają dialogi z wyborem czy tylko z reakcją na akcję, i czy zakończenia wpływają na progresję (reputacja, kasa).

## 3c. Napady na pieszych: co z tego wynika (burza mózgów, do decyzji)

Zasada: napad się opłaca od razu (drobne, fanty), ale kosztuje później. Każdy typ przechodnia reaguje inaczej, a świat pamięta.

- **Obława (gorąco):** każdy napad przy świadkach podbija licznik obławy (1–3 gwiazdki w stylu listu gończego). Przy 3 przyjeżdża policja; to się liczy do „policja za trzecim razem = koniec runu”. Obława stygnie, gdy jedziesz spokojnie i nikt cię nie widzi.
- **Każdy ofiarą, ale nie każdy bezbronny:**
  - babka tłucze parasolką i woła inne babki;
  - dresiarz oddaje, a potem wraca ze szwagrem;
  - biegacz ucieka i nagrywa telefonem (jutro jesteś w gazecie, którą sam roznosisz);
  - pani z psem spuszcza psa;
  - facet w garniturze okazuje się tajniakiem;
  - emeryt z laską płaci „za spokój” i dzwoni do wnuka policjanta.
- **Łup:** drobne, bułki (leczą HP), bilet, kupon lotto (event losowania), klucze (skrzynka pocztowa do otwarcia), stare zdjęcie (początek wątku).
- **Renoma:** napady w dzielnicy obniżają renomę; prenumeratorzy rezygnują, napiwki maleją, babki plotkują przy furtkach. Oddanie łupu albo pomoc ofierze (na przykład pogonienie złodzieja) ją podnosi. Wybór jest: karmazyn czy Robin Hood.
- **Zemsta:** okradziony może wrócić później w tym samym runie, z kumplem, czasem na rowerze.
- **Świadkowie i kamera:** monitoring na parkingu albo przy sklepie; zakapturzenie (kupiony kaptur) zmniejsza obławę.
- **Dla ostrzejszego humoru:** okradziony mówi coś zaskakującego („NARESZCIE KTOŚ MNIE ZAUWAŻYŁ”, „WEŹ TEŻ TEŚCIOWĄ”), a czasem to on okrada ciebie.

## 3d. Z klasyki gatunku (inspiracja, bez kopiowania nazw ani grafik)

- **Akcje ratunkowe:** wózek z dzieckiem toczy się z górki (dogonić i zatrzymać), złodziej ucieka z torebką (trafić gazetą albo dogonić i kopnąć z roweru; upada, rzuca łup, oddajesz go właścicielce: napiwek, renoma, czasem ciasto). Nagroda: renoma, napiwki, a przy obławie mniej gwiazdek. Równowaga dla napadów z 3c.
- **Wyzwanie przy sklepie na trasie:** krótki tor za warsztatem rowerowym: skocznie, tarcze do trafiania gazetą, limit czasu; nagroda w kasie albo zniżka na części.
- **Nagłówek na koniec runu:** podsumowanie runu jako pierwsza strona gazety, którą sam roznosisz, z nagłówkiem zależnym od tego, jak się skończył („GAZECIARZ POBITY PRZEZ BABKĘ Z PARASOLKĄ”, „TRZECI MANDAT: KONIEC KARIERY”, „REKORD: 4,2 KM BEZ WYWROTKI”) i zdjęciem z ostatniej chwili (zrzut klatki w pikselach).

## 3e. Zdarzenia na drodze (burza mózgów)

Wspólny szkielet: zapowiedź z daleka (dźwięk, znak, ludzie się oglądają), 5–15 s akcji, nagroda albo kara, śmieszna reakcja. Im dalej w runie, tym częściej, gęściej i w połączeniach (np. peleton w trakcie obławy).

**Przemknąć się (slalom, wyczucie szczeliny)**
- przejście dla pieszych: wycieczka przedszkolaków z paniami, trzeba się zmieścić między dziećmi albo poczekać (czekanie = spokój, przejazd na styk = bonus i wrzask pań)
- wyjście z kościoła po mszy: tłum babek w poprzek jezdni
- targ, stragany na poboczu, klienci z siatkami, skrzynki z jabłkami (rozsypane jabłka ślizgają koła)
- kondukt albo wesele: jedzie się wolno za orszakiem, wyprzedzenie ma skutki
- stado kaczek / krowy przepędzane przez drogę (wieś)

**Przeskoczyć (skocznie, tricki, wyczucie czasu)**
- roboty drogowe: wykop przez całą jezdnię, deska jako skocznia; robotnicy komentują styl
- szlaban na przejeździe kolejowym i nadjeżdżający pociąg (nasze tory): zdążyć albo czekać; przeskok przez opuszczony szlaban
- rozlana kałuża/plama oleju przed zakrętem, śmieciarka tarasująca drogę (wjechać po klapie)
- rura z hydrantu tryska przez ulicę (przejazd = mokry, gazety w torbie namakają)

**Uciec / przetrwać (pościg, spychanie)**
- **kolarze w peletonie:** wyprzedzają w grupie, spychają, można się podczepić w ich cień (szybciej), wyzwać na sprint do skrzyżowania o kasę albo zrzucić jednego (reszta się mści)
- **policja:** radiowóz z kogutem przy obławie; blokada z pachołkami (przejechać chodnikiem albo zatrzymać się i gadać); policjant na rowerze, który goni i ma lepszy rower od ciebie
- gang gazeciarzy (już w planie): pasek równowagi, zrzucanie
- pies uciekł z posesji i biegnie z właścicielem na smyczy wlokącym się za nim
- samochód nauki jazdy: jedzie zygzakiem, gaśnie, cofa bez patrzenia

**Pomóc albo skorzystać (wybór)**
- wózek z dzieckiem toczy się z górki / złodziej z torebką (sekcja 3d)
- rozsypane gazety konkurencji na drodze: zebrać (twoje) albo zostawić
- ktoś wybiega z domu w szlafroku za tobą: „MOJA GAZETA!”, pościg odwrotny (dogoni cię i da napiwek albo w ucho, zależnie, czy trafiłeś w ganek)
- autostopowicz na przystanku: podwieźć na bagażniku (wolniej, ale płaci; po drodze gada bzdury)
- dostawca pizzy na skuterze ściga się z tobą o ten sam adres

**Absurd (rzadko, do albumu odkryć)**
- balon z helem porywa kota, trzeba zestrzelić gazetą
- ktoś jedzie kosiarką samojezdną środkiem jezdni (dogonić, wyprzedzić, a on się ściga)
- byk / dzik na osiedlu
- bocian niesie coś ciężkiego nad drogą i to upuszcza

## 3f. Kradzież rowerów i dzieciaki na hulajnogach (burza mózgów)

**Kradzież roweru: po co?**
- **Ratunek:** twój rower się rozwalił albo ci go ukradli (napad, gang), a do sklepu daleko. Zrzucasz kogoś i jedziesz dalej na jego rowerze.
- **Inny rower, inna jazda:** damka z koszykiem (wolna, stabilna, mieści więcej gazet), góral (skoki, trawa), kolarzówka (szybka, krucha, źle na krawężnikach), składak, rower dziecięcy (śmiesznie mały, bardzo wolny), rower z przyczepką. Zanim kupisz część w sklepie, sprawdzasz, jak to jeździ.
- **Szybka kasa:** skradziony rower sprzedajesz w skupie albo u chłopaków z baraków (mało, ale od ręki).
- **Koszty:** właściciel zgłasza kradzież (obława +1), rower jest „znany” w tej dzielnicy (policja zatrzymuje, gdy cię z nim zobaczy), właściciel może cię gonić ze szwagrem; twój rower zostaje tam, gdzie go porzuciłeś (można wrócić, ale w międzyczasie ktoś go może zabrać).
- **Humor:** okradziony mówi „TO ROWER PO DZIADKU!”, damka ma dzwonek, który sam dzwoni, rower dziecięcy ma frędzle.

**Dzieciaki na elektrycznych hulajnogach**
- Jeżdżą grupkami, szybko i bez ładu, środkiem jezdni i chodnikiem, zajeżdżają drogę, trąbią, nagrywają cię telefonem.
- **Wkurzają:** wyprzedzają i hamują przed tobą, rzucają tekstami („OK BOOMER”, „ROWER? W TYCH CZASACH?”), zabierają gazetę spod drzwi, zanim wróci prenumerator.
- **Co możesz:** zrzucić (upadają z hulajnogą, obława +1, rodzice w oknie), prześcignąć (za sprint o kasę jak z kolarzami), ukraść hulajnogę (szybka, ale bateria się kończy i nie da się z niej rzucać gazetami).
- **Porzucone hulajnogi** leżą w poprzek chodnika jako przeszkoda.

## 3g. Wygląd: analiza względem referencji Jarka i plan (ciepła ulica z drzewami)

Referencja to malowana ilustracja: każdy piksel postawiony celowo, nie render w czasie rzeczywistym. Da się do niej zbliżyć, nie da się jej odtworzyć 1:1 przy 60 klatkach na telefonie. Najważniejsze różnice i co z nimi zrobić:

1. **Światło:** nisko stojące ciepłe słońce, długie miękkie cienie, **cętkowany cień liści** na jezdni. U nas cień jest twardy i jednolity. → cień koron z mapy „dziur w liściach” (plama światła i cienia przesuwa się lekko z wiatrem), cieplejszy domyślny styl.
2. **Zamknięcie ulicy:** drzewa nad jezdnią, żywopłoty wzdłuż chodnika, rabaty, kosze, flagi, lampy; widok jest „obudowany”. U nas trawniki są szerokie i puste. → więcej rzeczy przy chodniku i drzewa przy jezdni, których korony wchodzą nad drogę.
3. **Faktura w skali piksela:** krawężnik z bloczków, płyty chodnika, asfalt z łatami, trawa z kwiatkami; tekstury są rysowane tak, że jeden teksel to jeden piksel ekranu. U nas tekstury powtarzają się w różnych skalach i się rozmywają. → tekstury przerysowane pod docelową gęstość pikseli, z paletą.
4. **Drzewa:** pień rozgałęzia się szybko, kora z fakturą i cieniem, korona z kęp z jasną i ciemną stroną. U nas jeden pień i kule. → nowe drzewa: gałęzie, kora, kępy liści z dwoma tonami.
5. **Kolor i powietrze:** ciepła paleta, a w oddali niebieska mgiełka (miasteczko nad jeziorem tonie w powietrzu). → mgła zależna od odległości, z kolorem nieba.
6. **Szyby aut:** przezroczyste, z pikselową smugą odbicia. → szkło półprzezroczyste z ukośnym paskiem blasku.
7. **Droga nie zawsze taka sama:** odcinki jednopasmowe, zatoka autobusowa z wysepką i przystankiem, buspas, studzienki, łaty. → warianty odcinków drogi; przystanek z lumpem (obudzony gazetą: ludzie klaszczą, wpadają monety) jako zdarzenie.

**Pogoda w panelu stylu (U):** mgła (gęstość), deszcz (natężenie: krople, mokra ciemniejsza droga), kałuże (mienią się odbiciem nieba), może pora dnia. Panel U przebudowany na grupy: Obraz i piksele · Kolor · Światło · Kontur i linie · Pogoda i powietrze · Efekty.

## 4. Progresja (żeby chciało się wracać)

**Propozycja: dni pracy (rekomendacja).**
- Każdy dzień to jedna trasa: poniedziałek–sobota, rosnąca liczba prenumeratorów, niedziela dodatkowa (gruba gazeta, cięższa torba).
- Prenumeratorzy zaznaczeni na domach (zielona skrzynka / flaga). Gazeta do nich: pieniądze i napiwek. Nie-prenumeratorzy: szyby, kłopoty.
- Na koniec dnia raport: dostarczone, stracone, szkody, pieniądze; prenumeraty rezygnują, jak ich pominiesz, i wracają, jak dowozisz dobrze.
- **Pieniądze na ulepszenia:**
  - rower (przerzutki: szybciej pod górę, lepsze hamulce, BMX na tricki);
  - torba (więcej gazet);
  - ubrania i czapki (kosmetyka);
  - rzeczy do bójki (rękawice, lepszy kop).
- **Reputacja w dzielnicy:** mieszkańcy pamiętają (babcia z laską odpuszcza, psy znają Cię i mniej gonią, gang rośnie w siłę, jak go prowokujesz).
- Wyzwania dnia: „bez stłuczonej szyby”, „3 tricki”, „przed 7:00”.
- Zapis w przeglądarce (bez kont).

**Alternatywy:** sam wynik punktowy (najprostsze, najsłabsza motywacja); kariera z historią (najciekawsza, najwięcej pisania).

## 5. Atrakcyjność: szybkie zwycięstwa

- Dźwięki: rower, dzwonek, psy, szyby, okrzyki (dziś gra jest cicha; to największa różnica w odbiorze).
- Muzyka poranna (lekka, pętla), cichnie w bójce.
- Kamera: przy rzucie już odjeżdża; dodać krótkie „ujęcie z gazety” po trafieniu w skrzynkę (0,5 s zwolnione).
- Minimapa trasy (pasek u góry: domy prenumeratorów, rywal, gang).
- Efekty: kurz spod kół na szutrze, iskry przy wywrotce, liście wzbijane przejazdem.

## 6. Multiplayer (szczegóły w `docs/multiplayer.md`)

- Kolejność: najpierw rdzeń jednego gracza (dni, prenumeratorzy, rywale), potem dwóch graczy, żeby było w co grać razem.
- Tryby razem:
  - **wspólna trasa** (dzielicie ulicę, każdy ma swoich prenumeratorów);
  - **wyścig gazeciarzy** (kto pierwszy rozwiezie);
  - **ustawka** (bójka gracz na gracza, zasady walki z punktu 1).
- Krok 1 bez serwera: dwie karty przeglądarki, druga osoba jako „duch” (sprawdza protokół). Krok 2: mały serwer pokojów z kodem zaproszenia.

## 7. Proponowana kolejność

1. Walka w rytmie + trening (bo teraz frustruje).
2. Pasek równowagi na rowerze i rywal gazeciarz z torbą (kradzież gazet).
3. Gang na rowerach.
4. Dni pracy, prenumeratorzy, pieniądze, ulepszenia.
5. Skrzyżowania i boczne uliczki.
6. Dźwięk i muzyka.
7. Multiplayer krok 1 i 2.
