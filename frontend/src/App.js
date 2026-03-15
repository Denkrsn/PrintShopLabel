import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

const StandardFonts = {
  Courier: 'Courier',
  CourierBold: 'Courier-Bold',
  CourierOblique: 'Courier-Oblique',
  CourierBoldOblique: 'Courier-BoldOblique',
  Helvetica: 'Helvetica',
  HelveticaBold: 'Helvetica-Bold',
  HelveticaOblique: 'Helvetica-Oblique',
  HelveticaBoldOblique: 'Helvetica-BoldOblique',
  TimesRoman: 'Times-Roman',
  TimesRomanBold: 'Times-Roman-Bold',
  TimesRomanItalic: 'Times-Roman-Italic',
  TimesRomanBoldItalic: 'Times-Roman-BoldItalic',
  Symbol: 'Symbol',
  ZapfDingbats: 'ZapfDingbats',
};

const App = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [bgFile, setBgFile] = useState(null);
  const [txtFile, setTxtFile] = useState(null);
  const [range, setRange] = useState('00001-00010');
  const [x, setX] = useState(82);
  const [y, setY] = useState(52);
  const [fontSize, setFontSize] = useState(12);
  const [color, setColor] = useState('#000000');
  const [font, setFont] = useState(StandardFonts.Helvetica);
  
  // Barcode settings
  const [showBarcode, setShowBarcode] = useState(false);
  const [barcodeX, setBarcodeX] = useState(10);
  const [barcodeY, setBarcodeY] = useState(45);
  const [barcodeWidth, setBarcodeWidth] = useState(30);
  const [barcodeHeight, setBarcodeHeight] = useState(8);

  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const generatePreview = useCallback(async () => {
    if (!pdfFile) return;

    const formData = new FormData();
    formData.append('pdfFile', pdfFile);
    if (bgFile) formData.append('bgFile', bgFile);
    if (txtFile) formData.append('txtFile', txtFile);
    formData.append('range', range);
    formData.append('x', x);
    formData.append('y', y);
    formData.append('fontSize', fontSize);
    formData.append('color', color);
    formData.append('font', font);
    
    // Barcode params
    formData.append('showBarcode', showBarcode);
    formData.append('barcodeX', barcodeX);
    formData.append('barcodeY', barcodeY);
    formData.append('barcodeWidth', barcodeWidth);
    formData.append('barcodeHeight', barcodeHeight);

    try {
      const response = await fetch('/generate-preview', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Preview generation failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (error) {
      console.error(error);
    }
  }, [pdfFile, bgFile, txtFile, range, x, y, fontSize, color, font, showBarcode, barcodeX, barcodeY, barcodeWidth, barcodeHeight]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      generatePreview();
    }, 500);
    return () => clearTimeout(debounce);
  }, [generatePreview]);

  const handleGeneratePdf = async () => {
    if (!pdfFile) return alert('Please select a PDF template.');
    setLoading(true);

    const formData = new FormData();
    formData.append('pdfFile', pdfFile);
    if (bgFile) formData.append('bgFile', bgFile);
    if (txtFile) formData.append('txtFile', txtFile);
    formData.append('range', range);
    formData.append('x', x);
    formData.append('y', y);
    formData.append('fontSize', fontSize);
    formData.append('color', color);
    formData.append('font', font);

    // Barcode params
    formData.append('showBarcode', showBarcode);
    formData.append('barcodeX', barcodeX);
    formData.append('barcodeY', barcodeY);
    formData.append('barcodeWidth', barcodeWidth);
    formData.append('barcodeHeight', barcodeHeight);

    try {
      const response = await fetch('/generate-pdf', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('PDF generation failed');
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', 'numbered_labels.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error(error);
      alert('Error generating PDF.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="logo-container">
          <img src="/logo.png" alt="ID-Cards Logo" className="logo" />
        </div>
        <h1>PrintShopLabel Web</h1>
        <p className="developer-info">Developed by: Denis Haniewicz for personal use.</p>
        
        <div className="container">
          <div className="settings">
            <h3>General Settings</h3>
            <div className="form-row">
              <label>Card Template (PDF):</label>
              <input type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files[0])} />
            </div>
            <div className="form-row">
              <label>A4 Background (PDF):</label>
              <input type="file" accept="application/pdf" onChange={(e) => setBgFile(e.target.files[0])} />
            </div>
            <div className="form-row">
              <label>Numbers (TXT):</label>
              <input type="file" accept=".txt" onChange={(e) => setTxtFile(e.target.files[0])} />
            </div>
            {!txtFile && (
              <div className="form-row">
                <label>Number Range:</label>
                <input type="text" value={range} onChange={(e) => setRange(e.target.value)} />
              </div>
            )}
            
            <h3>Text Settings</h3>
            <div className="form-row">
              <label>X Position (mm):</label>
              <input type="number" value={x} onChange={(e) => setX(e.target.value)} />
            </div>
            <div className="form-row">
              <label>Y Position (mm):</label>
              <input type="number" value={y} onChange={(e) => setY(e.target.value)} />
            </div>
            <div className="form-row">
              <label>Font Size (pt):</label>
              <input type="number" value={fontSize} onChange={(e) => setFontSize(e.target.value)} />
            </div>
            <div className="form-row">
              <label>Color:</label>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
            <div className="form-row">
              <label>Font:</label>
              <select value={font} onChange={(e) => setFont(e.target.value)}>
                {Object.keys(StandardFonts).map(f => <option key={f} value={StandardFonts[f]}>{f}</option>)}
              </select>
            </div>

            <h3>Barcode Settings</h3>
            <div className="form-row">
              <label>Show Barcode:</label>
              <input type="checkbox" checked={showBarcode} onChange={(e) => setShowBarcode(e.target.checked)} />
            </div>
            {showBarcode && (
              <>
                <div className="form-row">
                  <label>Barcode X (mm):</label>
                  <input type="number" value={barcodeX} onChange={(e) => setBarcodeX(e.target.value)} />
                </div>
                <div className="form-row">
                  <label>Barcode Y (mm):</label>
                  <input type="number" value={barcodeY} onChange={(e) => setBarcodeY(e.target.value)} />
                </div>
                <div className="form-row">
                  <label>Barcode Width (mm):</label>
                  <input type="number" value={barcodeWidth} onChange={(e) => setBarcodeWidth(e.target.value)} />
                </div>
                <div className="form-row">
                  <label>Barcode Height (mm):</label>
                  <input type="number" value={barcodeHeight} onChange={(e) => setBarcodeHeight(e.target.value)} />
                </div>
              </>
            )}

            <button onClick={handleGeneratePdf} disabled={!pdfFile || loading} style={{ marginTop: '20px' }}>
              {loading ? 'Generating...' : 'Generate Final PDF'}
            </button>
          </div>
          <div className="preview">
            <h3>Preview</h3>
            {previewUrl ? (
              <iframe src={previewUrl} width="100%" height="650px" title="PDF Preview" />
            ) : (
              <p>Upload a PDF template to see the preview.</p>
            )}
            <div style={{fontSize: '12px', color: '#888', marginTop: '15px', textAlign: 'center'}}>
              Note: Background PDF is applied only to the final A4 output.
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};

export default App;
