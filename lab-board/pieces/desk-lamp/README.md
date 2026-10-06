# Desk Lamp

**W budowie:** za hasłem (`shared/lab-lock.js`), na planszy z kłódką (`locked:true`). Pomysł Jarka do przetestowania (06.10.2026).

Lampka biurkowa w ciemności (#0e0e10). Tylko dwa kolory: lampka jest jedną szarą sylwetką (#5c5c63), a światło jest białe. Bez poświaty, bez rozmycia, bez cieniowania. Płaski rysunek łączy się z głębią (Jarek: „połączenie flatu z głębią”): bryła jest w 3D, ale widok jest ortograficzny, lekko z góry. Przy obrocie ramiona się skracają, a jasny otwór klosza widać od frontu i chowa się od tyłu.

**Kształt:**
- podstawa w kształcie niskiego bębna z kołnierzem;
- dwa sztywne, proste ramiona z przegubami (jak klasyczna lampka kreślarska): dolne odchylone do tyłu, górne idzie w przód i do góry;
- klosz-dzwonek: zaokrąglony tył rozszerza się do szerokiego otworu.

**Światło:** stożek, domyślnie 45°, wychodzi z otworu klosza. Każdy jego brzegowy promień kończy się tam, gdzie trafia w blat, więc na biurku leży biała plama, a snop łączy ją z kloszem. Lampka skierowana w górę świeci za krawędzie ekranu.

**Ruch:**
- przeciąganie podstawy albo ramienia przesuwa całą lampkę;
- przeciąganie klosza w bok obraca lampkę wokół podstawy jak na talerzu obrotowym, bez ograniczeń (360° i dalej);
- przeciąganie klosza w górę lub w dół pochyla klosz: od sufitu po świecenie pod siebie.

**Panel:**
- stożek (15–120°);
- rozmiar;
- widok z góry (0–45°, domyślnie 16°).

Ustawienia zapisują się w `lab.desk-lamp.v1`.

**Jak:** jeden canvas 2D. Sylwetki części to otoczki wypukłe (hull) rzutów okręgów 3D:
- podstawa: dwa okręgi;
- klosz: suma krótkich ściętych stożków między sąsiednimi pierścieniami, więc jego obrys jest gładki z każdej strony;
- snop: otoczka okręgu otworu i końców promieni.

Na planszy `?thumb=1` lampka stoi nieruchomo, a `?demo=1` powoli obraca się dookoła. `window.LAMP` służy do testów (`L.yaw`, `L.pitch`, `draw`, `size`).
