import { Injectable, Inject, Optional, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IStorageProvider } from '../media/interfaces/storage-provider.interface';
import * as PDFDocument from 'pdfkit';
import { SOLO_LOGO_PNG_BUFFER } from '../assets/solo-logo-png';

// Brand / business constants for the invoice
const BRAND = {
  name: 'SOLO',
  trn: '104764432100001',
  phone: '0557133051',
  addressLines: [
    'VUET0399 Compass Building - Al Hulaila',
    'Al Hulaila Industrial Zone-FZ',
    'Ras Al Khaimah, United Arab Emirates',
  ],
  vatRate: 0.05,
};

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject('STORAGE_PROVIDER') private readonly storageProvider?: IStorageProvider,
  ) {}

  /**
   * Generate invoice PDF for an order
   */
  async generateInvoicePdf(
    orderId: string,
    userId?: string,
    isAdmin = false,
  ): Promise<{ buffer: Buffer; filename: string }> {
    // Fetch order with all related data
    const baseOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        items: true,
      },
    });

    if (!baseOrder) {
      throw new NotFoundException('Order not found');
    }

    // Check authorization (non-admin must own the order)
    if (!isAdmin && baseOrder.userId !== userId) {
      throw new ForbiddenException('You do not have access to this order');
    }

    // Fetch addresses separately so orphan FKs don't break PDF generation.
    const [shippingAddress, billingAddress] = await Promise.all([
      baseOrder.shippingAddressId
        ? this.prisma.address.findUnique({ where: { id: baseOrder.shippingAddressId } }).catch(() => null)
        : null,
      baseOrder.billingAddressId
        ? this.prisma.address.findUnique({ where: { id: baseOrder.billingAddressId } }).catch(() => null)
        : null,
    ]);
    const order: any = { ...baseOrder, shippingAddress, billingAddress };

    // Fetch product names from inventory schema
    const productIds = (order.items as any[])
      .map((item: any) => item.productId)
      .filter((id: any): id is number => id !== null);

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, productName: true, sku: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Generate PDF
    const buffer = await this.createPdfBuffer(order, productMap);

    return {
      buffer,
      filename: `invoice-${order.orderNumber}.pdf`,
    };
  }

  /**
   * Create or update an invoice record in the database and optionally upload PDF to cloud storage.
   */
  async persistInvoice(orderId: string): Promise<{ invoiceId: string; pdfUrl?: string }> {
    const baseOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        items: true,
      },
    });

    if (!baseOrder) {
      throw new NotFoundException('Order not found');
    }

    const [shippingAddress, billingAddress] = await Promise.all([
      baseOrder.shippingAddressId
        ? this.prisma.address.findUnique({ where: { id: baseOrder.shippingAddressId } }).catch(() => null)
        : null,
      baseOrder.billingAddressId
        ? this.prisma.address.findUnique({ where: { id: baseOrder.billingAddressId } }).catch(() => null)
        : null,
    ]);
    const order: any = { ...baseOrder, shippingAddress, billingAddress };

    // Check if invoice already exists for this order
    const existing = await this.prisma.invoices.findUnique({
      where: { orderId },
    });

    if (existing?.pdfUrl) {
      return { invoiceId: existing.id, pdfUrl: existing.pdfUrl };
    }

    // Generate the PDF buffer
    const productIds = (order.items as any[])
      .map((item: any) => item.productId)
      .filter((id: any): id is number => id !== null);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, productName: true, sku: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));
    const buffer = await this.createPdfBuffer(order, productMap);

    // Upload to cloud storage if available
    let pdfUrl: string | undefined;
    if (this.storageProvider) {
      try {
        pdfUrl = await this.storageProvider.upload(buffer, `invoice-${order.orderNumber}.pdf`, {
          mimetype: 'application/pdf',
          folder: 'invoices',
        });
      } catch (err) {
        this.logger.error(`Failed to upload invoice PDF for order ${orderId}`, err);
      }
    }

    // Build buyer info
    const buyerName = `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || order.user.email;
    const ba = order.billingAddress || order.shippingAddress;
    const buyerAddress = ba
      ? [ba.addressLine1, ba.addressLine2, ba.city, ba.postalCode].filter(Boolean).join(', ')
      : 'N/A';

    const subtotal = Number(order.subtotal || 0);
    const discount = Number(order.discount || 0);
    const vat = Number(order.vat || 0);
    const shipping = Number(order.shippingCost || 0);
    const total = Number(order.total || 0);

    const invoiceNumber = existing?.invoiceNumber || `INV-${order.orderNumber}`;

    const invoice = await this.prisma.invoices.upsert({
      where: { orderId },
      create: {
        orderId,
        invoiceNumber,
        invoiceDate: new Date(),
        currencyCode: 'AED',
        vatRateSnapshot: 0.05,
        sellerName: 'Solo Ecommerce',
        sellerAddress: 'VUET0399 Compass Building - Al Hulaila, Al Hulaila Industrial Zone-FZ, Ras Al Khaimah, UAE',
        buyerName,
        buyerAddress,
        buyerVatNumber: order.billingInvoiceVatNumber || null,
        subtotalExclVat: subtotal,
        discountExclVat: discount,
        vatAmount: vat,
        shippingExclVat: shipping,
        shippingVat: 0,
        totalInclVat: total,
        pdfUrl: pdfUrl || null,
        pdfStoragePath: pdfUrl ? `invoices/invoice-${order.orderNumber}.pdf` : null,
        status: 'issued',
      },
      update: {
        pdfUrl: pdfUrl || undefined,
        pdfStoragePath: pdfUrl ? `invoices/invoice-${order.orderNumber}.pdf` : undefined,
      },
    });

    return { invoiceId: invoice.id, pdfUrl: invoice.pdfUrl || undefined };
  }

  /**
   * Get a download URL for an existing invoice, or generate on the fly if not stored.
   */
  async getInvoiceDownload(
    orderId: string,
    userId?: string,
    isAdmin = false,
  ): Promise<{ buffer: Buffer; filename: string } | { redirectUrl: string }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, orderNumber: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!isAdmin && order.userId !== userId) {
      throw new ForbiddenException('You do not have access to this order');
    }

    // Always regenerate on-the-fly so design/layout changes take effect immediately.
    // (Cached blobs in storage may be from older designs.)
    return this.generateInvoicePdf(orderId, userId, isAdmin);
  }

  private createPdfBuffer(order: any, productMap: Map<number, any>): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'LETTER', bufferPages: true });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      this.generateHeader(doc, order);
      
      // Customer Info
      this.generateCustomerInfo(doc, order);
      
      // Items Table
      this.generateItemsTable(doc, order, productMap);
      
      // Totals
      this.generateTotals(doc, order);
      
      // Footer
      this.generateFooter(doc);

      doc.end();
    });
  }

  private generateHeader(doc: PDFKit.PDFDocument, order: any) {
    // Left-side: SOLO logo (PNG)
    try {
      doc.image(SOLO_LOGO_PNG_BUFFER, 50, 40, { width: 160 });
    } catch {
      // Logo render failed; continue without it
    }

    // Right-side: INVOICE title + meta
    doc
      .fillColor('#1a1a1a')
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('INVOICE', 400, 40, { width: 150, align: 'right' });

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#1a1a1a')
      .text(`Invoice No: ${order.orderNumber}`, 400, 70, { width: 150, align: 'right' })
      .text(`Date: ${this.formatDate(order.createdAt)}`, 400, 84, { width: 150, align: 'right' });

    if (order.paidAt) {
      doc.text(`Paid: ${this.formatDate(order.paidAt)}`, 400, 98, { width: 150, align: 'right' });
    }

    // Left-side: business address block (below logo)
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#444444')
      .text(BRAND.addressLines[0], 50, 145)
      .text(BRAND.addressLines[1], 50, 158)
      .text(BRAND.addressLines[2], 50, 171)
      .text(`Tel: ${BRAND.phone}`, 50, 184)
      .font('Helvetica-Bold')
      .fillColor('#1a1a1a')
      .text(`TRN: ${BRAND.trn}`, 50, 197);

    // Horizontal divider
    doc
      .strokeColor('#e0e0e0')
      .lineWidth(0.75)
      .moveTo(50, 210)
      .lineTo(550, 210)
      .stroke()
      .fillColor('#1a1a1a');
  }

  private renderAddressBlock(
    doc: PDFKit.PDFDocument,
    addr: any,
    x: number,
    startY: number,
  ): number {
    let y = startY;
    const fullName = `${addr.firstName || ''} ${addr.lastName || ''}`.trim();
    const lines: string[] = [];
    if (fullName) lines.push(fullName);
    if (addr.addressLine1) lines.push(addr.addressLine1);
    if (addr.addressLine2) lines.push(addr.addressLine2);
    if (addr.city) lines.push(`${addr.city}${addr.postalCode ? ', ' + addr.postalCode : ''}`);
    if (addr.phone) lines.push(`Tel: ${addr.phone}`);
    for (const line of lines) {
      doc.text(line, x, y);
      y += 12;
    }
    return y;
  }

  private renderBillingAddress(doc: PDFKit.PDFDocument, order: any, startY: number) {
    if (!order.billingAddress) return;
    let billingY = startY;
    doc.fillColor('#1a1a1a').fontSize(11).font('Helvetica-Bold').text('Billing Address:', 420, billingY);
    billingY += 16;
    doc.fontSize(10).font('Helvetica');
    billingY = this.renderAddressBlock(doc, order.billingAddress, 420, billingY);
    if (order.billingInvoiceCompany) {
      doc.text(`Company: ${order.billingInvoiceCompany}`, 420, billingY);
      billingY += 12;
    }
    if (order.billingInvoiceVatNumber) {
      doc.text(`VAT/TRN: ${order.billingInvoiceVatNumber}`, 420, billingY);
    }
  }

  private addressesEqual(a: any, b: any): boolean {
    if (!a || !b) return false;
    return (
      (a.firstName || '') === (b.firstName || '') &&
      (a.lastName || '') === (b.lastName || '') &&
      (a.addressLine1 || '') === (b.addressLine1 || '') &&
      (a.addressLine2 || '') === (b.addressLine2 || '') &&
      (a.city || '') === (b.city || '') &&
      (a.postalCode || '') === (b.postalCode || '')
    );
  }

  private renderShippingAddress(doc: PDFKit.PDFDocument, order: any, startY: number) {
    if (!order.shippingAddress) return;
    // Skip Ship To if it's the same as Billing (avoid overlap & duplication)
    if (this.addressesEqual(order.shippingAddress, order.billingAddress)) return;
    let shipY = startY;
    doc.fillColor('#1a1a1a').fontSize(11).font('Helvetica-Bold').text('Ship To:', 235, shipY);
    shipY += 16;
    doc.fontSize(10).font('Helvetica');
    this.renderAddressBlock(doc, order.shippingAddress, 235, shipY);
  }

  private generateCustomerInfo(doc: PDFKit.PDFDocument, order: any) {
    const startY = 230;

    doc.fillColor('#1a1a1a').fontSize(11).font('Helvetica-Bold').text('Bill To:', 50, startY);
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || 'Customer', 50, startY + 16)
      .text(order.user.email, 50, startY + 30);

    if (order.user.phone) {
      doc.text(`Phone: ${order.user.phone}`, 50, startY + 44);
    }

    this.renderBillingAddress(doc, order, startY);
    this.renderShippingAddress(doc, order, startY);
  }

  private generateItemsTable(doc: PDFKit.PDFDocument, order: any, productMap: Map<number, any>) {
    const tableTop = 360;
    // Column X positions (page width 612, margins 50/50 → usable 50..562 = 512)
    const cols = {
      code: 50,        // Item Code (70w)
      desc: 125,       // Description (160w)
      qty: 290,        // Order Qty (35w)
      rrp: 325,        // Amount (AED) (65w)
      vatTotal: 395,   // Total VAT Amount (75w)
      total: 475,      // Total Value (87w)
    };
    const headerH = 28;
    const vatRate = BRAND.vatRate;

    // Header band (light gray, dark text)
    doc
      .save()
      .rect(50, tableTop, 512, headerH)
      .fill('#f3f3f3')
      .restore();

    doc
      .fillColor('#1a1a1a')
      .fontSize(8)
      .font('Helvetica-Bold');
    const headerY = tableTop + 6;
      doc.text('Item Code', cols.code, headerY, { width: 70, lineBreak: false });
      doc.text('Description', cols.desc, headerY, { width: 160, lineBreak: false });
      doc.text('Order\nQty', cols.qty, headerY, { width: 35, align: 'center' });
      doc.text('Amount\n(AED)', cols.rrp, headerY, { width: 65, align: 'right' });
      doc.text('Total VAT\nAmount', cols.vatTotal, headerY, { width: 75, align: 'right' });
      doc.text('Total\nValue', cols.total, headerY, { width: 87, align: 'right' });

    // Reset for rows
    let y = tableTop + headerH + 8;
    doc.fillColor('#1a1a1a').font('Helvetica').fontSize(8.5);

    let rowIndex = 0;
    for (const item of order.items) {
      const product = item.productId ? productMap.get(item.productId) : null;
      const productName = product?.productName || item.name || 'Product';
      const itemCode = product?.sku || (item.productId ? String(item.productId) : '—');
      const qty = Number(item.quantity || 0);
      // unitPrice on Order is treated as VAT-inclusive (selling price). Derive ex-VAT.
      const unitInclVat = Number(item.unitPrice || item.price || 0);
      const unitExclVat = unitInclVat / (1 + vatRate);
      const lineExcl = unitExclVat * qty;
      const lineVat = unitInclVat * qty - lineExcl;
      const lineTotal = unitInclVat * qty;

      // New page if needed
      if (y > 720) {
        doc.addPage();
        y = 50;
      }

      // Subtle zebra striping (very light gray)
      if (rowIndex % 2 === 0) {
        doc
          .save()
          .rect(50, y - 4, 512, 22)
          .fill('#fafafa')
          .restore()
          .fillColor('#1a1a1a');
      }

      doc.text(String(itemCode).substring(0, 14), cols.code, y, { width: 70, lineBreak: false });
      doc.text(productName.substring(0, 50), cols.desc, y, { width: 160, lineBreak: false, ellipsis: true });
      doc.text(qty.toString(), cols.qty, y, { width: 35, align: 'center', lineBreak: false });
      doc.text(unitExclVat.toFixed(2), cols.rrp, y, { width: 65, align: 'right', lineBreak: false });
      doc.text(lineVat.toFixed(2), cols.vatTotal, y, { width: 75, align: 'right', lineBreak: false });
      doc.text(lineTotal.toFixed(2), cols.total, y, { width: 87, align: 'right', lineBreak: false });

      y += 22;
      rowIndex += 1;
    }

    // Bottom border
    doc
      .strokeColor('#cccccc')
      .lineWidth(0.5)
      .moveTo(50, y)
      .lineTo(562, y)
      .stroke();

    (doc as any).__lastItemY = y + 18;
  }

  private generateTotals(doc: PDFKit.PDFDocument, order: any) {
    const startY = (doc as any).__lastItemY || 500;
    const labelX = 380;
    const valueX = 480;
    let y = startY;

    const subtotal = Number(order.subtotal || 0);
    const shipping = Number(order.shippingCost || 0);
    const vat = Number(order.vat || 0);
    const discount = Number(order.discount || 0);
    const loyaltyRedeemAed = Number(order.loyaltyRedeemAed || 0);
    const total = Number(order.total || 0);

    doc.fontSize(10).font('Helvetica');

    // Subtotal
    doc.text('Subtotal:', labelX, y);
    doc.text(`AED ${subtotal.toFixed(2)}`, valueX, y);
    y += 18;

    // Shipping
    doc.text('Shipping:', labelX, y);
    doc.text(`AED ${shipping.toFixed(2)}`, valueX, y);
    y += 18;

    // VAT
    if (vat > 0) {
      doc.text('VAT:', labelX, y);
      doc.text(`AED ${vat.toFixed(2)}`, valueX, y);
      y += 18;
    }

    // Discount
    if (discount > 0) {
      doc.text('Discount:', labelX, y);
      doc.text(`-AED ${discount.toFixed(2)}`, valueX, y);
      y += 18;
    }

    // Loyalty Redeemed
    if (loyaltyRedeemAed > 0) {
      doc.text('Loyalty Redeemed:', labelX, y);
      doc.text(`-AED ${loyaltyRedeemAed.toFixed(2)}`, valueX, y);
      y += 18;
    }

    // GRAND TOTAL — clean style: thin top rule + bold black
    const bandY = y + 8;
    doc
      .strokeColor('#1a1a1a')
      .lineWidth(0.75)
      .moveTo(380, bandY - 4)
      .lineTo(562, bandY - 4)
      .stroke();
    doc
      .fillColor('#1a1a1a')
      .font('Helvetica-Bold')
      .fontSize(13)
      .text('GRAND TOTAL', 380, bandY + 4, { width: 100 });
    doc
      .fillColor('#1a1a1a')
      .font('Helvetica-Bold')
      .fontSize(13)
      .text(`AED ${total.toFixed(2)}`, 480, bandY + 4, { width: 82, align: 'right' });

    // Payment Status
    y = bandY + 38;
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Payment Method: ${order.paymentMethod || 'N/A'}`, 50, y)
      .text(`Payment Status: ${order.paymentStatus || 'PENDING'}`, 50, y + 15);
  }

  private generateFooter(doc: PDFKit.PDFDocument) {
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#888888')
      .text(
        'Thank you for shopping with SOLO  ·  VUET0399 Compass Building - Al Hulaila, Al Hulaila Industrial Zone-FZ, Ras Al Khaimah, UAE  ·  Tel: ' + BRAND.phone,
        40,
        720,
        { align: 'center', width: 532, lineBreak: false },
      );
  }

  private formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
