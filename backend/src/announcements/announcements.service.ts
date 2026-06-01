import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  /** Public: active announcements — promo-linked ones get fresh text from the promo code */
  async getActive() {
    const now = new Date();
    const announcements = await this.prisma.announcement.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      include: { promoCode: true },
      orderBy: { sortOrder: 'asc' },
    });

    return announcements
      .filter((a) => {
        // If promo-linked, only show if that promo is still active
        if (a.promoCodeId && a.promoCode) {
          const p = a.promoCode;
          if (!p.isActive) return false;
          if (new Date(p.startsAt) > now) return false;
          if (p.expiresAt && new Date(p.expiresAt) < now) return false;
        }
        return true;
      })
      .map((a) => {
        let text = a.text;
        // For promo-linked announcements, generate fresh text from the promo code
        if (a.promoCodeId && a.promoCode) {
          const p = a.promoCode;
          const valueStr =
            p.type === 'PERCENTAGE'
              ? `${Number(p.value)}% off`
              : p.type === 'FREE_SHIPPING'
                ? 'Free shipping'
                : `AED ${Number(p.value)} off`;
          const minStr = p.minOrderAmount
            ? ` on orders over AED ${Number(p.minOrderAmount)}`
            : '';
          text = `Use code ${p.code} for ${valueStr}${minStr}`;
        }
        return {
          id: a.id,
          text,
          linkUrl: a.linkUrl,
          linkLabel: a.linkLabel,
          bgColor: a.bgColor,
          textColor: a.textColor,
        };
      });
  }

  /** Admin: list promo codes for the dropdown */
  async listPromoCodes() {
    return this.prisma.promoCode.findMany({
      select: {
        id: true,
        code: true,
        type: true,
        value: true,
        minOrderAmount: true,
        isActive: true,
        startsAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Admin: list all — include promo code relation */
  async findAll() {
    return this.prisma.announcement.findMany({
      include: { promoCode: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /** Admin: get one */
  async findOne(id: string) {
    return this.prisma.announcement.findUniqueOrThrow({
      where: { id },
      include: { promoCode: true },
    });
  }

  /** Admin: create */
  async create(dto: CreateAnnouncementDto) {
    return this.prisma.announcement.create({
      data: {
        text: dto.text,
        linkUrl: dto.linkUrl,
        linkLabel: dto.linkLabel,
        bgColor: dto.bgColor,
        textColor: dto.textColor,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
        promoCodeId: dto.promoCodeId || null,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : new Date(),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
      include: { promoCode: true },
    });
  }

  /** Admin: update */
  async update(id: string, dto: UpdateAnnouncementDto) {
    const data: any = { ...dto };
    if (dto.startsAt) data.startsAt = new Date(dto.startsAt);
    if (dto.expiresAt) data.expiresAt = new Date(dto.expiresAt);
    if (dto.expiresAt === null) data.expiresAt = null;
    return this.prisma.announcement.update({
      where: { id },
      data,
      include: { promoCode: true },
    });
  }

  /** Admin: delete */
  async remove(id: string) {
    return this.prisma.announcement.delete({ where: { id } });
  }
}
