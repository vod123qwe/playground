# Gazeciarz

Automatowa gra o roznoszeniu gazet na rowerze (pixel art, three.js). Domy po jednej stronie ulicy, przeszkody po drugiej, rower toczy się sam: gaz przyspiesza, hamulec zwalnia, każdy rzut leci w stronę domów. Gra się na czas i na punkty, nic nie wymaga zatrzymania.

Wydzielona z Porannej Trasy (folder `poranna-trasa`, dziś **GTB Gazeciarz**, otwarte miasto 3D). Wspólny kod rozróżnia jeden plik: `src/edition.js` (tu `klasyk`).

## Uruchomienie

```
python serve.py        # http://localhost:8806
```

## Poziomy

1. Ulica Kasztanowa, 2. Wieś, 3. Park, 4. Deptak nad morzem, 5. Zima. Każdy przejazd to dzień tygodnia pracy (abonenci rezygnują po dwóch dniach bez gazety, dzień bez pudła odzyskuje jednego). Medal z gwiazdek, rekord punktów. Szczegóły i historia zmian: `docs/klasyk.md`.

## Sterowanie

Klawiatura: strzałki/WASD jazda, mysz lub przyciski rzutu, Spacja skok (w powietrzu trik), V kopnięcie, R restart poziomu. Telefon i tablet: lewy kciuk skręt i gaz, po prawej RZUT, SKOK/TRIK, KOP, SZYBCIEJ, TYTUŁ.

## Wersje

### Wersja 184: osobna gra

- Klasyk wydzielony z Porannej Trasy do własnego folderu, z własnym zapisem postępu (`gz.save`; za pierwszym razem przejmuje wyniki poziomów Klasyka ze starego zapisu, jeśli gra działa pod tym samym adresem).
- Ekran startowy bez przełącznika wersji: tytuł GAZECIARZ, podtytuł NA CZAS I NA PUNKTY.

### Wersja 185: lżejsza gra

- jedna klatka na Kasztanowej: z 6140 do około 3450 wywołań rysowania i z 3,75 do 2,2 mln trójkątów; do pobrania około 21 MB zamiast 30 MB
- tylko potrzebne modele ludzi; dalecy ludzie i rowery nie są rysowane, cienie rzucają tylko bliscy i duże rzeczy; nieruchome części ulicy i auta scalone po materiale; bez rowerów w ogródkach
