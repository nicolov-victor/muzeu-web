import sql from 'mssql';

const config = {
  user: 'sa',
  password: '123qwe@W',
  server: '127.0.0.1',
  port: 52969,
  database: 'muzeu',
  options: { encrypt: false, trustServerCertificate: true }
};

async function checkCols() {
  const pool = await sql.connect(config);
  const tables = ['Carte', 'Icoane', 'Arme', 'Monede', 'Ceramica', 'Documente', 'Fotografie', 'Etnografie', 'Medalie', 'Portelan', 'Afise', 'Istorie'];

  for (const t of tables) {
    const cols = await pool.request().query(`
      SELECT name FROM sys.columns WHERE object_id = OBJECT_ID('dbo.${t}')
    `);
    const names = cols.recordset.map(x => x.name);
    console.log(`\n[${t}]:`);
    console.log('Title/Name cols:', names.filter(n => ['DENUMIRE', 'TITLU', 'OBIECT', 'NUME'].includes(n)));
    console.log('Desc cols:', names.filter(n => ['DESCRIERE', 'AVERS', 'REVERS', 'NOTE', 'NOTE_CONS'].includes(n)));
    console.log('Location cols:', names.filter(n => n.includes('LOC')));
  }

  await pool.close();
}

checkCols().catch(console.error);
