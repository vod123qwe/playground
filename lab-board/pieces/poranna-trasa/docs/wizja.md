# Poranna Trasa: wizja i plan (z burzy mózgów z Jarkiem, 30.09.2026)

To jest źródło prawdy o kierunku gry. `plan-dalej.md` zbiera pomysły szczegółowe; gdy się różnią, wygrywa ten plik.

## W jednym zdaniu

Roguelite na rowerze: rozwozisz gazety jak najdalej, trudność i dziwność świata rosną z każdym kilometrem, po drodze zatrzymujesz się, żeby dokupić gazety i ulepszyć rower, trafiasz na historie z kilkoma zakończeniami, a gdy cię w końcu skroją, losujesz, co zabierasz do następnego runu.

## Decyzje

| Temat | Decyzja |
|---|---|
| Sesja | Jeden **run**: jedziesz, ile dasz radę. Krótko (5 min) albo długo (20 min i więcej), zależnie od tego, jak dobrze ci idzie. Bez zapisów w trakcie. |
| Rdzeń | Dostawa gazet jest rdzeniem i daje kasę. Bójki, napady, eventy to przyprawa: przeszkadzają albo kuszą. |
| Postęp w runie | Trudność rośnie z dystansem, dzielnice są otwarte (bez bramek). Im dalej, tym więcej przeszkód i ciekawszych miejsc. |
| Koniec runu | **HP do zera** (pobity, potrącony, wywrotki) albo **policja za trzecim razem**. Zawsze jest jakaś droga wyjścia z opresji: czasem łatwa, czasem trudna. |
| Ratunek | **Przedmioty z ekwipunku** (apteczka, drożdżówka na przekupstwo, gaz, kask) i **znajomy w multiplayerze** (pomoc w bójce, podrzucenie gazet, wykupienie). |
| Sklep | **Na trasie**, co jakiś dystans: zatrzymujesz się i wydajesz, co zarobiłeś. Nie między runami. |
| Ekran ulepszeń | Rower na osobnym ekranie, klikasz podzespoły (koła, rama, przerzutki, siodełko, kierownica, dzwonek, lampka, bagażnik), wymieniasz je i widać zmianę **w wyglądzie i w jeździe**. Tak samo torba i ekwipunek. |
| Gazety | Różne tytuły dla różnych domów (brukowiec, dziennik, lokalna, gruba niedzielna). Wymagania rosną z dystansem, ale nie mogą zabić zabawy. |
| Magazyn | Doładowanie gazet po drodze (torba nie pomieści wszystkiego), okazja do scenki z magazynierem. |
| Historie | **Pula losowych scenek** + kilka **wątków odkrywanych przez kolejne runy** (np. nawiedzony dom za każdym razem pokazuje więcej, w końcu finał). Scenki z wyborami i kilkoma zakończeniami. |
| Reputacja | Renoma u fikcyjnych ekip decyduje, kto cię zaczepia albo pomaga: gang gazeciarzy, chłopaki z baraków, osiedlowa ekipa spod bloku, babki z parafii, szwagrowie z działek. **Żadnych ekip opartych na grupach etnicznych ani realnych osobach.** |
| Humor | **Ostrzej**: czarny, januszowy, memiczny; więcej krwi, wulgaryzmy wypikane. Żart celuje w sytuacje, nie w grupy ludzi. W ustawieniach przełączniki „krew” i „wulgaryzmy” (do złagodzenia publicznie). |
| Odbiorca | Publicznie, także na telefonie: sterowanie dotykiem i wydajność muszą to udźwignąć. |
| Dźwięk | Najpierw testy w Warsztacie (grupa „Dźwięki”): synteza w przeglądarce kontra próbki CC0 (każde pobranie za zgodą). Wybieramy po odsłuchu. |

## Między runami: co przechodzi dalej

