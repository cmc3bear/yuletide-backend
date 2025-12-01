const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize SQLite database
const db = new Database(path.join(__dirname, 'yuletide.db'));

// Create gifts table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS gifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kid TEXT NOT NULL,
    item TEXT,
    link TEXT,
    helper TEXT,
    deliveryDate TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Initialize with default data if empty
const count = db.prepare('SELECT COUNT(*) as count FROM gifts').get();
if (count.count === 0) {
  const initialData = [
    // Niko
    { kid: "Niko", item: "VTech Touch and Learn Activity Desk 4-in-1 (Age 3–5)", link: "https://www.amazon.com/dp/B01LXLAFJP", helper: "", deliveryDate: "" },
    { kid: "Niko", item: "LeapFrog Prep for Preschool Math Book", link: "https://www.amazon.com/dp/B0CSNB7BQD", helper: "", deliveryDate: "" },
    { kid: "Niko", item: "Montessori Mama Wooden Puzzle for Kids", link: "https://www.amazon.com/dp/B0DHPXVN8B", helper: "", deliveryDate: "" },
    { kid: "Niko", item: "Learning Resources All Ready for Kindergarten", link: "https://www.amazon.com/dp/B00SJ66RS6", helper: "", deliveryDate: "" },
    { kid: "Niko", item: "Aizweb Classroom Calendar Pocket Chart", link: "https://www.amazon.com/dp/B0CBBKBXDS", helper: "", deliveryDate: "" },

    // Abby
    { kid: "Abby", item: "Ms Rachel Sing and Talk Toy Doll", link: "https://www.amazon.com/dp/B0CX24138S", helper: "", deliveryDate: "" },
    { kid: "Abby", item: "Fisher-Price Baby's First Blocks and Stack Toy", link: "https://www.amazon.com/dp/B077H5G2Q3", helper: "", deliveryDate: "" },
    { kid: "Abby", item: "Adena Montessori 4-in-1 Wooden Play Kit", link: "https://www.amazon.com/dp/B09TW84N12", helper: "", deliveryDate: "" },
    { kid: "Abby", item: "Any activity table", link: "", helper: "", deliveryDate: "" },

    // Ben
    { kid: "Ben", item: "Beyblade X String Launcher Set (2 Pack)", link: "https://www.amazon.com/String-Launcher-Players-Battles-Spinning/dp/B0DSHZSKK4", helper: "", deliveryDate: "" },
    { kid: "Ben", item: "Battling Tops Game Set (Arena + Launchers)", link: "https://www.amazon.com/dp/B0D1K222SP", helper: "", deliveryDate: "" },
    { kid: "Ben", item: "Beyblade X Dagger Dran 4-70Q Booster", link: "https://www.amazon.com/BEYBLADE-Dagger-Booster-Takara-Battling/dp/B0DN6YYL8G", helper: "", deliveryDate: "" },
    { kid: "Ben", item: "Roblox Robux Digital Gift Card", link: "https://www.amazon.com/Robux-Roblox-Online-Game-Code/dp/B07RZ74VLR", helper: "", deliveryDate: "" },
    { kid: "Ben", item: "Italian Brainrot Squishy Figures (24 pcs)", link: "https://www.amazon.com/Italian-Brainrot-Collection-Silicone-Dashboard/dp/B0FTMS4PPQ", helper: "", deliveryDate: "" },

    // Olive
    { kid: "Olive", item: "Pottery Wheel for Kids – Complete Painting Kit", link: "https://www.amazon.com/Pottery-Wheel-Kids-Complete-Painting/dp/B0D5R6WWPZ", helper: "", deliveryDate: "" },
    { kid: "Olive", item: "Acrylic Painting Creativity Set (Metallic + Standard)", link: "https://www.amazon.com/Painting-Creativity-Supplies-Metallic-Standard/dp/B08HD89CX6", helper: "", deliveryDate: "" },
    { kid: "Olive", item: "Desire Deluxe Temporary Hair Colour / Makeup Set", link: "https://www.amazon.com/Desire-Deluxe-Makeup-Temporary-Colour/dp/B07FTGLWDR", helper: "", deliveryDate: "" },
    { kid: "Olive", item: "Minecraft Minecoins Pack (Digital Code)", link: "https://www.amazon.com/Minecraft-Minecoins-Pack-Coins-Digital/dp/B07FYN4SBM", helper: "", deliveryDate: "" },

    // Blank rows
    { kid: "Elanor", item: "", link: "", helper: "", deliveryDate: "" },
    { kid: "Henry", item: "", link: "", helper: "", deliveryDate: "" },
    { kid: "Yasha", item: "", link: "", helper: "", deliveryDate: "" },
    { kid: "Rown", item: "", link: "", helper: "", deliveryDate: "" }
  ];

  const insert = db.prepare('INSERT INTO gifts (kid, item, link, helper, deliveryDate) VALUES (?, ?, ?, ?, ?)');
  const insertMany = db.transaction((gifts) => {
    for (const gift of gifts) {
      insert.run(gift.kid, gift.item, gift.link, gift.helper, gift.deliveryDate);
    }
  });
  insertMany(initialData);
  console.log('✅ Database initialized with default data');
}

