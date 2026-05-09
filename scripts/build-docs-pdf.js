// Convert every docs/*.md to PDF, rendering Mermaid diagrams via headless Chromium.
// Usage:  node scripts/build-docs-pdf.js
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const puppeteer = require('puppeteer');

const DOCS_DIR = path.join(__dirname, '..', 'docs');
const OUT_DIR = path.join(DOCS_DIR, 'pdf');

// --- Marked: emit mermaid code blocks as <pre class="mermaid"> ---
const renderer = new marked.Renderer();
const baseCode = renderer.code.bind(renderer);
renderer.code = (code, lang) => {
  if (lang === 'mermaid') {
    const text = typeof code === 'string' ? code : code?.text || '';
    return `<pre class="mermaid">${text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')}</pre>`;
  }
  return baseCode(code, lang);
};
marked.setOptions({ renderer, gfm: true, breaks: false });

const CSS = `
  body{font-family:-apple-system,"Segoe UI",Helvetica,Arial,sans-serif;font-size:11pt;color:#1f2328;line-height:1.5;margin:0;padding:0 4px;}
  h1{font-size:22pt;border-bottom:2px solid #d0d7de;padding-bottom:6px;margin-top:18px;}
  h2{font-size:16pt;border-bottom:1px solid #d0d7de;padding-bottom:4px;margin-top:22px;}
  h3{font-size:13pt;margin-top:18px;}
  h4{font-size:11.5pt;margin-top:14px;}
  code,pre{font-family:"Cascadia Mono",Consolas,"Courier New",monospace;font-size:9.5pt;}
  pre{background:#f6f8fa;padding:10px 12px;border-radius:6px;overflow:auto;page-break-inside:avoid;}
  code{background:#eef1f4;padding:1px 4px;border-radius:3px;}
  pre code{background:transparent;padding:0;}
  table{border-collapse:collapse;width:100%;margin:8px 0 14px;font-size:10pt;}
  th,td{border:1px solid #d0d7de;padding:6px 9px;vertical-align:top;}
  th{background:#f6f8fa;text-align:left;}
  blockquote{border-left:4px solid #d0d7de;color:#57606a;padding:2px 12px;margin:8px 0;}
  a{color:#0969da;text-decoration:none;}
  .mermaid{background:#fff;text-align:center;padding:8px;page-break-inside:avoid;}
  img,svg{max-width:100%;}
`;

function htmlFor(title, body) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>${CSS}</style>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js"></script>
</head><body>${body}
<script>
  window.__mermaidDone = false;
  mermaid.initialize({ startOnLoad:false, theme:'default', securityLevel:'loose', themeVariables:{ fontSize:'13px' } });
  (async () => {
    try { await mermaid.run({ querySelector: 'pre.mermaid' }); }
    catch (e) { console.warn('mermaid error:', e?.message); }
    window.__mermaidDone = true;
  })();
</script></body></html>`;
}

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const files = fs
    .readdirSync(DOCS_DIR)
    .filter((f) => f.toLowerCase().endsWith('.md'))
    .sort();

  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  try {
    for (const file of files) {
      const src = path.join(DOCS_DIR, file);
      const md = fs.readFileSync(src, 'utf8');
      const body = marked.parse(md);
      const html = htmlFor(file, body);

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });
      // Wait for mermaid.run() to finish (or 15s ceiling).
      await page.waitForFunction('window.__mermaidDone === true', { timeout: 15000 }).catch(() => {});

      const outName = file.replace(/\.md$/i, '.pdf');
      const outPath = path.join(OUT_DIR, outName);
      await page.pdf({
        path: outPath,
        format: 'A4',
        margin: { top: '20mm', right: '18mm', bottom: '22mm', left: '18mm' },
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate:
          '<div style="font-size:9px;width:100%;text-align:center;color:#888;font-family:Segoe UI,Arial,sans-serif;">Solo E-Commerce Documentation &mdash; <span class="title"></span> &mdash; Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
      });
      await page.close();
      const size = (fs.statSync(outPath).size / 1024).toFixed(1);
      console.log(`OK  ${outName}  (${size} KB)`);
    }
  } finally {
    await browser.close();
  }
  console.log(`\nWrote PDFs to: ${OUT_DIR}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
