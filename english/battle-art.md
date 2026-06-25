# ⚔️ Battle art & mechanika walki

Warstwa wizualna do scen (domyślnie przy 👹 bossach, opcjonalnie w zwykłych scenach).
Renderowana w czacie. Potwory = Twoje powtarzające się błędy. Bossowie = sceny
wysokiej stawki. To wciąż deliberate practice — tylko że wygląda jak walka.

## 🩸 Paski życia (16 znaków)

```
BOSS  💀 [████████████░░░░] 75/100
YOU   ❤️  [████████████████] 100/100  (Composure)
```
Legenda: `█` = pełne, `░` = utracone. 1 segment ≈ 6 HP.

## ⚙️ Zasady walki

- **HP bossa:** 100. **Composure (Twoje):** 100.
- **Atak = Twoja wypowiedź.** Obrażenia dla bossa zależą od jakości:
  - 🟢 płynnie, bez błędu w celu, użyte target chunki → **CRIT, -35/-40**
  - 🟡 komunikatywnie, ale z błędem w celu → **-10/-15** (boss kontruje)
  - 🔴 zacięcie/poddanie się → 0 obrażeń
- **Composure spada tylko za:** zamarznięcie/poddanie się (-15) lub powtórzenie
  **pokonanego** błędu (-10). Zwykłe błędy NIE ranią — uczysz się, nie karzemy.
- 🆘 **Frazy ratunkowe** ("Bear with me…", "Let me rephrase") **blokują** obrażenia
  Composure — to nagroda za użycie strategii zamiast zamarznięcia.
- **Wygrana:** HP bossa = 0 → scena zaliczona, loot, XP, odblokowany kolejny etap.
- Po walce: zaktualizuj `progress.md` (XP, drzewko, bestiariusz) + `error-log.md`.

## 👹 Bossowie

### Akt I — "The Gatekeeper" (scena: Walk me through what you do)
```
          .-"""""-.
        .'  _   _  '.
       /   (o) (o)   \
      |       <       |
      |     \___/     |     "So... what exactly
       \    \___/    /         do you do?"
     .__'.         .'__.
    /    `'-.....-'`    \
   |    THE GATEKEEPER   |
    \__/           \__/
```

### Akt II — "The Skeptic" (scena: obrona decyzji) 🔒
```
        /\___/\
       (  o o  )
       (  =^=  )      "Why should I
        )     (         believe that?"
       (       )
      ( (  )  ) )
     (__(__)__(__)
       THE SKEPTIC
```

### Akt III — "The Interrupter" (scena: szybka dyskusja pod presją) 🔒
```
       _.-^^---....,,--
   _--                  --_
  <          CHAOS         >
   '--._   interrupts   _.-'
        `^^---....,,--'^
     speaks fast • cuts you off
      THE INTERRUPTER
```

## 🐉 Bestiariusz — zwykłe potwory (= Twoje błędy)

### 🧟 Present Perfect Wraith  (`#tense`)
```
      .-""-.
     / .--. \
    | (o)(o) |
    |   <<   |     "I AM designer
     \ '~~' /        for 15 years..."
      '-..-'
     ~~|  |~~   weakness: "I've been..."
```

### 👻 Article Phantom  (`#articles`)
```
    .ooo.
   ( Ø Ø )      "...Ø designer,
    \ -- /         Ø person who..."
     'oo'       weakness: a / the
```

### 🦂 "to + -ing" Imp  (`#collocation`)
```
    /\_/\
   ( >.< )      "looking forward
    >  o <        to MAKE..."
   /__|__\      weakness: ...to MAKING
```

### 🐛 Preposition Slime  (`#prep`)
```
   _____
  (~~~~~)       "work WITH
  (~ o o ~)        projects..."
   ~~~~~~~      weakness: work ON
```

> Gdy w `progress.md` pojawia się nowy typ błędu → dorysuj mu tu potwora (mały,
> charakterny, z „weakness" = poprawną wersją). Tak bestiariusz rośnie z uczniem.
