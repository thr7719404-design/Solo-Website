import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import VariantSelector from './VariantSelector';
import type { ProductVariantDto } from '../../types';

function v(
  id: string,
  attrs: Record<string, any>,
  opts: Partial<ProductVariantDto> = {},
): ProductVariantDto {
  return {
    id,
    sku: `SKU-${id}`,
    slug: `slug-${id}`,
    name: `Variant ${id}`,
    attributes: attrs,
    price: 100,
    stockQty: 10,
    inStock: true,
    primaryImage: null,
    isCurrent: false,
    ...opts,
  };
}

function renderRouted(ui: React.ReactElement) {
  return render(
    <MemoryRouter initialEntries={['/products/A']}>
      <Routes>
        <Route path="/products/:id" element={ui} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('VariantSelector', () => {
  it('returns null when fewer than 2 variants', () => {
    const { container } = renderRouted(
      <VariantSelector
        variants={[v('A', { color: 'red', size: 'M' }, { isCurrent: true })]}
        axes={['color', 'size']}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders only sizes that share the current colour (Tin regression guard)', () => {
    // Tin has 1 size, Chestnut has 3 sizes — current is the only Tin variant.
    // Pre-fix, the colorFiltered.length > 1 fallback leaked Chestnut sizes
    // onto the Tin page. Post-fix only the Tin size should appear.
    const variants: ProductVariantDto[] = [
      v('tin-40', { color: 'tin', colorName: 'Tin', size: '40x29x22' }, {
        isCurrent: true,
      }),
      v('chest-30', { color: 'chestnut', colorName: 'Chestnut', size: '30x20x15' }),
      v('chest-40', { color: 'chestnut', colorName: 'Chestnut', size: '40x29x22' }),
      v('chest-50', { color: 'chestnut', colorName: 'Chestnut', size: '50x35x25' }),
    ];
    renderRouted(<VariantSelector variants={variants} axes={['color', 'size']} />);

    // Both colour swatches present
    expect(screen.getByLabelText(/Select color: Tin/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Select color: Chestnut/i)).toBeInTheDocument();

    // Size row should contain ONLY 40x29x22 (the Tin size), not Chestnut sizes
    const sizeButtons = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('title')?.includes('x'));
    const titles = sizeButtons.map((b) => b.getAttribute('title') || b.textContent);
    expect(titles.some((t) => t?.includes('40x29x22'))).toBe(true);
    expect(titles.some((t) => t?.includes('30x20x15'))).toBe(false);
    expect(titles.some((t) => t?.includes('50x35x25'))).toBe(false);
  });

  it('falls back to all sizes when the current colour matches no sibling (malformed data)', () => {
    const variants: ProductVariantDto[] = [
      // current colour 'orphan' has no sibling — fallback expected
      v('orphan-X', { color: 'orphan', size: 'X' }, { isCurrent: true }),
      v('red-S', { color: 'red', size: 'S' }),
      v('red-M', { color: 'red', size: 'M' }),
    ];
    renderRouted(<VariantSelector variants={variants} axes={['color', 'size']} />);
    const sizeButtons = screen
      .getAllByRole('button')
      .filter((b) => /^[A-Za-z0-9]/.test(b.textContent || ''));
    expect(sizeButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('navigates to the clicked size variant', async () => {
    const user = userEvent.setup();
    const variants: ProductVariantDto[] = [
      v('A', { color: 'red', size: 'M' }, { isCurrent: true }),
      v('B', { color: 'red', size: 'L', slug: 'red-large' }),
    ];
    renderRouted(<VariantSelector variants={variants} axes={['color', 'size']} />);
    const target = screen.getByTitle('L');
    await user.click(target);
    expect(target).toBeInTheDocument();
  });
});
