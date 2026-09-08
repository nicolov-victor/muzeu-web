-- ==========================================================
-- BAZA DE DATE: MuseumDB
-- Platforma Muzeală Modernă cu Tabele Separate pe Tipuri de Exponate
-- Sistem: Microsoft SQL Server 2017+ / Azure SQL
-- ==========================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'MuseumDB')
BEGIN
    CREATE DATABASE MuseumDB;
END
GO

USE MuseumDB;
GO

-- ==========================================================
-- 1. Tabel: Exhibits_Paintings (Picturi & Artă Plastică)
-- ==========================================================
IF OBJECT_ID('dbo.Exhibits_Paintings', 'U') IS NOT NULL
    DROP TABLE dbo.Exhibits_Paintings;
GO

CREATE TABLE dbo.Exhibits_Paintings (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(200) NOT NULL,
    Artist NVARCHAR(150) NOT NULL,
    YearCreated INT NULL,
    Period NVARCHAR(100) NULL,
    ImageUrl NVARCHAR(500) NOT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    HistoricalSignificance NVARCHAR(MAX) NULL,
    Medium NVARCHAR(100) NOT NULL,         -- ex: Ulei pe pânză, Tempera, Frescă
    CanvasType NVARCHAR(100) NULL,        -- ex: Pânză de in, Lemn de stejar
    Dimensions NVARCHAR(50) NULL,         -- ex: 77 x 53 cm
    FrameType NVARCHAR(100) NULL,         -- ex: Ramă barocă aurită cu foiță de aur
    LocationInMuseum NVARCHAR(100) NULL,  -- ex: Sala Mare, Aripa Renașterii
    IsFeatured BIT DEFAULT 0,
    AudioGuideUrl NVARCHAR(500) NULL,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);
GO

-- ==========================================================
-- 2. Tabel: Exhibits_Sculptures (Sculptură & Statuare)
-- ==========================================================
IF OBJECT_ID('dbo.Exhibits_Sculptures', 'U') IS NOT NULL
    DROP TABLE dbo.Exhibits_Sculptures;
GO

CREATE TABLE dbo.Exhibits_Sculptures (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(200) NOT NULL,
    Sculptor NVARCHAR(150) NOT NULL,
    YearCreated INT NULL,
    Period NVARCHAR(100) NULL,
    ImageUrl NVARCHAR(500) NOT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    HistoricalSignificance NVARCHAR(MAX) NULL,
    Material NVARCHAR(100) NOT NULL,       -- ex: Marmură de Carrara, Bronz patinat
    WeightKg DECIMAL(10,2) NULL,           -- ex: 280.50
    Dimensions NVARCHAR(50) NULL,         -- ex: 215 x 85 x 60 cm
    PedestalType NVARCHAR(100) NULL,      -- ex: Soclu granit negru lustruit
    CarvingTechnique NVARCHAR(100) NULL,  -- ex: Cizelare directă, Ronde-bosse
    LocationInMuseum NVARCHAR(100) NULL,
    IsFeatured BIT DEFAULT 0,
    AudioGuideUrl NVARCHAR(500) NULL,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);
GO

-- ==========================================================
-- 3. Tabel: Exhibits_Artifacts (Arheologie & Antichități)
-- ==========================================================
IF OBJECT_ID('dbo.Exhibits_Artifacts', 'U') IS NOT NULL
    DROP TABLE dbo.Exhibits_Artifacts;
GO

CREATE TABLE dbo.Exhibits_Artifacts (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(200) NOT NULL,
    OriginCulture NVARCHAR(150) NOT NULL,  -- ex: Egiptul Antic, Civilizația Greacă, Imperiul Roman
    Era NVARCHAR(100) NOT NULL,           -- ex: cca. 1323 î.Hr., Dinastia a XVIII-a
    ImageUrl NVARCHAR(500) NOT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    HistoricalSignificance NVARCHAR(MAX) NULL,
    Material NVARCHAR(100) NOT NULL,       -- ex: Aur masiv, Lapis lazuli, Teracotă
    DiscoverySite NVARCHAR(200) NULL,     -- ex: Valea Regilor, Luxor
    PreservationStatus NVARCHAR(100) NULL,-- ex: Excelentă, restaurat în 1925
    Dimensions NVARCHAR(50) NULL,
    LocationInMuseum NVARCHAR(100) NULL,
    IsFeatured BIT DEFAULT 0,
    AudioGuideUrl NVARCHAR(500) NULL,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);
GO

