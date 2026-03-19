# FullStack Todo – kuvaus ja käyttöönotto

Sovellus koostuu yksinkertaisesta frontendistä (HTML/CSS/JS) ja Node.js/Express‑pohjaisesta backend-API:sta. Käyttäjä näkee tehtävälistan, voi lisätä/muokata/poistaa tehtäviä ja tiedot tallentuvat MongoDB:hen (opetusversion mukaisesti tietokantaosoite on kovakoodattu tiedostoon `todo/index.js`).

## Kokonaisuuden rakenne
- Render-demo (frontend): [https://todo-1-x24h.onrender.com](https://todo-1-x24h.onrender.com)  
- Render-demo (backend API): [https://todo-hvqs.onrender.com](https://todo-hvqs.onrender.com)  
- AWS-demo (Apache + Node): [http://ec2-54-164-76-18.compute-1.amazonaws.com](http://ec2-54-164-76-18.compute-1.amazonaws.com)

- `ui/index.html` – ainoa HTML-sivu syötekentällä, tehtävälistalla ja napilla (Lisää/Tallenna).  
- `ui/code.js` – frontend-logiikka: hakee `/todos`-datan, muodostaa `<li>`-elementit, käsittelee Muokkaa/Tallenna-klikkaukset ja lähettää POST/PUT/DELETE-pyynnöt.  
- `todo/index.js` – Express-palvelin, jossa on CRUD-reitit `/todos`-polulle sekä Mongoose-yhteys MongoDB:hen.  
- `todo/package.json` – riippuvuudet ja skripti `npm start`.  

### API_BASE-vakion asetus
Tiedoston `ui/code.js` ensimmäinen rivi määrittää backend-osoitteen:
```js
const API_BASE = 'http://localhost:3000'
```
- Paikallisessa kehityksessä jätä oletus (`localhost`).  
- Ennen Render/AWS-julkaisua **vaihda** rivin arvoa todelliseen URL:iin (esim. `https://todo-hvqs.onrender.com` tai `http://ec2-54-164-76-18.compute-1.amazonaws.com`). Muuten selain yrittää kutsua omaa localhostiaan eikä palvelinta.  
- Sama tiedosto on ainoa paikka, jossa API-linkki elää; erillistä env‑muuttujaa ei ole.

## Deploy Render-alustalle
Render hakee lähdekoodin GitHubista.

### Backend (Render Web Service)
1. “New +” → “Web Service”, valitse tämä repo.  
2. Root Directory: `todo`.  
3. Build command: `npm install`.  
4. Start command: `npm start`.  
5. Node-versio 18+ riittää; erillisiä env-muuttujia ei tarvita (Mongo-URI on koodissa).  
6. Julkaisun jälkeen saat URL-osoitteen tyyliin `https://todo-XXXX.onrender.com`.

### Frontend (Render Static Site)
1. “New +” → “Static Site”.  
2. Root Directory: `ui`.  
3. Build command jätetään tyhjäksi.  
4. Publish directory: `ui`.  
5. Saat oman frontend-osoitteen. Päivitä `ui/code.js` (rivi 1) ennen puskua niin, että `const API_BASE = 'https://todo-XXXX.onrender.com'`, jotta selain hakee datan Render-backendistä.  

### Päivitys Renderissä
1. `git add/commit/push`.  
2. Renderissä joko odotat automaattista deployta tai painat “Deploy latest commit” (sekä backendille että frontendille).  
3. Testaa: avaa frontend, katso DevTools → Network -välilehdeltä että pyynnöt menevät Render-URL:iin, ja varmista että `https://todo-XXXX.onrender.com/todos` palauttaa JSONin.

## Deploy AWS:ään (EC2 + Apache + Node + pm2)
Esimerkki Amazon Linux / RHEL -ympäristölle. Oletuksena koodi sijaitsee hakemistossa `/var/www/FullStack-todo-sovellus`.

### 1. Peruspaketit
```bash
sudo dnf update -y
sudo dnf install git -y
```

### 2. Frontend Apache-palvelimella
1. Asenna ja käynnistä Apache:
   ```bash
   sudo dnf install httpd -y
   sudo systemctl enable --now httpd
   ```
2. Kopioi `ui`-kansio DocumentRootiin:
   ```bash
   sudo cp -r /var/www/FullStack-todo-sovellus/ui/* /var/www/html/
   ```
3. Avaa portti 80 EC2 Security Groupissa ja testaa `http://<EC2-IP>/`.

### 3. Backend (Node.js + pm2)
1. Asenna Node.js + npm:
   ```bash
   curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
   sudo dnf install -y nodejs
   ```
2. Asenna projektin riippuvuudet:
   ```bash
   cd /var/www/FullStack-todo-sovellus/todo
   npm install
   ```
3. Mongo-osoite on `index.js`-tiedostossa, joten erillisiä env-muuttujia ei tarvita.  
4. Vaihda `ui/code.js`-tiedoston `API_BASE`-arvoon EC2:n julkinen URL tai reverse-proxy-osoite (esim. `const API_BASE = 'http://ec2-54-164-76-18.compute-1.amazonaws.com'`). Jos käytät samaa domainia ja Apache-proxyä, voit osoittaa suoraan HTTPS-osoitteeseen.  
4. pm2 vastaa automaattisesta käynnistyksestä:
  ```bash
  sudo npm install -g pm2
  pm2 start index.js --name todo-api
   pm2 save
   pm2 startup systemd
   # suorita komento, jonka pm2 tulostaa, esim.
   # sudo env PATH=$PATH pm2 startup systemd -u ec2-user --hp /home/ec2-user
   ```
5. Tarkista toiminta:
   ```bash
   pm2 list
   curl http://localhost:3000/todos
   ```

### 4. API:n julkaisu
- Vaihtoehto A: avaa portti 3000 Security Groupissa ja käytä osoitetta `http://<EC2-IP>:3000`.  
- Vaihtoehto B: tee Apache/Nginx reverse proxy, esim.:
  ```apache
  ProxyPass "/todos" "http://127.0.0.1:3000/todos"
  ProxyPassReverse "/todos" "http://127.0.0.1:3000/todos"
  ```

### 5. Päivitykset
1. Hae uusin koodi:
   ```bash
   cd /var/www/FullStack-todo-sovellus
   git pull
   ```
2. Päivitä staattiset tiedostot:
   ```bash
   sudo cp -r ui/* /var/www/html/
   sudo systemctl reload httpd
   ```
3. Backendin päivitys:
   ```bash
   cd /var/www/FullStack-todo-sovellus/todo
   npm install        # vain jos package.json muuttui
   pm2 restart todo-api
   ```

### 6. Vianhaku
- `pm2 logs todo-api` – Node-palvelimen lokit.  
- `sudo tail -f /var/log/httpd/error_log` – Apachen virheloki.  
- `curl http://<EC2-IP>/todos` – nopea tarkistus.  

Backendin voi pysäyttää komennolla `pm2 stop todo-api`. Automaattikäynnistyksen poistamiseksi: `pm2 delete todo-api && pm2 unstartup systemd`.
