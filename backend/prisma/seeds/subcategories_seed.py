"""
Seed subcategories + auto-assign products to subcategories by keyword match.

- Idempotent: upserts subcategories by (category_id, slug); never deletes.
- Idempotent: only writes products.subcategory_id when it is currently NULL
  (so admin manual overrides are preserved across re-runs). Pass FORCE_REASSIGN=1
  env var to overwrite existing assignments.
- Case-INSENSITIVE substring match. FIRST match wins (subcategories ordered
  by specificity below). Products that match no keyword are left NULL.
- Inactive products are skipped.

Run:  python "d:/Solo Website/backend/prisma/seeds/subcategories_seed.py"
"""
import os
import re
import sys
import psycopg2

DSN = os.environ.get(
    "SEED_DSN",
    "host=pg-qlyb5greec2io.postgres.database.azure.com port=5432 "
    "dbname=solo_ecommerce user=soloadmin "
    "password=5mtZtLK5xCwe7cKzZElkdkfPI65qoEsb sslmode=require",
)
FORCE_REASSIGN = os.environ.get("FORCE_REASSIGN", "0") == "1"


def slugify(value: str) -> str:
    s = value.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s


# Per-category subcategory blueprint.
# Each list is ORDERED by specificity (first match wins for a given product).
# - "name": display name
# - "name_ar": Arabic name (optional, may be None)
# - "keywords": list of substrings; case-insensitive substring match against product.name
SUBCATEGORIES = {
    "cookware": [
        ("Frying Pans", None, ["frying pan"]),
        ("Saucepans", None, ["saucepan"]),
        ("Sauté Pans", None, ["sauté", "saute"]),
        ("Woks", None, ["wok"]),
        ("Roasting Pans", None, ["roasting pan", "rack for roasting"]),
        ("Pots", None, ["pot 2.", "pot 3.", "pot 4.", "pot 5.", "pot 6.", "pot 7.", "pot 9.", "pot 10", "pot 15", "stockpot"]),
        ("Lids", None, ["lid "]),
    ],
    "bakeware": [
        ("Baking Dishes", None, ["baking dish", "baking stone"]),
        ("Bread & Cake Tins", None, ["bread/cake tin", "bread tin", "cake tin", "rye bread"]),
        ("Bakeware Tools", None, ["cake server"]),
    ],
    "kitchen-tools": [
        ("Knives", None, ["knife", "cleaver"]),
        ("Cutting Boards", None, ["cutting board"]),
        ("Scissors", None, ["scissors"]),
        ("Brushes", None, ["brush"]),
        ("Tongs", None, ["tongs"]),
        ("Whisks", None, ["whisk"]),
        ("Spatulas", None, ["spatula"]),
        ("Ladles", None, ["ladle"]),
        ("Spoons & Servers", None, ["serving spoon", "spoon", "spaghetti", "stirrer", "pasta", "ice cream"]),
        ("Mixing Bowls", None, ["mixing bowl"]),
        ("Trivets", None, ["trivet"]),
        ("Graters & Peelers", None, ["grater", "peeler"]),
        ("Scales & Timers", None, ["scale", "timer"]),
        ("Strainers & Colanders", None, ["strainer", "colander", "sieve"]),
        ("Plates & Bowls", None, ["plate", "bowl", "ramen", "dish on stand", "ovenproof"]),
        ("Storage & Holders", None, ["holder", "salt cellar", "butter dish", "rack", "toolbox", "hooks"]),
        ("Other Tools", None, ["press", "opener", "thermometer", "dustpan", "magnetic", "salad", "trivets"]),
    ],
    "drinkware": [
        ("Wine Glasses", None, ["wineglass", "wine glass", "magnum"]),
        ("Beer Glasses", None, ["beer glass"]),
        ("Whisky & Liquor Glasses", None, ["schnapps", "liquor", "cognac", "whisky"]),
        ("Tumblers & Glasses", None, ["tumbler", "facet", "glass 6 pcs"]),
        ("Carafes", None, ["arafe"]),
        ("Decanters", None, ["decanter"]),
        ("Drinking Bottles", None, ["drinking bottle"]),
        ("Thermo Flasks", None, ["thermo flask", "thermo bottle", "re-hydrate", "sip'n'go", "urban thermo"]),
        ("Cups & Mugs", None, ["espresso cup", "egg cup", "thermo mug", "cup "]),
        ("Jugs", None, ["jug "]),
        ("Lids", None, ["glass lid", "fliptop lid"]),
        ("To Go", None, ["to go cup", "to go thermo", "24/12"]),
        ("Bird Feeders", None, ["bird feeder", "bird table"]),
    ],
    "food-storage": [
        ("Storage Jars", None, ["storage jar", "utensil jar"]),
        ("Bread Bins", None, ["bread bin"]),
        ("Soap Dispensers", None, ["soap dispenser", "squeeze soap"]),
        ("Recycling & Waste Bins", None, ["recycling", "waste bin", "pedal bin", "reflect "]),
        ("Vacuum Jugs", None, ["vacuum jug"]),
        ("Candle Holders", None, ["candlestick", "tealight", "lantern"]),
        ("Plant Pots & Herbs", None, ["plant pot", "herb organiser", "watering pots", "watering herb"]),
        ("Kitchen Organizers", None, ["kitchen organiser", "napkin holder", "mini shelf", "table caddy", "roll holder", "salt cellar", "potholder"]),
        ("Jugs & Cups", None, ["cylinder jug", "jug ", "cup ", "thermo mug", "teapot", "tea vacuum"]),
        ("Washing-up", None, ["washing-up rack", "folding washing"]),
    ],
    "cutlery": [
        ("Knife Stands & Sharpeners", None, ["knife sharpener", "knife stand"]),
        ("Knives", None, ["knife"]),
        ("Cutting Boards", None, ["cutting board"]),
        ("Scissors", None, ["scissors"]),
        ("Peelers", None, ["peeler"]),
    ],
    "small-appliances": [
        ("Kettles", None, ["kettle"]),
    ],
    "outdoor-and-travel": [
        ("Bird Feeders", None, ["bird feeder", "birdfeeder", "bird shelter", "bird table", "suet"]),
        ("Fire Pits & Heaters", None, ["firebox", "firecube", "firecylinder", "fireglobe", "firespot", "patio heater", "wood burner"]),
        ("Outdoor Lighting", None, ["lantern", "sunlight", "solar"]),
        ("Plant Pots & Garden", None, ["plant pot", "flowerpot", "orchid pot", "trellis", "simply grow"]),
        ("Outdoor Cutlery & Grills", None, ["grill", "flatware"]),
    ],
    "home-lighting": [
        ("Table Lamps", None, ["table lamp"]),
        ("Lanterns", None, ["lantern"]),
    ],
    "tea-and-coffee": [
        ("Coffee Glasses", None, ["cafe latte", "cafelatte", "espresso", "lungo"]),
        ("Cups & Mugs", None, ["thermo mug", "cup"]),
        ("Capsule Storage", None, ["capsule"]),
        ("Vacuum Jugs", None, ["vacuum jug", "thimble"]),
    ],
    "dallah": [
        ("Pump Jugs", None, ["pump vacuum"]),
        ("Vacuum Jugs", None, ["vacuum jug"]),
    ],
    "to-go": [
        ("Travel Cups", None, ["to go cup", "city to go"]),
        ("Thermo Flasks", None, ["thermo flask", "cool thermo"]),
        ("Tumblers", None, ["tumbler"]),
        ("Mealboxes", None, ["mealbox"]),
    ],
    "home-accessories": [
        ("Vases", None, ["vase"]),
    ],
}


