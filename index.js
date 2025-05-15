
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import vision from '@google-cloud/vision';

const app = express();
const port = process.env.PORT || 3001;
const upload = multer({ dest: 'uploads/' });
const client = new vision.ImageAnnotatorClient();

app.use(cors());

app.post('/pdf/analyze', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const stueckzahl = parseInt(req.body.stueckzahl || '1');
    const zielpreis = req.body.zielpreis || null;

    if (!file.mimetype.startsWith("image/")) {
      return res.status(400).json({ error: "Nur Bilddateien erlaubt." });
    }

    const [result] = await client.textDetection(file.path);
    const text = result.fullTextAnnotation?.text || '';

    const laufzeitMin = 5;
    const ruestkosten = 60;
    const bearbeitung = (laufzeitMin / 60) * 30;
    const gesamt = (ruestkosten + bearbeitung) / stueckzahl;

    res.json({
      preis: gesamt,
      rohtext: text
    });

    fs.unlink(file.path, () => {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Analyse fehlgeschlagen.' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server läuft auf Port ${port}`);
});