1. **Loteria na koniec runu.** Na środku ekranu kręci się los i wybiera jedną rzecz, którą zatrzymujesz na koncie. Może to być:
   - coś, co kupiłeś w tym runie (losowo z twoich zakupów);
   - jednorazowa **karta startowa** na kolejny run: więcej gazet, więcej kasy, start dalej, apteczka.
   Pula i szanse muszą być zbalansowane: im dalej zajechałeś, tym lepsza pula, ale nigdy „wygrany run z automatu”.
2. **Odblokowane części:** co raz kupiłeś albo znalazłeś, od teraz może pojawiać się w sklepach (nie masz tego od startu, masz dostęp).
3. **Napiwki i stałe bonusy:** osobna waluta z dobrych dostaw i eventów, wydawana między runami w garażu u wujka na małe stałe plusy.
4. **Kolekcja i wiedza:** album odkrytych scenek i zakończeń; znane miejsca dają nowe opcje przy kolejnym spotkaniu.
5. **Start z dalszego miejsca:** dzielnicę, do której raz dotarłeś, można wybrać na start (za mniejszą nagrodę).

## Kolejność prac

1. **Sklep na trasie z ekranem roweru** (wybór Jarka na start):
   - postój co jakiś dystans (budka albo warsztat rowerowy przy drodze), wjazd zatrzymuje grę;
   - ekran: rower na obrotowej scenie, klikalne podzespoły, lista części z ceną i efektem, podgląd różnicy (wygląd od razu na modelu, liczby: prędkość, przyspieszenie, skręt, stabilność, pojemność torby);
   - pierwsze części: 3 poziomy kół, siodełka, kierownicy, przerzutek; dzwonek i lampka (kosmetyka z małym efektem); torba (pojemność); ekwipunek (apteczka, drożdżówka);
   - części zmieniają `rider.js` (wygląd) i parametry jazdy w `main.js`.
2. **Szkielet runu:** licznik dystansu (już jest w liczniku rowerowym), trudność rosnąca z metrami (więcej aut, psów, wymagań), koniec runu (HP, policja 3×), ekran podsumowania z rekordem, loteria.
3. **Prenumeratorzy i tytuły:** widoczne zamówienie przy domu, różne gazety w torbie, magazyn.
4. **Dźwięki w Warsztacie** i wybór podejścia; potem dźwięk w grze.
5. **Historie i miejsca specjalne:** system scenek z wyborami; policja na parkingu (wiąże się z końcem runu), nawiedzony dom (wątek przez runy), kościół, szkoła, magazyn (`plan-dalej.md`, sekcja 3b).
6. **Reputacja ekip**, rywale (gazeciarz z torbą, gang z paskiem równowagi).
7. **Świat dłuższy:** dzielnice o różnym klimacie doładowywane kawałkami (osiedle, wieś, centrum, skrzyżowania), bo 20 minut na jednej pętli się znudzi.
8. **Telefon:** dotyk dla chodzenia i bójek, wydajność, przełączniki krwi i wulgaryzmów.
9. **Multiplayer** (`multiplayer.md`), z ratowaniem znajomego.

## Otwarte pytania (na później)

- Co dokładnie znaczy „trudność rośnie”: szybsze auta, więcej psów, ostrzejsi rywale, wyższe wymagania dostaw? Jaka krzywa na kilometr?
- Ile kosztuje czas postoju w sklepie (czy świat w tym czasie stoi)?
- Jak dokładnie liczyć loterię (pula, szanse, zależność od dystansu)?
- Waluty: kasa w runie i napiwki między runami. Czy to nie za dużo naraz?

## Tryb „czysta jazda” (na przyszłość, decyzja Jarka 2026-10-01)

Osobny tryb bez historii: sama jazda i rzucanie gazet, im dalej dojedziesz, tym lepiej, wynik zapisywany (rekordy). Długa droga, zmieniające się otoczenie i sytuacje: czasem węższe drogi, przejazdy ścieżką, skocznie nad przeszkodami, opony toczące się w poprzek drogi itp.
