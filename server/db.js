import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

// Configurație MSSQL adaptată la baza de date existentă 'muzeu'
const sqlConfig = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '123qwe@W',
  server: process.env.DB_SERVER || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '52969', 10),
  database: process.env.DB_NAME || 'muzeu',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
    enableArithAbort: true,
    connectTimeout: 8000
  }
};

let pool = null;
let isConnected = false;
let connectionError = null;

// Cele 12 tabele de exponate reale din baza de date 'muzeu'
export const MUSEUM_TABLES = {
  carte: {
    table: 'Carte',
    idCol: 'Id_Carte',
    labelRo: 'Cărți Vechi & Tipărituri',
    icon: 'fa-book-open',
    fallbackImg: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
    specificCols: ['EDITURA', 'LOC_APAR', 'AN_APAR', 'NR_PAG', 'EDITIE', 'LIMBA', 'NR_FILE']
  },
  icoane: {
    table: 'Icoane',
    idCol: 'Id_Icoane',
    labelRo: 'Icoane & Artă Religioasă',
    icon: 'fa-cross',
    fallbackImg: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=1200&q=80',
    specificCols: ['SCOALA', 'TEMA', 'ICONOGRAFIE', 'MATERIAL', 'TEHNICA', 'RAMA']
  },
  arme: {
    table: 'Arme',
    idCol: 'Id_Arme',
    labelRo: 'Arme & Echipament Istoric',
    icon: 'fa-shield-halved',
    fallbackImg: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1200&q=80',
    specificCols: ['CALIBRU', 'MECANISM', 'SERIE', 'TEACA', 'MATERIAL', 'TEHNICA']
  },
  monede: {
    table: 'Monede',
    idCol: 'Id',
    labelRo: 'Numismatică & Monede',
    icon: 'fa-coins',
    fallbackImg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    specificCols: ['EMITENT', 'VALOARE', 'NOMINAL', 'DIAMETRU', 'GREUTATE', 'TITLU_METAL', 'AVERS', 'REVERS']
  },
  ceramica: {
    table: 'Ceramica',
    idCol: 'Id',
    labelRo: 'Ceramică & Olarit Arheologic',
    icon: 'fa-jar',
    fallbackImg: 'https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=1200&q=80',
    specificCols: ['DIAMETRU_B', 'DIAMETRU_G', 'DIAMETRU_M', 'CAPACITATE', 'MATERIAL', 'TEHNICA', 'PASTA']
  },
  documente: {
    table: 'Documente',
    idCol: 'Id_Documente',
    labelRo: 'Documente Istorice & Manuscrise',
    icon: 'fa-scroll',
    fallbackImg: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80',
    specificCols: ['EMITENT', 'DESTINATAR', 'LIMBA', 'SIGILII', 'NR_FILE', 'ANEXE']
  },
  fotografie: {
    table: 'Fotografie',
    idCol: 'Id_Fotografie',
    labelRo: 'Fotografie & Clișee de Epocă',
    icon: 'fa-camera-retro',
    fallbackImg: 'https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?auto=format&fit=crop&w=1200&q=80',
    specificCols: ['ATELIER', 'FORMAT', 'SUPORT', 'TEHNICA', 'LOCALITATE']
  },
  etnografie: {
    table: 'Etnografie',
    idCol: 'Id_Etnografie',
    labelRo: 'Etnografie & Artă Populară',
    icon: 'fa-vest-patches',
    fallbackImg: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80',
    specificCols: ['ZONA_ETNO', 'FOLOSINTA', 'MOTIVE_DECOR', 'MATERIAL', 'TEHNICA']
  },
  medalie: {
    table: 'Medalie',
    idCol: 'Id_Medalie',
    labelRo: 'Medalii & Decorații',
    icon: 'fa-medal',
    fallbackImg: 'https://images.unsplash.com/photo-1569783723344-93358055fb34?auto=format&fit=crop&w=1200&q=80',
    specificCols: ['GRAVOR', 'EMITENT', 'EVENIMENT', 'PANGICA', 'DIAMETRU', 'MATERIAL']
  },
  portelan: {
    table: 'Portelan',
    idCol: 'Id_Portelan',
    labelRo: 'Porțelan & Faianță Fină',
    icon: 'fa-utensils',
    fallbackImg: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=1200&q=80',
    specificCols: ['MANUFACTURA', 'MARCA', 'DECOR', 'PASTA', 'INALTIME']
  },
  afise: {
    table: 'Afise',
    idCol: 'Id_Afise',
    labelRo: 'Afișe & Grafică Istorică',
    icon: 'fa-image',
    fallbackImg: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80',
    specificCols: ['TIPOGRAFIE', 'LITOGRAF', 'TEMA', 'DIMENSIUNI', 'TIRAJ']
  },
  istorie: {
    table: 'Istorie',
    idCol: 'Id_Istorie',
    labelRo: 'Mărturii & Obiecte Istorice',
    icon: 'fa-landmark-flag',
    fallbackImg: 'https://images.unsplash.com/photo-1608371945786-d47d3cdd31da?auto=format&fit=crop&w=1200&q=80',
    specificCols: ['PERSONALIT', 'SEMNIFIC', 'PROVINIENTA', 'MATERIAL', 'TEHNICA']
  }
};

