export interface GradientPreset {
  id: string;
  name: string;
  gradientClass: string;
  previewColor: string;
  textColor: string;
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  {
    id: "luxury-rose",
    name: "Velina Rose",
    gradientClass: "from-pink-600 to-rose-800",
    previewColor: "#e11d48",
    textColor: "text-white",
  },
  {
    id: "midnight-sapphire",
    name: "Midnight Sapphire",
    gradientClass: "from-blue-600 to-indigo-900",
    previewColor: "#2563eb",
    textColor: "text-white",
  },
  {
    id: "emerald-glam",
    name: "Emerald Glam",
    gradientClass: "from-emerald-600 to-teal-900",
    previewColor: "#059669",
    textColor: "text-white",
  },
  {
    id: "golden-twilight",
    name: "Golden Twilight",
    gradientClass: "from-amber-600 via-orange-600 to-rose-700",
    previewColor: "#d97706",
    textColor: "text-white",
  },
  {
    id: "cosmic-purple",
    name: "Cosmic Purple",
    gradientClass: "from-purple-900 via-indigo-900 to-purple-800",
    previewColor: "#7e22ce",
    textColor: "text-white",
  },
  {
    id: "velvet-noir",
    name: "Velvet Noir",
    gradientClass: "from-zinc-900 via-stone-900 to-neutral-950",
    previewColor: "#18181b",
    textColor: "text-white",
  },
  {
    id: "peachy-glow",
    name: "Peachy Glow",
    gradientClass: "from-rose-500 via-pink-400 to-amber-300",
    previewColor: "#f43f5e",
    textColor: "text-white",
  },
  {
    id: "oceanic-cyan",
    name: "Oceanic Cyan",
    gradientClass: "from-cyan-600 to-blue-800",
    previewColor: "#0891b2",
    textColor: "text-white",
  },
];

export const TAG_BG_PRESETS = [
  { label: "Cyan Glow", value: "bg-cyan-400 text-slate-900" },
  { label: "Lime Fresh", value: "bg-lime-300 text-teal-900" },
  { label: "White Rose", value: "bg-white text-velina-rose" },
  { label: "Gold Spark", value: "bg-yellow-300 text-amber-900" },
  { label: "Rose Punch", value: "bg-rose-500 text-white" },
  { label: "Dark Badge", value: "bg-zinc-900 text-white" },
];

export const SECTION_TYPES = [
  {
    value: "hero_slider",
    label: "Hero Carousel Slider",
    desc: "Top dynamic image slides under navbar with banners, headlines & CTAs",
  },
  {
    value: "product_showcase",
    label: "Product Showcase Grid",
    desc: "Select multiple store products by category & subcategory checklist",
  },
  {
    value: "deals_grid",
    label: "Deals Grid (Cards)",
    desc: "Grid of promotional deal cards with offer tags, gradients & buttons",
  },
  {
    value: "promo_banner",
    label: "Campaign Promo Banner",
    desc: "Wide full-width banner with promo copy, CTA button & side graphics",
  },
  {
    value: "banner_grid",
    label: "Banner Cards Grid",
    desc: "2 or 3 responsive featured campaign tiles",
  },
];
