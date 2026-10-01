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
- kamera: kręcenie kółkiem przybliża i oddala; kółko przytrzymane i ruch myszą zmienia kąt (góra/dół: wyżej, niżej; lewo/prawo: dookoła rowerzysty, aż do widoku z boku); podwójne kliknięcie kółkiem wraca do ustawień; zapamiętywane w przeglądarce; działa też w widoku z góry

## Wersja 28: obudowana ulica, celowanie myszą

- więcej drzew przy jezdni (mniej więcej co 10–17 m), ich korony schodzą się nad drogą
- przy krawędzi działki, obok podjazdu, pary pojemników na śmieci wystawione na rano (zwykły i żółty); pod oknami rabaty z kwiatami w kamiennym obrzeżu; na części domów biało-czerwona flaga na drążku ze ściany
- domy z garażem też mają zwykle (70%) ścieżkę od ganku do chodnika, z przerwą w płocie
- prześwit działa też przy samej kamerze: gdy kamera wejdzie w koronę drzewa, liście przed obiektywem znikają
- rzut: trzymając go, mysz w górę kieruje gazetę bardziej do przodu, w dół do tyłu (do około 30°), ruch w stronę rzutu dodaje zasięgu (do 25%); w tym czasie mysz nie obraca widoku
- podgląd rzutu subtelniejszy: 7 małych, gasnących kropek tylko na początku lotu, cieńszy i bledszy pierścień lądowania

## Wersja 29: szyby aut

- szyby półprzezroczyste, przyciemnione na niebiesko, z ukośną pikselową smugą odbicia nieba (smuga przesuwa się wzdłuż auta i w górę szyby)
- w środku widać wnętrze: deskę rozdzielczą, dwa fotele z zagłówkami i tylną kanapę (w pikapie i dostawczaku bez kanapy), wszystko poniżej dachu
- nadwozie i szkło to teraz dwie osobne siatki (jedna z dwoma materiałami, z których jeden przezroczysty, sprawiała kłopoty)

## Wersja 30: tekstury w skali piksela

- asfalt: ziarno w dwóch tonach, kamyczki (jasny piksel z cieniem), łaty z ciemniejszym brzegiem, szew smoły w poprzek, plama oleju, pęknięcia z odnogami
- płyty chodnika: każda w swoim odcieniu, z jasnym brzegiem u góry i z lewej i cieniem po przeciwnej stronie, mech w szczelinach, odprysk w rogu, pęknięcie
- trawa: źdźbła w kępkach (ciemny korzeń, środek, jasny czubek), w trawnikach więcej kwiatków w teksturze
- prawdziwych, ostrych kwiatków (osobnych, nie w teksturze) jest więcej i rosną też w głąb trawników

## Wersja 31: łup po bójce, spokojniejsi kierowcy, powietrze w oddali

- pokonany w bójce rowerzysta w 3 przypadkach na 4 coś upuszcza: portfelik z drobnymi (3–9 zł), kilka swoich gazet (+4) albo bułkę (+30 HP); łup leży podświetlony (pulsujący krąg, słaby snop, strzałka), podnosi się go podchodząc albo przejeżdżając po nim rowerem, znika po minucie
- auta nie odbijają na drugi pas, gdy na chwilę wjedziesz na ich pas: rowerzysta liczy się „na pasie” dopiero 1 m od jego środka, a kierowca najpierw zwalnia i czeka (około 1,3 s), dopiero potem omija
- powietrze: im dalej, tym bledsze i bardziej niebieskie kolory, a daleko obraz lekko miękki (od około 45 m, najwięcej przy 300 m); nakładane po palecie, żeby paleta go nie zjadała; bliskie plany zostają ostre
- prześwit przy samym obiektywie szerszy (korona tuż przy kamerze nie zasłania pół ekranu)

## Wersja 32: przystanki, autobus, pasy rowerowe, spokojne uliczki

- trzy przystanki na pętli: wiata (słupki, dach, szyby z tyłu i po bokach, ławka, kosz, plakat), znak przystanku z rozkładem przy krawężniku, na jezdni zatoka z przerywaną linią i napisem BUS; przy przystanku nie stoi żaden dom
- na ławce śpi lump z butelką (od czasu do czasu chrapie: „ZZZ... PIWKO...”); trafiony gazetą się budzi (+5 zł), a czekający obok klaszczą („BRAWO! TRZECI DZIEŃ TU ŚPI!”); po około 45 s zasypia znowu
- autobus: czerwony, żółty albo zielony, rząd okien przedzielonych słupkami, drzwi z przodu i pośrodku, siedzenia w środku; jeździ po pętli, zwalnia przed przystankiem po swojej stronie i stoi na nim 6 s; auta za nim trzymają większy odstęp i go wyprzedzają
- pasy rowerowe na trzech dłuższych odcinkach: czerwony pas przy krawężniku, biała linia, namalowany rower co 18 m; kto jedzie pasem rowerowym, tego auta nie uznają za przeszkodę na swoim pasie
- spokojne uliczki: dwa odcinki bez linii na środku
- buspasa nie ma: przy jednym pasie w każdą stronę zabrałby autom cały ich pas

## Wersja 33: przyroda w detalu

- nowy moduł `src/nature.js` i grupa **Przyroda** w Warsztacie (15 rzeczy): kępa trawy, trawa ozdobna, trzcina (z pałkami), krzak kulisty (wiele małych kęp, liście na brzegach), bukszpan (przycięty), krzak kwitnący, paproć (liście wzdłuż łodyg, wygięte), tulipany, stokrotki, łubiny, słoneczniki, kamienie i głaz (fasetki, mech od góry), sterta liści (pojedyncze listki, czasem grabie), staw (błotny brzeg, woda z błyskami, kamienie, trzciny, liście lilii, kwiat)
- w świecie: w ogródkach losują się krzaki, kwiaty, kamienie i sterty liści; wzdłuż drogi kępy traw na brzegu pasa zieleni i trawników, co jakiś czas kępka kwiatów (nigdy na podjeździe ani ścieżce); w laskach paprocie i trawy; 5 stawów na łąkach wewnątrz pętli
- źdźbła i kępy mają kolory w samych punktach, więc scalane są osobno, a każdy kolor to jeden wspólny materiał: siatek w świecie jest mniej niż przedtem (około 1750)

## Wersja 34: natura nieidealna, autobus z góry

- przyroda z niedoskonałościami: suche i złamane źdźbła, łysy placek ziemi pod kępą, w krzaku uschnięta kępa, ubytek z jednej strony, sterczące gałązki i pożółkłe liście, paproć z zeschniętymi liśćmi, zwiędłe główki kwiatów, opadłe płatki, złamana łodyga na ziemi, porosty na kamieniach, kamień wpuszczony w ziemię, goła ziemia wokół, patyki w stercie liści, glony i liście na stawie, złamana trzcina, czasem stara opona w błocie
- bukszpan z wielu małych kęp jak przycięty żywopłot (czasem z łysym, brązowym placem)
- autobus: jasny dach z klimatyzatorem i dwoma włazami, przednia szyba (z ciemnym wnętrzem za nią) i tylna, podświetlana tablica „7 CENTRUM”; z góry nie jest już gładkim prostokątem
- pozostałe auta sprawdzone z góry: dach w kolorze lakieru, szyby, skrzynka pikapa bez zmian

## Wersja 35: wydeptane ścieżki, ławki, domki na drzewie

- ścieżki z udeptanej ziemi: zaplanowane przed domami (tam, gdzie ścieżka odchodzi od chodnika, jest łączka: bez domu, bez płotu między działkami, świerki i drzewa omijają wejście); przy domach idą prosto, dalej skręcają na skos i wiją się: wewnątrz pętli przez laski prawie do jeziora, na zewnątrz przez pas świerków pod tory; część się rozwidla; gdy trafią na przeszkodę, kończą się tam
- ścieżki za domami: wzdłuż drogi za tylnymi płotami, od jednej łączki do następnej, omijają to, co tam stoi
- wzdłuż ścieżek trawy (wyższe tam, gdzie nikt nie chodzi), kwiaty, krzaki dalej od brzegu, kamyki na ścieżce; nic na nich nie rośnie
- ławki trzech rodzajów przy ścieżkach: parkowa (listwy na żeliwnych nogach, zielona) często z koszem na słupku, deska na dwóch pniakach, betonowa; na końcach ścieżek pniaki ze słojami
- domki na drzewie: na końcu niektórych ścieżek w laskach duże drzewo z pomostem, ścianami z desek, daszkiem, okienkiem i drabinką (widać je też w Warsztacie, w grupie Drzewa)
- pnie świerków za domami zatrzymują teraz rower
- poprawka: wywrotka przy trzymanym rzucie mogła zatrzymać grę (kamera czytała siłę rzutu, którego już nie było); celownik znika przy wywrotce

