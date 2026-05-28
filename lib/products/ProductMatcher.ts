export interface MatchedProductResult {
  name: string
  price: string
  imageUrl: string
  productUrl: string
  category: string
}

export interface ProductMatcher {
  match(categories: string[]): Promise<MatchedProductResult[]>
}

const MOCK_CATALOG: MatchedProductResult[] = [
  {
    name: 'Linen Sectional Sofa',
    price: '$1,299',
    imageUrl: 'https://placehold.co/300x200/e2e8f0/64748b?text=Sofa',
    productUrl: '#',
    category: 'sofa',
  },
  {
    name: 'Wool Area Rug 8×10',
    price: '$349',
    imageUrl: 'https://placehold.co/300x200/fef3c7/92400e?text=Rug',
    productUrl: '#',
    category: 'rug',
  },
  {
    name: 'Arched Floor Lamp',
    price: '$189',
    imageUrl: 'https://placehold.co/300x200/f1f5f9/475569?text=Lamp',
    productUrl: '#',
    category: 'lamp',
  },
  {
    name: 'Fiddle Leaf Fig (Large)',
    price: '$79',
    imageUrl: 'https://placehold.co/300x200/dcfce7/166534?text=Plant',
    productUrl: '#',
    category: 'plant',
  },
  {
    name: 'Walnut Coffee Table',
    price: '$499',
    imageUrl: 'https://placehold.co/300x200/fef9c3/713f12?text=Table',
    productUrl: '#',
    category: 'coffee table',
  },
  {
    name: 'Boucle Accent Chair',
    price: '$649',
    imageUrl: 'https://placehold.co/300x200/f5f5f4/44403c?text=Chair',
    productUrl: '#',
    category: 'chair',
  },
  {
    name: 'Concrete Table Lamp',
    price: '$129',
    imageUrl: 'https://placehold.co/300x200/e7e5e4/57534e?text=Lamp',
    productUrl: '#',
    category: 'lamp',
  },
  {
    name: 'Rattan Side Table',
    price: '$219',
    imageUrl: 'https://placehold.co/300x200/fef3c7/78350f?text=Table',
    productUrl: '#',
    category: 'side table',
  },
]

export class MockProductMatcher implements ProductMatcher {
  async match(categories: string[]): Promise<MatchedProductResult[]> {
    if (categories.length === 0) return MOCK_CATALOG.slice(0, 5)

    const matched = MOCK_CATALOG.filter((p) =>
      categories.some((c) => p.category.includes(c.toLowerCase()))
    )
    return matched.length > 0 ? matched : MOCK_CATALOG.slice(0, 5)
  }
}

export const productMatcher: ProductMatcher = new MockProductMatcher()
