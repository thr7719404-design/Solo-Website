import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';
import { PrismaService } from '../prisma/prisma.service';
import { MediaService } from '../media/media.service';

interface SeedImagesOptions {
  unsplashAccessKey: string;
  scope?: 'all' | 'categories' | 'subcategories' | 'brands';
  overwrite?: boolean;
}

interface SeedResult {
  scope: string;
  overwrite: boolean;
  processed: { categories: number; subcategories: number; brands: number };
  unsplash: { categories: number; subcategories: number };
  fallback: { categories: number; subcategories: number; brands: number };
  skipped: { categories: number; subcategories: number; brands: number };
  errors: Array<{ kind: string; id: number; name: string; message: string }>;
}

// Stylish dark gradients with warm gold accents (matches storefront aesthetic)
const GRADIENTS: Array<[string, string]> = [
  ['#1a1a1a', '#3a3a3a'],
  ['#0f172a', '#334155'],
  ['#7c2d12', '#c2410c'],
  ['#831843', '#be185d'],
  ['#064e3b', '#047857'],
  ['#1e3a8a', '#1d4ed8'],
  ['#78350f', '#b45309'],
  ['#581c87', '#7e22ce'],
  ['#3f3f46', '#71717a'],
  ['#155e75', '#0e7490'],
];

function hashIndex(seed: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
}

function escapeXml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&apos;');
}

