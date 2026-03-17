const express = require('express');
const multer = require('multer');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const bwipjs = require('bwip-js');

const app = express();
const port = 3001;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.json());

const MM_TO_POINTS = 2.83465;
const A4_WIDTH = 210 * MM_TO_POINTS;
const A4_HEIGHT = 297 * MM_TO_POINTS;
const CARD_WIDTH = 92 * MM_TO_POINTS;
const CARD_HEIGHT = 57 * MM_TO_POINTS;
const COLUMN_GAP = 6 * MM_TO_POINTS;
const ROW_GAP = 0 * MM_TO_POINTS;

// Helper: Hex to RGB
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : null;
};

// Helper: Parse TXT file for numbers
const parseTxtFile = (buffer) => {
  if (!buffer) return null;
  const content = buffer.toString('utf-8');
  const lines = content.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
  if (lines.length <= 1) return []; // Only header or empty
  return lines.slice(1); // Skip header (e.g., "NUM")
};

// Helper: Generate numbers from range
const generateRangeNumbers = (range) => {
  if (!range) return [];
  const [startStr, endStr] = range.split('-');
  const startNum = parseInt(startStr, 10);
  const endNum = parseInt(endStr, 10);
  const numLength = startStr.length;
  const numbers = [];
  for (let i = startNum; i <= endNum; i++) {
    numbers.push(String(i).padStart(numLength, '0'));
  }
  return numbers;
};

// Helper: Generate Barcode Image Buffer
const generateBarcodeBuffer = async (text, width, height) => {
  return bwipjs.toBuffer({
    bcid: 'code128',       // Barcode type
    text: text,           // Text to encode
    scale: 3,             // 3x scaling factor
    height: height || 10, // Bar height, in millimeters
    includetext: false,   // Do not include text below barcode
  });
};

// Refactored Endpoint: Preview
app.post('/generate-preview', upload.fields([
  { name: 'pdfFile', maxCount: 1 }, 
  { name: 'txtFile', maxCount: 1 },
  { name: 'bgFile', maxCount: 1 }
]), async (req, res) => {
  try {
    const { 
      number, x, y, fontSize, color, font, range,
      enableNumbering, showBarcode, barcodeX, barcodeY, barcodeWidth, barcodeHeight 
    } = req.body;
    const pdfFile = req.files['pdfFile'] ? req.files['pdfFile'][0] : null;
    const txtFile = req.files['txtFile'] ? req.files['txtFile'][0] : null;

    if (!pdfFile) return res.status(400).send('No PDF file uploaded.');

    const uploadedPdfBytes = pdfFile.buffer;
    const doc = await PDFDocument.load(uploadedPdfBytes);
    const [page] = await doc.getPages();

    if (enableNumbering === 'true') {
      const fontToUse = await doc.embedFont(font || StandardFonts.Helvetica);
      const textColor = hexToRgb(color || '#000000');

      // Determine preview number
      let previewNum = number;
      if (!previewNum) {
        const fileNumbers = parseTxtFile(txtFile ? txtFile.buffer : null);
        if (fileNumbers && fileNumbers.length > 0) {
          previewNum = fileNumbers[0];
        } else {
          const rangeNumbers = generateRangeNumbers(range);
          previewNum = rangeNumbers.length > 0 ? rangeNumbers[0] : '00001';
        }
      }

      // Draw text
      page.drawText(String(previewNum), {
        x: parseFloat(x) * MM_TO_POINTS,
        y: CARD_HEIGHT - parseFloat(y) * MM_TO_POINTS - parseFloat(fontSize) * 0.8,
        font: fontToUse,
        size: parseFloat(fontSize),
        color: rgb(textColor.r, textColor.g, textColor.b),
      });

      // Draw barcode
      if (showBarcode === 'true') {
        try {
          const barcodeBuffer = await generateBarcodeBuffer(previewNum, parseFloat(barcodeWidth), parseFloat(barcodeHeight));
          const barcodeImage = await doc.embedPng(barcodeBuffer);
          
          page.drawImage(barcodeImage, {
            x: parseFloat(barcodeX) * MM_TO_POINTS,
            y: CARD_HEIGHT - parseFloat(barcodeY) * MM_TO_POINTS - parseFloat(barcodeHeight) * MM_TO_POINTS,
            width: parseFloat(barcodeWidth) * MM_TO_POINTS,
            height: parseFloat(barcodeHeight) * MM_TO_POINTS,
          });
        } catch (err) {
          console.error('Barcode generation error:', err);
        }
      }
    }

    const pdfBytes = await doc.save();
    res.setHeader('Content-type', 'application/pdf');
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Preview Error:', error);
    res.status(500).send('Error generating preview');
  }
});

