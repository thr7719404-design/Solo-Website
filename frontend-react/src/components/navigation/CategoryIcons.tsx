import type { ReactElement, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  width: 18,
  height: 18,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const Cookware = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="13" r="6" />
    <path d="M17 13h4M19 11v4" />
  </svg>
);

const Drinkware = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M7 5h10l-1 14a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2L7 5Z" />
    <path d="M9 9h6" />
  </svg>
);

const KitchenTools = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M5 19l7-7" />
    <path d="M9 5h2v6H9z" />
    <circle cx="17" cy="7" r="2" />
    <path d="M16 9l-4 4" />
  </svg>
);

const Cutlery = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M6 3l6 9-7 8" />
    <path d="M12 12l8 8" />
  </svg>
);

const Bakeware = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 10c2-2 4-2 6 0s4 2 6 0 2-2 4 0v8H4v-8Z" />
  </svg>
);

const FoodStorage = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M7 4h10v3H7z" />
    <path d="M6 7h12v13H6z" />
    <path d="M9 11h6" />
  </svg>
);

const ToGo = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M5 7h14l-1 2H6L5 7Z" />
    <path d="M7 9l1 11h8l1-11" />
    <path d="M10 4h4" />
  </svg>
);

const TeaCoffee = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M5 10h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-6Z" />
    <path d="M16 12h2a2 2 0 0 1 0 4h-2" />
    <path d="M8 6c0-1 1-1 1-2M11 6c0-1 1-1 1-2" />
  </svg>
);

const Dallah = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M9 5h5l1 3-1 1v2c2 0 3 2 3 4v4a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-4c0-2 1-4 3-4V9L9 8l-1-2 1-1Z" />
    <path d="M14 9l3-3" />
  </svg>
);

const OutdoorTravel = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 3c1 3 3 4 3 7a3 3 0 1 1-6 0c0-2 2-3 3-7Z" />
    <path d="M7 19l10 0" />
    <path d="M9 16l-2 3M15 16l2 3" />
  </svg>
);

const HomeAccessories = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M9 4h6v3l-1 2c2 1 3 3 3 6v5a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-5c0-3 1-5 3-6L9 7V4Z" />
  </svg>
);

const HomeLighting = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M7 4h10l-2 8H9L7 4Z" />
    <path d="M12 12v6" />
    <path d="M9 20h6" />
  </svg>
);

const SmallAppliances = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M8 6h7l3 3v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
    <path d="M15 6V4h-3" />
    <path d="M9 13h6" />
  </svg>
);

const Default = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="7" />
    <path d="M9 12h6" />
  </svg>
);

const Account = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="9" r="3.5" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </svg>
);

const ShopBy = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.4l-4.8 2.5.9-5.4L4.2 8.7l5.4-.8L12 3z" />
  </svg>
);

const Orders = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="4" y="6" width="16" height="14" rx="1.5" />
    <path d="M8 6V4h8v2" />
    <path d="M8 12h8M8 16h5" />
  </svg>
);

const Returns = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M9 7H5V3" />
    <path d="M5 7a8 8 0 1 1-2 5.8" />
  </svg>
);

const Addresses = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 21s-7-7.2-7-12a7 7 0 1 1 14 0c0 4.8-7 12-7 12Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);

const Security = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="6" y="11" width="12" height="9" rx="1.5" />
    <path d="M9 11V8a3 3 0 1 1 6 0v3" />
  </svg>
);

const BestSellers = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 3l2.5 5.1 5.6.8-4 4 .9 5.6L12 15.9 7 18.5l.9-5.6-4-4 5.6-.8L12 3z" />
  </svg>
);

const NewArrivals = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 4v8M12 4l-3 3M12 4l3 3" />
    <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
  </svg>
);

const Featured = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 4l1.8 4 4.4.4-3.3 3 1 4.3L12 13.6 8.1 15.7l1-4.3-3.3-3 4.4-.4L12 4z" />
  </svg>
);

const Sale = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M7 17L17 7" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <circle cx="15.5" cy="15.5" r="1.5" />
  </svg>
);

const Loyalty = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 21s-6-4.4-8-8.5C2.4 8.7 5 5 8.5 5c1.7 0 3 1 3.5 2 .5-1 1.8-2 3.5-2 3.5 0 6.1 3.7 4.5 7.5C18 16.6 12 21 12 21z" />
  </svg>
);

const ICON_MAP: Record<string, (p: IconProps) => ReactElement> = {
  cookware: Cookware,
  drinkware: Drinkware,
  'kitchen tools': KitchenTools,
  cutlery: Cutlery,
  bakeware: Bakeware,
  'food storage': FoodStorage,
  'to go': ToGo,
  togo: ToGo,
  'tea and coffee': TeaCoffee,
  'tea & coffee': TeaCoffee,
  dallah: Dallah,
  'outdoor & travel': OutdoorTravel,
  'outdoor and travel': OutdoorTravel,
  outdoor: OutdoorTravel,
  'home accessories': HomeAccessories,
  'home lighting': HomeLighting,
  lighting: HomeLighting,
  'small appliances': SmallAppliances,
  appliances: SmallAppliances,
  // Static menu sections
  'my account': Account,
  account: Account,
  'shop by': ShopBy,
  orders: Orders,
  returns: Returns,
  addresses: Addresses,
  security: Security,
  password: Security,
  'best sellers': BestSellers,
  bestsellers: BestSellers,
  'new arrivals': NewArrivals,
  featured: Featured,
  sale: Sale,
  loyalty: Loyalty,
  rewards: Loyalty,
};

export function CategoryIcon({
  name,
  ...rest
}: { name: string } & IconProps) {
  const key = name.trim().toLowerCase();
  const Icon = ICON_MAP[key] || Default;
  return <Icon {...rest} />;
}
