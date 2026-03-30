const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const data = [
  ["Tea & Coffee", [
    "Dallahs & Vacuum Jugs",
    "Cups & Saucers",
    "Tea & Coffee Makers",
    "Milk & Sugar",
    "Trays",
    "Accessories",
  ]],
  ["Table", [
    "Plates",
    "Bowls",
    "Serveware",
    "Cutlery & Flatware",
    "Table Mats & Linens",
    "Table Accessories",
  ]],
  ["Glass & Stemware", [
    "Tumblers",
    "Wine & Goblet Glasses",
    "Beer Glasses",
    "Cocktail & Coup Glasses",
    "Carafes & Decanters",
    "Bar Accessories",
  ]],
  ["On The Go Hot & Cold", [
    "0.35 L",
    "0.5 L",
    "0.7 L",
    "0.9 L (Sip & Go)",
  ]],
  ["Kitchen", [
    "Pots",
    "Pans",
    "Saucepans",
    "Saute pans",
    "Lids",
    "Tools",
    "Equipment",
    "Oil & Vinegar",
    "Accessories",
    "Organizers",
    "Trivets & More",
  ]],
  ["Indoor Living", [
    "Vases & Candles",
    "Decorative",
    "Organizing",
    "Bathroom",
  ]],
  ["Outdoor:Bird Feeding", [
    "Fire & Grills",
    "Self Watering Planters",
  ]],
];

function slugify(s) {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[:]/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

(async () => {
  console.log("== 1) Deleting existing subcategories ==");
  await prisma.invSubcategory.deleteMany({});
  console.log("== 2) Deleting existing categories ==");
  await prisma.invCategory.deleteMany({});

  console.log("== 3) Inserting new parent categories ==");
  const parentByName = new Map();
  let order = 1;

  for (const [catName] of data) {
    const created = await prisma.invCategory.create({
      data: {
        categoryName: catName,
        description: null,
        displayOrder: order++,
        isActive: true,
      },
    });
    parentByName.set(catName, created);
  }

  console.log("== 4) Inserting subcategories linked to parents ==");
  for (const [catName, subs] of data) {
    const parent = parentByName.get(catName);
    let subOrder = 1;
    for (const subName of subs) {
      await prisma.invSubcategory.create({
        data: {
          subcategoryName: subName,
          description: null,
          displayOrder: subOrder++,
          isActive: true,
          categoryId: parent.id,
        },
      });
    }
  }

  const c = await prisma.invCategory.count();
  const s = await prisma.invSubcategory.count();
  console.log("DONE. InvCategory=", c, "InvSubcategory=", s);
})()
  .catch((e) => {
    console.error("FAILED:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