-- ==========================================================
-- 4. Tabel: Exhibits_Manuscripts (Manuscrise & Documente Istorice)
-- ==========================================================
IF OBJECT_ID('dbo.Exhibits_Manuscripts', 'U') IS NOT NULL
    DROP TABLE dbo.Exhibits_Manuscripts;
GO

CREATE TABLE dbo.Exhibits_Manuscripts (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(200) NOT NULL,
    Author NVARCHAR(150) NOT NULL,
    YearCreated INT NULL,
    Period NVARCHAR(100) NULL,
    ImageUrl NVARCHAR(500) NOT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    HistoricalSignificance NVARCHAR(MAX) NULL,
    Language NVARCHAR(100) NOT NULL,       -- ex: Latină clasică, Greacă bizantină, Slavonă
    ScriptType NVARCHAR(100) NULL,        -- ex: Minisculă carolingiană, Iluminare gotică
    PageCount INT NULL,
    BindingMaterial NVARCHAR(100) NULL,   -- ex: Pergament, Piele de vițel cu ferecătură argint
    ConditionReport NVARCHAR(200) NULL,
    LocationInMuseum NVARCHAR(100) NULL,
    IsFeatured BIT DEFAULT 0,
    AudioGuideUrl NVARCHAR(500) NULL,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);
GO

-- ==========================================================
-- 5. Vedere Unificată (VIEW) pentru Catalog și Carusel Global
-- ==========================================================
IF OBJECT_ID('dbo.vw_Exhibits_Unified', 'V') IS NOT NULL
    DROP VIEW dbo.vw_Exhibits_Unified;
GO

CREATE VIEW dbo.vw_Exhibits_Unified AS
SELECT 
    Id,
    'Paintings' AS Category,
    'Pictură & Artă Plastică' AS CategoryNameRo,
    Title,
    Artist AS Creator,
    YearCreated,
    Period,
    ImageUrl,
    Description,
    HistoricalSignificance,
    Medium + ' / ' + ISNULL(Dimensions, '') AS KeySpecification,
    LocationInMuseum,
    IsFeatured,
    AudioGuideUrl,
    CreatedAt
FROM dbo.Exhibits_Paintings

UNION ALL

SELECT 
    Id,
    'Sculptures' AS Category,
    'Sculptură & Statuare' AS CategoryNameRo,
    Title,
    Sculptor AS Creator,
    YearCreated,
    Period,
    ImageUrl,
    Description,
    HistoricalSignificance,
    Material + ' (' + CAST(ISNULL(WeightKg, 0) AS NVARCHAR(20)) + ' kg)' AS KeySpecification,
    LocationInMuseum,
    IsFeatured,
    AudioGuideUrl,
    CreatedAt
FROM dbo.Exhibits_Sculptures

UNION ALL

SELECT 
    Id,
    'Artifacts' AS Category,
    'Arheologie & Tezaur' AS CategoryNameRo,
    Title,
    OriginCulture AS Creator,
    NULL AS YearCreated,
    Era AS Period,
    ImageUrl,
    Description,
    HistoricalSignificance,
    Material + ' - Descoperit la ' + ISNULL(DiscoverySite, 'Locație nespecificată') AS KeySpecification,
    LocationInMuseum,
    IsFeatured,
    AudioGuideUrl,
    CreatedAt
FROM dbo.Exhibits_Artifacts

UNION ALL

SELECT 
    Id,
    'Manuscripts' AS Category,
    'Manuscrise & Cărți Rare' AS CategoryNameRo,
    Title,
    Author AS Creator,
    YearCreated,
    Period,
    ImageUrl,
    Description,
    HistoricalSignificance,
    Language + ' / ' + ISNULL(ScriptType, '') + ' (' + CAST(ISNULL(PageCount, 0) AS NVARCHAR(20)) + ' pagini)' AS KeySpecification,
    LocationInMuseum,
    IsFeatured,
    AudioGuideUrl,
    CreatedAt
FROM dbo.Exhibits_Manuscripts;
GO

-- ==========================================================
-- 6. Date Demonstrative (Seed Data)
-- ==========================================================