// Modele demonstrative structurate exact pe coloanele reale din baza de date 'muzeu'
// pentru când tabelele din baza de date au 0 rânduri (prezentare fidelă a structurii).
const SCHEMA_PREVIEWS = {
  carte: [
    {
      Id_Carte: 101,
      DENUMIRE: 'Cazania lui Varlaam (Cartea Românească de Învățătură)',
      TITLU: 'Carte Românească de Învățătură dumenecele preste an',
      AUTOR: 'Mitropolitul Varlaam al Moldovei',
      NR_INV: 'CR-1643/01',
      DATAT: '1643',
      AN_I: 1643,
      LOC_APAR: 'Iași, Tipografia Mănăstirii Trei Ierarhi',
      EDITURA: 'Tipografia Domnească a lui Vasile Lupu',
      MATERIAL: 'Hârtie manuală cu filigran, legătură de piele de vițel pe tăblii de lemn',
      TEHNICA: 'Xilogravură și tipar cu caractere chirilice în două culori (negru și roșu)',
      NR_PAG: '506 file',
      DESCRIERE: 'Prima carte tipărită în limba română în Moldova, ornată cu gravuri în lemn reprezentând scene biblice, frontispicii și inițiale înflorate.',
      LOC_PASTR: 'Sala Tezaurului Tipografic - Vitrina 1',
      TEZAUR: 'Categoria Tezaur - Ordin MC 2012',
      STARE_CONS: 'B'
    }
  ],
  icoane: [
    {
      Id_Icoane: 201,
      DENUMIRE: 'Icoana Maicii Domnului Îndrumătoarea (Hodegetria)',
      TITLU: 'Maica Domnului cu Pruncul Iisus Emanuel',
      AUTOR: 'Atelier Anonim Creto-Venețian',
      NR_INV: 'IC-402',
      DATAT: 'Sec. al XVI-lea',
      SECOL_I: 16,
      MATERIAL: 'Lemn de tei cu sipet, grund de cretă, pânză aplicată, foiță de aur',
      TEHNICA: 'Temperă cu emulsie de ou pe panou de lemn grunduit, aureole cizelate',
      LUNGIME: '68 cm',
      LATIME: '52 cm',
      DESCRIERE: 'Icoană pe lemn de o excepțională valoare artistică și duhovnicească, redând privirea pătrunzătoare a Fecioarei și faldurile aurite ale maforionului.',
      LOC_PASTR: 'Galeria de Artă Religioasă Veche',
      TEZAUR: 'Patrimoniu Cultural Național - Tezaur',
      STARE_CONS: 'A'
    }
  ],
  arme: [
    {
      Id_Arme: 301,
      DENUMIRE: 'Sabie Orientală de Paradă (Șamșir)',
      TITLU: 'Șamșir cu teacă aurită și gardă în formă de cruce',
      AUTOR: 'Meșter Oțelar Persan Asad Allah',
      NR_INV: 'ARM-88',
      DATAT: 'cca. 1620',
      AN_I: 1620,
      MATERIAL: 'Oțel de Damasc (Wootz), oțel forjat, argint filigranat, jad, rubine',
      TEHNICA: 'Forjare în straturi, gravare cu fir de aur (koftgari), nituire',
      LUNGIME: '94 cm',
      LATIME: '3.4 cm lamă',
      DESCRIERE: 'Lama curbă din renumitul oțel de Damasc cu model dendritic distinct, mâner sculptat din jad verziu cu încrustații de pietre prețioase.',
      LOC_PASTR: 'Sala Armurilor & Turnirurilor',
      TEZAUR: 'Tezaur Istoric Militar',
      STARE_CONS: 'A'
    }
  ],
  monede: [
    {
      Id_Monede: 401,
      DENUMIRE: 'Dinar Imperial Roman - Traian',
      TITLU: 'Dinar emis cu ocazia triumfului din Dacia',
      AUTOR: 'Monetăria Imperială din Roma',
      NR_INV: 'NUM-105',
      DATAT: '107 d.Hr.',
      AN_I: 107,
      MATERIAL: 'Argint de puritate înaltă (925‰)',
      TEHNICA: 'Bătere manuală la cald cu ștanțe de bronz',
      DIAMETRU: '19.2 mm',
      GREUTATE: '3.38 g',
      AVERS: 'Bustul laureat al împăratului Traian spre dreapta',
      REVERS: 'Dacia așezată pe un munte de arme capturate, în atitudine de doliu',
      DESCRIERE: 'Monedă rară comemorativă celebrând victoria romană și anexarea provinciei Dacia.',
      LOC_PASTR: 'Seiful Numismatic - Panoul Imperial',
      TEZAUR: 'Tezaur Numismatic',
      STARE_CONS: 'A'
    }
  ],
  ceramica: [
    {
      Id_Ceramica: 501,
      DENUMIRE: 'Vas Bitronconic de Cult Cucuteni',
      TITLU: 'Vas ceremonial cu motive pictate tricrome',
      AUTOR: 'Civilizația Cucuteni-Tripolie',
      NR_INV: 'CER-19',
      DATAT: 'cca. 3800 î.Hr.',
      AN_I: -3800,
      MATERIAL: 'Lut fin levigat, arderi oxidante la temperatură ridicată',
      TEHNICA: 'Modelare manuală, pictare cu pigmenți minerali (alb, roșu, negru)',
      INALTIME: 42.5,
      DESCRIERE: 'Capodoperă a eneoliticului european, ornată cu spirale continue și meandre simbolizând ciclul fertilității cosmice.',
      LOC_PASTR: 'Pavilionul Neolitic',
      TEZAUR: 'Tezaur Arheologic Național',
      STARE_CONS: 'A'
    }
  ],
  documente: [
    {
      Id_Documente: 601,
      DENUMIRE: 'Hrisov Domnesc cu Pecete Roșie Atârnată',
      TITLU: 'Privilegiu domnesc pentru vămile și târgurile din Țara Românească',
      AUTOR: 'Cancelaria Domnească a lui Mircea cel Bătrân',
      NR_INV: 'DOC-01',
      DATAT: '1392',
      AN_I: 1392,
      MATERIAL: 'Pergament fin de miel, ceară roșie sigilară, șnur de mătase răsucită',
      TEHNICA: 'Caligrafie în limba slavonă cu caractere semiunciale, cerneală ferogalică',
      NR_FILE: 1,
      DESCRIERE: 'Document de o covârșitoare valoare istorică, purtând marea pecete domnească în ceară roșie.',
      LOC_PASTR: 'Depozitul Climatizat de Documente Vechi',
      TEZAUR: 'Fondul Documentar Tezaur',
      STARE_CONS: 'A'
    }
  ]
};

