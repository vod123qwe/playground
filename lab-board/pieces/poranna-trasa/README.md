# Poranna Trasa

Gra w klimacie klasycznego roznosiciela gazet: rowerem przez przedmieście, widok zza pleców, gazety w lewo i w prawo do skrzynek.
Własna nazwa i własne grafiki.

## Uruchomienie

```
python serve.py        # (serwer bez pamięci podręcznej: zmiana widać po odświeżeniu)
```

i w przeglądarce `http://localhost:8805` (moduły ES nie działają z pliku otwartego wprost).

## Sterowanie

- klawiatura: W / ↑ pedałowanie, S / ↓ hamulec, A D / ← → skręt, Q / E rzut w lewo / w prawo
- pad: lewa gałka skręt, RT (albo A) pedałowanie, LT (albo X) hamulec, LB / RB rzut w lewo / w prawo
- P: wygląd pikselowy włącz / wyłącz (do porównania), 1 2 3: wielkość pikseli (180, 240, 320 pikseli wysokości)

## Etap 1: sam rowerzysta (teraz)

- `src/rider.js` · chłopak na rowerze z gładkich, zwężających się brył (czapka z daszkiem, włosy, koszulka z rękawkami, dżinsy, trampki, torba z paskiem i gazetami; rower z ramą z rurek, wygiętym widelcem i kierownicą, siodełkiem, kołami ze szprychami, korbą, pedałami, odblaskiem). Poza liczona co klatkę: koła i korba się kręcą, nogi idą za pedałami, ręce trzymają kierownicę (IK dwóch kości), cały rower przechyla się w zakręcie, na podjeździe i przy mocnym ruszaniu staje na pedałach, przy hamowaniu pochyla się, rzut: ręka do torby, zamach w bok, wypuszczenie gazety.
- `src/track.js` · tor testowy: pętla ulicy (ok. 700 m) z zakrętami i górkami; asfalt, krawężniki, trawnik, chodnik, domy z gankami i skrzynkami, drzewa (część jesiennych), słupy z przewodami, płotki, żywopłoty, zaparkowane auta, liście na drodze, dalekie wzgórza.
- `src/pixel.js` · wygląd pikselowy: scena rysowana w małej rozdzielczości (skala całkowita), obrys na skokach głębokości, dithering 4 × 4, paleta ok. 45 ciepłych kolorów.
- `src/main.js` · jazda (pedałowanie słabnące z prędkością, hamulec, opór, górki, trawa, krawężniki), skręt (mniejszy przy dużej prędkości), przechył z prędkości i promienia skrętu (tan φ = v² / g r) na sprężynie, kamera za plecami z opóźnieniem, gazety z odbiciami i trafieniami w skrzynki.

## Otoczenie i wygląd (etap 1b)

- `src/textures.js` · małe pikselowe faktury z kodu: asfalt, płyty chodnika, krawężnik, trawa z kwiatkami, deski, gonty, liście, kwitnące krzewy, kratka ściekowa, plamki cienia liści, kora
- `src/backdrop.js` · dalekie tło dookoła: wzgórza, jezioro z odblaskami, miasteczko na zboczu z kościołami, bliższe pagórki ze świerkami
- domy: okna z ramą, szprosami, okiennicami i skrzynkami kwiatów, ganki z balustradą i schodkami, ścieżki albo podjazd z bramą garażową, krzewy i klomby, kosze
- przy ulicy: drzewa na poboczu z koronami nad jezdnią i plamkami cienia na drodze, latarnie, kratki ściekowe, hydranty, świerki za domami
- cały nieruchomy wystrój scalony materiałami w kilkadziesiąt siatek (mniej wywołań rysowania)
- wielkość pikseli do podglądu: przyciski w lewym dolnym rogu albo klawisze 1–5 (180, 240, 320, 400, 540 pikseli wysokości)

## Etap 2: pierwsze zasady gry