def upsert_subcategories(cur, category_id: int, blueprint: list) -> dict:
    """Insert/update subcategories. Returns {slug: subcategory_id}."""
    slug_to_id = {}
    for idx, (name, name_ar, _kw) in enumerate(blueprint):
        slug = slugify(name)
        cur.execute(
            """
            INSERT INTO subcategories (category_id, name, name_ar, slug, sort_order, is_active, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, true, NOW(), NOW())
            ON CONFLICT (category_id, slug)
            DO UPDATE SET
                name = EXCLUDED.name,
                name_ar = COALESCE(EXCLUDED.name_ar, subcategories.name_ar),
                sort_order = EXCLUDED.sort_order,
                updated_at = NOW()
            RETURNING id;
            """,
            (category_id, name, name_ar, slug, idx),
        )
        sub_id = cur.fetchone()[0]
        slug_to_id[slug] = sub_id
    return slug_to_id


def assign_products(cur, category_id: int, blueprint: list, slug_to_id: dict) -> dict:
    """Match active products to first matching keyword's subcategory."""
    if FORCE_REASSIGN:
        cur.execute(
            "SELECT id, name FROM products WHERE category_id = %s AND is_active = true",
            (category_id,),
        )
    else:
        cur.execute(
            "SELECT id, name FROM products WHERE category_id = %s AND is_active = true AND subcategory_id IS NULL",
            (category_id,),
        )
    products = cur.fetchall()

    assigned_per_sub: dict = {}
    unmatched = 0
    for pid, pname in products:
        lower = pname.lower()
        matched_sub_id = None
        for name, _name_ar, keywords in blueprint:
            if any(kw.lower() in lower for kw in keywords):
                matched_sub_id = slug_to_id[slugify(name)]
                assigned_per_sub[name] = assigned_per_sub.get(name, 0) + 1
                break
        if matched_sub_id is None:
            unmatched += 1
            continue
        cur.execute(
            "UPDATE products SET subcategory_id = %s, updated_at = NOW() WHERE id = %s",
            (matched_sub_id, pid),
        )

    return {"assigned": assigned_per_sub, "unmatched": unmatched, "total_examined": len(products)}


def main() -> int:
    conn = psycopg2.connect(DSN)
    conn.autocommit = False
    try:
        cur = conn.cursor()
        # Map category slug -> id
        cur.execute("SELECT slug, id FROM categories")
        cat_map = {slug: cid for slug, cid in cur.fetchall()}

        grand_assigned = 0
        grand_unmatched = 0
        for cat_slug, blueprint in SUBCATEGORIES.items():
            cid = cat_map.get(cat_slug)
            if cid is None:
                print(f"!! Category slug '{cat_slug}' not found, skipping")
                continue
            slug_to_id = upsert_subcategories(cur, cid, blueprint)
            stats = assign_products(cur, cid, blueprint, slug_to_id)

            print(f"\n=== {cat_slug} (cat_id={cid}) ===")
            print(f"  subcategories: {len(slug_to_id)}")
            print(f"  products examined: {stats['total_examined']}")
            for sub_name, n in sorted(stats["assigned"].items(), key=lambda x: -x[1]):
                print(f"    {sub_name}: {n}")
            print(f"  unmatched (left NULL): {stats['unmatched']}")
            grand_assigned += sum(stats["assigned"].values())
            grand_unmatched += stats["unmatched"]

        conn.commit()
        print("\n========================================")
        print(f"TOTAL assigned: {grand_assigned}")
        print(f"TOTAL unmatched (NULL): {grand_unmatched}")
        print(f"FORCE_REASSIGN: {FORCE_REASSIGN}")
        print("========================================")
        return 0
    except Exception as e:
        conn.rollback()
        print(f"ERROR: {e}", file=sys.stderr)
        return 1
    finally:
        conn.close()


if __name__ == "__main__":
    sys.exit(main())
