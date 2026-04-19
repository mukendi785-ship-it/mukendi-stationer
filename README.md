# Mfumo wa Mauzo — Duka la Nguo

Mfumo rahisi wa mauzo (Point of Sale) kwa duka la nguo. Unafanya kazi kwenye kivinjari chochote bila seva wala utegemezi. Data huhifadhiwa kwenye `localStorage` ya kivinjari.

## Vipengele

- **Mauzo (POS)** — tafuta bidhaa, ongeza kwenye kikapu, weka punguzo, chagua njia ya malipo, chapisha risiti.
- **Bidhaa** — ongeza, hariri, futa. Fuatilia saizi, rangi, bei, gharama na stoo.
- **Historia ya Mauzo** — angalia mauzo yote, chuja kwa tarehe, ona risiti, au batilisha mauzo (stoo itarudishwa).
- **Ripoti** — mauzo ya leo/wiki/mwezi, faida inayokadiriwa, bidhaa zinazouzwa zaidi, na tahadhari za stoo ndogo.
- **Nakala** — pakua/leta data yote kama faili la JSON.

## Jinsi ya kutumia

Fungua `index.html` kwenye kivinjari chochote cha kisasa.

```
xdg-open index.html    # Linux
open index.html        # macOS
start index.html       # Windows
```

Au tumia seva yoyote ya static files:

```
python3 -m http.server 8000
```

kisha nenda `http://localhost:8000`.

## Vifaa

- HTML, CSS, JavaScript safi — hakuna framework.
- Hifadhi: `localStorage` ya kivinjari.
- Sarafu: KSh (inaweza kubadilishwa kwenye `app.js`, kigezo `CURRENCY`).

## Muundo

```
index.html    # UI
styles.css    # Mtindo
app.js        # Logic yote
```
