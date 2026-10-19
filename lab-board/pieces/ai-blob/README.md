# AI Blob

Żywa kula asystenta AI jako **jeden web component** (`ai-blob.js`, bez zależności, WebGL2, przezroczyste tło). Ta strona to jego plac zabaw: pasek kul na dole, pasek stanów nad nim (1–7), Light/Dark u góry, panel Customize (presety, kolory, blend, głębia, strojenie, dotyk i dźwięk, rozmiary, gotowy tag).

## Użycie w innym projekcie

```html
<script src="ai-blob.js"></script>
<ai-blob variant="halo" state="default" palette="aurora" style="width:240px;height:240px"></ai-blob>
```

```js
const orb = document.querySelector('ai-blob');
orb.state = 'listening';      // gdy użytkownik mówi
orb.state = 'thinking';       // gdy model pracuje
orb.state = 'speaking';       // gdy asystent odpowiada
orb.level = 0.6;              // własna głośność 0–1 (np. z TTS); bez niej ruch daje wbudowany „głos”
orb.useAnalyser(analyser);    // albo dowolny AnalyserNode z Web Audio (np. odtwarzanie mowy)
await orb.useMicrophone();    // albo mikrofon (pyta o zgodę)
orb.tap(90, 1);               // ściśnięcie i rozbłysk (kąt w stopniach, siła)
orb.replayIntro();            // jeszcze raz wejście na sprężynie
orb.refresh();                // od razu zbadaj tło (np. po przełączeniu strony na ciemną)
orb.addEventListener('statechange', e => console.log(e.detail));   // { state, previous, auto }
orb.addEventListener('tap', e => console.log(e.detail));           // { angle, strength }
```

**Atrybuty:**
- `variant` glass | halo | core | aurora | synapse | mercury | cloud | nebula | dots | swirl | swarm | rings
- `state` default | listening | speaking | thinking | connecting | error | muted
- `blend` auto | ink | glow: ink = czysty kolor na jasnych stronach (bez świecenia, które na bieli się pierze), glow = świecenie na ciemnych; auto czyta tło za kulą (co 1,2 s i po `refresh()`); `theme="light|dark"` dalej działa i wygrywa z auto
- `palette` aurora | ocean | sunset | mint | mono albo `colors` (4 kolory)
- `ground` kula stoi nad podłogą w perspektywie (poniżej 72 px sama ją pomija: ikona tylko się unosi), `lift` mnoży wysokość
- strojenie: `sweep` (przelot światła przez szkło), `glow`, `halo`, `rim`, `core`, `glints` (0–2/2,5), `detail` (skala szumu 0,3–3), `wobble` (0–1, falowanie obrysu), `color-speed`, `speed`, `resolution` (0,4–1,5 × gęstość pikseli)
- `interactive="false"` wyłącza stuknięcie, `intro="false"` wejście; `level` 0–1; `label` dla czytnika ekranu

## Głębia („wstawanie”)

Ciało kuli ma sprężyny: wysokość nad podłogą (każdy stan swoją: Muted 0, czyli siedzi, Default 0,15, Speaking 0,19, Thinking 0,21, Listening 0,25 – wstaje najwyżej), lekkie bujanie i podbicie od głosu; przy lądowaniu spłaszcza się (impuls z prędkości), przy wznoszeniu wydłuża; Muted siedzi lekko spłaszczony. Connecting zaczyna od kałuży na podłodze i wstaje. Cień (osobny przebieg): elipsa w perspektywie, przy kuli wysoko szersza, miękka i jaśniejsza, nisko ciaśniejsza z ciemnym kontaktem; na ciemnych stronach to kolorowa plama światła. Wszystko przez jedną macierz „ciała” (uniesienie, spłaszczenie, ściśnięcie od stuknięcia, wejście), wspólną dla wszystkich ośmiu shaderów (dla płaskich odwrotna w vertex shaderze, dla roju wprost na punktach).

## Kule (shadery)

