module.exports = {
  pdf_options: {
    format: 'A4',
    margin: '20mm 18mm',
    printBackground: true,
    headerTemplate: '<div></div>',
    footerTemplate: '<div style="font-size:9px;width:100%;text-align:center;color:#888;">Solo E-Commerce Documentation — Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
    displayHeaderFooter: true,
  },
  marked_extensions: [
    {
      renderer: {
        // Wrap mermaid code blocks so the browser-side mermaid script renders them.
        code(code, lang) {
          if (lang === 'mermaid') {
            return `<pre class="mermaid">${code}</pre>`;
          }
          return false; // fall back to default
        },
      },
    },
  ],
  body_class: 'markdown-body',
  css: `
    body { font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 11pt; color: #1f2328; line-height: 1.5; }
    h1 { font-size: 22pt; border-bottom: 2px solid #d0d7de; padding-bottom: 6px; margin-top: 18px; }
    h2 { font-size: 16pt; border-bottom: 1px solid #d0d7de; padding-bottom: 4px; margin-top: 22px; }
    h3 { font-size: 13pt; margin-top: 18px; }
    h4 { font-size: 11.5pt; margin-top: 14px; }
    code, pre { font-family: "Cascadia Mono", Consolas, "Courier New", monospace; font-size: 9.5pt; }
    pre { background:#f6f8fa; padding:10px 12px; border-radius:6px; overflow:auto; page-break-inside: avoid; }
    code { background:#eef1f4; padding:1px 4px; border-radius:3px; }
    pre code { background:transparent; padding:0; }
    table { border-collapse: collapse; width: 100%; margin: 8px 0 14px; font-size: 10pt; }
    th, td { border: 1px solid #d0d7de; padding: 6px 9px; vertical-align: top; }
    th { background: #f6f8fa; text-align: left; }
    blockquote { border-left: 4px solid #d0d7de; color: #57606a; padding: 2px 12px; margin: 8px 0; }
    a { color: #0969da; text-decoration: none; }
    .mermaid { background:#fff; text-align:center; padding:8px; page-break-inside: avoid; }
    img, svg { max-width: 100%; }
  `,
  stylesheet_encoding: 'utf-8',
  launch_options: { args: ['--no-sandbox'] },
  script: [
    { url: 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js' },
    { content: "mermaid.initialize({startOnLoad:true,theme:'default',securityLevel:'loose',themeVariables:{fontSize:'13px'}});" },
  ],
  // Wait for mermaid to finish rendering before saving the PDF.
  // md-to-pdf does not have a direct "wait" knob, but the script tag above
  // injects mermaid which renders synchronously enough for the typical 1s
  // page-load delay. We bump it via the puppeteer launch option below.
  port: 0,
};
