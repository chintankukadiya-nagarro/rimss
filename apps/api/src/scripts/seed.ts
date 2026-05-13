import "../models/index";
import { Product } from "../models/Product";
import { sequelize } from "../db/sequelize";

/** Deterministic catalogue for facet demos (~20 SKUs). */
const rows = [
  {
    slug: "linen-blazer-natural",
    name: "Linen blazer — Natural",
    category: "outerwear",
    colour: "natural",
    priceCents: 18900,
    onSale: true,
    imageUrl: "/samples/blazer-natural.svg",
  },
  {
    slug: "linen-blazer-navy",
    name: "Linen blazer — Navy",
    category: "outerwear",
    colour: "navy",
    priceCents: 18900,
    onSale: false,
    imageUrl: "/samples/blazer-natural.svg",
  },
  {
    slug: "silk-shift-midnight",
    name: "Silk shift — Midnight",
    category: "dresses",
    colour: "midnight",
    priceCents: 14900,
    onSale: false,
    imageUrl: "/samples/silk-shift.svg",
  },
  {
    slug: "silk-shift-rose",
    name: "Silk shift — Rose",
    category: "dresses",
    colour: "rose",
    priceCents: 13900,
    onSale: true,
    imageUrl: "/samples/silk-shift.svg",
  },
  {
    slug: "cashmere-wrap-stone",
    name: "Cashmere wrap — Stone",
    category: "accessories",
    colour: "stone",
    priceCents: 7900,
    onSale: true,
    imageUrl: "/samples/cashmere-wrap.svg",
  },
  {
    slug: "wool-coat-charcoal",
    name: "Wool coat — Charcoal",
    category: "outerwear",
    colour: "charcoal",
    priceCents: 24900,
    onSale: true,
    imageUrl: "/samples/blazer-natural.svg",
  },
  {
    slug: "merino-rollneck-sand",
    name: "Merino rollneck — Sand",
    category: "knitwear",
    colour: "sand",
    priceCents: 8900,
    onSale: false,
    imageUrl: "/samples/cashmere-wrap.svg",
  },
  {
    slug: "merino-rollneck-black",
    name: "Merino rollneck — Black",
    category: "knitwear",
    colour: "black",
    priceCents: 8900,
    onSale: true,
    imageUrl: "/samples/cashmere-wrap.svg",
  },
  {
    slug: "city-sneaker-white",
    name: "City sneaker — White",
    category: "footwear",
    colour: "white",
    priceCents: 12900,
    onSale: false,
    imageUrl: "/samples/silk-shift.svg",
  },
  {
    slug: "city-sneaker-taupe",
    name: "City sneaker — Taupe",
    category: "footwear",
    colour: "sand",
    priceCents: 12900,
    onSale: true,
    imageUrl: "/samples/silk-shift.svg",
  },
  {
    slug: "leather-loafer-brown",
    name: "Leather loafer — Brown",
    category: "footwear",
    colour: "brown",
    priceCents: 15900,
    onSale: false,
    imageUrl: "/samples/silk-shift.svg",
  },
  {
    slug: "pleated-trousers-navy",
    name: "Pleated wool trousers — Navy",
    category: "outerwear",
    colour: "navy",
    priceCents: 9800,
    onSale: true,
    imageUrl: "/samples/blazer-natural.svg",
  },
  {
    slug: "canvas-tote-natural",
    name: "Canvas tote — Natural",
    category: "accessories",
    colour: "natural",
    priceCents: 4900,
    onSale: false,
    imageUrl: "/samples/cashmere-wrap.svg",
  },
  {
    slug: "suede-belt-brown",
    name: "Suede belt — Brown",
    category: "accessories",
    colour: "brown",
    priceCents: 3200,
    onSale: true,
    imageUrl: "/samples/cashmere-wrap.svg",
  },
  {
    slug: "evening-slip-red",
    name: "Evening slip — Ruby",
    category: "dresses",
    colour: "red",
    priceCents: 17500,
    onSale: true,
    imageUrl: "/samples/silk-shift.svg",
  },
];

async function main(): Promise<void> {
  await sequelize.sync();
  let created = 0;
  for (const r of rows) {
    const [p, wasCreated] = await Product.findOrCreate({
      where: { slug: r.slug },
      defaults: r,
    });
    if (!wasCreated) {
      await p.update({
        name: r.name,
        category: r.category,
        colour: r.colour,
        priceCents: r.priceCents,
        onSale: r.onSale,
        imageUrl: r.imageUrl,
      });
    }
    if (wasCreated) created++;
  }
  const total = await Product.count();
  console.log(
    `Seed done. Rows created this run: ${created}. Total products in DB: ${total}.`,
  );
  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