-- Picturi
INSERT INTO dbo.Exhibits_Paintings 
(Title, Artist, YearCreated, Period, ImageUrl, Description, HistoricalSignificance, Medium, CanvasType, Dimensions, FrameType, LocationInMuseum, IsFeatured)
VALUES 
(
    N'Noaptea Înstelată (The Starry Night)', 
    N'Vincent van Gogh', 
    1889, 
    N'Postimpresionism', 
    N'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80',
    N'Capodoperă absolută ce descrie priveliștea de la fereastra azilului Saint-Paul-de-Mausole cu puțin timp înainte de răsărit, îmbogățită de cerul vârtejos și satul idealizat.',
    N'Una dintre cele mai recunoscute picturi din istoria culturii occidentale.',
    N'Ulei pe pânză', 
    N'Pânză grunduită manual', 
    N'73.7 x 92.1 cm', 
    N'Ramă clasică din lemn de nuc finisată mat', 
    N'Galeria de Artă Modernă - Sala 1', 
    1
),
(
    N'Portretul Iluminat al Doamnei cu Hermină', 
    N'Leonardo da Vinci', 
    1489, 
    N'Renașterea Italiană', 
    N'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=1200&q=80',
    N'Lucrare reprezentativă a Renașterii ce o surprinde pe Cecilia Gallerani, amanta ducelui de Milano, îmbrăcată în moda spaniolă de epocă.',
    N'Inovație uluitoare în tehnica clarobscurului și redarea dinamicii anatomice.',
    N'Ulei pe panou de nuc', 
    N'Panou de lemn de nuc selecționat', 
    N'54.8 x 40.3 cm', 
    N'Ramă florentină aurită manual', 
    N'Aripa Renașterii - Sala Regală', 
    1
),
(
    N'Rondul de Noapte', 
    N'Rembrandt van Rijn', 
    1642, 
    N'Secolul de Aur Olandez', 
    N'https://images.unsplash.com/photo-1576769267415-9642010aa962?auto=format&fit=crop&w=1200&q=80',
    N'Compoziție monumentală renumită pentru utilizarea dramatică a luminii și a mișcării într-un portret militar colectiv.',
    N'A revoluționat pictura de grup prin dinamismul compozițional.',
    N'Ulei pe pânză de in', 
    N'Pânză dublu întinsă', 
    N'363 x 437 cm', 
    N'Ramă monumentală de stejar băițuit', 
    N'Galeria Barocă - Pavilionul Central', 
    0
);

-- Sculpturi
INSERT INTO dbo.Exhibits_Sculptures 
(Title, Sculptor, YearCreated, Period, ImageUrl, Description, HistoricalSignificance, Material, WeightKg, Dimensions, PedestalType, CarvingTechnique, LocationInMuseum, IsFeatured)
VALUES
(
    N'Victoria Înaripată din Samothrace (Nike)', 
    N'Maestru Elenistic Anonim', 
    -190, 
    N'Perioada Elenistică', 
    N'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80',
    N'Zeița greacă a victoriei, Nike, surprinsă coborând din ceruri pe prora unei corăbii de luptă, cu veșmintele bătute de vânt.',
    N'Capodoperă elenistică admirată pe scara de onoare Daru pentru dinamismul faldurilor drapajului.',
    N'Marmură albă de Paros', 
    320.00, 
    N'244 x 135 x 180 cm', 
    N'Soclul original în formă de proră de navă din marmură de Lartos', 
    N'Sculptură în ronde-bosse cu cizelare virtuoză', 
    N'Scara Monumentală Centrală', 
    1
),
(
    N'David din Florența (Studiu Monumental)', 
    N'Michelangelo Buonarroti', 
    1504, 
    N'Renașterea Italiană', 
    N'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80',
    N'Întruchipare sublimă a frumuseții umane și a curajului civic, reprezentându-l pe eroul biblic David înaintea înfruntării cu Goliat.',
    N'Simbolul libertăților Republicii Florentine și apogeul sculpturii renascentiste.',
    N'Marmură de Carrara statuară', 
    5660.00, 
    N'517 x 198 x 140 cm', 
    N'Bază masivă de marmură armată structural', 
    N'Tăiere directă dintr-un singur bloc monolitic', 
    N'Tribuna Rotondei Mari', 
    1
),
(
    N'Gânditorul (Le Penseur)', 
    N'Auguste Rodin', 
    1904, 
    N'Modernism Clasic', 
    N'https://images.unsplash.com/photo-1569783723344-93358055fb34?auto=format&fit=crop&w=1200&q=80',
    N'Figură nudă masculină așezată pe o stâncă, absorbită într-o profundă meditație intelectuală și luptă interioară.',
    N'Proiectat inițial ca reprezentare a lui Dante în fața Porților Infernului.',
    N'Bronz turnat cu patină neagră-verzuie', 
    750.00, 
    N'186 x 98 x 140 cm', 
    N'Bloc cioplit din piatră de andezit', 
    N'Turnare în ceară pierdută', 
    N'Grădina de Sculptură Interioară', 
    0
);

