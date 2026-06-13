# playground

Publiczna piaskownica na szybkie eksperymenty i zabawki. Każdy pomysł ląduje w osobnym podfolderze, bez ciśnienia i bez sprzątania.

## Jak dodać nowy eksperyment

```bash
# w katalogu playground
mkdir moj-pomysl
# wrzuć co chcesz: HTML, mały skrypt, cokolwiek
git add .
git commit -m "moj-pomysl: start"
git push
```

## Co tu jest

- `index.html` — strona główna (hub) linkująca do żywych wersji wszystkich projektów
- `lithos/` — pełnoekranowy hero marki geologicznej z reflektorem podążającym za kursorem (React 18 + TypeScript + Vite + Tailwind). Lokalnie: `cd lithos && npm install && npm run dev`
- `hello/` — przykładowy mini projekt na rozgrzewkę (otwórz `hello/index.html`)

## Live (GitHub Pages)

Po każdym pushu workflow `.github/workflows/deploy.yml` buduje projekty i publikuje całość na GitHub Pages:

- Hub: https://vod123qwe.github.io/playground/
- Lithos: https://vod123qwe.github.io/playground/lithos/
- hello: https://vod123qwe.github.io/playground/hello/

Projekty statyczne (jak `hello/`) kopiowane są 1:1, a te z buildem (jak `lithos/`) są budowane do statycznych plików. Nowy projekt z buildem? Dorzuć krok budowania w workflow i kartę w `index.html`.

## Zasada

Jeden podfolder = jeden eksperyment. To miejsce do zabawy, nie do porządków.
