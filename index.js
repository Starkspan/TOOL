
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import vision from '@google-cloud/vision';
import { fromPath } from 'pdf2pic';
import path from 'path';

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

    const outputDir = "converted";
    fs.mkdirSync(outputDir, { recursive: true });
    const outputName = uuidv4();
    const outputPath = `${outputDir}/${outputName}`;

    await convertPdfToPng(file.path, outputPath);

    const [result] = await client.textDetection(`${outputPath}.1.png`);
    const text = result.fullTextAnnotation?.text || '';

    const laufzeitMin = 5;
    const ruestkosten = 60;
    const bearbeitung = (laufzeitMin / 60) * 30;
    const gesamt = (ruestkosten + bearbeitung) / stueckzahl;

    res.json({
      preis: gesamt,
      rohtext: text
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Analyse fehlgeschlagen.' });
  }
});

async function convertPdfToPng(inputPath, outputPath) {
  const options = {
    density: 200,
    saveFilename: outputPath.split('/').pop(),
    savePath: path.dirname(outputPath),
    format: "png",
    width: 1000,
    height: 1414,
  };

  const storeAsImage = fromPath(inputPath, options);
  await storeAsImage(1); // erste Seite konvertieren
}

app.listen(port, () => {
  console.log(`🚀 Server läuft auf Port ${port}`);
});
