import { Injectable, Inject, Optional, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IStorageProvider } from '../media/interfaces/storage-provider.interface';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    private prisma: PrismaService,
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
    const order = await this.prisma.order.findUnique({
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
        shippingAddress: true,
        billingAddress: true,
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check authorization (non-admin must own the order)
    if (!isAdmin && order.userId !== userId) {
      throw new ForbiddenException('You do not have access to this order');
    }

    // Fetch product names from inventory schema
    const productIds = order.items
      .map((item) => item.productId)
      .filter((id): id is number => id !== null);

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
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        shippingAddress: true,
        billingAddress: true,
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if invoice already exists for this order
    const existing = await this.prisma.invoices.findUnique({
      where: { orderId },
    });

    if (existing?.pdfUrl) {
      return { invoiceId: existing.id, pdfUrl: existing.pdfUrl };
    }

    // Generate the PDF buffer
    const productIds = order.items
      .map((item) => item.productId)
      .filter((id): id is number => id !== null);
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
        sellerAddress: 'Dubai, UAE',
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

    // Check for stored invoice with pdfUrl
    const invoice = await this.prisma.invoices.findUnique({
      where: { orderId },
      select: { pdfUrl: true, pdfStoragePath: true },
    });

    if (invoice?.pdfStoragePath && this.storageProvider) {
      try {
        const url = await this.storageProvider.getUrl(invoice.pdfStoragePath, { expiresIn: 300 });
        return { redirectUrl: url };
      } catch {
        // Fall through to regeneration
      }
    }

    // Fall back to on-the-fly generation
    return this.generateInvoicePdf(orderId, userId, isAdmin);
  }

  private createPdfBuffer(order: any, productMap: Map<number, any>): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
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
    // Store Name/Logo
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('SOLO ECOMMERCE', 50, 50)
      .fontSize(10)
      .font('Helvetica')
      .text('Premium Shopping Experience', 50, 80);

    // Invoice Title
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('INVOICE', 400, 50, { align: 'right' });

    // Invoice Details
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Invoice No: ${order.orderNumber}`, 400, 80, { align: 'right' })
      .text(`Date: ${this.formatDate(order.createdAt)}`, 400, 95, { align: 'right' });

    if (order.paidAt) {
      doc.text(`Paid: ${this.formatDate(order.paidAt)}`, 400, 110, { align: 'right' });
    }

    // Horizontal line
    doc
      .strokeColor('#cccccc')
      .lineWidth(1)
      .moveTo(50, 130)
      .lineTo(550, 130)
      .stroke();
  }

  private generateCustomerInfo(doc: PDFKit.PDFDocument, order: any) {
    const startY = 150;
    const colWidth = 240;

    // Customer Details
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Bill To:', 50, startY);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || 'Customer', 50, startY + 18)
      .text(order.user.email, 50, startY + 33);

    if (order.user.phone) {
      doc.text(`Phone: ${order.user.phone}`, 50, startY + 48);
    }

    // Billing Address
    if (order.billingAddress) {
      let billingY = startY + 70;
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Billing Address:', 50, billingY);

      billingY += 15;
      doc.fontSize(10).font('Helvetica');
      
      const ba = order.billingAddress;
      const billingName = `${ba.firstName || ''} ${ba.lastName || ''}`.trim();
      if (billingName) {
        doc.text(billingName, 50, billingY);
        billingY += 12;
      }
      if (ba.addressLine1) {
        doc.text(ba.addressLine1, 50, billingY);
        billingY += 12;
      }
      if (ba.addressLine2) {
        doc.text(ba.addressLine2, 50, billingY);
        billingY += 12;
      }
      if (ba.city) {
        doc.text(`${ba.city}${ba.postalCode ? ', ' + ba.postalCode : ''}`, 50, billingY);
        billingY += 12;
      }
      if (ba.phone) {
        doc.text(`Tel: ${ba.phone}`, 50, billingY);
        billingY += 12;
      }

      // Billing Invoice Fields
      if (order.billingInvoiceCompany) {
        doc.text(`Company: ${order.billingInvoiceCompany}`, 50, billingY);
        billingY += 12;
      }
      if (order.billingInvoiceVatNumber) {
        doc.text(`VAT/TRN: ${order.billingInvoiceVatNumber}`, 50, billingY);
      }
    }

    // Shipping Address
    if (order.shippingAddress) {
      let shipY = startY;
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Ship To:', 300, shipY);

      shipY += 18;
      doc.fontSize(10).font('Helvetica');

      const sa = order.shippingAddress;
      const shipName = `${sa.firstName || ''} ${sa.lastName || ''}`.trim();
      if (shipName) {
        doc.text(shipName, 300, shipY);
        shipY += 12;
      }
      if (sa.addressLine1) {
        doc.text(sa.addressLine1, 300, shipY);
        shipY += 12;
      }
      if (sa.addressLine2) {
        doc.text(sa.addressLine2, 300, shipY);
        shipY += 12;
      }
      if (sa.city) {
        doc.text(`${sa.city}${sa.postalCode ? ', ' + sa.postalCode : ''}`, 300, shipY);
        shipY += 12;
      }
      if (sa.phone) {
        doc.text(`Tel: ${sa.phone}`, 300, shipY);
      }
    }
  }

  private generateItemsTable(doc: PDFKit.PDFDocument, order: any, productMap: Map<number, any>) {
    const tableTop = 320;
    const itemCodeX = 50;
    const descriptionX = 100;
    const qtyX = 350;
    const priceX = 400;
    const totalX = 480;

    // Table Header
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('#', itemCodeX, tableTop)
      .text('Description', descriptionX, tableTop)
      .text('Qty', qtyX, tableTop)
      .text('Price', priceX, tableTop)
      .text('Total', totalX, tableTop);

    // Header line
    doc
      .strokeColor('#cccccc')
      .lineWidth(1)
      .moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    // Table Rows
    let y = tableTop + 25;
    doc.font('Helvetica').fontSize(9);

    order.items.forEach((item: any, index: number) => {
      const product = item.productId ? productMap.get(item.productId) : null;
      const productName = product?.productName || item.name || 'Product';
      const unitPrice = Number(item.unitPrice || item.price || 0);
      const subtotal = Number(item.subtotal || 0);

      // Check if we need a new page
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      doc
        .text((index + 1).toString(), itemCodeX, y)
        .text(productName.substring(0, 40), descriptionX, y, { width: 240 })
        .text(item.quantity.toString(), qtyX, y)
        .text(`AED ${unitPrice.toFixed(2)}`, priceX, y)
        .text(`AED ${subtotal.toFixed(2)}`, totalX, y);

      y += 20;
    });

    // Bottom line
    doc
      .strokeColor('#cccccc')
      .lineWidth(1)
      .moveTo(50, y + 5)
      .lineTo(550, y + 5)
      .stroke();

    // Store the Y position for totals
    (doc as any).__lastItemY = y + 15;
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
    const loyaltyEarnAed = Number(order.loyaltyEarnAed || 0);
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

    // Loyalty Earned
    if (loyaltyEarnAed > 0) {
      doc.text('Loyalty Earned:', labelX, y);
      doc.text(`+AED ${loyaltyEarnAed.toFixed(2)}`, valueX, y);
      y += 18;
    }

    // Total
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('TOTAL:', labelX, y + 5)
      .text(`AED ${total.toFixed(2)}`, valueX, y + 5);

    // Payment Status
    y += 30;
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Payment Method: ${order.paymentMethod || 'N/A'}`, labelX - 100, y)
      .text(`Payment Status: ${order.paymentStatus || 'PENDING'}`, labelX - 100, y + 15);
  }

  private generateFooter(doc: PDFKit.PDFDocument) {
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#666666')
      .text(
        'Thank you for shopping with Solo Ecommerce!',
        50,
        750,
        { align: 'center', width: 500 },
      )
      .text(
        'For any queries, please contact support@solo-ecommerce.com',
        50,
        765,
        { align: 'center', width: 500 },
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
