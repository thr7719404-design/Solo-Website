/* scripts/seed_categories_tree.js */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Simple slugify (safe for your DB unique slug)
function slugify(input) {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

// Department mapping (based on your existing departments list)
const DEPT = {
  tableware: "29d84db7-47fb-4dc5-905a-2d0366c95273",
  kitchenware: "0ab0052b-4403-4c97-8ec7-7133b3713f2d",
  onthego: "3b519dd9-e599-4eed-b828-2014d987d7e3",
  outdoor: "4d24a13d-48d3-4b86-8bbf-75bf0a38149e",
  furniture: "02c2d593-f44b-4dee-86f9-cf64b10cac60",
};

// Your requested tree
const TREE = [
  {
    name: "Tea & Coffee",
    departmentId: DEPT.tableware,
    sortOrder: 10,
    children: [
      "Dallahs & Vacuum Jugs",
      "Cups & Saucers",
      "Tea & Coffee Makers",
      "Milk & Sugar",
      "Trays",
      "Accessories",
    ],
  },
  {
    name: "Table",
    departmentId: DEPT.tableware,
    sortOrder: 20,
    children: [
      "Plates",
      "Bowls",
      "Serverware",
      "Cutlery & Flatware",
      "Table Mats & Linens",
      "Table Accessories",
    ],
  },
  {
    name: "Glass & Stemware",
    departmentId: DEPT.tableware,
    sortOrder: 30,
    children: [
      "Tumblers",
      "Wine & Goblet Glasses",
      "Beer Glasses",
      "Cocktail & Coup Glasses",
      "Carafes & Decanters",
      "Bar Accessories",
    ],
  },
  {
    name: "On The Go Hot & Cold",
    departmentId: DEPT.onthego,
    sortOrder: 40,
    children: ["0.35 L", "0.5 L", "0.7 L", "0.9 L (Sip & Go)"],
  },
  {
    name: "Kitchen",
    departmentId: DEPT.kitchenware,
    sortOrder: 50,
    children: [
      "Pots",
      "Pans",
      "Saucepans",
      "Saute Pans",
      "Lids",
      "Tools",
      "Show All Equipment",
      "Oil & Vinegar",
      "Accessories",
      "Organizers",
      "Trivets & More",
    ],
  },
  {
    name: "Indoor Living",
    departmentId: DEPT.furniture,
    sortOrder: 60,
    children: ["Vases & Candles", "Decorative", "Organizing", "Bathroom"],
  },
  {
    name: "Outdoor",
    departmentId: DEPT.outdoor,
    sortOrder: 70,
    children: ["Bird Feeding", "Fire & Grills", "Self Watering Planters"],
  },
];

async function upsertCategory({ name, slug, departmentId, parentId, sortOrder }) {
  return prisma.category.upsert({
    where: { slug },
    create: {
      name,
      slug,
      departmentId,
      parentId: parentId ?? null,
      sortOrder: sortOrder ?? 0,
      isActive: true,
    },
    update: {
      name,
      departmentId,
      parentId: parentId ?? null,
      sortOrder: sortOrder ?? 0,
      isActive: true,
    },
  });
}

async function main() {
  let createdOrUpdated = 0;

  for (const mainCat of TREE) {
    const mainSlug = slugify(mainCat.name);
    const parent = await upsertCategory({
      name: mainCat.name,
      slug: mainSlug,
      departmentId: mainCat.departmentId,
      parentId: null,
      sortOrder: mainCat.sortOrder,
    });
    createdOrUpdated++;

    let childOrder = 1;
    for (const childName of mainCat.children) {
      const childSlug = slugify(`${mainCat.name}-${childName}`);
      await upsertCategory({
        name: childName,
        slug: childSlug,
        departmentId: mainCat.departmentId,
        parentId: parent.id,
        sortOrder: childOrder,
      });
      createdOrUpdated++;
      childOrder++;
    }
  }

  const total = await prisma.category.count();
  console.log(`✅ Done. Upserted ${createdOrUpdated} categories (parents + children).`);
  console.log(`📌 Total categories in DB now: ${total}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
