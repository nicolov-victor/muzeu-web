# Grand Musée Virtuel 🏛️
### Platformă Web Modernă pentru Prezentarea Patrimoniului Muzeal & Arhitectură SQL Server

Platformă web modernă de prezentare vizuală a patrimoniului muzeal, concepută cu o estetică **Dark Luxury Museum**, carusel cinematografic 3D (Coverflow Depth) și conectivitate directă la **Microsoft SQL Server** pe baza de date relațională `muzeu`.

Sistemul este configurat în mod **Strict Read-Only** (exclusiv vizualizare și prezentare de patrimoniu, fără riscul modificării sau alterării datelor din baza de date).

---

## 🌟 Caracteristici Principale

- **Carusel 3D Cinematografic (Depth Coverflow)**: Navigare fluidă pe axele 3D (`translateZ`, `rotateY`, `scale`), iluminare focalizată pe piesa centrală, indicatoare tactile, rotire automată inteligentă cu pauză la hover și controale touch/swipe.
- **Conectat la cele 12 Tabele Reale de Exponate**:
  - `dbo.Carte` – Cărți Vechi & Tipărituri
  - `dbo.Icoane` – Icoane & Artă Religioasă
  - `dbo.Arme` – Arme & Echipament Istoric
  - `dbo.Monede` – Numismatică & Tezaur Monetar
  - `dbo.Ceramica` – Ceramică & Olarit Arheologic
  - `dbo.Documente` – Documente Istorice & Manuscrise
  - `dbo.Fotografie` – Fotografie de Epocă & Clișee
  - `dbo.Etnografie` – Etnografie & Port Tradițional
  - `dbo.Medalie` – Medalii, Decorații & Ordine
  - `dbo.Portelan` – Porțelan & Faianță Fină
  - `dbo.Afise` – Afișe & Grafică Istorică
  - `dbo.Istorie` – Obiecte & Mărturii Istorice
- **Fișă Tehnică Detaliată (Spotlight Modal)**: Inspecție la rezoluție înaltă, zoom dinamic pe imagine, redare ghid audio narativ și afișarea parametrilor relaționali specifici fiecărui tabel (Număr inventar, Autor, Datare, Material, Tehnică, Dimensiuni, Statut Tezaur/Fond, Loc păstrare).
- **Ghid Audio & Ambianță de Galerie**: Sinteză vocală a fișei piesei și sintetizator audio ambiental cu acorduri calme de galerie de artă.
- **Proiectat pentru Producție pe Windows Server + IIS**: Include `web.config` preconfigurat pentru Reverse Proxy prin IIS.

---

## 📁 Structura Proiectului

```text
Museum_Web/
├── public/                     # Frontend static
│   ├── index.html              # Interfața muzeală modernă
│   ├── styles.css              # Design system dark luxury & 3D CSS
│   ├── app.js                  # Controller carusel 3D și filtrare tabele
│   └── schema.sql              # Scriptul SQL de referință
├── server/                     # Backend API
│   ├── server.js               # Server Express REST API (Read-Only)
│   ├── db.js                   # Modul conectare Microsoft SQL Server
│   └── schema.sql              # Schema SQL completă cu date demo
├── .env.example                # Model configurare variabile de mediu
├── web.config                  # Fișier de configurare pentru IIS (Reverse Proxy)
├── package.json                # Dependențe Node.js
└── README.md                   # Documentație completă
```

---

## 🚀 Rulare Rapidă în Mod Dezvoltare (Local)

1. **Instalare dependențe**:
   ```bash
   npm install
   ```

2. **Configurare mediu (`.env`)**:
   Copiați `.env.example` în `.env` și specificați datele SQL Server:
   ```env
   PORT=3000
   DB_USER=sa
   DB_PASSWORD=ParolaTaSql
   DB_SERVER=127.0.0.1
   DB_PORT=52969
   DB_NAME=muzeu
   DB_TRUST_SERVER_CERTIFICATE=true
   DB_ENCRYPT=false
   ```

3. **Pornire aplicație**:
   ```bash
   npm start
   ```
   Deschideți în browser: **`http://localhost:3000`**

---

## 🏢 Ghid de Publicare pe Windows Server cu IIS

Pentru a rula platforma în producție pe un server cu **Windows Server (2016, 2019, 2022)** și **Internet Information Services (IIS)**:

### Pasul 1: Instalare Componente Necesare pe Windows Server
1. **Node.js LTS**: Descărcați și instalați versiunea LTS de pe [nodejs.org](https://nodejs.org).
2. **IIS (Web Server)**:
   - În *Server Manager* &rarr; *Add Roles and Features* &rarr; Bifați rolul **Web Server (IIS)**.
3. **Modulele Oficiale IIS pentru Reverse Proxy**:
   - Descărcați și instalați **[URL Rewrite Module](https://www.iis.net/downloads/microsoft/url-rewrite)**.
   - Descărcați și instalați **[Application Request Routing (ARR)](https://www.iis.net/downloads/microsoft/application-request-routing)**.
   - În IIS Manager &rarr; click pe server &rarr; **Application Request Routing Cache** &rarr; în panoul din dreapta click **Server Proxy Settings** &rarr; bifați **Enable proxy** &rarr; click **Apply**.

---

### Pasul 2: Clonare și Pregătire Aplicație
1. Copiați proiectul într-un folder pe server (ex: `C:\inetpub\muzeu-web` sau `C:\Apps\muzeu-web`).
2. În linia de comandă (PowerShell / CMD), navigați în folder și rulați:
   ```powershell
   cd C:\inetpub\muzeu-web
   npm install --production
   ```
3. Creați fișierul `.env` cu datele reale de conectare la SQL Server.

---

### Pasul 3: Rularea Procesului Node.js ca Serviciu Windows (PM2 / NSSM)
Pentru ca aplicația să ruleze permanent în fundal și să pornească automat la repornirea serverului:

#### Opțiunea Recomandată: PM2 cu Windows Service
```powershell
# Instalare PM2 global
npm install pm2 -g
npm install pm2-windows-service -g

# Pornire aplicație prin PM2
cd C:\inetpub\muzeu-web
pm2 start server/server.js --name "muzeu-web"

# Salvare configurație pentru pornire automată la boot
pm2 save
pm2-service-install -n "MuzeuWebService"
```

*Alternativ, puteți folosi utilitarul gratuit **NSSM** (`nssm install MuzeuWeb "C:\Program Files\nodejs\node.exe" "C:\inetpub\muzeu-web\server\server.js"`).*

---

### Pasul 4: Configurare Website în IIS
1. Deschideți **IIS Manager**.
2. Faceți click dreapta pe **Sites** &rarr; **Add Website...**.
   - **Site name**: `MuzeuWeb`
   - **Physical path**: `C:\inetpub\muzeu-web` (folderul proiectului unde se află fișierul `web.config`)
   - **Binding**: Port `80` (sau `443` cu certificat SSL) și Hostname-ul dorit (ex: `muzeu.domeniu.ro` sau lăsați liber pentru acces prin IP-ul serverului).
3. Fișierul [`web.config`](./web.config) inclus în rădăcina proiectului redirecționează automat toate cererile sosite pe portul 80/443 din IIS către instanța Node.js internă (`http://127.0.0.1:3000`).

---

## 🗄️ Setări Necesare pentru Conectarea la Baza de Date SQL Server

Pentru a permite conectarea aplicației la instanța SQL Server pe Windows Server:

### 1. Activarea Protocolului TCP/IP în SQL Server
1. Deschideți **SQL Server Configuration Manager**.
2. Mergeți la **SQL Server Network Configuration** &rarr; **Protocols for [NUME_INSTANȚĂ]** (ex: `Protocols for SQLEXPRESS` sau `MSSQLSERVER`).
3. Asigurați-vă că protocolul **TCP/IP** este setat pe **Enabled**.
4. Dați dublu-click pe **TCP/IP** &rarr; tabul **IP Addresses**:
   - Derulați până jos la secțiunea **IPAll**.
   - Dacă doriți un port fix standard, ștergeți valoarea de la `TCP Dynamic Ports` și puneți la **`TCP Port`** valoarea `1433` (sau lăsați portul dinamic curent și treceți-l în `.env`).
5. Reporniți serviciul SQL Server:
   - În *SQL Server Services* &rarr; click dreapta pe `SQL Server (...)` &rarr; **Restart**.

### 2. Activare Autentificare Mixtă (SQL Server and Windows Authentication)
1. Deschideți **SQL Server Management Studio (SSMS)**.
2. Click dreapta pe server (nodul rădăcină) &rarr; **Properties** &rarr; secțiunea **Security**.
3. Bifați **SQL Server and Windows Authentication mode**.
4. În secțiunea **Security** &rarr; **Logins** &rarr; asigurați-vă că utilizatorul `sa` are parola corectă și contul este activat (*Status &rarr; Login: Enabled*).

### 3. Deschidere Port în Windows Firewall
Dacă SQL Server se află pe o altă mașină sau accesați prin rețea, rulați în PowerShell (Administrator):
```powershell
New-NetFirewallRule -DisplayName "SQL Server Port 1433" -Direction Inbound –LocalPort 1433 -Protocol TCP -Action Allow
```
*(Dacă folosiți portul dinamic curent, ex. 52969, specificați acel port în comanda de mai sus).*

---

## 🔒 Securitate și Integritate Date

- **Protecție Garantată**: Sistemul este programat strict în mod **Read-Only**. Nu există rute active de `INSERT`, `UPDATE` sau `DELETE`.
- Baza de date originală `muzeu` rămâne neatinsă, platforma acționând ca o vitrină digitală modernă.

---

&copy; 2026 Grand Musée Virtuel &bull; Dezvoltat pentru evidența și valorificarea patrimoniului cultural.