**Naczynia (szklana kula ze światem w środku):** skorupa to dokładna sfera; promień załamuje się na wejściu (n ≈ 1,43) i dopiero potem leci przez wnętrze, więc szkło naprawdę soczewkuje to, co w środku. Na skorupie: odbicie studia (jasno u góry, ciemno u dołu, dwa softboxy, lekko w kolorze palety), błysk, cienka warstwa opalizacji, tęczowa obwódka przy krawędzi; na jasnej stronie odbicie przygaszone, a wnętrze kładzione jako kolor, nie światło. Kroki wnętrza: 44 / 26 / 14 zależnie od rozmiaru, start promienia z drżeniem (zamiast pasków: drobne ziarno).
- **Core:** sześć kropli światła (metaballe ze smooth-min), krążą, zlewają się i rozdzielają, poświata wokół nich; mowa = puchną, myślenie = ciaśniej i szybciej.
- **Aurora:** dwie pofałdowane kurtyny zorzy: ostra jasna dolna krawędź, promienie gasnące ku górze, kolor od wysokości (najładniej z paletą Mint).
- **Synapse:** nitki tam, gdzie dwa pola szumu jednocześnie przechodzą przez zero, iskry biegnące wzdłuż nich (burza przy myśleniu i mowie).
- **Mercury:** opalizujący płynny metal (SDF z szumem), odbija studio, warstwa koloru zależna od kąta; mowa = fale.


- **Halo:** przezroczyste szkło: płynący kolorowy brzeg (pasmo + cienka jasna linia, połysk szumu wzdłuż brzegu), rdzeń światła wędrujący i puchnący z głosem, dwa błyski, aura. Ink: matowe białe szkło oświetlone z lewej góry, kolor położony na nim.
- **Glass:** ciekła kula liczona promieniami; w środku rozszczepienie (R, G, B załamane inaczej) i płynące żyłki światła. Do tego co 5,2 s (przy myśleniu częściej) przez szkło przechodzi pasmo światła, mały AirDrop w środku kuli: od lewej góry do prawej dołu w 1,25 s, wnętrze lekko się pod nim wygina (każdy kolor trochę inaczej), skóra dostaje jasną, lekko tęczową smugę. Najmocniej w Default, słabiej przy słuchaniu i mówieniu, wcale w Muted, Error i Connecting; stuknięcie puszcza je od razu. Atrybut `sweep` (0–2), w panelu „Light sweep (glass)”.
- **Cloud:** miękkie plamy z kolorem jak jedwab (fbm zawinięty dwa razy).
- **Nebula:** objętość kolorowego dymu (ray marching przez kulę, fbm 3D).
- **Dots:** raster: siatka kropek, wielkość = światło na obracającej się kuli z pasmami szumu; głos wysyła pierścienie większych kropek, słuchanie je wciąga, myślenie zamiata wokół; kolor płynie za szumem.
- **Swirl:** spokojna kula w jednym kolorze (z koloru bazowego), dwa tony zawinięte wokół środka, miękkie przejście z delikatnym zagięciem; myślenie mocniej skręca.
- **Swarm:** 2600 punktów na sferze (mniej i większe na małych).
- **Rings:** cienkie pętle; `rim` = grubość linii, `core` = środek.

## Presety (panel)

**Baza labu (Glass, ustawienia Jarka z 20.10):** Light sweep 1,15, Glow 1,35, Halo 2,10, Rim 2,05, Core 1,55, Glints 1,70, Detail 1,05, Wobble 0,76, Colour speed 1,70. Od niej lab startuje i do niej wraca Reset; preset **Glass** ustawia ją z powrotem. Pozostałe presety startują od wartości neutralnych komponentu (wszystko 1, Wobble 0), a tag do skopiowania porównuje z tymi neutralnymi, więc zawsze niesie całe strojenie.


Iridescent (halo, aurora), Pearl (halo, mono), Liquid (glass, ocean), Lava lamp (core), Northern (aurora, mint), Neural (synapse, ocean), Chrome (mercury, mono), Opal (mercury, aurora), Silk (cloud, sunset), Smoke (nebula), Print (dots), Calm (swirl, ocean), Orbit (rings, mint), Stardust (swarm, sunset). Preset ustawia kulę, paletę i kilka suwaków, reszta wraca do domyślnych.

## Kolory

Gotowe palety albo jeden kolor bazowy w HCT (Material Color Utilities z jsDelivr): baza, dwaj sąsiedzi w odcieniu (+42°, −46°), jasny akcent naprzeciw (+150°).

## Lab

Ustawienia: `lab.ai-blob.v1`. Klawisze: 1–7 stany, ← → kule, Spacja stuknięcie. Plansza: `?thumb=1` (opcjonalnie `&theme=dark&state=…&variant=…&ground`), `?demo=1` (Halo przez stany; z `&ground` nad podłogą). Podłoga jest domyślnie wyłączona wszędzie (w panelu „Stand on a ground”). Do testów: `window.BLOB`. Inspiracja kierunkiem: React Bits Pro (AI Blob, Agentic Ball, Glyph Orb); kod własny.