// Refactored Endpoint: Full PDF
app.post('/generate-pdf', upload.fields([
  { name: 'pdfFile', maxCount: 1 }, 
  { name: 'txtFile', maxCount: 1 },
  { name: 'bgFile', maxCount: 1 }
]), async (req, res) => {
  try {
    const { 
      range, x, y, fontSize, color, font,
      enableNumbering, showBarcode, barcodeX, barcodeY, barcodeWidth, barcodeHeight 
    } = req.body;
    const pdfFile = req.files['pdfFile'] ? req.files['pdfFile'][0] : null;
    const txtFile = req.files['txtFile'] ? req.files['txtFile'][0] : null;
    const bgFile = req.files['bgFile'] ? req.files['bgFile'][0] : null;

    if (!pdfFile) return res.status(400).send('No PDF file uploaded.');

    const resultDoc = await PDFDocument.create();
    const uploadedPdfBytes = pdfFile.buffer;

    // Embed background if provided
    let bgEmbeddedPage = null;
    if (bgFile) {
      const bgDoc = await PDFDocument.load(bgFile.buffer);
      const [bgPage] = await bgDoc.getPages();
      bgEmbeddedPage = await resultDoc.embedPage(bgPage);
    }

    if (enableNumbering === 'true') {
      let numbers = parseTxtFile(txtFile ? txtFile.buffer : null);
      if (!numbers || numbers.length === 0) {
        numbers = generateRangeNumbers(range);
      }
      if (numbers.length === 0) return res.status(400).send('No numbers provided.');

      const fontToUse = await resultDoc.embedFont(font || StandardFonts.Helvetica);
      const textColor = hexToRgb(color || '#000000');
      let currentIdx = 0;

      while (currentIdx < numbers.length) {
        const resultPage = resultDoc.addPage([A4_WIDTH, A4_HEIGHT]);
        if (bgEmbeddedPage) resultPage.drawPage(bgEmbeddedPage, { x: 0, y: 0, width: A4_WIDTH, height: A4_HEIGHT });

        const uploadedDoc = await PDFDocument.load(uploadedPdfBytes);
        const [uploadedPage] = await uploadedDoc.getPages();
        const embeddedPage = await resultDoc.embedPage(uploadedPage);

        const totalContentWidth = (CARD_WIDTH * 2) + COLUMN_GAP;
        const totalContentHeight = (CARD_HEIGHT * 5) + (ROW_GAP * 4);
        const startX = (A4_WIDTH - totalContentWidth) / 2;
        const startY = (A4_HEIGHT - totalContentHeight) / 2;

        for (let row = 0; row < 5; row++) {
          for (let col = 0; col < 2; col++) {
            if (currentIdx >= numbers.length) break;

            const posX = startX + col * (CARD_WIDTH + COLUMN_GAP);
            const posY = startY + (4 - row) * (CARD_HEIGHT + ROW_GAP);

            resultPage.drawPage(embeddedPage, { x: posX, y: posY, width: CARD_WIDTH, height: CARD_HEIGHT });

            const currentNumText = String(numbers[currentIdx]);

            resultPage.drawText(currentNumText, {
              x: posX + parseFloat(x) * MM_TO_POINTS,
              y: posY + CARD_HEIGHT - parseFloat(y) * MM_TO_POINTS - parseFloat(fontSize) * 0.8,
              font: fontToUse,
              size: parseFloat(fontSize),
              color: rgb(textColor.r, textColor.g, textColor.b),
            });

            if (showBarcode === 'true') {
              try {
                const barcodeBuffer = await generateBarcodeBuffer(currentNumText, parseFloat(barcodeWidth), parseFloat(barcodeHeight));
                const barcodeImage = await resultDoc.embedPng(barcodeBuffer);
                resultPage.drawImage(barcodeImage, {
                  x: posX + parseFloat(barcodeX) * MM_TO_POINTS,
                  y: posY + CARD_HEIGHT - parseFloat(barcodeY) * MM_TO_POINTS - parseFloat(barcodeHeight) * MM_TO_POINTS,
                  width: parseFloat(barcodeWidth) * MM_TO_POINTS,
                  height: parseFloat(barcodeHeight) * MM_TO_POINTS,
                });
              } catch (err) { console.error('Barcode generation error:', err); }
            }
            currentIdx++;
          }
          if (currentIdx >= numbers.length) break;
        }
      }
    } else {
      // Logic for no numbering
      const resultPage = resultDoc.addPage([A4_WIDTH, A4_HEIGHT]);
      if (bgEmbeddedPage) resultPage.drawPage(bgEmbeddedPage, { x: 0, y: 0, width: A4_WIDTH, height: A4_HEIGHT });

      const uploadedDoc = await PDFDocument.load(uploadedPdfBytes);
      const [uploadedPage] = await uploadedDoc.getPages();
      const embeddedPage = await resultDoc.embedPage(uploadedPage);

      const totalContentWidth = (CARD_WIDTH * 2) + COLUMN_GAP;
      const totalContentHeight = (CARD_HEIGHT * 5) + (ROW_GAP * 4);
      const startX = (A4_WIDTH - totalContentWidth) / 2;
      const startY = (A4_HEIGHT - totalContentHeight) / 2;

      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 2; col++) {
          const posX = startX + col * (CARD_WIDTH + COLUMN_GAP);
          const posY = startY + (4 - row) * (CARD_HEIGHT + ROW_GAP);
          resultPage.drawPage(embeddedPage, { x: posX, y: posY, width: CARD_WIDTH, height: CARD_HEIGHT });
        }
      }
    }

    const pdfBytes = await resultDoc.save();
    res.setHeader('Content-disposition', 'attachment; filename="numbered_labels.pdf"');
    res.setHeader('Content-type', 'application/pdf');
    res.send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error('Generation Error:', error);
    res.status(500).send('Error generating PDF');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
