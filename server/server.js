import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  initializeDatabase, 
  getStatus, 
  getAllUnified, 
  getFeaturedExhibits, 
  getExhibitDetails,
  MUSEUM_TABLES
} from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// 1. Status conexiune bază de date reală 'muzeu'
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    database: getStatus()
  });
});

// 2. Metadate despre cele 12 tabele de exponate existente
app.get('/api/categories', (req, res) => {
  res.json({
    categories: Object.entries(MUSEUM_TABLES).map(([key, val]) => ({
      key,
      tableName: val.table,
      labelRo: val.labelRo,
      icon: val.icon,
      idColumn: val.idCol,
      specificColumns: val.specificCols
    }))
  });
});

// 3. Exponate de Top pentru Caruselul 3D Cinematografic
app.get('/api/exhibits/featured', async (req, res) => {
  try {
    const exhibits = await getFeaturedExhibits();
    res.json({ success: true, count: exhibits.length, data: exhibits });
  } catch (error) {
    console.error('Eroare la /api/exhibits/featured:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Catalog unificat cu filtrare pe cele 12 tabele și căutare
app.get('/api/exhibits', async (req, res) => {
  try {
    const { category, search } = req.query;
    const exhibits = await getAllUnified(category, search);
    res.json({ success: true, count: exhibits.length, data: exhibits });
  } catch (error) {
    console.error('Eroare la /api/exhibits:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Fișă tehnică detaliată din tabelul corespunzător
app.get('/api/exhibits/:category/:id', async (req, res) => {
  try {
    const { category, id } = req.params;
    const details = await getExhibitDetails(category, id);
    if (!details) {
      return res.status(404).json({ success: false, message: 'Exponatul nu a fost găsit în baza de date.' });
    }
    res.json({ success: true, data: details });
  } catch (error) {
    console.error(`Eroare la detalii exponat [${req.params.category}/${req.params.id}]:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// 6. Blocare totală a scrierii / adăugării (Strict Read-Only)
app.post('/api/exhibits/*', (req, res) => {
  res.status(403).json({
    success: false,
    message: 'Modul de scriere este dezactivat conform instrucțiunilor. Baza de date "muzeu" este accesată exclusiv în mod citire și prezentare vizuală.'
  });
});

// Pornire server
async function startServer() {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🏛️  MUSEUM WEB PLATFORM (EXCLUSIV VIZUALIZARE & PREZENTARE)`);
    console.log(`Conectat la baza de date: muzeu pe portul ${process.env.DB_PORT || 52969}`);
    console.log(`URL aplicație: http://localhost:${PORT}`);
    console.log(`======================================================\n`);
  });
}

startServer();