## Wersja 36: rozmycie promieniste przy sprincie

- efekt prędkości przy sprincie (Shift) to teraz rozmycie promieniste (radial blur, zoom blur): świat na krawędziach rozmazuje się w smugi uciekające od środka, liczone płynnie (10 próbek, z punktu ekranu, nie z bloku piksela), środek z rowerzystą zostaje ostry
- zamiast kropkowanej winiety krawędzie ciemnieją łagodnie, bez ditheringu
- torba w rogu nie rozmywa się razem ze światem

## Wersja 37: korony z liści, dach autobusu, styl „Gładki”

- korony drzew: kule (kępy) są teraz tylko ciemnym rdzeniem w środku, mniejsze; liści (kart) jest dwa razy więcej, w dwóch warstwach, i to one tworzą obrys korony
- dach autobusu: ścięte krawędzie w kolorze lakieru, rynienki, żebra w poprzek, klimatyzator z dwoma wentylatorami i kratką, włazy z zawiasami, antena, skos nad przednią szybą
- nowy gotowy styl **Gładki** (panel U i menu Esc): bez pikseli, gładko i miękko, pełne tony, przygaszone kolory, ledwie kontur

## Wersja 38: nakładki stylu rysunku (eksperyment)

- w panelu U nowa grupa **Nakładka: styl rysunku** (brak, malowany, komiks, akwarela, ołówek, riso, 1 bit) i suwak **Drżenie kreski** (rysunek przerysowany 8 razy na sekundę, kontury lekko się ruszają)
- gotowe style z nakładkami (panel U, część też w menu Esc):
  - **Malowany**: plamy farby (filtr Kuwahary na pikselach ekranu), faktura płótna, ciemniejszy kontur
  - **Komiks**: gruby tusz, rastrowe kropki w cieniach, mocne kolory, drżąca kreska
  - **Akwarela**: papier, miękki kolor, barwnik zebrany na brzegach plam i ziarnisty, białe światła
  - **Ołówek**: szkic na papierze, kreskowanie według cienia (trzy kierunki), grafitowe linie
  - **Riso**: różowa, niebieska i żółta farba w rastrach pod różnymi kątami, lekko przesunięte
  - **1 bit**: dwa kolory i dithering, tusz na krawędziach
- styl bez nakładki zdejmuje poprzednią (każdy gotowy styl mówi, że nakładki nie ma)

## Wersja 39: nowy panel stylu (U)

- panel w zakładkach: **Styl** (gotowe style w grupach: pikselowe, gładkie, rysunkowe; każdy z paskiem swoich kolorów; zapis jako „Mój”) · **Obraz** · **Kolor** · **Linie** · **Nakładka** · **Ruch** · **Powietrze**; pamięta ostatnią zakładkę
- **Nakładka**: wybór rysunku i tylko jego ustawienia: malowany (pędzel, płótno, obrys), komiks (wielkość i kąt kropek, grubość tuszu, próg cienia), akwarela (papier, barwnik na brzegach, ziarno, rozmycie), ołówek (gęstość i siła kresek, ile koloru, papier: kremowy, biały, szary karton), riso (zestaw farb, przesunięcie, wielkość rastra), 1 bit (para kolorów, skala ditheringu); do tego wspólne: siła nakładki i drżenie kreski
- ustawienie, które przy wybranym stylu nic nie robi, jest wyszarzone z powodem (np. „ta nakładka rysuje własnymi kolorami”, „tylko w wyglądzie pikselowym”, „kontur wyłączony”)
- każda zakładka ma „Przywróć z gotowego stylu”; nagłówek mówi, na jakim stylu jesteś i czy go zmieniłeś
- nowe suwaki: siła rozmycia przy sprincie (Ruch), mgiełka w oddali (Powietrze)
- poprawka: wygląd „gładki” (bez pikseli) wyłączał też kontur, linie, nasycenie, kontrast i winietę; teraz wyłącza tylko paletę, dithering i posteryzację

## Wersja 40: torba na piechurze

- torba bliżej pleców i odrobinę bardziej z prawej (przy kręgosłupie), zawieszona u góry: przy chodzie delikatnie się kołysze w rytm kroków (na boki, a przy szybszym chodzie lekko do tyłu), na stojąco nieruchoma
- pasek leży na ciele, a nie przechodzi przez nie: jego droga jest liczona z kształtu ciała (z wierzchołków modelu, w kilkunastu punktach): od torby na skos przez plecy do prawego ramienia, przez ramię, na skos przez klatkę do lewego biodra i bokiem z powrotem do torby

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


## Wersja 41: telefon

- sterowanie dotykowe od nowa: okrągłe, półprzezroczyste przyciski z ikonami i małym podpisem, zestaw zależny od sytuacji (rower: kop, rzut w lewo i w prawo, skok, szybciej, zsiądź; pieszo i w bójce: cios lewy i prawy, blok, unik, skok, a pieszo też rower i gadaj)
- lewy kciuk: gałka tam, gdzie dotkniesz; prawa strona ekranu: przeciąganie palcem rozgląda się (pieszo obraca postać)
- swipe nic nie przełącza: przeglądarka nie przewija, nie cofa strony, nie przybliża i nie odświeża (poza przewijaniem panelu stylu)
- ekran responsywny: tytuł mieści się w szerokości, licznik rowerowy mniejszy, pod nim rząd małych przycisków (kamera, menu, pełny ekran), torba z gazetami w prawym górnym rogu pod portmonetką, szerszy kąt kamery przy telefonie trzymanym pionowo
- lżejsze renderowanie na telefonie (piksel do piksela, mniejsza mapa cieni); w Grafice przycisk „Panel stylu: wszystko”

## Wersja 42: chodzenie na telefonie

- kamera osobno od postaci: przeciąganie palcem po prawej stronie ekranu obraca kamerę wokół niego (w bok i w górę albo w dół), postać stoi
- lewa gałka prowadzi go tam, gdzie ją pchniesz, względem kamery; on sam się obraca w tę stronę; gałka wychylona do końca: bieg
- przyciski dopasowane do sytuacji: pieszo cios (na zmianę lewa i prawa), skok, gadaj, rower; w bójce lewy, prawy, blok (trzymany), unik (z gałką w bok)
- na telefonie cios albo gadanie samo obraca go do najbliższej osoby (albo rowerzysty), bo nie ma myszy do celowania
- podpowiedzi bez klawiszy na telefonie (trening bójki, „ROWER: wsiądź”), ramka treningu nad przyciskami; „×” w treningu zamienione na „x” (czcionka go nie ma)

## Wersja 43: tricki bez nerwów

- trick to jedno kliknięcie w locie ze skoczni (Spacja, na telefonie przycisk kopniaka, który w powietrzu świeci i mówi TRIK!); kręci się sam, w tempie dopasowanym do tego, ile lotu zostało
- dociąganie: gdy brakuje czasu, obrót przyspiesza, żeby zdążył przed lądowaniem; zrobiony we własnym tempie: CZYSTO +1, dociągnięty na końcu: NA STYK (bez bonusu)
- kombo: trick skończony, a dalej w locie? klik jeszcze raz, następny (+2 za każdy kolejny); punkty liczone razem przy lądowaniu, np. „360 + STÓŁ CZYSTO”
- koniec wywrotek za złe puszczenie albo trzymanie przy lądowaniu; za późno jest tylko wtedy, gdy do ziemi zostało mniej niż ułamek sekundy (wtedy trick się po prostu nie zaczyna)
- kierunki bez zmian: z A albo D 360, z W na dużej skoczni salto, sam klik stół

## Wersja 44: przyciski na telefonie się nie zacinają

- naprawione: po wejściu w menu przycisk menu zostawał podświetlony i nie dało się go nacisnąć drugi raz (menu zasłaniało sterowanie, zanim palec się podniósł, więc przycisk nie dostawał puszczenia)
- gdy sterowanie się chowa (menu, rozmowa), wszystkie palce są puszczane: przyciski, gałka i przeciąganie kamery; nic nie zostaje „trzymane”
- górny rząd (kamera, menu, pełny ekran) działa po puszczeniu palca, więc dotyk nie przebija się na przycisk w otwartym menu

## Wersja 45: rozmowy i zadania