-- Arheologie & Antichități
INSERT INTO dbo.Exhibits_Artifacts
(Title, OriginCulture, Era, ImageUrl, Description, HistoricalSignificance, Material, DiscoverySite, PreservationStatus, Dimensions, LocationInMuseum, IsFeatured)
VALUES
(
    N'Masca Funerară de Aur a Faraonului', 
    N'Egiptul Antic - Dinastia a XVIII-a', 
    N'cca. 1323 î.Hr. (Noul Regat)', 
    N'https://images.unsplash.com/photo-1608371945786-d47d3cdd31da?auto=format&fit=crop&w=1200&q=80',
    N'Masca funerară regală din foiță groasă de aur, împodobită cu pastă de sticlă colorată, cuarț, lapis lazuli și obsidian.',
    N'Una dintre cele mai celebre descoperiri arheologice ale secolului XX din mormântul KV62.',
    N'Aur de 24 carate, Lapis Lazuli, Obsidian, Sticlă colorată', 
    N'Mormântul KV62, Valea Regilor, Teba', 
    N'Stare excepțională, conservată impecabil', 
    N'54 x 39.3 x 49 cm', 
    N'Tezaurul Faraonilor - Vitrina Criptă', 
    1
),
(
    N'Vas Amforă Panatenaică cu Figuri Negre', 
    N'Atena - Grecia Antică', 
    N'cca. 530 î.Hr. (Perioada Arhaică)', 
    N'https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=1200&q=80',
    N'Vas ceramic ceremonial oferit ca premiu la Jocurile Panatenaice, pictat cu silueta zeiței Atena Promachos înarmată cu suliță și scut.',
    N'Documentează tradițiile atletice și meșteșugul vaselor ceramice atice.',
    N'Argilă arsă fină cu glazură ceramică neagră', 
    N'Acropola din Atena', 
    N'Completă, restaurare minimă a toartelor', 
    N'62 x 34 cm diametru', 
    N'Aripa Mediteraneană - Sala Antichității', 
    0
),
(
    N'Casca Romană de Paradă cu Mască de Argint', 
    N'Imperiul Roman - Garda Pretoriană', 
    N'Secolul I d.Hr.', 
    N'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1200&q=80',
    N'Coif de ceremonie din bronz acoperit cu argint masiv cizelat fin, reprezentând chipul idealizat al zeului războiului Marte.',
    N'Folosită în turnirurile militare imperiale Hippika Gymnasia.',
    N'Bronz aurit, Argint filigranat', 
    N'Castrul Roman Apulum', 
    N'Conservată în atmosferă controlată cu argon', 
    N'32 x 25 x 28 cm', 
    N'Sala Armurilor Antice', 
    0
);

-- Manuscrise & Documente Rare
INSERT INTO dbo.Exhibits_Manuscripts
(Title, Author, YearCreated, Period, ImageUrl, Description, HistoricalSignificance, Language, ScriptType, PageCount, BindingMaterial, ConditionReport, LocationInMuseum, IsFeatured)
VALUES
(
    N'Evangheliarul Iluminat de la Lorsch (Codex Aureus)', 
    N'Școala de Caligrafi a Curții Carolingiene', 
    810, 
    N'Renașterea Carolingiană', 
    N'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
    N'Manuscris iluminat scris integral cu cerneală din pulbere de aur pe pergament fin de vițel, ornat cu miniaturi policrome excepționale.',
    N'Considerat una dintre cele mai prețioase cărți de artă carolingiană din lume.',
    N'Latină ecleziastică', 
    N'Uncială carolingiană cu inițiale aurite', 
    474, 
    N'Tăblițe de fildeș sculptat cu ferecături de argint și pietre semiprețioase', 
    N'Stabilizat, consultabil doar în condiții de microclimat protejat', 
    N'Seiful de Manuscrise Rare', 
    1
),
(
    N'Harta Cerească și Tratat de Navigație Astronomică', 
    N'Cartografii Venețieni & Arabi', 
    1482, 
    N'Zorii Marilor Descoperiri Geografice', 
    N'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80',
    N'Atlas nautic portulan cu diagrame astronomice detaliate, roze ale vânturilor și coordonate ale constelațiilor emisferei nordice.',
    N'Instrument esențial care a deschis rutele maritime spre Orient.',
    N'Latină și Arabă clasică', 
    N'Scriere cursivă renascentistă cu cerneală sepia și pigmenți de cobalt', 
    86, 
    N'Piele de căprioară tăbăcită vegetal', 
    N'Conservare foarte bună, pagini stabilizate chimic', 
    N'Sala Globurilor și Hărților Istorice', 
    0
);
GO

PRINT '>>> Baza de date MuseumDB și toate tabelele au fost create și populate cu succes! <<<';
GO