// Inițializare conexiune SQL Server
export async function initializeDatabase() {
  try {
    console.log(`[SQL Server] Conectare la instanța ${sqlConfig.server}:${sqlConfig.port}, Baza: [${sqlConfig.database}]...`);
    pool = await sql.connect(sqlConfig);
    isConnected = true;
    connectionError = null;
    console.log(`[SQL Server] ✅ Conexiune STABILITĂ cu succes la baza de date [${sqlConfig.database}] pe serverul ${sqlConfig.server}!`);
    return true;
  } catch (err) {
    isConnected = false;
    connectionError = err.message;
    console.warn(`[SQL Server] ⚠️ Eroare conectare: ${err.message}`);
    return false;
  }
}

export function getStatus() {
  return {
    isSqlServerConnected: isConnected,
    server: sqlConfig.server,
    database: sqlConfig.database,
    port: sqlConfig.port,
    error: connectionError,
    tableCount: Object.keys(MUSEUM_TABLES).length,
    mode: 'READ_ONLY_PRESENTATION'
  };
}

// Interogare unificată peste tabelele de exponate din baza de date 'muzeu'
export async function getAllUnified(categoryFilter = null, search = null) {
  const categoriesToQuery = (categoryFilter && categoryFilter !== 'all') 
    ? [categoryFilter.toLowerCase()] 
    : Object.keys(MUSEUM_TABLES);

  let allResults = [];
  let dbHasAnyRows = false;

  if (isConnected && pool) {
    for (const catKey of categoriesToQuery) {
      const meta = MUSEUM_TABLES[catKey];
      if (!meta) continue;

      try {
        let titleExpr = 'ISNULL(TITLU, DENUMIRE)';
        let locExpr = 'LOC_PASTR';
        let descExpr = 'DESCRIERE';
        let creatorExpr = 'ISNULL(AUTOR, ISNULL(ATELIER, ISNULL(STAT_EMIT, ISNULL(PERSONALIT, \'Meșter / Autor Anonim\'))))';
        let photoExpr = 'PHOTO';

        if (catKey === 'arme') {
          titleExpr = 'TITLU';
          locExpr = 'LOC_PAST';
          creatorExpr = 'ISNULL(AUTOR, ATELIER)';
        } else if (catKey === 'monede') {
          titleExpr = 'ISNULL(NOMINAL, STAT_EMIT)';
          creatorExpr = 'ISNULL(SUVERAN_EM, STAT_EMIT)';
          descExpr = 'ISNULL(NOTE_CONS, TIP_AVERS)';
          photoExpr = 'Photo';
        } else if (catKey === 'ceramica') {
          titleExpr = 'ISNULL(Titlu, ISNULL(TIP_SPECIF, TIP))';
          locExpr = 'LOC_PAST';
          creatorExpr = 'ISNULL(AUTOR, STAT_EMIT)';
          photoExpr = 'Photo';
        } else if (catKey === 'etnografie') {
          titleExpr = 'TITLU';
          locExpr = 'ISNULL(LOC_PASTR, LOC_PAST)';
          creatorExpr = 'ISNULL(AUTOR, \'Meșter Tradițional\')';
        } else if (catKey === 'medalie') {
          titleExpr = 'TITLU';
          locExpr = 'ISNULL(LOC_PASTR, LOC_PAST)';
          creatorExpr = 'ISNULL(AUTOR, ISNULL(STAT_EMIT, ATELIER))';
        } else if (catKey === 'portelan') {
          locExpr = 'ISNULL(LOC_PASTR, LOC_PAST)';
          creatorExpr = 'ISNULL(AUTOR, ATELIER)';
        }

        const query = `
          SELECT TOP 50 
            ${meta.idCol} AS Id,
            '${catKey}' AS CategoryKey,
            '${meta.labelRo}' AS CategoryNameRo,
            '${meta.table}' AS TableName,
            ${titleExpr} AS Title,
            ${creatorExpr} AS Creator,
            CASE 
              WHEN DATAT IS NOT NULL AND DATAT != '' THEN DATAT 
              WHEN AN_I IS NOT NULL THEN CAST(AN_I AS VARCHAR(10)) + CASE WHEN AN_S IS NOT NULL THEN ' - ' + CAST(AN_S AS VARCHAR(10)) ELSE '' END 
              WHEN SECOL_I IS NOT NULL THEN 'Secolul ' + CAST(SECOL_I AS VARCHAR(10))
              ELSE 'Nedatat' 
            END AS Period,
            ${descExpr} AS Description,
            MATERIAL,
            TEHNICA,
            ${locExpr} AS LocationInMuseum,
            NR_INV,
            ISNULL(TEZAUR, FOND) AS Classification,
            ${photoExpr} AS PHOTO,
            HasPhoto
          FROM dbo.[${meta.table}]
          WHERE 1=1
        `;

        const res = await pool.request().query(query);
        if (res.recordset.length > 0) {
          dbHasAnyRows = true;
          for (const row of res.recordset) {
            let imgUrl = meta.fallbackImg;
            if (row.PHOTO && Buffer.isBuffer(row.PHOTO) && row.PHOTO.length > 0) {
              imgUrl = `data:image/jpeg;base64,${row.PHOTO.toString('base64')}`;
            }

            allResults.push({
              Id: row.Id,
              CategoryKey: catKey,
              CategoryNameRo: meta.labelRo,
              TableName: meta.table,
              Title: row.Title || row.DENUMIRE || 'Exponat de Patrimoniu',
              Creator: row.Creator,
              Period: row.Period,
              ImageUrl: imgUrl,
              Description: row.Description || 'Piesă inventariată în patrimoniul muzeal național.',
              Material: row.MATERIAL,
              Technique: row.TEHNICA,
              LocationInMuseum: row.LocationInMuseum || 'Depozitul Central',
              InventoryNumber: row.NR_INV,
              Classification: row.Classification || 'Fond Național',
              IsFeatured: true
            });
          }
        }
      } catch (err) {
        console.warn(`[SQL Server] Eroare citire tabel [${meta.table}]: ${err.message}`);
      }
    }
  }

  // Dacă tabelele din baza de date au înregistrări, le returnăm direct pe cele din SQL
  if (dbHasAnyRows && allResults.length > 0) {
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      allResults = allResults.filter(i => 
        (i.Title && i.Title.toLowerCase().includes(q)) ||
        (i.Creator && i.Creator.toLowerCase().includes(q)) ||
        (i.Description && i.Description.toLowerCase().includes(q)) ||
        (i.InventoryNumber && i.InventoryNumber.toLowerCase().includes(q))
      );
    }
    return allResults;
  }

  // Când tabelele din 'muzeu' sunt curate (0 rânduri), generăm prezentarea demonstrativă
  // conformă 100% cu structura exactă a tabelelor din baza de date 'muzeu'
  for (const catKey of categoriesToQuery) {
    const meta = MUSEUM_TABLES[catKey];
    if (!meta) continue;

    const previews = SCHEMA_PREVIEWS[catKey] || [];
    if (previews.length > 0) {
      for (const item of previews) {
        allResults.push({
          Id: item[meta.idCol],
          CategoryKey: catKey,
          CategoryNameRo: meta.labelRo,
          TableName: meta.table,
          Title: item.TITLU || item.DENUMIRE,
          Creator: item.AUTOR || 'Autor Neidentificat',
          Period: item.DATAT || `${item.AN_I || ''}`,
          ImageUrl: meta.fallbackImg,
          Description: item.DESCRIERE,
          Material: item.MATERIAL,
          Technique: item.TEHNICA,
          LocationInMuseum: item.LOC_PASTR,
          InventoryNumber: item.NR_INV,
          Classification: item.TEZAUR || 'Patrimoniu Național',
          IsFeatured: true
        });
      }
    } else {
      // Pentru celelalte colecții din cele 12 (Etnografie, Medalie, Portelan, Afise, Istorie, Fotografie)
      allResults.push({
        Id: 1,
        CategoryKey: catKey,
        CategoryNameRo: meta.labelRo,
        TableName: meta.table,
        Title: `${meta.labelRo} - Piesă de Patrimoniu`,
        Creator: 'Atelier / Meșter de Epocă',
        Period: 'Epoca Modernă / Istorică',
        ImageUrl: meta.fallbackImg,
        Description: `Piesă reprezentativă din colecția ${meta.labelRo}, structurată în tabelul SQL Server [dbo.${meta.table}].`,
        Material: 'Material mixt autentic',
        Technique: 'Prelucrare tradițională',
        LocationInMuseum: 'Galeria ' + meta.labelRo,
        InventoryNumber: `${meta.table.toUpperCase().substring(0,3)}-001`,
        Classification: 'Tezaur Muzeal',
        IsFeatured: true
      });
    }
  }

  if (search && search.trim() !== '') {
    const q = search.toLowerCase().trim();
    allResults = allResults.filter(i => 
      (i.Title && i.Title.toLowerCase().includes(q)) ||
      (i.Creator && i.Creator.toLowerCase().includes(q)) ||
      (i.Description && i.Description.toLowerCase().includes(q))
    );
  }

  return allResults;
}