- ludzie przy trasie mają sprawy: „!” nad kimś, kto ma sprawę, „?” nad kimś, kto na ciebie czeka, strzałka nad celem (poza kadrem: przy krawędzi ekranu, z odległością); pod najbliższą osobą jak zagadać (rower: T, trzeba zwolnić; pieszo: E; telefon: przycisk GADAJ)
- rozmowa w okienku z odpowiedziami do wyboru (1–4, strzałki i Enter, dotyk); gra czeka; bez sprawy tylko krótka odzywka, gra leci dalej
- nastroje: każdy pamięta, jak go potraktowałeś; zły nastrój: wyzwiska, butelka w przejeżdżającego; dobry: pozdrowienia, rzucony napiwek; kłamstwo wychodzi na jaw po jakimś czasie
- zadania z historią i zwrotami akcji: „wojna o kosiarkę” (szyba u sąsiada albo donos; na końcu prawda z piwnicy, szantaż albo przeprosiny), list (podziękowania, rachunek, mąż od czterech lat u siostry przez pilota, odpowiedź do przekazania: szczerze, kłamstwem albo złośliwie), gazety na podpałkę dla ekipy spod beczki (fanty ze śmietnika, potem tanie gazety), rowery dla ekipy (zrzuć rowerzystów, płacą makulaturą, bo kasy nigdy nie mają), przystanek (gazeta do poczytania, lump po obudzeniu chce dwa złote na bilet)
- złodziej (samo się zdarza): wyrywa torebkę i ucieka; czerwony pierścień i słup światła nad nim, napis z odległością, przycisk kopniaka świeci KOPNIJ!, przy 80 m ucieka na dobre; torebkę oddajesz właścicielce, na posterunek dalej na trasie (zwrot akcji u dyżurnego), kasa dla ciebie i torebka do kosza przy drodze, albo wszystko zostaje u ciebie
- nic nie zmusza do zawracania: niezałatwiona sprawa sama przepada po kilku minutach
- dwa posterunki policji przy trasie; kosze na śmieci znane grze (przy domach, przystankach, w parkach)
- pieszo: kamera nie wjeżdża już w postać, gdy biegniesz w jej stronę (trzyma minimalny dystans)
- plan i dalsze pomysły: docs/rozmowy-i-zadania.md

## Wersja 46: kopniaki poza bójką

- pieszo, poza solówką, ciosy jeden po drugim układają się w kombinację: pięść, druga pięść, kopniak z przodu, kopniak z półobrotu; wciśnięcie w trakcie ruchu czeka i leci zaraz po nim (szybkie klikanie nic nie gubi)
- w powietrzu (po skoku) cios to kopniak z wyskoku
- kopniaki sięgają dalej niż pięść i mają swoje „BACH!” i „ŁUBUDU!”; działają na przechodniów, rowerzystów i złodzieja
- nogi bez osobnych animacji: stopa prowadzona do celu (kolano w górę, wyprost, powrót), ciało lekko się odchyla
- w solówce (bójka jeden na jeden) bez zmian: tylko pięści

## Wersja 47: menu na telefonie, mniej presetów

- Grafika: siatka stylów nie nachodzi już na suwaki (wiersz stylów ma tyle rzędów przycisków, ile trzeba)
- na telefonie podpowiedzi w menu bez klawiszy („dotknij, żeby wybrać”, „dotknij albo przeciągnij suwak”)
- panel stylu na wąskim ekranie: zakładki w dwóch rzędach, żadna nie jest ucięta
- usunięte trzy presety: Ołówek, Riso, 1 bit (same nakładki zostają w zakładce Nakładka)

## Wersja 48: jazda dopracowana, miasto żyje w rozmowie

- skręt: płynne wejście w zakręt, szybsze oddanie kierownicy, gałka na telefonie precyzyjniejsza przy małych ruchach, odrobinę ostrzej przy prędkości
- zakręty drogi: gdy nie skręcasz, rower łagodnie prowadzi się wzdłuż jezdni (po zmianie pasa ustawia się równo z drogą); każdy skręt od razu to wyłącza
- pęd: mniejsze opory, rower dłużej toczy się z rozpędu (z 9 do 3 m/s ok. 9 s); mocniejszy przechył w zakrętach
- czucie prędkości: szerszy kąt i kamera dalej przy prędkości, kamera przechyla się z rowerem, drobne drgania od nawierzchni (asfalt, krawężnik, najmocniej trawa), lekkie rozmycie brzegów obrazu przy pełnej prędkości
- rozmowa nie zatrzymuje świata: auta, ludzie i złodziej żyją dalej, tylko rower hamuje i stoi
- historia widać w świecie: sąsiad z „wojny o kosiarkę” naprawdę kosi swój trawnik różową kosiarką (miejsce wybrane tak, żeby nie wchodził w auto ani kosze); donos i przeprosiny mówisz mu na trawniku; po wybitej szybie przestaje kosić i stoi wściekły; gdy prawda wyjdzie na jaw, przy leżaku brzuchacza stoi odtąd jego szara kosiarka na trzech kółkach

## Wersja 49: rozmowy bliżej, rzuty celniej, porządek w ogródkach

- po rozmowie postać rzuca jeszcze ostatnie słowo zależne od twojego wyboru („TYLKO MNIE NIE SPRZEDAJ!”, „I ANI SŁOWA O KOCIE!”, „PĄCZKI JUTRO! PAMIĘTAJ!”); kamera chwilę na niej zostaje
- kamera w rozmowie: płynnie przechodzi zza ramienia na rozmówcę (wyżej, gdy siedzi nisko albo za płotem; bliżej, gdy jest daleko), po rozmowie wraca; w rozmowie bez znaczników nad sceną
- nikt nie wciąga w rozmowę sam: posterunek otwiera się dopiero na „gadaj”; wybór przy podniesionej torebce to lekkie okienko u góry ekranu, wybierane cyframi albo dotykiem, a rower jedzie dalej
- znak rozmowy: dyndająca chmurka dymka nad głową (kropki: ma sprawę; „?”: czeka na ciebie); strzałka zostaje dla celów
- rzucanie: okno odrobinę łatwiej trafić (ramka liczy się szerzej), a gazeta lecąca tuż obok szyby w ostatniej chwili jest lekko do niej przyciągana
- ogródki: krzesło i leżak nie stają już na ozdobach, podjeździe ani ścieżce (wcześniej grill albo poidełko potrafiło stać na leżaku); ozdoby omijają też klomby, kosz przy ganku i pojemniki przy chodniku

## Wersja 50: zadań znacznie mniej

- sprawy rozdaje „reżyser”: na starcie nikt nie ma sprawy, pierwsza pojawia się po chwili jazdy, potem mniej więcej co minutę, zawsze u kogoś przed tobą (50–220 m), naraz najwyżej dwie
- sprawa minięta (ktoś został za tobą) przepada; później pojawi się inna, dalej na trasie

## Wersja 51: policja

- sława: rośnie za złe uczynki (zrzuceni rowerzyści, pobici przechodnie, szyby, zatrzymana torebka, kłamstwa), maleje za dobre (posterunek, mandat przyjęty z pokorą, pomoc); sama powoli opada; pod portmonetką lampka i kropki (od trzech może przyjechać patrol), lampka miga na niebiesko-czerwono, gdy patrol jedzie za tobą
- patrol: rzadko (co kilka minut), przy sławie od 3; radiowóz dojeżdża z tyłu na sygnale, u góry „POLICJA! ZWOLNIJ I STAŃ”; zatrzymaj się (podjeżdża obok) albo uciekaj (po 14 s ucieczki odpuszcza, sława rośnie)
- rozmowa z posterunkowym Kapustą: przeprosiny (mandat), „to mój brat bliźniak”, gazeta jako łapówka, albo „mogę coś zgłosić?” zamiast mandatu; trzecie zatrzymanie kończy trasę (gra od nowa)
- posterunek: zawsze ktoś na dyżurce (pogadaj przy drzwiach): zgłoś, co wiesz (kto zamawia szyby, kto skupuje kradzione rowery) za kasę i dobrą opinię; skutek widać: radiowóz pod domem, obrażona postać („KABEL!”, butelki), ekipa spod beczki raz się mści (wybiega do bójki)
- tablica na posterunku: list gończy (pierwszy rowerzysta na drodze dostaje czerwoną strzałkę; zrzuć go, zapłata przez radio, bez wracania), wezwania do rozniesienia (trzy domy, każdy reaguje po swojemu)
- plan grup i gangu rowerowego: docs/rozmowy-i-zadania.md

## Wersja 52: nastroje słychać

- zaczepki z ogródków zależą od tego, jak kogoś potraktowałeś: od „O, NASZ BOHATER JEDZIE!” po „WYNOCHA Z MOJEJ ULICY!”; osobne dla kabli („KAPUŚ JEDZIE!”), kłamczuchów („ŁGARZ!”) i dla ekipy spod beczki
- rozmowy o sprawy zaczynają się inaczej przy dobrym i złym nastroju; ktoś wściekły nie da żadnej sprawy
- ktoś obrażony: można przeprosić (raz na jakiś czas), dać gazetę na zgodę albo dolać oliwy do ognia
- ktoś bardzo zadowolony raz coś podaruje (szarlotka, „sok”, dzwonek, bilet)
- policja płaci „z funduszu konfidenta. Znaczy... prawowitego obywatela”

## Wersja 53: kopanie radiowozu, anegdoty, opinia u policji

