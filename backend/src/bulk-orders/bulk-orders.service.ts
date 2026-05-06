import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateBulkOrderDto, UpdateBulkOrderStatusDto } from './dto';
import { BulkOrderStatus } from '@prisma/client';

@Injectable()
export class BulkOrdersService {
  private readonly logger = new Logger(BulkOrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async create(dto: CreateBulkOrderDto) {
    const bulkOrder = await this.prisma.bulkOrderRequest.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        countryCode: dto.countryCode || '+971',
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            sku: item.sku || null,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    const orderNum = `BO-${String(bulkOrder.orderNumber).padStart(4, '0')}`;
    let confirmationEmailSent = false;

    // Send confirmation email to customer
    try {
      // Fetch product details (price + image + description) for enriched email
      const productIds = bulkOrder.items.map((item) => item.productId);
      const products = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
        include: {
          pricing: true,
          images: { orderBy: { displayOrder: 'asc' }, take: 1 },
        },
      });

      // Resolve media_asset_id UUIDs to full URLs (some products store UUIDs,
      // some store full URLs directly — replicate the same logic as ProductsService)
      const uploadsBaseUrl =
        process.env.UPLOAD_BASE_URL ||
        process.env.APP_URL + '/uploads';
      const rawMediaIds = products
        .flatMap((p) => p.images?.map((img: any) => img.media_asset_id) || [])
        .filter((id: string) => id && !id.startsWith('http'));
      if (rawMediaIds.length > 0) {
        const uniqueIds = [...new Set(rawMediaIds)] as string[];
        const assets = await this.prisma.media_assets.findMany({
          where: { id: { in: uniqueIds } },
          select: { id: true, key: true },
        });
        const urlMap = new Map(assets.map((a: any) => [a.id, `${uploadsBaseUrl}/${a.key}`]));
        for (const product of products) {
          for (const img of product.images || []) {
            if (img.media_asset_id && !img.media_asset_id.startsWith('http')) {
              img.media_asset_id = urlMap.get(img.media_asset_id) || img.media_asset_id;
            }
          }
        }
      }

      const productMap = new Map(products.map((p) => [p.id, p]));

      let grandTotal = 0;

      const itemRows = bulkOrder.items
        .map((item) => {
          const product = productMap.get(item.productId);
          const imageUrl = product?.images?.[0]?.media_asset_id || '';
          const description = product?.shortDescription || product?.description || '';
          const unitPrice = product?.pricing ? Number(product.pricing.price_incl_vat_aed) : 0;
          const lineTotal = unitPrice * item.quantity;
          grandTotal += lineTotal;

          const thumbCell = imageUrl
            ? `<td style="padding:12px;border-bottom:1px solid #eee;width:72px;vertical-align:top">
                <img src="${imageUrl}" alt="${item.productName}" width="60" height="60"
                  style="display:block;width:60px;height:60px;object-fit:cover;border-radius:6px;border:1px solid #eee" />
              </td>`
            : `<td style="padding:12px;border-bottom:1px solid #eee;width:72px"></td>`;

          const priceCell = unitPrice > 0
            ? `<td style="padding:12px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;vertical-align:top">AED ${unitPrice.toFixed(2)}</td>
               <td style="padding:12px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;vertical-align:top;font-weight:600">AED ${lineTotal.toFixed(2)}</td>`
            : `<td style="padding:12px;border-bottom:1px solid #eee;text-align:right;color:#aaa;vertical-align:top">—</td>
               <td style="padding:12px;border-bottom:1px solid #eee;text-align:right;color:#aaa;vertical-align:top">—</td>`;

          return `<tr>
              ${thumbCell}
              <td style="padding:12px;border-bottom:1px solid #eee;vertical-align:top">
                <div style="font-weight:600;font-size:14px;color:#1A1A1A">${item.productName}</div>
                ${description ? `<div style="font-size:12px;color:#888;margin-top:3px;line-height:1.4">${description}</div>` : ''}
              </td>
              <td style="padding:12px;border-bottom:1px solid #eee;text-align:center;vertical-align:top">${item.quantity}</td>
              ${priceCell}
            </tr>`;
        })
        .join('');

      const grandTotalRow = grandTotal > 0
        ? `<tr>
            <td colspan="3" style="padding:14px 12px;text-align:right;font-size:15px;font-weight:700;color:#1A1A1A">Grand Total</td>
            <td colspan="2" style="padding:14px 12px;text-align:right;font-size:16px;font-weight:700;color:#B8860B">AED ${grandTotal.toFixed(2)}</td>
           </tr>`
        : '';

      confirmationEmailSent = await this.emailService.sendEmail({
        to: dto.email,
        subject: `Solo — Bulk Order ${orderNum} Received`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#1A1A1A">
            <div style="background:#1A1A1A;padding:24px;text-align:center">
              <h1 style="color:#B8860B;margin:0;font-size:24px;letter-spacing:4px">SOLO</h1>
            </div>
            <div style="padding:28px 24px">
              <h2 style="margin-top:0">Thank you, ${bulkOrder.name}!</h2>
              <p style="background:#f8f8f6;padding:12px 16px;border-radius:8px;font-size:15px">
                Your bulk order reference: <strong style="color:#B8860B;font-size:17px">${orderNum}</strong>
              </p>
              <p style="color:#444;line-height:1.6">We have received your bulk order request and our team will review it shortly. You will be contacted regarding pricing and availability.</p>
              <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:13px">
                <thead>
                  <tr style="background:#f8f8f6">
                    <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #B8860B;width:72px"></th>
                    <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #B8860B">Product</th>
                    <th style="padding:10px 12px;text-align:center;border-bottom:2px solid #B8860B">Qty</th>
                    <th style="padding:10px 12px;text-align:right;border-bottom:2px solid #B8860B">Unit Price</th>
                    <th style="padding:10px 12px;text-align:right;border-bottom:2px solid #B8860B">Total</th>
                  </tr>
                </thead>
                <tbody>${itemRows}</tbody>
                <tfoot style="border-top:2px solid #B8860B">${grandTotalRow}</tfoot>
              </table>
              <p style="color:#888;font-size:13px">Prices shown are indicative (incl. VAT) and subject to confirmation. If you have any questions, feel free to reach out to us via WhatsApp or email.</p>
            </div>
            <div style="background:#f8f8f6;padding:16px;text-align:center;font-size:12px;color:#888">
              &copy; Solo — All rights reserved
            </div>
          </div>
        `,
        text: `Thank you ${bulkOrder.name}! Your bulk order ${orderNum} has been received. We'll review it and get back to you soon.`,
      });
    } catch (err) {
      this.logger.warn(`Failed to send bulk order confirmation email: ${err.message}`);
    }

    return {
      ...bulkOrder,
      confirmationEmailSent,
    };
  }

  async findAll(page = 1, limit = 20, status?: string) {
    const where: any = {};
    if (status && ['NEW', 'IN_PROGRESS', 'CLOSED'].includes(status)) {
      where.status = status as BulkOrderStatus;
    }

    const [items, total] = await Promise.all([
      this.prisma.bulkOrderRequest.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.bulkOrderRequest.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const order = await this.prisma.bulkOrderRequest.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Bulk order request not found');
    return order;
  }

  async updateStatus(id: string, dto: UpdateBulkOrderStatusDto) {
    const order = await this.prisma.bulkOrderRequest.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Bulk order request not found');

    return this.prisma.bulkOrderRequest.update({
      where: { id },
      data: {
        status: dto.status as BulkOrderStatus,
        adminNotes: dto.adminNotes ?? order.adminNotes,
      },
      include: { items: true },
    });
  }

  async remove(id: string) {
    const order = await this.prisma.bulkOrderRequest.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Bulk order request not found');
    await this.prisma.bulkOrderRequest.delete({ where: { id } });
    return { message: 'Bulk order request deleted' };
  }
}
