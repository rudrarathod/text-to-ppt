import express from 'express';
import cors from 'cors';
import { chromium } from 'playwright';

const app = express();
app.use(cors());
app.use(express.json({ limit: '100mb' }));

app.post('/api/export-pdf', async (req, res) => {
  const { html, name } = req.body;
  
  if (!html) {
    return res.status(400).send('HTML is required');
  }

  let browser;
  try {
    console.log(`Generating PDF for: ${name || 'Presentation'}`);
    browser = await chromium.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Set viewport to 16:9
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Set content and wait for it to be loaded
    await page.setContent(html, { waitUntil: 'networkidle' });
    
    // Wait for fonts to be ready
    await page.evaluateHandle(() => document.fonts.ready);
    
    // Give a small buffer for any final animations or renderings
    await page.waitForTimeout(500);

    const pdfBuffer = await page.pdf({
      printBackground: true,
      width: '1280px',
      height: '720px',
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      pageRanges: '1-' // Ensure all pages are printed
    });

    res.contentType('application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${name || 'presentation'}.pdf"`);
    res.send(pdfBuffer);
    console.log('PDF generated successfully');
  } catch (err: any) {
    console.error('PDF Generation Error:', err);
    res.status(500).send(err.message);
  } finally {
    if (browser) await browser.close();
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`PDF Server running at http://localhost:${PORT}`);
});