- sterowanie: W / ↑ pedałowanie, Shift szybciej, S / ↓ hamulec, A D / ← → skręt, Q / E przytrzymaj i puść: rzut w lewo / w prawo z siłą, Spacja: kopniak, C: podskok, S na postoju: cofanie, O: kontur, R: od nowa (z pytaniem Y / N), V: następna kamera (oczami rowerzysty, blisko, średnio, daleko, wysoko); pad: gałka, RT, LT, A (kopniak), B (podskok), X (szybciej), LB / RB (przytrzymaj: rzut)
- rzut z siłą: pikselowy pasek nad głową napełnia się, im dłużej trzymasz; od lobu do mocnego rzutu
- punkty: gazeta koło drzwi +1, w skrzynce +5 (z okna domu dymek z podziękowaniem i serduszkami), wybita szyba +2 (pęknięta szyba, odłamki i pikselowy dymek z przekleństwem @#$%! nad domem); paczki gazet na chodniku +8 gazet
- `src/cars.js` · auta: sedan, hatchback, kombi, pickup (profil z nadkolami, szyby, słupki, zderzaki, światła, tablice, lusterka, koła z felgami); zaparkowane przy krawężniku i na podjazdach
- `src/traffic.js` · ruch uliczny w obie strony, zwalnia za rowerzystą; zderzenie to wywrotka
- `src/props.js` · między domami: płoty z desek i siatki, szopy, pranie, drewno, piaskownice, poidełka; na drodze: pachołki, worki, wózek, roboty drogowe, dziury, skocznie, paczki gazet
- `src/dogs.js` · psy przy domach: czasem gonią, szczekając obok spowalniają (chłopak nerwowo się ogląda), kopniak je odgania
- `src/hud.js` · nakładka w pikselach gry: czcionka 3 × 5, pasek siły, HAU!, KOP!, +1, +2, gazety i punkty w rogu
- fizyka: skok, skocznie (wylot w powietrze z krawędzi), lądowanie z szarpnięciem; przeszkody z obrysem (w locie przeskakujesz niskie); szybkie uderzenie w twarde to wywrotka: rower na bok, chwila, wstaje; worki i żywopłoty tylko spowalniają

## Etap 3: wywrotki, babka, nerwy

- wywrotka jako ragdoll (`src/rider.js`): chłopak to 15 punktów na patyczkach (Verlet), leci przez kierownicę, obraca się, ląduje, sunie po ziemi, może oprzeć się o przeszkodę albo auto; po chwili płynnie wraca na rower
- `src/granny.js` · babka w chuście z laską: gdy wjedziesz daleko za domy, wybiega z najbliższych drzwi i krzyczy „NIE PO SIONYM!”; wrócisz na drogę, to odpuszcza; dogoni cię poza drogą, to przewraca, zabiera całą kasę (punkty), a ty migając wracasz na trasę
- pies za długo przy tobie: nad głową rosną wykrzykniki i kropla potu, tuż przed progiem duże, drżące, czerwono-białe na czerwonym wybuchu; potem wywrotka, a pies ucieka
- otwarte studzienki na jezdni: wjazd to wywrotka, podskok (C) przelatuje
- Shift przy prędkości: aberracja kolorów na brzegach obrazu i lekko szerszy kadr
- kontur: brak, fiolet, czarny albo gruby czarny (klawisz O albo panel stylu)
- mocniejszy maksymalny rzut
- kopniak w psa po komiksowemu: gwiazda „KOP!”, chwila zatrzymania, wstrząs kamery, pies odlatuje z obrotem; kopniak w babkę nic nie daje (krzyczy „JA CI DAM GNOJKU!” i goni dalej)
- pies wpada na drzewo, słupek, hydrant albo pod auto: koziołkuje („AUU!”, „BUM!”) i ucieka do domu
- kamera przy rzucie: łagodnie się cofa, podnosi i patrzy między rowerzystą a gazetą, chwilę trzyma miejsce trafienia
- dymki (przekleństwa, pochwały) stoją między domem a rowerzystą, z dala od krawędzi ekranu

## Telefon i stamina

- `src/touch.js` · sterowanie dotykowe (włącza się samo na telefonie/tablecie, na komputerze z `?touch` w adresie): lewy kciuk to gałka tam, gdzie dotkniesz (na boki skręt, w górę pedałowanie, w dół hamulec i cofanie); prawy: RZUT w lewo i w prawo (przytrzymaj: siła), KOP, SKOK, SZYBCIEJ; u góry kamera, od nowa (Tak / Nie), pełny ekran
- stamina: sprint (Shift / SZYBCIEJ) zużywa siły, ok. 5,5 s; przy końcu krople potu i obłoczki oddechu nad głową, po wyczerpaniu zadyszka (falki, opuszczona głowa, słabsze pedałowanie, bez sprintu), siły wracają po odpuszczeniu
- psów mniej, ale są szybsze, bliżej, dłużej gonią i częściej szczekają

## Styl obrazu i menu

- `src/settings.js` · panel „Styl obrazu” (klawisz U albo przycisk „styl” w lewym dolnym rogu): gotowe style (Miękki, Klasyczny, Komiks, Wysoka rozdzielczość) i osobno: wielkość pikseli, wygładzanie krawędzi (obraz rysowany 2× albo 3× większy i uśredniany do dużych pikseli, mniej schodków), kontur, liczba tonów cieniowania, paleta ograniczona albo pełna, ciepłe światła i chłodne cienie, jasność, dithering; zapamiętane w przeglądarce
- okno „Zacząć od nowa?” (R albo Esc) rysowane w pikselach gry: ditherowane przyciemnienie, ramka, TAK / NIE (strzałki, Enter, Y / N, myszka, dotyk); czcionka ma polskie litery
- `src/cursor.js` · pikselowe kursory w menu: strzałka i rączka nad przyciskami
- sprint: zamiast rozszczepienia kolorów efekt tunelu (lekka soczewka, obraz uciekający od środka, ditherowana winieta, kamera odjeżdża)
- postać: fałdy koszulki, szwy i przetarcia dżinsów, panele czapki, większa torba ze sprzączką i gazetami na wierzchu, kremowe błotniki; przy cofaniu odpycha się nogami od drogi, na postoju podpiera się lewą nogą, tułów kołysze się z pedałowaniem
- tekstu na stronie nie da się już zaznaczyć

## Menu i sterowanie (wersja 5)

- sterowanie: WSAD jazda (W pedałowanie, S hamulec i cofanie, A D skręt), strzałki ← → przytrzymaj i puść: rzut w lewo / w prawo z siłą (Q / E też), Spacja kopniak, C podskok, Shift szybciej
- Esc: menu w pikselach gry (`src/menu.js`): pauza (wróć, grafika, zacznij od nowa) i grafika: 4 style (Stary ekran, Miękki 280 px, Pastelowy poranek, Złota godzina), piksele 120–300, wygładzanie 1–10×, wygląd pikselowy (P), a pod stylem jego 3 lekkie suwaki; strzałki, Enter, myszka, dotyk; gra stoi, gdy menu jest otwarte
- wygładzanie do 10×: obraz rysowany do 10 razy większy (ograniczony do 4096 px) i uśredniany do dużych pikseli

## Jazda i teren (wersja 5b)

- toczenie bez pedałowania: przy małej prędkości opór rośnie i rower sam staje (z ok. 18 km/h w ok. 3,6 s); pod górę zwalnia szybciej, z górki rozpędza się mocniej
- droga lekko faluje (wzniesienia rzędu pół metra), teren za ogrodami łagodnie faluje i wznosi się ku horyzontowi
- za domami po zewnętrznej stronie pętli (do 200 m): pola w pasy (zboże, zaorane, zielone, ściernisko) w dwóch rzędach, żywopłoty na miedzach, zagajniki, gospodarstwa (dom i czerwona stodoła z dachem mansardowym), pojedyncze drzewa i ściana drzew na krańcu; po wewnętrznej stronie pętli teren tylko do 40 m (dalej jest już druga strona pętli)
- menu Esc: własne płótno (nie rośnie ani nie maleje ze zmianą pikseli); strona grafiki jako panel po lewej, bez przyciemnienia, żeby było widać zmiany

## Ludzie z MakeHuman (wersja 6)

- `assets/vendor/` · MPFB 2.0.17 (w osobnym katalogu `assets/vendor/blender_user`, nie w ustawieniach Blendera użytkownika), zestawy MakeHuman, animacje Quaternius UAL 1 i 2 (Standard, CC0); autorzy i licencje: `assets/CREDITS.md` (bez AGPL)
- `assets/source/mpfb_install_packs.py` · wgrywa zestawy do MPFB; `assets/source/mpfb_people.py` · składa 10 postaci (sylwetka i twarz z suwaków, skóra, brwi, rzęsy, fryzura, ubrania, lekka siatka ciała), szkielet `game_engine`, przenosi animacje UAL (kość po kości, z wyrównaniem pozy T do pozy A, kierunku i wysokości bioder), mierzy tempo chodu (`assets/export/people.json`), zmniejsza tekstury do 256 px, eksportuje `.glb` (razem ok. 18 MB)
- przebudowa: `set BLENDER_USER_RESOURCES=<projekt>/assets/vendor/blender_user` i `blender -b -P assets/source/mpfb_people.py -- all` (albo jeden klucz)
- klipy: emeryt i pan z psem, nastolatek, dziecko, ogrodnik: chód; biegaczka: trucht; mama: chód z rękami przed sobą (wózek); pan w garniturze i pani w sukience: chód elegancki; postoje: telefon, założone ręce, podlewanie

## Auta, rowerzyści, zabawy (wersja 6)

- `src/cars.js` · nadwozia z zaokrąglonych przekrojów (nadkola łukiem, burty zwężające się ku górze, zaokrąglone końce), kabina z szybami i słupkami; typy: liftback (jak z lat 80.), sedan, kanciaste kombi, stary pickup z paką, rzadko niska klinówka ze spojlerem; kolory z lat 80.
- auta skręcają płynnie (kierunek z przejściem między punktami drogi i z bezwładnością), wymijają też rowerzystów
- rowerzyści z naprzeciwka (`src/traffic.js`): od czasu do czasu, przy krawężniku, każdy w swoich kolorach
- kopniak celuje sam w najbliższy cel (pies, pieszy, rowerzysta, auto, babka, hydrant) i kopie z tej strony; kopnięty klnie, a dymek leci za nim (także za odjeżdżającym autem)
- hydrant (`src/water.js`): wjazd albo kopniak i tryska woda przez kilka sekund, rośnie kałuża
- za domami: osiedla z własną uliczką i domami, pagórki dookoła i niskie góry za nimi (mgła dalej: 90–620 m)

## Wersja 7

- zderzenie z innym rowerzystą: mocne (liczone z prędkości obu) przewraca obu, on też robi ragdoll i po chwili wstaje; lekkie: odpycha, on się chwieje; w obu razach klnie
- mieszkańcy (`src/residents.js`): przy części domów krzesła ogrodowe i leżaki w pasy; na leżakach brzuchacz z piwem, na krzesłach starsi; siedzą (animacje siedzenia UAL) i gdy przejeżdżasz, wołają coś do ciebie (dymek nad głową, animacja rozmowy)
- psy: sześć ras (labrador, husky, jamnik, terier, dalmatyńczyk, kundel), gładki tułów, kufa, uszy i ogon wg rasy
- drzewa nie rosną na autach, domach, podjazdach, ścieżkach ani gankach

## Wersja 8

- dymki: stoją prosto nad mówiącym (przesuwają się tylko tyle, żeby zmieścić się w kadrze), ogonek celuje w mówiącego; gdy mówiący jest poza kadrem, dymek stoi przy krawędzi od jego strony z mrugającą strzałką; dwa naraz nie zachodzą na siebie
- postój na wzniesieniu: gdy przestajesz pedałować i zwalniasz, stawia nogę i stoi (nie stacza się); do tyłu tylko S na postoju
- skocznie: deskowa, krótka stroma (kicker) i dwie duże na ramie z czerwoną krawędzią (na jezdni, auta je omijają); z krawędzi wyrzuca w górę, podskok C na krawędzi wyrzuca wyżej
- tricki: Spacja w locie ze skoczni. Z A / D: 360 (+3), z W na dużej: salto (+6), sama Spacja: stół (+2). Trick kręci się, póki trzymasz Spację; puść, gdy jest obrócony (±18% wybaczone i domknięte, w punkt: CZYSTO +1). Puszczony za wcześnie, za późno albo trzymany do lądowania: wywrotka
- kopniak w rowerzystę go przewraca
- kolizja z tym samym rowerzystą po wstaniu: 7 s przenikania; gazeta rzucona w pieszego lub siedzącego: odpowiadają; świadek zderzenia komentuje, rowerzysta też

## Wersja 9: pieszo i bójki (`src/onfoot.js`)

- F: zsiadasz z roweru (rower staje na nóżce), F przy rowerze: wsiadasz. Pieszo: W S naprzód i w tył, A D obrót, Shift bieg; V: widok z oczu (widać ręce) albo zza pleców
- nowe postacie z Blendera: gazeciarz pieszo (biały t-shirt, dżinsy, czerwona czapka i torba z gazetami jak na rowerze) i bójkarz w kraciastej koszuli; każdy ma chód, trucht, postawę, prosty, sierpowy, hak, trafienie w głowę i w brzuch, odrzut, nokaut, wstawanie, kiwanie palcem
- rowerzysta skopany z roweru (zwykle) albo mocno potrącony (czasem) wstaje z pretensjami i idzie za tobą; jak ucieknie ci na rowerze dalej niż ~24 m, woła „TCHÓRZ!” i wraca; jak cię dopadnie, ściąga cię z roweru i zaczyna się bójka (sama przełącza na widok z oczu, V zmienia)
- bójka: A D krążenie, W S doskok i odskok, Shift unik (nic cię wtedy nie trafia), ← prosty, → sierpowy, z ↑ hak, z ↓ na korpus; Spacja garda (z ↓ dolna), podniesiona tuż przed ciosem = KONTRA (on się chwieje, twój następny cios mocniejszy); zablokowane ciosy zjadają oddech, pusty oddech = garda pęka; prosty i sierpowy = RAZ-DWA, dwa proste i sierpowy = SERIA; G: prowokacja (trochę oddechu)
- przeciwnik (ten sam zestaw zasad co ty): trzyma dystans, krąży, rzuca kombinacje z zamachem (wykrzyknik nad głową), częściej się zasłania, gdy go zasypujesz, kontruje po twoim ciosie, cofa się ranny
- pasek zdrowia i oddechu na górze; przy niskim zdrowiu krawędzie ekranu czerwienieją i pulsują
- wygrana: NOKAUT +15, on wstaje, gada głupoty i wraca do roweru; przegrana: zabiera ci całą kasę albo połowę gazet, albo kradnie rower i rzuca go dalej przy drodze, albo robi z tobą selfie na grupę osiedla
- testy (boty grające za gracza, po dwie serie): gra z głową (blok na zamach, kontra, atak w otwarcie) wygrywa ~2 z 3, samo klepanie ledwo wygrywa albo przegrywa, stanie w miejscu zawsze przegrywa
- plan multiplayera (kod zaproszenia, kto o czym decyduje, kroki): `docs/multiplayer.md`

## Wersja 10: mysz, kierunki ciosów, droga do roweru

- pieszo klik w grę łapie mysz: mysz obraca postać i patrzy w górę i w dół, A D wtedy chodzi bokiem; menu (Esc) i wsiadanie na rower oddają kursor
- walka jak w grach rycerskich: na środku ekranu gwiazda z czterema strzałkami. Ruch myszy wybiera stronę ciosu (lewo: prosty, prawo: sierpowy, góra: hak, dół: na korpus, na zmianę lewą i prawą), LPM uderza, PPM trzyma gardę (z myszą w dół: niska), Shift lekki unik
- cios przeciwnika mruga na gwieździe po stronie, z której leci (czerwony z żółtym); na zielono w chwili, gdy podniesiona garda da kontrę
- bez myszy dalej działają ← → ↑ ↓ i Spacja; pada na razie nie ruszamy
- pieszo: na dole ekranu strzałka do roweru z odległością (ROWER 11 M), nad rowerem mrugający znacznik, gdy jest w kadrze
- torba: listonoszka na prawym biodrze z paskiem przez pierś (zamiast deski na plecach)
- pieszo nikt nie gada o jeździe: mieszkańcy („CO, ROWER CI UKRADLI?”, „SPACERKIEM, DZIECKO?”), kierowcy trąbią inaczej („ZEJDŹ Z JEZDNI!”, „CHODNIK JEST OBOK, PIESZY!”), bójkarz też („NIE UCIEKNIESZ MI NA PIECHOTĘ!”)

## Wersja 11: pieszo naprawdę (przechodnie, auta, wywrotka)

- mysz działa też bez „łapania” kursora (panel przeglądarki go nie daje): ruch myszy obraca postać, kursor przy krawędzi ekranu obraca dalej, kliknięcia działają zawsze
- wywrotka: po chwili wstajesz pieszo, rower zostaje na ziemi; podejdź do niego (strzałka pokazuje drogę) i F: podnosisz go i jedziesz
- auta mogą cię potrącić, gdy wejdziesz im pod koła: lecisz, leżysz chwilę, wstajesz (−HP), kierowca ma coś do powiedzenia („PATRZ, JAK ŁAZISZ!”)
- przechodnie: E zagaduje (staje, patrzy na ciebie i odpowiada po swojemu; zagadywany trzeci raz się wkurza); LPM uderza (−2 pkt „BRZYDKO!”): delikatni uciekają z krzykiem, twardziele czasem wołają szwagra, który wyskakuje zza domów i jest bójka
- czapka gazeciarza dopasowana do jego głowy (mierzona z modelu): czerwona, z daszkiem, szwami i przyciskiem; krótsza fryzura spod niej; torba jak na rowerze: oliwkowa listonoszka nisko na plecach z gazetami, pasek po skosie
- przeciwnik, który nie może do ciebie dojść (płot, żywopłot), obchodzi przeszkodę, a w końcu przez nią przechodzi

## Wersja 12: w sieci, porządek na ekranie

- na żywo: https://vod123qwe.github.io/playground/lab-board/pieces/poranna-trasa/ (kafel na planszy lab-board); kopię do playground robi `tools/publish.sh`, potem commit na main i na gałęzi Pages
- H: okno ze sterowaniem (pogrupowane: rower, skocznia, pieszo, bójka, inne), domyślnie schowane, stan zapamiętany; w rogu tylko podpowiedź „H sterowanie · L pełny ekran”
- L albo PEŁNY EKRAN w menu Esc (w panelu przeglądarki aplikacji Claude pełny ekran jest zablokowany, w zwykłej przeglądarce działa); w menu też STEROWANIE
- kursor schowany w całej grze (jest tylko w menu, w pytaniu „od nowa”, w panelu stylu i nad przyciskami w rogu)
- menu Esc → STEROWANIE: osobny ekran. Na górze czułość myszy (0.2–2X, zapamiętana; 1X to połowa dawnej), pod nią każda akcja w sekcjach NA ROWERZE, PIESZO, W BÓJCE, OGÓLNE: co robi i na jakim klawiszu; Enter albo klik i nowy klawisz przypisuje (Esc: bez zmian), klawisz zajęty w tym samym trybie świeci na czerwono, PRZYWRÓĆ DOMYŚLNE; do tego wiersze z myszą (LPM, PPM, ruch) dla każdego trybu. Lista się przewija (strzałki, kółko). Przypisania zapamiętane w przeglądarce, okno pomocy (H) pokazuje aktualne
- na rowerze: LPM rzuca w lewo, PPM w prawo (trzymasz: rośnie siła, puszczasz: leci), lekki ruch myszy obraca widok w tę stronę i wraca, gdy mysz stoi
- paczki gazet do zebrania: świecący krąg na ziemi, słup światła widoczny z daleka i strzałka nad paczką
- niskie zdrowie: czerwona winieta w ditherze zachodzi od krawędzi, pulsuje jak serce (szybciej, im gorzej), przy krytycznym miga; każde trafienie: błysk i plamy krwi na brzegach ekranu (zostają, póki jesteś ranny, bledną, gdy zdrowie wraca)
- wywrotka na auto: ciało nie wylatuje już na kilkanaście metrów (to była korekta pozycji na dachu auta zamieniana w prędkość; teraz prędkość po zderzeniu ma limit)

## Wersja 13: ekran startowy, powrót do labu

- ekran startowy: tytuł nad ulicą, nad którą powoli leci kamera (auta i ludzie żyją), GRAJ, STEROWANIE, GRAFIKA (`?play` w adresie go pomija)
- gra otwarta z planszy lab-board: WRÓĆ DO LABU na ekranie startowym i w pauzie (Esc)

## Wersja 14: świat żyje dalej, celowanie, skok

- chmury rysowane pikselowo (twarde brzegi, tony od góry, płaski spód), trzy warstwy: wysokie smugi, cumulusy, długie niskie przy horyzoncie
- w średniej odległości: wiejska droga za polami (84–88 m od ulicy) z autami w obie strony i traktorem z kurzem, stada ptaków krążące nad okolicą (`src/life.js`)
- rzut: póki trzymasz, łuk z kropek i krąg z mrugającą strzałką tam, gdzie gazeta spadnie (zielony nad skrzynką albo gankiem); kamera odjeżdża i patrzy w tamtą stronę
- pieszo: skok (C, poza bójką też Spacja), przeskakuje niskie rzeczy; paczki gazet zbierasz też pieszo
- kursor trzymany w oknie gry (klik w grę, pełny ekran); Esc go oddaje i otwiera pauzę (panel Claude na to nie pozwala, zwykła przeglądarka tak)

## Wersja 15: Warsztat (przegląd assetów)

- `studio.html` (ekran startowy → WARSZTAT): wszystkie assety gry na obrotowym talerzu, grupy: auta (każdy typ w każdym kolorze), ludzie (modele MakeHuman z listą klipów do odtworzenia), rowerzysta (pedałuje), psy (każda rasa), rekwizyty, skocznie; wymiary, trójkąty, siatki, materiały; widoki przód, bok, tył, góra, 3/4; włącz/wyłącz pixel, siatkę 1 m, druty, obrót
- auta: przednia szyba na całą szerokość (wąskie słupki po bokach), tylna między słupkami C; wcześniej część przedniej szyby była blachą

## Wersja 16: walka w rytmie

- przeciwnicy trzech rodzajów: CHERLAK (70 HP, słaby, długi zamach), KOZAK Z OSIEDLA (100 HP, szybszy, zwody, czasem dwa ciosy), SZWAGIER (140 HP, mocny, zamachu nie przerwiesz)
- każdy atak ma fazy: zamach (żółta strzałka po jego stronie, odchyla się), okno kontry (zielona, czas zwalnia: PPM / Spacja = KONTRA), cios, a potem chwila odsłonięcia (środek gwiazdy miga: cios wtedy 1,4×, poza nią 0,8×)
- unik (Shift + kierunek) w jego zamachu albo ciosie: ten atak chybia i przeciwnik zostaje odsłonięty; garda na złą wysokość łapie połowę
- oddech: przy zadyszce nie uderzysz; odbity od gardy cios kosztuje; zasypywany przeciwnik zasłania się i cofa, po bloku i kontrze od razu odpowiada, gdy brak Ci tchu, atakuje
- pierwsza bójka to trening w trzech krokach (kontra, unik, cios w odsłonięcie), przeciwnik wtedy nie bije; Enter pomija
- bójka nie przełącza już na widok z oczu (zza pleców widać obu, V dalej przełącza); gwiazda w tym widoku nad walczącymi

## Wersja 17: auta od nowa, torba, skręt

- auta: przeszklenie bardziej kanciaste (płaski dach z czystą krawędzią, piksele układają się równo), boczne szyby pod dachem, ich przód i tył pochylone wzdłuż słupków A i C, podzielone słupkiem B (dwie szyby z boku); przednia szyba na całą szerokość
- pikap: skrzynia od ściany kabiny do klapy (przednia ściana, podłoga, burty z relingami, klapa), kabina kanciasta
- klin: bez sterczącego grilla i lamp nad maską: szczelinowe reflektory na nosie, wlot powietrza w zderzaku; u wszystkich lampy i grill nie wyżej niż nos auta
- sedan i długa limuzyna: dłuższa, niższa maska, krótszy, wyższy bagażnik, przednia szyba bardziej pochylona (przód nie myli się z tyłem)
- torba (`src/bag.js`, jedna dla roweru, pieszo i Warsztatu): płócienna listonoszka z klapą przez górę i przód (przeszycie), dwa skórzane paski z mosiężnymi klamrami, kieszeń z klapką i napą, naszywka z gazetą, mosiężne kółka na pasek, ciemniejsze boki; gazety (rolki z czerwonymi opaskami i złożone) wystają spod klapy i ubywa ich, gdy rzucasz; w Warsztacie grupa Torba
- rower skręca mocniej (większy skręt, szybsze wejście w zakręt)
- to, co zasłania postać (korona drzewa, róg dachu), przerzedza się ditherem wokół linii kamera–postać (nie w widoku z oczu)

## Wersja 18: test walki w Warsztacie

- Warsztat → Walka (test): wybierasz przeciwnika (cherlak, kozak z osiedla, szwagier), zaznaczasz nieśmiertelny / najpierw trening / podgląd faz i „otwórz arenę”: gra od razu w bójce na polu, po każdej walce przychodzi następny
- Warsztat otwierasz z ekranu startowego albo z pauzy (Esc → WARSZTAT); z areny wracasz Esc → ← WRÓĆ DO WARSZTATU
- adres areny: `index.html?arena=kozak&god&train&debug` (każdy dodatek opcjonalny); podgląd faz na górze: co robi przeciwnik (zamach z czasem i zwodem, cios i czas do trafienia, odsłonięcie, zatoczenie), jego i Twoje HP, oddech

## Wersja 19: płoty z furtkami

- płot od ulicy (45% domów) albo żywopłot (25%) ma zawsze przerwę tam, gdzie podjazd albo ścieżka dochodzą do chodnika: auto z podjazdu wyjedzie, do drzwi się dojdzie (rowerem też, kolizje są liczone odcinkami)
- na ścieżce furtka (czasem uchylona), przy podjeździe słupki, czasem dwuskrzydłowa brama otwarta na oścież
- co trzeci ogrodzony dom ma płot dookoła: boczne odcinki od ulicy do frontu domu

## Wersja 20: dobudówki, baraki, licznik rowerowy

- co piąty dom bez garażu ma z boku dobudówkę z garażem: płaski dach, szare blaszane drzwi, własny podjazd do chodnika, czasem auto; płot ma przerwę i na podjazd, i na ścieżkę do drzwi
- przed podjazdami (także na pasie zieleni) nie rosną już drzewa, które blokowały wyjazd
- rzeczy w ogródkach (huśtawka, trampolina, piaskownica) trzymają się z dala od bocznych płotów, huśtawka już na nie nie zachodzi
- czasem zamiast domu stoi działka z barakami: budki z blachy i desek z łatami, rdzawe dachy, przybudówki, kominki, beczka z ogniem i dymem, stara kanapa, opony, palety, pranie, auto na klockach, połamany płot; przy ogniu stoją chłopaki z baraków i zaczepiają („DAWAJ GAZETĘ, NA ROZPAŁKĘ!”)
- licznik rowerowy jak dawniej: plastikowa obudowa z przyciskami, szarozielony LCD, prędkość cyframi siedmiosegmentowymi (niezapalone segmenty lekko widać), strzałka przyspieszania; dolny wiersz co 4 s: dystans (DST), prędkość maksymalna (MAX), czas jazdy (TM). Wszystko w pikselach.
- mieszkańcy daleko od gracza nie są rysowani ani animowani (lżej przy wielu postaciach)

## Wersja 21: babcina portmonetka

- zamiast „PKT” pod licznikiem rowerowym jest portmonetka z mosiężnym zapięciem na dwie kulki, w kwiatki na śliwkowym gobelinie, obok gazety (rulonik i liczba) i suma w złotych
- gdy wpadają pieniądze: portmonetka się otwiera, monety wpadają jedna po drugiej, przy każdej lekko podskakuje, suma rośnie razem z nimi, potem zatrzask się zamyka
- gdy ktoś zabiera kasę (rowerzysta, babka, selfie): otwiera się i monety z niej wylatują
- komunikaty mówią teraz o złotówkach, nie o punktach
- całość siedzi w prawym górnym rogu, bez półprzezroczystego tła: ikony i liczby mają własny ciemny obrys; ikona gazety to złożona gazeta (winieta, zdjęcie, szpalty); podpowiedź „H sterowanie · L pełny ekran” usunięta (sterowanie jest w menu i pod H)

## Wersja 22: domy i drzewa w Warsztacie

- nowe grupy w Warsztacie: **Domy** (po 3 z każdego rodzaju: parterowy, piętrowy, z garażem, z dobudówką), **Drzewa** (liściaste, jesienne, świerki) i **Baraki i gospodarstwa** (baraki, dom w gospodarstwie, stodoła)
- Warsztat buduje w tym celu cały tor raz, bez scalania geometrii (tryb `showcase` w `createTrack`), i wyjmuje z niego pojedyncze budynki i drzewa; pierwsze otwarcie grupy trwa około 2 s
- domy są obrócone frontem do kamery

## Poprawka: bójka po „Zacznij od nowa”

- „Zacznij od nowa” czyści wszystkie bójki i pościgi (rowerzyści wracają na rowery, HP i oddech do pełna); wcześniej zostawały paski walki i celownik
- wsiadanie na rower w trakcie bójki też czyści jej stan na ekranie (przeciwnik dalej może gonić)
- paski walki są pod licznikiem rowerowym i portmonetką, a nie na nich

## Wersja 23: płoty za domami, laski, pociąg

- za większością domów stoi tylny płot (deskowy albo z siatki) na całą szerokość działki, razem z dobudówką
- po wewnętrznej stronie pętli, 32 do 52 m od drogi, rosną gęste laski: drzewa liściaste i świerki, pod nimi krzaki; między nimi dalej widać jezioro
- po zewnętrznej stronie, między świerkami a polami, biegną tory: nasyp z tłucznia, podkłady, szyny (pętla około 1160 m); jeździ po nich pociąg, lokomotywa i pięć wagonów, osobowych albo towarowych (węglarki, kryte), około 15 m/s

## Wersja 24: torba w rogu

- w prawym dolnym rogu wystaje od dołu ta sama torba, którą gazeciarz ma na plecach (model 3D, rysowany tym samym pikselowym przejściem, z tą samą paletą i obrysem); gazety sterczą spod klapy i ubywa ich, gdy rzucasz
- przy rzucie gazeta chowa się w torbie (zsuwa się pod klapę i znika, torba lekko drgnie), nic z niej nie wylatuje, żeby nie mylić tego z prawdziwym rzutem; przy paczce gazety wysuwają się z powrotem, a torba podskakuje
- obok torby liczba gazet (na czerwono, gdy pusto); ikona gazety z prawego górnego rogu zniknęła, zostaje sama portmonetka

## Poprawka: prześwit

- prześwit przez to, co zasłania postać, nie wycina już ziemi pod nią (jezdnia, trawa, krawężniki niżej niż około 40 cm nad jego stopami); wcześniej za rowerem pojawiała się jasna plama
- prześwit jest szerszy (1,9 m zamiast 1,5 m) i mocniejszy (więcej pikseli znika w środku)

## Wersja 25: pixel art, krok dalej; domy na zboczu

- **linie w środku rzeczy i jasne krawędzie** (panel U, „Pixel art: nowe”, domyślnie 70%): tam, gdzie dwie ściany się spotykają, zostaje ciemna linia; wypukła krawędź (kalenica, krawężnik, dach auta) dostaje jasny piksel. Liczone z samej głębi obrazu, bez dodatkowego rysowania świata.
- **stabilny obraz** (U, wł./wył.): kamera jest do rysowania przesuwana do pełnego piksela, a reszta ruchu oddawana przesunięciem gotowego obrazu, więc nieruchome rzeczy nie migoczą przy jeździe (najlepiej widać na prostej)
- **animacja postaci klatkami** (U: płynna / 12 / 8 klatek na sekundę): ludzie ruszają się jak rysowani klatka po klatce; rower, kamera i gra zostają płynne
- poprawka: torba w rogu czyściła głębię obrazu i świat tracił przez to kontur; teraz torba jest rysowana pomniejszona tuż przy obiektywie, głębia zostaje
- domy na zboczu: dom stoi na najwyższym punkcie terenu pod nim (głębszy kamienny cokół zakrywa szparę), a wszystko na działce (auta, krzaki, huśtawki, kosze, krzesła z siedzącymi, tylny płot) stoi na gruncie tam, gdzie jest; auto przed garażem nie jest już zakopane

## Poprawka: cios w rowerzystę

- na nogach cios (LPM/PPM) trafia też przejeżdżającego rowerzystę: spada z roweru, a zwykle (80%) wstaje i przychodzi się bić, jak po kopniaku z roweru

## Poprawka: działki na zboczu, drugie podejście

- działki są płaskie: teren zaczyna się wznosić dopiero 30 m od drogi, za tylnymi płotami (wcześniej od 14 m, pod domami, więc dom podniesiony do najwyższego punktu wisiał od frontu)
- podjazd i ścieżka leżą na gruncie i przechylają się razem z nim (auto nie stoi już „pod” podjazdem)
- pod gankiem i dobudówką jest kamienna podmurówka, żeby na spadku drogi nie było widać szpary

## Wersja 26: cętkowany cień drzew, niższe słońce, widok z góry

- korony drzew rzucają cień z dziurami: pod drzewem słońce przebija plamkami, które lekko drgają z wiatrem (wzór dziur jest liczony wzdłuż promienia słońca, więc przechodzi przez wszystkie warstwy korony naraz)
- słońce niżej (około 34°) i cieplejsze: dłuższe cienie w poprzek drogi
- nowa kamera **z góry (jak GTA 2)** pod klawiszem przełączania widoku: pionowo w dół, obrócona z kierunkiem jazdy, wyżej przy większej prędkości i przy rzucie
- `?style=<nazwa>` w adresie (np. `?style=zlota`): ten styl tylko na tę wizytę, bez zapisywania (do porównań i testów)

## Wersja 27: nowe drzewa, kamera z kółka myszy

- drzewa rosną jak drzewa: korzenie rozchodzą się przy ziemi, pień rozwidla się nisko, każdy konar dzieli się jeszcze na dwie gałęzie, a każda kończy się własną kępą liści (korona z wielu kęp z jasną i ciemną stroną zamiast kilku kul); korony szersze (drzewo przy domu ma około 7–8 m szerokości)
- drzewa nad jezdnią widać teraz też w Warsztacie (grupa Drzewa)
- kamera: kółko myszy przytrzymane i ruch myszą (góra/dół: kąt, lewo/prawo: odległość) albo samo kręcenie kółkiem (odległość); podwójne kliknięcie kółkiem wraca do ustawień; zapamiętywane w przeglądarce; działa też w widoku z góry (wysokość)

## Wersja 28: obudowana ulica, celowanie myszą

- więcej drzew przy jezdni (mniej więcej co 10–17 m), ich korony schodzą się nad drogą
- przy krawędzi działki, obok podjazdu, pary pojemników na śmieci wystawione na rano (zwykły i żółty); pod oknami rabaty z kwiatami w kamiennym obrzeżu; na części domów biało-czerwona flaga na drążku ze ściany
- domy z garażem też mają zwykle (70%) ścieżkę od ganku do chodnika, z przerwą w płocie
- prześwit działa też przy samej kamerze: gdy kamera wejdzie w koronę drzewa, liście przed obiektywem znikają
- rzut: trzymając go, mysz w górę kieruje gazetę bardziej do przodu, w dół do tyłu (do około 30°), ruch w stronę rzutu dodaje zasięgu (do 25%); w tym czasie mysz nie obraca widoku
- podgląd rzutu subtelniejszy: 7 małych, gasnących kropek tylko na początku lotu, cieńszy i bledszy pierścień lądowania

## Na później

- dodatkowe uliczki między ulicami, zabudowa między domami a dalekim tłem
- multiplayer wg `docs/multiplayer.md`

## Ludzie z Blendera (`assets/`)

- `assets/source/people.py` · skrypt dla Blendera, który buduje 10 przechodniów od zera (nic nie jest pobierane): ciało z modyfikatora Skin na stawach (wygładzone), własny szkielet z nazwanymi kośćmi (`handL`, `handR`, `forearmL`…), skóra przypięta automatycznie (heat weights), głowa z twarzą, fryzurą i nakryciem, ubrania jako materiały i osobne części (koszula z krawatem, klapy, kaptur, ogrodniczki, pasek, poły płaszcza i sukienki); animacje `walk`, `run`, `idle` (ręce ułożone pod rekwizyt)
- przebudowa wszystkich (albo jednej, np. `suit`):

```
"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" -b --factory-startup -P assets/source/people.py -- all
```

- wynik: `assets/export/<klucz>.glb` (gra je wczytuje) i podglądy w `assets/preview/`
- klucze: `oldman jogger mum dogman teen suit shopper kid gardener lady`
- podgląd w ruchu: `http://localhost:8805/viewer.html` (`viewer.html`): wybór postaci albo wszyscy naraz, chód / bieg / postój, szybkość, pauza i klatka po klatce, styl gry albo zwykłe 3D, wielkość pikseli, szkielet, obrót; mysz obraca i przybliża
- w grze (`src/pedestrians.js`): materiały podmienione na kreskówkowe, animacje w tempie marszu, rekwizyty przypięte do dłoni ze szkieletu

## Wersja 4: ludzie, ruch, podwórka

- `src/pedestrians.js` · 10 zaprojektowanych przechodniów: emeryt z laską, biegaczka, mama z wózkiem, pan z psem na smyczy, nastolatek w bluzie ze słuchawkami, pan w garniturze z teczką, pani z zakupami, dziecko z balonem, ogrodnik z grabiami, pani w kapeluszu z torebką; pełniejsze bryły (miednica, barki, twarz z nosem, uszami i oczami, łokcie, kolana, buty z podeszwą), fryzury i nakrycia głowy, chód z IK (biodra, ramiona, stopy z pięty na palce), bieg
- rowerzysta: biodra i pośladki na siodełku, grubsze uda, kolana, łydki; kopniak z zamachem, wybiciem i powrotem, tułów odchyla się i skręca
- `src/traffic.js` · auta wymijają stojące i wolne przeszkody (auta, zaparkowane przy krawężniku, rowerzystę): płynna zmiana pasa, powrót za przeszkodą, zwalnianie lub rezygnacja, gdy coś jedzie z naprzeciwka
- podwórka: kupki grabionych liści z grabiami, piaskownice, huśtawki, rowerki, trampoliny, grille, krasnale, poidełka; czasem stare auto na klockach z plandeką obok domu
- panel stylu: suwaki (wielkość pikseli 120–600, wygładzanie, tony), siła i czułość konturu, siła palety, posteryzacja, nasycenie, kontrast, winieta, linie starego ekranu; nowy styl „Stary ekran”
- `serve.py` · serwer bez pamięci podręcznej przeglądarki (po zmianie wystarczy odświeżyć)

## Wersja 3 wyglądu i zasad

- punkty: gazeta na ganku przy drzwiach +2, w skrzynce +5, pod oknami +1, wybita szyba +2, obok domu nic (każdy dom liczy się raz)
- panel stylu: „Zapisz jako domyślny” (styl „Mój”, do niego wraca „Domyślny”), suwak połysku krawędzi
- połysk krawędzi od słońca: ciepły, twardy pas światła na obrysie stojących brył (nie na ziemi)
- domy: listwa okapu i rynna, listwy szczytów, gąsior, lepsze dachówki, listwy narożne, podmurówka, pas między piętrami, okna z odblaskiem i firankami, drzwi z płycinami, okienkiem i lampką, komin z cegły
- drzewa: wygięte pnie zwężające się ku górze, 2–4 konary, korony z kilku mas na końcach konarów
- postać: kosmyki spod czapki, torba na plecach (idzie z tułowiem) z gazetami na wierzchu, bagażnik i czerwona lampka w rowerze, grubsze opony
- `src/pedestrians.js` · przechodnie na chodnikach: idą, machają rękami, czasem zawracają, schodzą na trawnik przed rowerzystą; wjazd w kogoś to wywrotka („UWAŻAJ!”)
- kamera: szósta (V), „bardzo daleko”; przy rzucie odjeżdża do panoramy zamiast się obracać
- poprawka: psy i babka liczą grunt od swojego miejsca na trasie (nie wiszą w powietrzu)

## Assety, wersja 2 (wg referencji)

- drzewa: korony z wielu grudkowatych kęp (jasne u góry, ciemne pod spodem) i kart liści na obrysie (poszarpana sylwetka, cienie z dziurami)
- krawężnik w metrowych blokach z fugami, ciemniejszy rynsztok, liście nawiane pod krawężnik i na nim, kępki trawy nad krawędzią i przy chodniku, kwiatki w kępach na poboczach i trawnikach
- hydrant: stopa z kołnierzem, trzon, kołnierz ze śrubami, kopułka z nakrętką, trzy wyloty z zaślepkami, łańcuszek
- skrzynka na listy: zaokrąglona, na słupku z ramieniem i zastrzałem, drzwiczki, zatrzask, czerwona chorągiewka na zawiasie
- auta: szyby z odblaskami nieba, duże klosze tylnych lamp (czerwone, białe, pomarańczowe), chromowane listwy, grill, tablice z literami, progi, listwa boczna, drzwi tylne, ciemne wnęki kół, miękki cień pod autem

## Dalej

- rozgrywka: prenumeratorzy, lista dnia, przeszkody (psy, auta, studzienki), punkty, wywrotka
- grafiki z GPT: fasady domów, tło z jeziorem i miasteczkiem, drobiazgi; ewentualnie klatki rowerzysty

## Pomysły na później (od Jarka)

- po wywrotce trzeba samemu podejść do roweru i go podnieść (chodzenie pieszo, podniesienie, wsiadanie)
- rzadko spotykani inni rowerzyści: można im dać kopa, obaj schodzą z rowerów i jest bójka
- bójka jako minigra w tym samym świecie, ale z widokiem z pierwszej osoby (widać swoje ręce): krótki pojedynek bokserski; garda góra lub dół, ciosy lewą i prawą, w górę lub w dół; lekkie krążenie na boki z kamerą skupioną na przeciwniku; do rozwinięcia (np. uniki, kontry, zmęczenie, zwycięstwo daje coś na trasie)

