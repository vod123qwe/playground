# AI Blob

Żywa kula asystenta AI jako **jeden web component** (`ai-blob.js`, bez zależności, WebGL2, przezroczyste tło). Ta strona to jego plac zabaw: pasek kul na dole, pasek stanów nad nim, panel Customize (kolory, motyw strony, rozmiary, mikrofon i gotowy tag do skopiowania).

## Użycie w innym projekcie

```html
<script src="ai-blob.js"></script>
<ai-blob variant="glass" state="default" theme="light" palette="aurora" style="width:200px;height:200px"></ai-blob>
```

```js
const orb = document.querySelector('ai-blob');
orb.state = 'listening';      // gdy użytkownik mówi
orb.state = 'thinking';       // gdy model pracuje
orb.state = 'speaking';       // gdy asystent odpowiada
orb.level = 0.6;              // własna głośność 0–1 (np. z TTS); bez niej ruch daje wbudowany „głos”
orb.useAnalyser(analyser);    // albo dowolny AnalyserNode z Web Audio (np. odtwarzanie mowy)
await orb.useMicrophone();    // albo mikrofon (pyta o zgodę)
orb.addEventListener('statechange', e => console.log(e.detail));   // { state, previous, auto }
```

**Atrybuty / właściwości:** `variant` glass | cloud | nebula | swarm | rings; `state` default | listening | speaking | thinking | connecting | error | muted; `theme` light | dark (jak mieszać się ze stroną); `palette` aurora | ocean | sunset | mint | mono; `colors` cztery kolory zamiast palety; `speed` (1 = normalnie); `level` 0–1; `label` (dla czytnika ekranu, domyślnie „AI assistant”).

**Stany:** każda zmiana to płynne przejście (wszystkie parametry dążą do celu, nie przeskakują). `connecting` (kula zbiera się z niczego, z odbiciem) i `error` (czerwienieje, drgnie) grają raz i same wracają: connecting do default, error do stanu sprzed błędu (zdarzenie `statechange` z `auto: true`). Listening dostaje fale wchodzące do środka, speaking pulsuje z głosem, thinking wiruje w środku, muted szarzeje i prawie zamiera.

**Rozmiar:** dowolny kwadrat od 24 do 600 px. Poniżej ok. 200 px rysuje prostszą wersję (mniej kroków promienia, mniej oktaw szumu, mniej i większe punkty, grubsze linie), żeby ikona 40 px była czytelna i lekka. Zatrzymuje się, gdy jest poza ekranem albo karta jest w tle; przy „ograniczonym ruchu” w systemie zwalnia do 35% i nie drga przy błędzie. Każda kula to osobny kontekst WebGL (przeglądarki pozwalają na kilkanaście naraz).

## Kule (shadery)

- **Glass:** ciekła kula liczona promieniami (ray marching po polu odległości z szumem simplex). W środku światło załamane przez skórę, każdy kanał RGB załamany trochę inaczej (rozszczepienie: tęczowe brzegi), kolor z palety i cienkie, płynące „żyłki” światła (grzbiety szumu), mocniejsze przy mówieniu. Na skórze światło główne, miękkie od dołu i cienka warstwa opalizacji przy krawędzi; na jasnej stronie lekko ciemniejszy brzeg, żeby trzymała kształt na bieli.
- **Cloud:** miękkie plamy koloru krążące w sobie, kolor w środku jak jedwab (szum fbm zawinięty sam w siebie dwa razy), żywa krawędź.
- **Nebula:** kula kolorowego dymu, promień przechodzi przez objętość i zbiera gęstość (fbm 3D); przy myśleniu się kłębi, przy głosie puchnie.
- **Swarm:** 2600 punktów na sferze Fibonacciego (mniej i większe przy małych rozmiarach), oddychają szumem, przy myśleniu się rozluźniają, na ciemnym świecą addytywnie.
- **Rings:** cztery cienkie pętle wokół środka, falują z głosem, przy myśleniu obracają się w przestrzeni jak orbity.

Wspólne dla wszystkich: paleta jako pętla czterech kolorów, „muted” zmniejsza nasycenie, „error” miesza w czerwień, poświata gaśnie okrągło przed krawędzią płótna.

## Kolory

Gotowe palety albo **jeden kolor bazowy w HCT** (panel: Hue, Chroma, Tone; biblioteka Material Color Utilities z jsDelivr). Z niego cztery kolory: baza, dwaj sąsiedzi w odcieniu (+42°, −46°, ton +12 / −8) i jasny akcent po drugiej stronie koła (+150°, chroma ×0,55, ton +26). Panel pokazuje gotowy tag z `colors="…"`.

## Lab

Ustawienia: `lab.ai-blob.v1`. Klawiatura: 1–7 stany, ← → kule. Plansza: `?thumb=1` (szkło, speaking), `?demo=1` (kula przechodzi przez stany: connecting, listening, thinking, speaking, default). Do testów: `window.BLOB`.