function buildTileSvg(name: string, kicker: string): string {
  const [c1, c2] = GRADIENTS[hashIndex(name, GRADIENTS.length)];
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="rgba(255,215,130,0.20)"/>
      <stop offset="100%" stop-color="rgba(255,215,130,0)"/>
    </radialGradient>
  </defs>
  <rect width="800" height="600" fill="url(#g)"/>
  <rect width="800" height="600" fill="url(#glow)"/>
  <g font-family="Georgia, 'Times New Roman', serif" text-anchor="middle">
    <text x="400" y="290" font-size="180" font-weight="700" fill="#f5e6c4" letter-spacing="6">${escapeXml(initials)}</text>
    <text x="400" y="380" font-size="34" font-weight="500" fill="rgba(245,230,196,0.88)" letter-spacing="4">${escapeXml(name.toUpperCase())}</text>
  </g>
  <line x1="280" y1="420" x2="520" y2="420" stroke="#f5e6c4" stroke-width="1" opacity="0.5"/>
  <text x="400" y="475" text-anchor="middle" font-family="Georgia, serif" font-size="16" fill="rgba(245,230,196,0.6)" letter-spacing="6">${escapeXml(kicker)}</text>
</svg>`;
}

async function rasterizeTile(name: string, kicker: string): Promise<Buffer> {
  const svg = buildTileSvg(name, kicker);
  return sharp(Buffer.from(svg))
    .png({ quality: 90, compressionLevel: 9 })
    .toBuffer();
}

@Injectable()
export class SeedImagesService {
  private readonly logger = new Logger(SeedImagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
  ) {}

  async seed(opts: SeedImagesOptions): Promise<SeedResult> {
    const scope = opts.scope ?? 'all';
    const overwrite = opts.overwrite ?? true;
    const key = (opts.unsplashAccessKey || process.env.UNSPLASH_ACCESS_KEY || '').trim();

    const result: SeedResult = {
      scope,
      overwrite,
      processed: { categories: 0, subcategories: 0, brands: 0 },
      unsplash: { categories: 0, subcategories: 0 },
      fallback: { categories: 0, subcategories: 0, brands: 0 },
      skipped: { categories: 0, subcategories: 0, brands: 0 },
      errors: [],
    };

    if (scope === 'all' || scope === 'categories') {
      await this.seedCategories(key, overwrite, result);
    }
    if (scope === 'all' || scope === 'subcategories') {
      await this.seedSubcategories(key, overwrite, result);
    }
    if (scope === 'all' || scope === 'brands') {
      await this.seedBrands(overwrite, result);
    }

    return result;
  }

  // ── Categories ──────────────────────────────────────────────────────────
  private async seedCategories(key: string, overwrite: boolean, result: SeedResult) {
    const cats = await this.prisma.category.findMany({ where: { isActive: true } });
    for (const cat of cats) {
      if (!overwrite && cat.imageUrl) {
        result.skipped.categories++;
        continue;
      }
      try {
        let url: string | null = null;
        if (key) {
          url = await this.tryUnsplash(key, this.queryFor(cat.name, 'category'), `category-${cat.id}`, 'categories');
          if (url) result.unsplash.categories++;
        }
        if (!url) {
          url = await this.uploadTile(cat.name, 'SOLO COLLECTION', `category-${cat.id}`, 'categories');
          result.fallback.categories++;
        }
        await this.prisma.category.update({ where: { id: cat.id }, data: { imageUrl: url } });
        result.processed.categories++;
      } catch (err: any) {
        result.errors.push({ kind: 'category', id: cat.id, name: cat.name, message: err?.message || 'failed' });
      }
    }
  }

  // ── Subcategories ───────────────────────────────────────────────────────
  private async seedSubcategories(key: string, overwrite: boolean, result: SeedResult) {
    const subs = await this.prisma.subcategory.findMany({
      where: { isActive: true },
      include: { category: { select: { name: true } } },
    });
    for (const sub of subs) {
      if (!overwrite && (sub as any).imageUrl) {
        result.skipped.subcategories++;
        continue;
      }
      try {
        const parentName = (sub as any).category?.name ?? '';
        const query = this.queryFor(`${sub.name} ${parentName}`.trim(), 'subcategory');
        let url: string | null = null;
        if (key) {
          url = await this.tryUnsplash(key, query, `subcategory-${sub.id}`, 'subcategories');
          if (url) result.unsplash.subcategories++;
        }
        if (!url) {
          url = await this.uploadTile(
            sub.name,
            (parentName || 'SOLO').toUpperCase(),
            `subcategory-${sub.id}`,
            'subcategories',
          );
          result.fallback.subcategories++;
        }
        await this.prisma.subcategory.update({ where: { id: sub.id }, data: { imageUrl: url } });
        result.processed.subcategories++;
      } catch (err: any) {
        result.errors.push({ kind: 'subcategory', id: sub.id, name: sub.name, message: err?.message || 'failed' });
      }
    }
  }

  // ── Brands ──────────────────────────────────────────────────────────────
  private async seedBrands(overwrite: boolean, result: SeedResult) {
    const brands = await this.prisma.brand.findMany({ where: { isActive: true } });
    for (const brand of brands) {
      if (!overwrite && brand.logoUrl) {
        result.skipped.brands++;
        continue;
      }
      try {
        const url = await this.uploadTile(brand.name, 'SOLO BRAND', `brand-${brand.slug}`, 'brands');
        await this.prisma.brand.update({ where: { id: brand.id }, data: { logoUrl: url } });
        result.processed.brands++;
        result.fallback.brands++;
      } catch (err: any) {
        result.errors.push({ kind: 'brand', id: brand.id, name: brand.name, message: err?.message || 'failed' });
      }
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────
  private queryFor(name: string, kind: 'category' | 'subcategory'): string {
    const suffix = kind === 'subcategory' ? 'product styled flat lay' : 'lifestyle styled photography';
    const cleaned = name.replace(/\bSolo\b/gi, '').trim();
    return `${cleaned} ${suffix}`.trim();
  }

  private async tryUnsplash(
    accessKey: string,
    query: string,
    seedTag: string,
    folder: string,
  ): Promise<string | null> {
    try {
      // Throttle to stay under Unsplash demo's 50 req/hour cap
      await new Promise((r) => setTimeout(r, 1300));
      const searchUrl =
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}` +
        `&per_page=5&orientation=landscape&content_filter=high`;
      const searchResp = await fetch(searchUrl, {
        headers: { Authorization: `Client-ID ${accessKey}` },
      });
      if (!searchResp.ok) {
        this.logger.warn(`Unsplash ${searchResp.status} for "${query}" — using fallback tile`);
        return null;
      }
      const data: any = await searchResp.json();
      const photo = (data?.results || [])[0];
      const downloadUrl: string | undefined = photo?.urls?.regular || photo?.urls?.full;
      if (!downloadUrl) return null;
      if (photo?.links?.download_location) {
        fetch(photo.links.download_location, {
          headers: { Authorization: `Client-ID ${accessKey}` },
        }).catch(() => {});
      }
      const imgResp = await fetch(downloadUrl);
      if (!imgResp.ok) return null;
      const buffer = Buffer.from(await imgResp.arrayBuffer());
      const uploaded = await this.media.uploadFile(
        {
          buffer,
          originalname: `${seedTag}.jpg`,
          mimetype: 'image/jpeg',
          size: buffer.length,
        } as any,
        folder,
        true,
      );
      return uploaded.url;
    } catch (err: any) {
      this.logger.warn(`Unsplash error for "${query}": ${err?.message}`);
      return null;
    }
  }

  private async uploadTile(
    name: string,
    kicker: string,
    seedTag: string,
    folder: string,
  ): Promise<string> {
    const png = await rasterizeTile(name, kicker);
    const uploaded = await this.media.uploadFile(
      {
        buffer: png,
        originalname: `${seedTag}.png`,
        mimetype: 'image/png',
        size: png.length,
      } as any,
      folder,
      false,
    );
    return uploaded.url;
  }
}
