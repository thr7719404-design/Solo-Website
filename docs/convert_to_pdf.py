"""Convert all 5 project documentation markdown files to PDF."""

import re
import os
from fpdf import FPDF

DOCS_DIR = os.path.dirname(os.path.abspath(__file__))

FILES = [
    "01_HIGH_LEVEL_DESIGN.md",
    "02_LOW_LEVEL_DESIGN.md",
    "03_ARCHITECTURE_DOCUMENT.md",
    "04_PROJECT_SCOPE_FEATURES_REQUIREMENTS.md",
    "05_TECHNICAL_FEATURES.md",
]


class MarkdownPDF(FPDF):
    """Custom PDF with header/footer and markdown rendering."""

    def __init__(self, title_text=""):
        super().__init__()
        self.title_text = title_text
        self.set_auto_page_break(auto=True, margin=20)

    def header(self):
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 6, self.title_text, align="L")
        self.cell(0, 6, "Solo E-Commerce Platform", align="R", new_x="LMARGIN", new_y="NEXT")
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")


def sanitize_unicode(text):
    """Replace Unicode chars unsupported by built-in PDF fonts with ASCII equivalents."""
    replacements = {
        '\u2014': '--',   # em dash
        '\u2013': '-',    # en dash
        '\u2018': "'",    # left single quote
        '\u2019': "'",    # right single quote
        '\u201c': '"',    # left double quote
        '\u201d': '"',    # right double quote
        '\u2026': '...',  # ellipsis
        '\u2022': '*',    # bullet
        '\u2192': '->',   # right arrow
        '\u2190': '<-',   # left arrow
        '\u2500': '-',    # box drawing horizontal
        '\u2502': '|',    # box drawing vertical
        '\u250c': '+',    # box drawing corner
        '\u2510': '+',
        '\u2514': '+',
        '\u2518': '+',
        '\u251c': '+',
        '\u2524': '+',
        '\u253c': '+',
        '\u2191': '^',    # up arrow
        '\u2193': 'v',    # down arrow
        '\u25cf': '*',    # black circle
        '\u25cb': 'o',    # white circle
        '\u2588': '#',    # full block
        '\u2591': '.',    # light shade
        '\u2592': ':',    # medium shade
        '\u2593': '#',    # dark shade
        '\u25a0': '[x]',  # black square (checkbox filled)
        '\u25a1': '[ ]',  # white square (checkbox empty)
        '\u2611': '[x]',  # ballot box with check
        '\u2610': '[ ]',  # ballot box
        '\u2605': '*',    # star
        '\u2606': '*',    # white star
        '\u00d7': 'x',    # multiplication sign
        '\u2265': '>=',   # greater than or equal
        '\u2264': '<=',   # less than or equal
        '\u2260': '!=',   # not equal
        '\u2248': '~=',   # approx equal
        '\u221e': 'inf',  # infinity
        '\u2713': '[x]',  # check mark
        '\u2717': '[X]',  # cross mark
        '\u25b6': '>',    # play/right triangle
        '\u25c0': '<',    # left triangle
        '\u2580': '=',    # upper half block
        '\u2584': '=',    # lower half block
        '\u2709': '@',    # envelope
        '\u2b05': '<-',   # left arrow emoji
        '\u27a1': '->',   # right arrow emoji
        '\u2b06': '^',    # up arrow emoji
        '\u2b07': 'v',    # down arrow emoji
        '\u2756': '*',    # black diamond minus white x
        '\u2796': '-',    # heavy minus sign
        '\u2795': '+',    # heavy plus sign
        '\u2716': 'x',    # heavy multiplication x
        '\u2753': '?',    # question mark ornament
        '\u2757': '!',    # exclamation mark
        '\u2b50': '*',    # star
        '\u274c': 'X',    # cross mark
        '\u2705': '[v]',  # white heavy check mark
        '\u2b1b': '[ ]',  # black large square
        '\u2b1c': '[ ]',  # white large square
        '\u27a4': '->',   # arrow
        '\u25b8': '>',    # small right triangle
        '\u2800': ' ',    # braille blank
    }
    for char, replacement in replacements.items():
        text = text.replace(char, replacement)
    # Fallback: replace any remaining non-latin-1 characters
    try:
        text.encode('latin-1')
    except UnicodeEncodeError:
        text = text.encode('latin-1', errors='replace').decode('latin-1')
    return text


def clean_text(text):
    """Remove markdown formatting for plain text output."""
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
    text = re.sub(r'\*(.+?)\*', r'\1', text)
    text = re.sub(r'`(.+?)`', r'\1', text)
    text = re.sub(r'\[(.+?)\]\(.+?\)', r'\1', text)
    text = sanitize_unicode(text)
    return text.strip()


def parse_table(lines, start_idx):
    """Parse a markdown table starting at start_idx. Returns (rows, end_idx)."""
    rows = []
    i = start_idx
    while i < len(lines):
        line = lines[i].strip()
        if not line.startswith('|'):
            break
        cells = [c.strip() for c in line.split('|')[1:-1]]
        # skip separator rows (|---|---|)
        if cells and all(re.match(r'^[-:]+$', c) for c in cells):
            i += 1
            continue
        rows.append(cells)
        i += 1
    return rows, i