- radiowóz (patrol albo zaparkowany po donosie) można kopnąć z roweru, a pieszo kopniakiem albo pięścią; z środka najpierw ostrzeżenia („TO JEST MIENIE PAŃSTWOWE!”), po kilku razach policjant wysiada
- rozmowa z nim: przyjmij mandat, odmów (wtedy bójka „w imieniu prawa”), dogadaj się (łapówka, udaje się częściej, gdy policja cię lubi) albo zapytaj, czemu taki nerwowy (anegdota)
- anegdoty policjantów (kura, mandat dla samego siebie, babcia na chodziku, kot z własną szafką...) także przy zatrzymaniu przez patrol i na posterunku („co słychać na komisariacie?”)
- opinia u policji: rośnie za donosy, oddaną torebkę, zadania z tablicy, przyjęty mandat; spada za ucieczkę, kopanie radiowozu, łapówki i bójkę; przy świetnej opinii policja przymyka oko (przy kopaniu i przy zatrzymaniu: „PANIE WŁADZO, TO JA, GAZECIARZ”), ale opinia na tym traci

## Wersja 54: anegdoty

- nowy plik `src/stories.js`: pule anegdot dla każdej grupy (policja 18, brzuchacze, babcie i dziadkowie, ekipa spod beczki, przystanek, lump), losowane bez powtórek, aż pula się wyczerpie
- zagadany ktoś bez sprawy (i nie obrażony) często opowiada anegdotę: lekkie okienko u góry, jedziesz dalej, znika samo po 10 s; każdy raz na jakiś czas
- policjanci losują anegdoty z większej puli (przy zatrzymaniu, po kopnięciu radiowozu, na posterunku)

## Wersja 55: pula wariantów zadań, dymki w linijkach

- „szyba u sąsiada” w trzech historiach (losowane bez powtórek w przejeździe), każda z własnym twistem i obrazkiem w świecie: wojna o kosiarkę (sąsiad kosi różową kosiarką), antena (Mirek sam ją przekręcił, wieszając flagę w samych skarpetkach; sąsiad podlewa kwiatki z konewką), kogut (pieje budzik w telefonie brzuchacza, bo kogut od trzech lat jest w rosole; sąsiad karmi kury, które dziobią po trawniku)
- list w trzech wersjach: list, słoik ogórków, pocztówka znad morza spóźniona o pół wieku; każda z własnymi reakcjami odbiorcy
- ekipa spod beczki chce gazet z różnych powodów: na rozpałkę, na ściółkę dla psa Komornika, na czapki na urodziny Ziutka, na zakład o krzyżówkę
- dymki z tekstem łamią się na linijki, gdy nie mieszczą się w szerokości ekranu (telefon), a długie zostają dłużej
- plan: tryb „czysta jazda” na wynik zapisany w docs/wizja.md

## Wersja 56: sklep rowerowy

- dwa warsztaty rowerowe przy trasie (szyld ROWERY · CZĘŚCI, otwarta brama, rower na stojaku); zatrzymaj się przy drzwiach i „T: SKLEP” (telefon: GADAJ); w sklepie gra czeka
- ekran sklepu (`src/shop.js`): rower bez rowerzysty obraca się na podglądzie i od razu pokazuje część, na którą najedziesz; paski: prędkość, przyspieszenie, skręt, na trawie, pod górkę, kondycja, torba (zielone i czerwone: co by się zmieniło)
- części (każda z kilkoma wersjami, ceną i krótkim opisem): koła (szosowe, terenowe „Kozica”, wyczynowe złote), siodełko (skórzane, żelowe „Kanapa”), kierownica (sportowe chwyty, BMX), przerzutki (3 i 7 biegów), lakier (miętowy, granatowy, cytrynowy, czarny mat), dzwonek (piesi schodzą z drogi wcześniej), lampka (policja szybciej zapomina), torba (26 i 32 gazety)
- działają w jeździe: prędkość maksymalna i rozpędzanie, opór trawy, podjazdy, skręt, sprint (kondycja), szybkość tricków, pojemność torby (więcej się nie zmieści: „Torba pełna”)
- fanty z zadań: sprzedaż, a dzwonek i lampka do zamontowania od ręki; dopełnienie torby gazetami (2 gazety za złotówkę)
- części zostają do końca przejazdu (od nowa: rower fabryczny)

## Wersja 57: przejazd ma początek i koniec

- torba na start mieści 30 gazet i jest pełna (w sklepie 36 i 42)
- zdrowie (serce i pasek pod portmonetką): wywrotka −15, uderzenie autem −30, potrącenie pieszo −35, przegrana bójka −35; powoli wraca samo, bułka z łupu +30, drożdżówka w sklepie +40 (5 zł)
- koniec trasy: gdy zdrowie spadnie do zera albo przy trzecim zatrzymaniu przez policję
- trudność rośnie z dystansem (pełna po 8 km): auta jeżdżą szybciej, patrole i złodzieje zdarzają się częściej
- ekran końca trasy (`src/run.js`): powód, dystans, dostarczone gazety, zarobek, zbite szyby, zatrzymania; rekord zapamiętany w przeglądarce
- loteria: z kupionych części i fantów jedna rzecz zostaje na koncie na zawsze; każdy kolejny przejazd zaczyna się z tym, co już na koncie („Z konta: ...”)

## Wersja 58: prenumeratorzy i tytuły

- trzy tytuły (wymyślone): Trąbka Poranna (czerwona), Wieści zza Płotu (zielone), Sport i Działka (niebieski); w torbie po trochę każdego (na start po 10), pasek tytułu na rzucanej gazecie w jego kolorze
- X (na telefonie przycisk „tytuł”) zmienia rzucany tytuł; przy torbie trzy kolorowe liczniki, wybrany obwiedziony, nad nimi jego nazwa
- około połowy domów prenumeruje jeden tytuł: tabliczka w jego kolorze przy drzwiach, a z bliska (do ~40 m przed tobą) mała gazeta w jego kolorze nad domem
- właściwy tytuł: pełna zapłata i liczy się do dostarczonych; zły: połowa i „JA CZYTAM SPORT!”; dom bez prenumeraty: nic („NIE ZAMAWIAŁEM!”)
- wybita szyba u prenumeratora: „REZYGNUJĘ Z PRENUMERATY!” (tabliczka znika)
- gazety dochodzące skądkolwiek (paczki, sklep, łupy, ekipa) rozkładają się po tytułach (najpierw tam, gdzie najmniej); każdy przejazd: nowi prenumeratorzy
- w sklepie także konkretny tytuł: +5 wybranej gazety za 3 zł (obok „dopełnij” po równo)

## Wersja 59: reputacja grup, gang rowerowy, notes, pan Janusz

- reputacja pięciu grup (od wroga do szacunku): policja, ekipa spod beczki, gang rowerowy, sąsiedzi, przystanek i ławki; grupy mają zgrzyty (rowery dla ekipy i list gończy dla policji psują stosunki z gangiem, donos na ekipę cieszy policję)
- gang rowerowy (czarne koszulki, czarne ramy): każdy strącony rowerzysta to minus u gangu, czysty trick to plus (cenią styl); przy złej reputacji rzadko (co kilka minut, dwa razy częściej na ich rewirze: ścieżkach rowerowych) dojeżdża dwóch albo trzech z tyłu; kopnij ich z rowerów albo uciekaj; dopadną: zrzucają z roweru („TO ZA KOLEGĘ!”); wszystkich na asfalt: niechętny respekt
- notes gazeciarza pod Tabem (telefon: przycisk z notesem u góry), gra czeka: co o tobie mówią poszczególne grupy (pasek i jedno, dwa zdania), stan (zdrowie, kasa, sława, dystans), torba po tytułach, części roweru, fanty, rzeczy na koncie z loterii
- pan Janusz, właściciel warsztatów: w kąpielówkach, klapkach, za małej koszulce i czapeczce; siedzi na taborecie przed warsztatem i zaczepia („JAPOŃSKI OSPRZĘT, MŁODY!”), a w sklepie siedzi obok roweru i komentuje każdą kategorię, zakup, brak kasy i sprzedaż; „Pogadaj z Januszem”: anegdoty z wypraw z Mietkiem (nad morze w klapkach, guma załatana kanapką z serem, zlot tydzień po zlocie...)
- długie linijki zadań u góry ekranu łamią się na wąskim ekranie

## Wersja 60: dźwięk i muzyka