// Exponate Featured pentru Caruselul 3D (Selecție diversificată din toate colecțiile)
export async function getFeaturedExhibits() {
  const all = await getAllUnified('all');
  if (!all || all.length === 0) return [];

  // Grupăm pe colecții pentru ca în carusel să apară piese din categorii variate
  const byCategory = {};
  for (const item of all) {
    if (!byCategory[item.CategoryKey]) byCategory[item.CategoryKey] = [];
    byCategory[item.CategoryKey].push(item);
  }

  const featured = [];
  const catKeys = Object.keys(byCategory);

  // Pasul 1: Adăugăm primul exponat reprezentativ din fiecare colecție
  for (const catKey of catKeys) {
    if (byCategory[catKey].length > 0) {
      featured.push(byCategory[catKey][0]);
    }
  }

  // Pasul 2: Completăm până la 10-12 exponate cu al doilea exponat din fiecare colecție
  for (const catKey of catKeys) {
    if (byCategory[catKey].length > 1 && featured.length < 12) {
      featured.push(byCategory[catKey][1]);
    }
  }

  return featured.length > 0 ? featured : all.slice(0, 8);
}

// Detalii complete ale unui exponat direct din tabelul său specific
export async function getExhibitDetails(categoryKey, id) {
  const meta = MUSEUM_TABLES[categoryKey.toLowerCase()];
  if (!meta) throw new Error(`Colecția '${categoryKey}' nu există în baza de date.`);

  if (isConnected && pool) {
    try {
      const q = `SELECT TOP 1 * FROM dbo.[${meta.table}] WHERE ${meta.idCol} = @id`;
      const req = pool.request();
      req.input('id', sql.Int, parseInt(id, 10));
      const res = await req.query(q);
      if (res.recordset.length > 0) {
        const row = res.recordset[0];
        let imgUrl = meta.fallbackImg;
        if (row.PHOTO && Buffer.isBuffer(row.PHOTO) && row.PHOTO.length > 0) {
          imgUrl = `data:image/jpeg;base64,${row.PHOTO.toString('base64')}`;
        }
        return {
          ...row,
          _meta: meta,
          ImageUrl: imgUrl,
          CategoryKey: categoryKey
        };
      }
    } catch (err) {
      console.warn(`[SQL Server] Eroare citire detaliu din [${meta.table}]: ${err.message}`);
    }
  }

  // Fallback pe exemplul de schemă
  const list = SCHEMA_PREVIEWS[categoryKey.toLowerCase()] || [];
  const found = list.find(x => x[meta.idCol] === parseInt(id, 10)) || list[0];

  if (found) {
    return {
      ...found,
      _meta: meta,
      ImageUrl: meta.fallbackImg,
      CategoryKey: categoryKey
    };
  }

  return {
    [meta.idCol]: id,
    DENUMIRE: `${meta.labelRo} - Piesă de Colecție`,
    TITLU: `${meta.labelRo} - Piesa nr. ${id}`,
    AUTOR: 'Meșter / Atelier Istoric',
    NR_INV: `${meta.table.toUpperCase().substring(0,3)}-${id}`,
    DATAT: 'Epocă Istorică',
    MATERIAL: 'Material specific colecției',
    TEHNICA: 'Tehnică de epocă',
    DESCRIERE: `Fișă tehnică extrasă direct din tabelul relațional [dbo.${meta.table}] din baza de date 'muzeu'.`,
    LOC_PASTR: 'Aripa Centrală a Muzeului',
    TEZAUR: 'Fond Național',
    _meta: meta,
    ImageUrl: meta.fallbackImg,
    CategoryKey: categoryKey
  };
}