def render_table(pdf, rows):
    """Render a table into the PDF."""
    if not rows:
        return

    num_cols = len(rows[0])
    page_width = 190  # mm (210 - 2*10 margins)

    # Calculate column widths based on content
    col_widths = []
    for col_idx in range(num_cols):
        max_len = 0
        for row in rows:
            if col_idx < len(row):
                cell_text = clean_text(row[col_idx])
                max_len = max(max_len, len(cell_text))
        col_widths.append(max(max_len, 3))

    total = sum(col_widths)
    col_widths = [w / total * page_width for w in col_widths]

    # Cap any single column at 60% of page width
    for i in range(len(col_widths)):
        if col_widths[i] > page_width * 0.6:
            col_widths[i] = page_width * 0.6

    # Recalculate to fit page
    total = sum(col_widths)
    if total > page_width:
        col_widths = [w / total * page_width for w in col_widths]

    pdf.set_font("Helvetica", "", 7)
    line_height = 4.5

    for row_idx, row in enumerate(rows):
        # Header row styling
        if row_idx == 0:
            pdf.set_font("Helvetica", "B", 7)
            pdf.set_fill_color(66, 66, 66)
            pdf.set_text_color(255, 255, 255)
        else:
            pdf.set_font("Helvetica", "", 7)
            if row_idx % 2 == 0:
                pdf.set_fill_color(245, 245, 245)
            else:
                pdf.set_fill_color(255, 255, 255)
            pdf.set_text_color(0, 0, 0)

        # Calculate row height based on content wrapping
        max_lines = 1
        cell_texts = []
        for col_idx in range(num_cols):
            cell_text = clean_text(row[col_idx]) if col_idx < len(row) else ""
            cell_texts.append(cell_text)
            # Estimate lines needed
            char_width = 1.8  # approximate character width at font size 7
            chars_per_line = max(int(col_widths[col_idx] / char_width), 1)
            lines_needed = max(1, -(-len(cell_text) // chars_per_line))  # ceiling division
            max_lines = max(max_lines, lines_needed)

        row_height = line_height * max_lines

        # Check if we need a new page
        if pdf.get_y() + row_height > 275:
            pdf.add_page()

        y_start = pdf.get_y()
        x_start = pdf.get_x()

        for col_idx, cell_text in enumerate(cell_texts):
            x = x_start + sum(col_widths[:col_idx])
            pdf.set_xy(x, y_start)
            pdf.multi_cell(
                col_widths[col_idx],
                line_height,
                cell_text,
                border=1,
                fill=True,
                new_x="RIGHT",
                new_y="TOP",
            )

        pdf.set_y(y_start + row_height)

    pdf.set_text_color(0, 0, 0)
    pdf.ln(3)


def render_code_block(pdf, code_lines):
    """Render a code block with monospace font and grey background."""
    pdf.set_font("Courier", "", 7)
    pdf.set_fill_color(240, 240, 240)

    for line in code_lines:
        text = sanitize_unicode(line.rstrip())
        if not text:
            text = " "
        if pdf.get_y() > 275:
            pdf.add_page()
        pdf.cell(190, 4, txt=text, fill=True, new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Helvetica", "", 10)
    pdf.ln(3)


def convert_md_to_pdf(md_path, pdf_path):
    """Convert a markdown file to PDF."""
    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')

    # Extract document title from first heading
    doc_title = ""
    for line in lines:
        if line.startswith('# '):
            doc_title = sanitize_unicode(clean_text(line[2:].strip()))
            break

    pdf = MarkdownPDF(title_text=doc_title)
    pdf.alias_nb_pages()
    pdf.add_page()

    # Title page
    pdf.set_font("Helvetica", "B", 24)
    pdf.ln(40)
    pdf.multi_cell(0, 12, doc_title, align="C")
    pdf.ln(10)
    pdf.set_font("Helvetica", "", 12)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 8, "Solo E-Commerce Platform", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 8, "Document Version 1.0  |  March 2026", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_text_color(0, 0, 0)
    pdf.ln(10)
    pdf.line(60, pdf.get_y(), 150, pdf.get_y())
    pdf.add_page()

    i = 0
    in_code_block = False
    code_lines = []
    skip_title_found = False

    while i < len(lines):
        line = lines[i]

        # Code block handling
        if line.strip().startswith('```'):
            if in_code_block:
                render_code_block(pdf, code_lines)
                code_lines = []
                in_code_block = False
            else:
                in_code_block = True
            i += 1
            continue

        if in_code_block:
            code_lines.append(line)
            i += 1
            continue

        stripped = line.strip()

        # Skip empty lines
        if not stripped:
            i += 1
            continue

        # Skip horizontal rules
        if re.match(r'^-{3,}$', stripped):
            pdf.ln(3)
            pdf.line(10, pdf.get_y(), 200, pdf.get_y())
            pdf.ln(3)
            i += 1
            continue

        # Skip the main title (already on cover page)
        if stripped.startswith('# ') and not skip_title_found:
            skip_title_found = True
            i += 1
            continue

        # H1
        if stripped.startswith('# '):
            if pdf.get_y() > 40:
                pdf.add_page()
            pdf.set_font("Helvetica", "B", 20)
            pdf.set_text_color(26, 26, 26)
            text = clean_text(stripped[2:])
            pdf.set_x(10)
            pdf.multi_cell(190, 10, text)
            pdf.ln(3)
            pdf.line(10, pdf.get_y(), 200, pdf.get_y())
            pdf.ln(4)
            pdf.set_text_color(0, 0, 0)
            i += 1
            continue

        # H2
        if stripped.startswith('## '):
            if pdf.get_y() > 250:
                pdf.add_page()
            pdf.ln(4)
            pdf.set_font("Helvetica", "B", 16)
            pdf.set_text_color(26, 26, 26)
            text = clean_text(stripped[3:])
            pdf.set_x(10)
            pdf.multi_cell(190, 9, text)
            pdf.ln(2)
            pdf.set_text_color(0, 0, 0)
            i += 1
            continue

        # H3
        if stripped.startswith('### '):
            if pdf.get_y() > 260:
                pdf.add_page()
            pdf.ln(3)
            pdf.set_font("Helvetica", "B", 13)
            pdf.set_text_color(50, 50, 50)
            text = clean_text(stripped[4:])
            pdf.set_x(10)
            pdf.multi_cell(190, 8, text)
            pdf.ln(1)
            pdf.set_text_color(0, 0, 0)
            i += 1
            continue

        # H4
        if stripped.startswith('#### '):
            if pdf.get_y() > 265:
                pdf.add_page()
            pdf.ln(2)
            pdf.set_font("Helvetica", "B", 11)
            pdf.set_text_color(70, 70, 70)
            text = clean_text(stripped[5:])
            pdf.set_x(10)
            pdf.multi_cell(190, 7, text)
            pdf.ln(1)
            pdf.set_text_color(0, 0, 0)
            i += 1
            continue

        # Table
        if stripped.startswith('|'):
            rows, end_idx = parse_table(lines, i)
            render_table(pdf, rows)
            i = end_idx
            continue

        # Bullet list
        if re.match(r'^[-*]\s', stripped):
            pdf.set_font("Helvetica", "", 9)
            text = clean_text(re.sub(r'^[-*]\s+', '', stripped))
            if pdf.get_y() > 275:
                pdf.add_page()
            pdf.set_x(10)
            pdf.cell(5)
            pdf.cell(5, 5, "-")
            pdf.multi_cell(175, 5, text)
            i += 1
            continue

        # Numbered list
        m = re.match(r'^(\d+)\.\s+', stripped)
        if m:
            pdf.set_font("Helvetica", "", 9)
            num = m.group(1)
            text = clean_text(stripped[m.end():])
            if pdf.get_y() > 275:
                pdf.add_page()
            pdf.set_x(10)
            pdf.cell(5)
            pdf.cell(7, 5, f"{num}.")
            pdf.multi_cell(173, 5, text)
            i += 1
            continue

        # Indented sub-list items
        indent_match = re.match(r'^(\s+)[-*]\s', line)
        if indent_match:
            pdf.set_font("Helvetica", "", 8)
            indent_level = min(len(indent_match.group(1)) // 2, 5)
            text = clean_text(re.sub(r'^\s+[-*]\s+', '', line))
            if pdf.get_y() > 275:
                pdf.add_page()
            indent_px = 5 + indent_level * 5
            remaining = max(190 - indent_px - 5, 50)
            pdf.set_x(10)
            pdf.cell(indent_px)
            pdf.cell(5, 4.5, "-")
            pdf.multi_cell(remaining, 4.5, text)
            i += 1
            continue

        # Bold-only lines (like metadata)
        if re.match(r'^\*\*.+\*\*\s*:', stripped) or re.match(r'^\*\*.+\*\*$', stripped):
            pdf.set_font("Helvetica", "B", 9)
            text = clean_text(stripped)
            if pdf.get_y() > 275:
                pdf.add_page()
            pdf.set_x(10)
            pdf.multi_cell(190, 5, text)
            pdf.set_font("Helvetica", "", 10)
            i += 1
            continue

        # Regular paragraph
        pdf.set_font("Helvetica", "", 9)
        text = clean_text(stripped)
        if pdf.get_y() > 275:
            pdf.add_page()
        pdf.set_x(10)
        pdf.multi_cell(190, 5, text)
        pdf.ln(1)
        i += 1

    pdf.output(pdf_path)
    return pdf_path


def main():
    for md_file in FILES:
        md_path = os.path.join(DOCS_DIR, md_file)
        pdf_file = md_file.replace('.md', '.pdf')
        pdf_path = os.path.join(DOCS_DIR, pdf_file)

        if not os.path.exists(md_path):
            print(f"SKIP: {md_file} not found")
            continue

        convert_md_to_pdf(md_path, pdf_path)
        size_kb = os.path.getsize(pdf_path) / 1024
        print(f"OK: {pdf_file} ({size_kb:.0f} KB)")

    print("\nAll conversions complete.")


if __name__ == "__main__":
    main()