- wszystko grane w przeglądarce (`src/audio.js`: oscylatory, szum, filtry), bez plików i bez pobierania; rusza po pierwszym kliknięciu albo klawiszu
- efekty: rzut gazety, lądowanie, ganek, skrzynka, szyba, kasa, dzwonek (B, gdy masz go na rowerze; piesi schodzą z drogi), wywrotka, kopniak, cios, psy, klakson, syrena patrolu (głośniej, gdy bliżej), podniesienie łupu, szelest paczki, trick, au, kliknięcia w menu i rozmowie; szum jazdy rośnie z prędkością (na trawie szorstszy); dźwięki ze świata cichsze z daleka i z właściwej strony
- mowa bez lektora: każdy dymek i każda rozmowa to bełkot sylab w głosie postaci (jak w bajkach): babcie wysoko i drżąco, dziadkowie niżej, brzuchacz basem, ekipa szybko, policja sucho, pan Janusz podskakująco, gang zadziornie, a lump mamrocze nisko, bełkotliwie i z czkawką; pytanie idzie w górę, wykrzyknik mocniej
- muzyka: pogodny poranek w trakcie jazdy, pościg (gang albo policja za tobą) z płynnym przejściem, spokojna na ekranie tytułowym i podsumowaniu
- menu (pauza i ekran tytułowy): DŹWIĘK z suwakami głośności, muzyki, efektów i głosów (zapamiętane)
- Warsztat: kategoria „Dźwięki” do odsłuchu każdego efektu, głosu i muzyki, z suwakami

## Wersja 61: nowy warsztat i ekran sklepu

- warsztat: ceglana podmurówka, dach z falistej blachy z rdzą, pasiasta markiza nad bramą, większy szyld z rowerkiem, brama podniesiona do połowy (w środku wiszą koła), witryna z czerwonym kołem; obok złom z lat: sterty starych opon, rdzawe ramy rowerów oparte o ścianę, stara lodówka na plecach, beczka, skrzynki; pan Janusz siedzi po drugiej stronie bramy
- ekran sklepu od nowa: gra przyciemniona rastrem (jak w pauzie), pikselowe okno z „klocków” (blokowe przyciski z cieniem), z boku okno rozmowy z awatarem Janusza (pikselowy portret: czapeczka, wąsy, podbródki, koszulka na ramiączkach; usta ruszają się, gdy mówi) i dymkiem jego kwestii
- własny awatar: plik `assets/ui/janusz.png` (kwadratowy) zastąpi rysowany portret

## Wersja 62: Janusz z obrazka, łatwiejszy start, dźwięk

- ekran sklepu: pan Janusz z obrazka (`assets/ui/janusz.png`) stoi luzem w lewym dolnym rogu, jakby wychodził zza ekranu; nad nim pikselowy dymek z ogonkiem, słowa wskakują po kolei, migający kursor; gdy mówi, lekko się buja
- po prawej okno sklepu: rower na górze (sam, bliżej), pod nim statystyki z dziesięciu klocków (zielone/czerwone klocki: co zmieni część) z liczbą obok, niżej przewijane półki
- Janusz nie powtarza się: każda pula kwestii tasowana bez powtórek; przy każdej kategorii po sześć różnych kwestii (konkretne rady o częściach i anegdoty)
- naprawione: drożdżówka w sklepie była wypisana dwa razy
- nad Januszem w świecie chmurka z wózkiem na zakupy
- łatwiejszy start: na początku jedna gazeta (bez wybierania tytułu), druga dochodzi po 1,4 km, trzecia po 3,8 km; torba przepakowana po równo, dalsze domy dostają nowe prenumeraty (bliskie i obsłużone zostają)
- naprawione: F przy podnoszeniu roweru czasem otwierało pauzę (puszczenie myszy brane było za Esc)
- menu Dźwięk: przycisk całkowitego wyciszenia
- menu Grafika: usunięte style Gładki, Malowany, Komiks i Akwarela

## Wersja 63: przewidywalny ruch

- auta wymijają już tylko to, co stoi w miejscu: zaparkowane przy krawężniku, rampę, autobus na przystanku i rowerzystę, który stoi dłużej niż 4 sekundy; za wolnym autem i za jadącym rowerzystą grzecznie czekają (i trąbią)
- przed wymijaniem kierunkowskaz: najpierw chwilę miga lewy (auto jeszcze na swoim pasie), potem zjazd; w drodze powrotnej miga prawy

## Wersja 64: pad i płynne auta

- pad Xbox i PlayStation (każdy w standardowym układzie): pierwsze wciśnięcie przełącza grę na pada, podpowiedzi pokazują jego przyciski (A B X Y albo krzyżyk, kółko, kwadrat, trójkąt), klawisz lub mysz przełącza z powrotem
- rower: RT jedź, LT hamuj, lewa gałka skręt, LB / RB rzut (trzymaj: siła, prawa gałka: celowanie), A podskok, X kopniak / trick, Y pogadaj, B zsiądź, L3 szybciej, R3 kamera, krzyżak ↑ zmiana gazety, ↓ dzwonek
- pieszo: lewa gałka idzie tam, gdzie ją pchniesz (względem kamery), prawa obraca kamerę, A skok, X uderz, Y zagadaj, B wsiądź; w bójce X prosty, Y sierpowy, RB garda, LB / A unik, krzyżak ↑ ↓ hak i dół, ← prowokacja
- menu, pytania, rozmowy: krzyżak lub gałka wybiera, A zatwierdza, B wraca; w szybkim wyborze w trakcie jazdy odpowiedzi pod strzałkami krzyżaka; MENU pauza, VIEW notes
- sklep: podświetlenie skacze po przyciskach (część od razu widać na rowerze), A kupuje, Y pogadaj, B wyjście
- auta skręcają płynnie: bez przeskoku w bok na styku kawałków drogi, obrót z faktycznego ruchu, jak prawdziwe auto

## Wersja 65: świat reaguje na kopniaki

- naprawione: wersja 64 nie uruchamiała się (błąd w obsłudze pada)
- kopniak (pieszo albo z roweru) w skrzynkę pocztową: drży, chorągiewka podskakuje, trzecie kopnięcie łamie ją i przewraca zawsze od strony jezdni, w stronę domu (sława u policji lekko w górę, sąsiedzi komentują)
- słup: ledwie widoczny obłoczek kurzu; drzewo: chwieje się i sypią się liście, im więcej kopniaków, tym więcej (jesienne pomarańczowe, zielone, igły ze świerków); krzak: opadają zielone listki (z kwitnącego płatki); liście zostają na ziemi
- huśtawka: każdy kopniak rozbuja ją mocniej, potem powoli się uspokaja
- pachołki: wjechane albo kopnięte przewracają się i odjeżdżają po asfalcie, zamiast stać jak ściana

## Wersja 66: chodzenie po werandach, niewidzialne ściany

- pieszo stoisz na werandzie, jej stopniach i stopniu posterunku zamiast zapadać się w nie po kolana (podłogi chodzenia zapisane osobno od gruntu)
- naprawione: szopy, beczka i stary samochód przy barakach oraz krzesła i leżaki w ogródkach miały kolizje w jednym punkcie mapy zamiast u siebie (przy barakach przejeżdżało się przez szopy, a w tamtym miejscu stały niewidzialne ściany)

## Wersja 67: działki zamiast niektórych domów, grunt pod wszystkim

- nowe działki w miejsce części domów: działki ogrodowe (grządki, szklarnia z folii, strach na wróble, działkowiec krzyczy, gdy wjedziesz w grządki), garaże blaszaki (czasem jeden otwarty, a w nim przerzutki do zwinięcia), budowa (hałda piasku, betoniarka, pustaki, kontener, błoto, deska do skoku na chodniku), trzepak z dywanem, piaskownicą, dzieciakiem i piłką do kopania, buda z psem na łańcuchu (rzuca się, ile łańcuch pozwoli) i kurnikiem (kury się rozbiegają), kapliczka ze świeczkami i babcią (kopnięta: świeczki gasną, babcia ma coś do powiedzenia), przyczepa kempingowa na pustakach z dymiącą rurą i jej lokatorem
- kałuże przy krawężnikach: przejazd chlapie (dźwięk i krople), przechodzień obok dostaje i komentuje; błoto na budowie hamuje
- dopasowanie do gruntu: płyty (podjazdy, ścieżki, beton, błoto, place przy barakach) są wyginane po terenie punkt po punkcie, bez szpar i chowania pod trawą; działki i baraki siadają na zboczu jak domy, każdy element na swojej wysokości, ludzie też
- jedna wysokość gruntu dla wszystkiego: teren liczony dokładnie tak, jak jest narysowany (wcześniej na łukach 30 do 50 m od drogi rozjeżdżało się to do kilkudziesięciu centymetrów), więc przedmioty, stopy i ścieżki stoją na trawie, nie nad nią ani pod nią
- las po wewnętrznej stronie pętli nie wychodzi już poza trawę (drzewa wisiały tam nad pustką)
- naprawione: kopane pachołki i huśtawki naprawdę się ruszają (wcześniej były wtopione w nieruchome siatki), drzewo kopnięte brzmi jak uderzenie, nie jak szelest
- narzędzie: `?audit` buduje trasę bez łączenia siatek i `PT.track.audit()` wypisuje, co wisi w powietrzu, co jest pod trawą, co się zapada
- poprawka 67.1: trasa znowu widać (w 67 przez błąd nie trafiała do sceny i jechało się po pustce); kamera pieszo znowu nie wchodzi pod ziemię; obrót podstawki w Warsztacie

