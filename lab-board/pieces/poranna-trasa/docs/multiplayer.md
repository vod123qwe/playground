# Multiplayer: plan

Stan: **plan, nic jeszcze nie zbudowane**. Cel: obok mnie jedzie druga osoba (znajomy), dołącza kodem zaproszenia, widzimy się nawzajem, rozwozimy gazety na tej samej trasie, możemy się pobić.

## Decyzja do podjęcia

Jak gracze się znajdują i łączą. Trzy drogi, od najprostszej:

| Droga | Jak działa | Plusy | Minusy |
|---|---|---|---|
| **A. Własny mały serwer pokojów (rekomendacja)** | Mały serwer Node (WebSocket). Gospodarz klika „Graj z kimś”, dostaje kod `KRW-4821`, drugi gracz go wpisuje. Serwer tylko przekazuje wiadomości w pokoju. | Pełna kontrola, żadnych kont, żadnych cudzych serwisów. Działa zawsze (nie zależy od sieci domowych). Prosty do napisania (~150 linii). | Trzeba go gdzieś trzymać (np. darmowy Render, jak Książka Kucharska). Każdy ruch idzie przez serwer (opóźnienie ~30–80 ms, dla tej gry OK). |
| B. WebRTC peer-to-peer + ten sam serwer tylko do „przedstawienia się” | Serwer z A przekazuje tylko ofertę połączenia, potem gracze gadają bezpośrednio (DataChannel). | Mniejsze opóźnienie, serwer prawie nic nie robi. | Część sieci (NAT, sieci firmowe, komórkowe) nie przepuści połączenia bez serwera TURN, a to płatna usługa albo własny serwer. Więcej kodu, więcej rzeczy, które mogą się zepsuć. |
| C. Gotowy serwis (np. PeerJS Cloud, Firebase) | Cudzy serwer do łączenia. | Najmniej kodu. | Zewnętrzna usługa: konto, klucz, zależność, dane przez cudzą infrastrukturę. Do zgody. |

**Rekomendacja: A teraz, B jako ulepszenie później.** A jest najmniej kruche; protokół (niżej) będzie ten sam, więc przejście na B to wymiana „rury”, nie gry.

## Co jest już przygotowane w kodzie

- **Walka jest „na wejściach”** (`src/onfoot.js`): każdy uczestnik bójki to *fighter* z tymi samymi zasadami, sterowany obiektem wejścia `{ fwd, side, atk, guard, low, dodge, taunt }`. Dziś wejście daje klawiatura albo komputer (`ai()`); w multiplayerze da je sieć. Nic w zasadach walki nie trzeba zmieniać.
- **Świat jest deterministyczny z ziarna**: trasa, domy, skocznie, przeszkody i przechodnie powstają z `seed` (ta sama liczba = ten sam świat u obu graczy). Przesyłać trzeba tylko to, co żyje.

## Kto o czym decyduje (autorytet)

- **Swój rower i swoja postać: każdy gracz u siebie.** Wysyła swoją pozycję, prędkość, pochylenie, stan (jedzie, leży, pieszo, bójka) 15 razy na sekundę. U drugiego gracza obcy rowerzysta jest „duchem”: interpolowany między paczkami (100 ms do tyłu), bez fizyki.
- **Gospodarz (ten, kto dał kod) decyduje o świecie**: auta, rowerzyści z naprzeciwka, psy, babcia, szyby, skrzynki, punkty za dostarczone gazety. Wysyła ich stan 10 razy na sekundę; gość tylko je rysuje.
- **Rzut gazetą**: rzucający wysyła „rzuciłem z X, siła Y”; lot liczy każdy u siebie (ta sama fizyka), trafienie i punkty zatwierdza gospodarz.
- **Bójka gracz kontra gracz**: każdy wysyła swoje wejście (klawisze), a trafienia liczy gospodarz tymi samymi regułami co dziś. Gość widzi wynik z ~50 ms opóźnieniem; dla ciosów z zamachem to niewidoczne.

## Protokół (wiadomości JSON, krótkie klucze)

```text
join   { code, name }                       → pokój: kto jest
me     { t, x, z, y, yaw, v, lean, mode }   15/s, każdy o sobie
world  { t, cars[], bikes[], dogs[], granny } 10/s, gospodarz
ev     { k: 'paper'|'window'|'kick'|'score'|'fight', ... }   zdarzenia, raz
input  { t, fwd, side, atk, guard, low, dodge }   w bójce, 30/s
bye    {}
```

## Kod zaproszenia

- 3 litery + 4 cyfry (`KRW-4821`), ważny 30 minut albo do startu gry, jeden pokój = 2 graczy (później do 4).
- Bez kont i bez danych osobowych: gracz podaje tylko ksywkę (widoczną nad głową drugiego).
- W menu Esc: **GRAJ Z KIMŚ** → „Załóż grę (dostaniesz kod)” / „Dołącz (wpisz kod)”.

## Kroki (każdy działa sam, można przerwać po każdym)

1. **Duch na jednym komputerze**: dwie karty przeglądarki, BroadcastChannel zamiast sieci. Sprawdza protokół `me` i rysowanie drugiego rowerzysty (bez serwera).
2. **Serwer pokojów** (`server/rooms.js`, Node + `ws`) i menu z kodem. Dwie osoby jadą obok siebie, bez wspólnego świata.
3. **Wspólny świat**: gospodarz wysyła `world`, gość przestaje symulować auta i psy.
4. **Gazety i punkty**: zdarzenia `ev`, wspólny wynik, ranking poranka.
5. **Bójka gracz kontra gracz**: kopnięcie drugiego gracza = wyzwanie, wejścia przez sieć.
6. (opcja) **WebRTC** zamiast przekazywania przez serwer.

## Ryzyka i otwarte sprawy

- **Hosting**: gra musi być dostępna pod publicznym adresem (np. GitHub Pages) i serwer pokojów też (Render: darmowy plan usypia się po bezczynności, pierwsze połączenie czeka ~30 s). Do decyzji: czy gra ma być publiczna.
- **Oszukiwanie**: przy grze ze znajomymi pomijamy; gospodarz i tak zatwierdza punkty.
- **Wydajność**: druga postać to ~1 draw call więcej; bez znaczenia.
- **Telefon**: sterowanie dotykowe już jest, sieć komórkowa zwykle działa z drogą A (z B nie zawsze).