// API Routes

// GET all gifts
app.get('/api/gifts', (req, res) => {
  try {
    const gifts = db.prepare('SELECT * FROM gifts ORDER BY id').all();
    res.json(gifts);
  } catch (error) {
    console.error('Error fetching gifts:', error);
    res.status(500).json({ error: 'Failed to fetch gifts' });
  }
});

// GET single gift
app.get('/api/gifts/:id', (req, res) => {
  try {
    const gift = db.prepare('SELECT * FROM gifts WHERE id = ?').get(req.params.id);
    if (!gift) {
      return res.status(404).json({ error: 'Gift not found' });
    }
    res.json(gift);
  } catch (error) {
    console.error('Error fetching gift:', error);
    res.status(500).json({ error: 'Failed to fetch gift' });
  }
});

// POST create new gift
app.post('/api/gifts', (req, res) => {
  try {
    const { kid, item, link, helper, deliveryDate } = req.body;
    const result = db.prepare(
      'INSERT INTO gifts (kid, item, link, helper, deliveryDate) VALUES (?, ?, ?, ?, ?)'
    ).run(kid || '', item || '', link || '', helper || '', deliveryDate || '');

    const newGift = db.prepare('SELECT * FROM gifts WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newGift);
  } catch (error) {
    console.error('Error creating gift:', error);
    res.status(500).json({ error: 'Failed to create gift' });
  }
});

// PUT update gift
app.put('/api/gifts/:id', (req, res) => {
  try {
    const { kid, item, link, helper, deliveryDate } = req.body;
    const result = db.prepare(
      'UPDATE gifts SET kid = ?, item = ?, link = ?, helper = ?, deliveryDate = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(kid || '', item || '', link || '', helper || '', deliveryDate || '', req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Gift not found' });
    }

    const updatedGift = db.prepare('SELECT * FROM gifts WHERE id = ?').get(req.params.id);
    res.json(updatedGift);
  } catch (error) {
    console.error('Error updating gift:', error);
    res.status(500).json({ error: 'Failed to update gift' });
  }
});

// DELETE gift
app.delete('/api/gifts/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM gifts WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Gift not found' });
    }
    res.json({ message: 'Gift deleted successfully' });
  } catch (error) {
    console.error('Error deleting gift:', error);
    res.status(500).json({ error: 'Failed to delete gift' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎄 Yuletide Backend running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${path.join(__dirname, 'yuletide.db')}`);
  console.log(`🚀 API endpoints:`);
  console.log(`   GET    /api/gifts       - Get all gifts`);
  console.log(`   GET    /api/gifts/:id   - Get single gift`);
  console.log(`   POST   /api/gifts       - Create gift`);
  console.log(`   PUT    /api/gifts/:id   - Update gift`);
  console.log(`   DELETE /api/gifts/:id   - Delete gift`);
  console.log(`   GET    /api/health      - Health check`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  console.log('\n👋 Database closed. Server shutting down...');
  process.exit(0);
});