## Wersja 68: czapka

- czapka (pieszo i na rowerze) wyższa z tyłu i obejmuje fryzurę, więc włosy nie wystają nad nią; z tyłu półokrągły otwór (widać przez niego włosy) i pasek regulacji ze sprzączką

## Wersja 69: ten sam chłopak na rowerze i pieszo

- na rowerze siedzi teraz ten sam model co pieszo (ta sama głowa, twarz, fryzura, czapka, ubranie i torba): jego kości są co klatkę ustawiane według dawnej sylwetki rowerzysty, która została jako niewidoczny szkielet; nogi na pedałach, ręce na kierownicy, głowa patrzy w zakręt i za psem; rzut, kopniak, tricki i upadek działają jak dotąd, tylko na nim
- odmłodzony (pieszo i na rowerze tak samo): głowa o 10% większa w stosunku do ciała, jak u trzynastolatka
- rowerzyści z ruchu ulicznego i gang zostają przy dawnej, lżejszej postaci

## Wersja 70: czapka na miarę, kamera

- czapka zbudowana od nowa i „obciągnięta” na głowę: każdy punkt kopuły leży tuż nad głową i włosami modelu (mierzone z jego wierzchołków), przechylona jak prawdziwa czapka (z przodu na czole, z tyłu niżej przy karku), daszek, otwór z paskiem i sprzączką z tyłu, guzik na czubku
- spod czapki wychodzą dłuższe kosmyki: płaskie, zaokrąglone, w dwóch zachodzących warstwach, dłuższe na karku i nad uszami
- kamera na rowerze i pieszo celuje bliżej postaci: cała mieści się w kadrze, nie ucina jej dół ekranu

## Wersja 71: czapka i włosy jak na koncepcie, widok z oczu, mniej sztywno

- czapka pełniejsza i okrągła z tyłu (dopasowana do głowy, ale z koroną jak prawdziwa czapka), sześć szwów paneli, ciemniejsza obwódka u dołu, dziurki wentylacyjne, większy otwór z tyłu z obszyciem, pasek z końcówką i sprzączką
- włosy: gęsta warstwa pod czapką dookoła głowy, na niej falujące kosmyki lekko podwinięte na końcach, w trzech warstwach, dłuższe na karku i nad uszami (uszy lekko spod nich widać)
- torba czytelniejsza z daleka: grubsze jasne przeszycia, ciemna lamówka klapy, szersze ciemne paski, jaśniejsze klamry, skórzane rogi u dołu
- widok z oczu rowerzysty: kamera na oczach nowego modelu (wcześniej siedziała w szyi), na dole kierownica i dłonie
- na rowerze mniej sztywno: model pochylony mniej niż dawna sylwetka (jest wyższy, głowa wypadała nad kierownicą), reszta pochylenia w zgięciu pleców; biodra i barki kołyszą się w rytm korby, lekkie podskakiwanie, głowa spokojna

## Wersja 72: chłopak bez prześwitów

- naprawione: rowerzysta (i chłopak pieszo) prześwitywał nakrapianą dziurą i tracił głowę: prześwietlanie przeszkód między kamerą a postacią łapało jego samego (nowy model jest wyższy niż dawna sylwetka); teraz jego materiały, czapka, włosy i torba są z tego wyłączone, a drzewa i dachy dalej się prześwietlają

## Wersja 73: znaczniki zadań nie zasłaniają drogi

- napis nad celem zadania (POSZUKIWANY, ZŁODZIEJ i inne) z odległością pokazuje się tylko, gdy cel jest dalej niż 22 m; z bliska sama strzałka; gdy cel jest poza ekranem, strzałka przy krawędzi dalej mówi, co to i jak daleko

## Wersja 74: naturalniej na rowerze

- ręce nie są już proste jak kije: nowy model ma krótsze ręce niż dawna sylwetka i nie sięgał kierownicy; teraz pochyla się nad nią, plecy zaokrąglone, łokcie ugięte (ok. 40°), palce obejmują chwyty
- mocniejsze kołysanie bioder i barków w rytm korby, lekkie „pompowanie” plecami
- rozglądanie się myszką: głowa delikatnie odwraca się w tę stronę (i lekko w górę lub w dół)
- widok z oczu dopasowany do nowego pochylenia: na dole kierownica i dłonie; czapka znika z widoku z oczu (wcześniej przez błąd zostawała)

## Wersja 75: dłuższa walka z gangiem

- gang najpierw dojeżdża i przez kilka sekund jedzie obok po bokach (z docinkami), dopiero potem atakuje: jeden naraz zjeżdża i kopie, z przerwą między atakami
- jeden kopniak już nie zrzuca: szarpnięcie, wolniej, trochę zdrowia mniej, licznik 1/5 … dopiero piąty przewraca
- każdy z gangu wytrzymuje trzy kopniaki: po pierwszych chwieje się i odpada na bok, potem wraca
- patrzą przed siebie i omijają przeszkody (pachołki, zaparkowane auta, barierki, studzienki: ich prawdziwe obrysy, nie przybliżenia); kto jednak wjedzie, traci życie, a na koniec leży
- pościg trwa dłużej (do 160 s, jeśli nie uciekniesz ani ich nie położysz)

## Wersja 76: włosy spod czapki jak na koncepcie

- za uszami końcówki włosów podkręcone na zewnątrz i do góry, z tyłu krótsze i proste do karku, nad uszami krótko, więc uszy (i z tyłu kawałek policzka) widać

## Wersja 77: fryzura z jednego kawałka, niższa korona czapki

- włosy pod czapką to jedna warstwa dookoła głowy (z tyłu i po bokach), przylegająca, lekko zwężona do karku, z falistym brzegiem w pasma i jaśniejszymi i ciemniejszymi smugami; nad uszami krótko, za uszami tylko delikatne podwinięcie (wcześniej osobne kosmyki odstawały jak płatki)
- korona czapki niższa i szersza w ramionach, bardziej płaska na górze (wcześniej półkula); szwy paneli ciemniejsze i cieńsze

## Wersja 78: prawdziwe włosy zamiast plastiku

- pod czapką ok. 130 cienkich pasm, zwężających się ku końcom, w kilku brązach (w pikselach dają nieregularną mozaikę jak na koncepcie), ułożonych po kształcie głowy: z tyłu dłuższe, zachodzą na kark; nad uszami krótkie i podkręcone do góry; pod spodem krótka ciemna warstwa, żeby nie prześwitywała skóra
- włosy się ruszają: lekko falują zawsze, przy szybkiej jeździe wiatr odgina je do tyłu, przy szarpnięciu głowy podskakują (pieszo i na rowerze)

## Wersja 79: start spod domu

- gra zaczyna się przed domem: krótka uliczka od trasy (w lewo albo w prawo), małe rondko z wysepką, drzewkiem i kwiatkami, chodniki dookoła, dwie latarnie
- dom piętrowy z gankiem i otwartym garażem: w środku półki z puszkami i pudłami, warsztat z tablicą narzędzi, zapasowe koło na ścianie, światło; obok dwa rowery, jeden do góry kołami bez przedniego koła; rodzinne auto stoi na rondku przy krawężniku
- rodzina: mama przy ścieżce, tata przy warsztacie w garażu, brat przy rowerach; każde rzuca swoje teksty
- dwoje sąsiadów przed domami po bokach rondka (pan przy żywopłocie, pani przy furtce), ze swoimi tekstami
- wjazd z uliczki w trasę: zaokrąglone narożniki z krawężnikiem, chodnik trasy przechodzi łukiem w chodnik uliczki, przerywana linia krawędzi, „ząbki” ustąp pierwszeństwa i znak; bez trawy i liści na środku wjazdu
- ujęcie startowe: kamera z przodu pokazuje chłopaka na tle domu i garażu, a gdy ruszy, płynnie obiega go do tyłu
- poprawki: podwórko nie jest już „poza mapą” (granica 28 m od trasy nie wypycha z osiedla, babka nie okrada przed domem); kałuże nie wywalają gry; dźwięk odporny na błędne położenie

## Wersja 80: wygodne rzucanie, seria, poziomy

- **szybki rzut**: krótkie kliknięcie (LPM/PPM, Q/E, LB/RB) samo posyła gazetę do najlepszego celu po tej stronie: skrzynki prenumeratora (najlepiej) albo przed jego drzwi; gazeta leci łukiem prosto w cel. Cel w zasięgu kliknięcia ma nad sobą migającą ramkę i podpis przycisku
- **przytrzymanie** działa jak dotąd (siła i celowanie myszą), ale gdy kółko upadku jest blisko celu, przykleja się do niego i gazeta tam doleci
- jedna gazeta w locie do domu blokuje drugi rzut w ten sam dom; doręczenie do skrzynki zalicza cały dom (nie da się już dostać punktów drugi raz z ganku)
- **seria**: kolejni prenumeratorzy obsłużeni bez błędu; co 3 punkty liczą się razy więcej (x2, x3, x4). Serię przerywa zły tytuł, dom bez prenumeraty, gazeta rzucona obok czekającego domu albo minięcie prenumeratora bez gazety. Licznik pod licznikiem rowerowym
- **poziomy co kilometr** (do 6): na starcie tylko 2 auta i autobus, z każdym kilometrem dochodzi auto, ruch trochę przyspiesza, psy są czujniejsze; awans ogłaszany
- mniej zaczepek: mieszkańcy wołają z bliska, rzadziej, nie wszyscy i nie jeden po drugim
- jeden salon rowerowy na pętli zamiast dwóch
- okolice domu: kosz do koszykówki nad garażem, klasy kredą na podjeździe, żywopłoty między ogrodami, ławka i kosz na rondku, tabliczka „UL. PORANNA”

## Wersja 81: tryby gry i gra przez sieć

- **TRYBY GRY** w menu (na ekranie tytułowym i w pauzie):
  - **Poranny sprint**: minuta na zegarze, każda doręczona gazeta dokłada 5 s (w serii więcej). Ile zdążysz? Rekord zapisany w przeglądarce
  - **Tor przeszkód**: na najspokojniejszym odcinku pętli staje tor: brama START, rzędy pachołków do slalomu (przejazd raz z lewej, raz z prawej), skocznia i deska, bramki, META w szachownicę. Czas od bramy startowej, przewrócony pachołek +2 s, ominięta bramka +5 s. Bez aut i psów
  - każdy tryb zaczyna się odliczaniem 3-2-1 i kończy ekranem wyniku: JESZCZE RAZ (Enter) albo KLASYCZNA TRASA (Esc)
- **GRA PRZEZ SIEĆ (2 graczy)**: każdy gra u siebie, na swoim komputerze; połączenie idzie prosto między przeglądarkami (WebRTC), bez serwera gry
  - łączenie: gospodarz klika ZAŁÓŻ GRĘ i dostaje KOD 1, wysyła go znajomemu (np. na czacie); znajomy klika DOŁĄCZ, wkleja, dostaje KOD 2 i go odsyła; gospodarz wkleja KOD 2 i POŁĄCZ
  - drugiego gracza widać na trasie (niebieski rower), nad nim znacznik G1/G2; gdy jest poza kadrem, na krawędzi ekranu strzałka z odległością („G2 60 M”)
  - te same domy prenumeratorów u obu; dom obsłużony przez jednego jest obsłużony dla obu; widać gazety rzucane przez drugiego, zbite przez niego szyby
  - tryby (wybiera gospodarz): WSPÓLNA JAZDA (bez zegara), WYŚCIG GAZECIARZY (4 min, kto więcej zarobi; kopnięcie zrzuca drugiego z roweru), RAZEM (20 gazet we dwóch w 5 min; kopnięcie tylko popycha), BEREK NA ROWERACH (3 min, kopnięcie oddaje berka, potem 3 s ochrony; wygrywa ten, kto był berkiem krócej)
  - wspólny start obok siebie na trasie przy wyjeździe z uliczki, odliczanie u obu naraz, tablica wyników na górze, ekran końca z porównaniem (zarobione, doręczone, kopniaki, upadki)
  - zerwane połączenie kończy rundę; do testów na jednym komputerze: dwie karty z `?bc=KOD` w adresie

## Wersja 82: zaproszenie linkiem, bez niewidzialnej ściany

- gra przez sieć bez kopiowania kodów: ZAŁÓŻ GRĘ daje **link zaproszenia** (zawsze na publiczną stronę gry, także gdy gospodarz gra lokalnie); znajomy klika i od razu dostaje **link zwrotny**; gospodarz klika link zwrotny, otwiera się karta, która przekazuje go do czekającej gry i sama się zamyka. Bez serwera, kod jest w części adresu po „#”, więc nie trafia na żaden serwer
- można też wkleić link (albo sam kod) w okno gry; zaproszenie czeka 10 minut
- poprawka: przy wyjeździe z osiedla na trasę stała niewidzialna ściana (granica podwórka sięgała na trasę); teraz granica działa tylko za domami

## Wersja 83: wsiadanie przy leżącym rowerze

- poprawka: przy leżącym rowerze była martwa strefa (wsiadało się tylko do 1,7 m od jednego punktu roweru, a strzałka do roweru znikała już od 2,2 m), więc stojąc przy przednim kole nie dało się wsiąść i nie było strzałki; teraz liczy się odległość do całego roweru, od koła do koła, i strzałka znika dopiero, gdy da się wsiąść
- gdy rower jest dalej (np. po przegranej bójce przeciwnik rzucił go przy drodze), komunikat mówi, ile metrów i żeby iść za strzałką na dole

## Wersja 84: cudze rowery i ekwipunek roweru

- **rowery mają typy** z własnymi statystykami (prędkość, przyspieszenie, skręt, teren, pod górkę, triki, torba): TWÓJ GÓRAL, SKŁADAK, KOLARZÓWKA, BMX, DAMKA Z KOSZYKIEM, OSTRE KOŁO, TREKKING Z BŁOTNIKAMI, ROWER Z SILNICZKIEM. Statystyki roweru = jego rama + jego części
- **cudze rowery**: kilka stoi albo leży w ogródkach, BMX brata stoi przy garażu, a przewrócony rowerzysta zostaje na ziemi, dopóki jesteś blisko. Pieszo przy rowerze F: zabierasz go i jedziesz, a Twój zostaje tam, gdzie stał (można po niego wrócić). Właściciel krzyczy, policja trochę bardziej się Tobą interesuje
- **karta roweru**: kursor nad rowerem (albo stanie obok, gdy kursor jest schowany) pokazuje jego nazwę, opis, statystyki w kratkach w porównaniu z Twoim (zielone lepiej, czerwone gorzej), torbę i części, jakie ma
- **każdy rower ma swoje części** w 8 slotach (koła, siodełko, kierownica, przerzutki, lakier, dzwonek, lampka, torba); części nie przechodzą same na nowy rower. Kupione u Janusza zakładają się na rower, którym jedziesz, a to, co było, trafia do zapasowych; kupiony lakier jest Twój do użycia na każdym rowerze
- **ekwipunek (I, na padzie krzyżak w lewo)** na wykropkowanej nakładce jak sklep: Twój rower z boku na tle tablicy narzędziowej, sloty przy prawdziwych częściach, połączone pikselowymi liniami; zielona kropka przy slocie, gdy masz coś lepszego. Klik w slot: co może w nim być (zapasowe, część z roweru obok, zdjęcie do zapasowych, lakiery); najechanie od razu pokazuje część na rowerze i zmianę w paskach statystyk. Siatka części zapasowych (klik: załóż). Rower stojący obok: pasek na dole z jego częściami do zdjęcia i przyciskiem PRZESIĄDŹ SIĘ. Przekładanie tylko na postoju; w jeździe ekran jest do podglądu. Gra czeka, gdy ekran jest otwarty
- lakier „zerowy” nazywa się teraz FABRYCZNY (kolor ramy danego typu); czerwony doszedł jako puszka do kupienia

## Wersja 85: boisko przy domu i rzuty z widoku z oczu

- **boisko po lewej stronie domu** (od strony garażu): asfalt 8,4 × 8 m z liniami (trumna w ceglastym kolorze, linia i koło rzutów wolnych, łuk za 3 z prostymi przy liniach bocznych, więc z rogu też liczy się 3), kosz na bocznej ścianie domu na wspornikach (obręcz 3,05 m, tablica z czerwonym kwadratem, siatka falująca po trafieniu)
- dookoła: ławka z butelkami wody, lampa w rogu, wózek z piłkami pod ścianą, tablica z wynikiem kredą na ścianie, niski płotek od strony ulicy z otwartą furtką; ścieżka z rondka przez furtkę na boisko i dalej do drzwi sąsiadki; żywopłot po tej stronie zniknął; brat kibicuje przy linii, odwrócony rower stoi za płotkiem
- **rzucanie**: podejdź do piłki i jest w rękach, a widok sam przełącza się na oczy (odłożenie piłki albo zejście z boiska wraca do poprzedniego). Celujesz myszką, trzymasz LPM: pasek siły pływa w górę i w dół, zielone pole na nim to siła „w sam raz” z tego miejsca przy tym celowaniu (dalej: węższe); puszczasz. Piłka leci prawdziwym łukiem i odbija się od tablicy, obręczy, ściany i asfaltu. Za 2 albo za 3 decyduje miejsce stóp; trzy trafienia z rzędu: „W GAZIE”, punkty podwójnie, a pasek pływa szybciej. PPM odkłada piłkę
- **ręce w widoku z oczu**: piłka trzymana oburącz, przy ładowaniu siły schodzi do klatki, przy rzucie ręce wystrzeliwują w górę i do przodu z ruchem nadgarstków, potem znikają z kadru; przy podniesieniu piłki wracają
- **tryb RZUTY POD DOMEM** (menu TRYBY GRY): minuta, kolejne zielone koła na boisku (3 miejsca za 2, 3 za 3: rogi i szczyt), rzut liczy się tylko z koła, każde trafienie +2 s, piłka wraca do rąk po każdym rzucie; rekord zapisany
- **przez sieć**: nowy tryb RZUTY POD DOMEM dla dwóch (minuta, kto więcej punktów), obaj na boisku, widać piłki rzucane przez drugiego
- poprawka 85.1: wrócił dźwięk rzutu piłką i wysyłanie rzutów do drugiego gracza (komentarz w kodzie połykał tę linię)

## Wersja 86: prawdziwe ręce, brat do podawania, podania w sieci, lepsze czucie rzutu

- **ręce chłopaka zamiast klocków**: w widoku z oczu piłkę trzymają jego własne ramiona i dłonie z modelu (te same co pieszo i na rowerze): prawa za piłką i pod nią, lewa z boku, palce lekko na piłce. Przy rzucie prawa ręka idzie w górę z opadającą dłonią, przy lekkim podaniu obie wypychają piłkę przed siebie. Z piłką kamera cofa się nieco do środka głowy (kark i głowa schowane), więc piłka i dłonie są u dołu kadru, a kosz zostaje odsłonięty
- **czucie rzutu**: siła rośnie płynnie, póki trzymasz (szybko, potem wolniej pod górę paska), a na pełnej drga; krótka prowadnica z kropek pokazuje początek lotu (resztę oceniasz sam); dalsze rzuty mają zielone pole w połowie paska, nie na samej górze; trafienie bez dotknięcia obręczy: CZYSTO +1; rzut w wyskoku (skok z piłką): Z WYSKOKU +1
- **brat**: przy nim klawisz rozmowy (E) i biegnie po piłkę, podnosi ją, obraca się do Ciebie, podskakuje i podaje; lekkie podanie w jego stronę łapie i odrzuca; po wszystkim wraca na swoje miejsce przy linii; komentuje trafienia
- **podania przez sieć**: lekki rzut do kolegi: on łapie (u niego piłka w rękach, u Ciebie znika), a jego podanie łapiesz Ty. Kolega pieszo jest wreszcie widoczny w sieci: kopia Twojej postaci z niebieską czapką, chodzi i biega jak on, ze znacznikiem G1/G2 i piłką w rękach, gdy ją trzyma

## Wersja 87: plandeki na starych autach, auta bez przecinania, F najpierw Twój rower

- zielone „daszki” nad niektórymi autami to była plandeka na starym aucie w naprawie (stoi na klockach, bez koła), zrobiona jako płaska płyta z klapami. Teraz to prawdziwa płachta: każdy jej punkt opuszczony z góry na karoserię, po bokach zwisa, ma fałdy (ciemniejsze w zagnieceniach) i dwa sznurki; kolor: niebieska folia, płótno albo szara
- auto przy domu (na podjeździe albo stare przy ścianie), w które po zbudowaniu wszystkiego wchodzi coś innego (płotek między ogrodami, przybudówka sąsiada, szopa), znika zamiast stać przecięte
- F pieszo: gdy obok leży Twój rower i cudzy, najpierw podnosisz swój; cudzy weźmiesz, stając wyraźnie bliżej niego (wcześniej cudzy był liczony jako bliższy i F brało go zamiast Twojego)

## Wersja 88: pikselowy warsztat i garaż, zakup działa za pierwszym kliknięciem

- własne pikselowe litery gry (src/pixfont.js): narysowane piksel po pikselu, z polskimi znakami, zamieniane w pamięci na prawdziwą czcionkę, więc tekst dalej jest tekstem
- pikselowe ramki okien i przycisków (src/pixui.js): ścięte rogi, jasna krawędź u góry, cień u dołu, wciśnięcie przy kliku
- warsztat ułożony od nowa: po lewej rower i paski, po prawej zakładki z ikonkami i lista części na całą wysokość; gazety, drożdżówka i fanty w osobnej zakładce GAZETY
- każda część z ikonką w kolorze poziomu, kropkami poziomu i ceną z monetą (czerwoną, gdy nie stać)
- naprawione: najechanie myszką przebudowywało całą listę, więc przycisk znikał pod kursorem w trakcie kliknięcia (zakup „nie działał”) i lista skakała do góry; teraz najechanie zmienia tylko podgląd roweru i paski
- dymek pana Janusza obok jego głowy, nie na oknie
- garaż (I) w tym samym stylu: litery, ramki, przyciski

## Wersja 89: mapa trasy, odcinki z metą, gazeta z wynikami, zapis postępu

- mapa trasy (M, albo z menu): widok z góry w pikselach, podzielony na regiony (Peryferie, Wieś, Druga strona, Miasto, Leśna droga i dalej); otwarte są na razie Peryferie, reszta pod kratką z napisem WKRÓTCE
- dom jako punkt na mapie: jazda swobodna jak dotąd, bez mety i zegara
- 4 odcinki w Peryferiach: Pierwszy poranek (pół okrążenia), potem rozwidlenie: Okrążenie od tyłu (w drugą stronę, spokojniej) albo Główną ulicą (więcej aut), dalej Godzina szczytu; każdy z tymi samymi prenumeratorami za każdym razem, auta i psy losowo
- start z domu, punkty kontrolne co ćwierć okrążenia, brama META nad drogą, pasek u góry: czas, metry do mety, gazety; jazda w złą stronę: ZAWRÓĆ
- na mecie gazeta „Wieści z trasy”: nagłówek z Twojej jazdy, 3 gwiazdki (czas, gazety i celność, bez wywrotki), dziś i najlepsze wyniki z rekordami, co się otworzyło na mapie
- przy każdym punkcie na mapie: gwiazdki, cele, najlepsze wyniki i liczba przejazdów
- zapis postępu w przeglądarce po każdym odcinku (i przyciskiem ZAPISZ): kasa, rower, części, lakiery, wyniki
- warsztat dostępny z mapy, żeby zrobić zakupy między odcinkami
- plan dalszych etapów: docs/progresja.md

## Wersja 90: gazeta między odcinkami

- po mecie zamiast okienka jest gazeta „Wieści zza płotu”: stos pikselowych kartek, herb miasteczka, data, numer wydania, przewracanie stron (strzałki, Enter, przyciski)
- strona 1 PORANEK: artykuł o Twoim poranku (nagłówek i tekst z tego, co zrobiłeś), zdjęcie z mety zrobione w grze, dwa newsy o zdarzeniach z trasy (wywrotka, auto, babcia, policja, szyby, pies, seria) ze zdjęciem z chwili zdarzenia, a gdy nic się nie stało: lokalne newsy ze zdjęciem z miejsca (posterunek, warsztat, kapliczka, buda z psem, budowa...); zapowiedź jutra z odcinków, które się otwierają; ramka „Twoja trasa” z liczbami i mapką
- strona 2 TWOJA TRASA: duża mapka trasy z każdym domem (doręczone, prenumerator bez gazety, bez prenumeraty), szybami i wywrotkami; gwiazdki i ich cele; dziś obok najlepszych, rekordy
- strona 3 OGŁOSZENIA: drobne ogłoszenia (części od Janusza z cenami i zabawne z miasteczka), dokąd dalej (od razu na kolejny odcinek), warsztat, mapa, tabela wyników wszystkich odcinków

## Wersja 91: wywiady i portrety w gazecie, przyciski jak pikselowe klawisze

- „Rozmowa dnia”: wywiad z kimś z okolicy (Janusz, brat, mama, tata, sąsiadka, sąsiad, działkowiec, pani spod kapliczki, kierownik budowy, właściciel psa); kto, zależy od poranka (po pościgu psa jego właściciel, po szybie sąsiadka, po wywrotkach mama, po czystej jeździe brat), odpowiedzi biorą liczby z Twojej jazdy
- anegdoty z miasteczka na stronie ogłoszeń
- portrety postaci zrobione w grze (kamera przed twarzą) albo z obrazka (Janusz), wydrukowane „po gazetowemu”: dwa kolory farby i kropkowany raster
- „W skrócie”: inne zdarzenia z trasy i lokalne krótkie wiadomości
- gazeta w wąskim oknie: dwa łamy zamiast jednej długiej kolumny
- nowe przyciski w całej grze (gazeta, mapa, warsztat, garaż): pikselowe klawisze z grubością, które wciskają się przy kliknięciu, z ikonką i podpowiedzią klawisza; najważniejszy złoty z drgającą strzałką
