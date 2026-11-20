export const BUSINESS_CATEGORIES = [
  {
    id: "retail_store",
    name: "Retail Store",
    icon: "Store",
    description: "General retail goods, packaged items, and convenience merchandise",
    units: ["pcs", "box", "pack", "dozen", "set"],
    defaultUnit: "pcs",
    allowFractional: false,
    productFields: [
      { key: "brand", label: "Brand / Manufacturer", type: "text", placeholder: "e.g. Sony, Nike, Local" },
      { key: "model", label: "Model / Specification", type: "text", placeholder: "e.g. Pro Edition" },
      { key: "color", label: "Color / Variant", type: "text", placeholder: "e.g. Blue, Matte Black" }
    ],
    suggestedCategories: ["General Merchandise", "Home Goods", "Personal Care", "Gifts & Novelties"]
  },
  {
    id: "supermarket",
    name: "Supermarket",
    icon: "ShoppingCart",
    description: "Fast-moving consumer goods, groceries, household, and packaged foods",
    units: ["pcs", "kg", "gm", "ltr", "ml", "pack", "box"],
    defaultUnit: "pcs",
    allowFractional: true,
    productFields: [
      { key: "brand", label: "Brand", type: "text", placeholder: "e.g. Nestle, Unilever" },
      { key: "batch_number", label: "Batch / Lot No.", type: "text", placeholder: "e.g. B-9982" },
      { key: "expiry_date", label: "Expiry Date", type: "date", placeholder: "YYYY-MM-DD" },
      { key: "net_weight", label: "Net Content / Weight", type: "text", placeholder: "e.g. 500g, 1L" }
    ],
    suggestedCategories: ["Staples & Grains", "Beverages", "Snacks & Packaged Food", "Cleaning & Hygiene", "Dairy & Eggs"]
  },
  {
    id: "grocery_store",
    name: "Grocery Store",
    icon: "Apple",
    description: "Kirana, grains, pulses, spices, oils, and daily essentials",
    units: ["kg", "gm", "ltr", "ml", "pcs", "pack", "bag"],
    defaultUnit: "kg",
    allowFractional: true,
    productFields: [
      { key: "batch_number", label: "Batch No", type: "text", placeholder: "e.g. G-102" },
      { key: "expiry_date", label: "Expiry Date", type: "date", placeholder: "YYYY-MM-DD" },
      { key: "origin", label: "Source / Origin", type: "text", placeholder: "e.g. Punjab, Kerala" }
    ],
    suggestedCategories: ["Rice & Flours", "Pulses & Dal", "Edible Oils & Ghee", "Spices & Masalas", "Fresh Produce"]
  },
  {
    id: "textile_clothing",
    name: "Textile and Clothing Store",
    icon: "Shirt",
    description: "Apparel, readymade garments, ethnic wear, suiting & shirting",
    units: ["pcs", "metre", "set", "box"],
    defaultUnit: "pcs",
    allowFractional: false,
    productFields: [
      { key: "size", label: "Size", type: "text", placeholder: "e.g. S, M, L, XL, 32, 38, 42" },
      { key: "color", label: "Color", type: "text", placeholder: "e.g. Navy Blue, Maroon" },
      { key: "fabric", label: "Fabric / Material", type: "text", placeholder: "e.g. Cotton, Linen, Silk" },
      { key: "brand", label: "Brand", type: "text", placeholder: "e.g. Raymond, Allen Solly" }
    ],
    suggestedCategories: ["Men's Wear", "Women's Wear", "Kids & Infants", "Ethnic & Formal", "Fabrics & Linens"]
  },
  {
    id: "electronics_store",
    name: "Electronics Store",
    icon: "Tv",
    description: "Consumer electronics, home appliances, audio-visual, and computing",
    units: ["pcs", "set", "box"],
    defaultUnit: "pcs",
    allowFractional: false,
    productFields: [
      { key: "brand", label: "Brand", type: "text", placeholder: "e.g. Samsung, LG, Dell" },
      { key: "model", label: "Model Number", type: "text", placeholder: "e.g. OLED-55C3" },
      { key: "serial_number", label: "Serial Number", type: "text", placeholder: "e.g. SN88392109" },
      { key: "warranty_period", label: "Warranty Period", type: "text", placeholder: "e.g. 1 Year, 2 Years" }
    ],
    suggestedCategories: ["Home Appliances", "Audio & Sound", "Television & Video", "Computing & Laptops"]
  },
  {
    id: "hardware_store",
    name: "Hardware Store",
    icon: "Wrench",
    description: "Tools, building materials, plumbing, electrical fixtures, fasteners",
    units: ["pcs", "kg", "metre", "box", "set", "roll"],
    defaultUnit: "pcs",
    allowFractional: true,
    productFields: [
      { key: "brand", label: "Brand", type: "text", placeholder: "e.g. Bosch, Stanley, Asian Paints" },
      { key: "size_spec", label: "Dimensions / Specification", type: "text", placeholder: "e.g. 1/2 inch, 10mm" },
      { key: "material", label: "Material Grade", type: "text", placeholder: "e.g. Brass, Stainless Steel, PVC" }
    ],
    suggestedCategories: ["Power Tools", "Fasteners & Screws", "Plumbing & Sanitary", "Electrical Supplies", "Paints & Adhesives"]
  },
  {
    id: "medical_pharmacy",
    name: "Medical and Pharmacy Store",
    icon: "Stethoscope",
    description: "Medicines, healthcare devices, surgical supplies, and wellness items",
    units: ["strip", "box", "bottle", "pcs", "tube", "pack"],
    defaultUnit: "strip",
    allowFractional: false,
    productFields: [
      { key: "batch_number", label: "Batch Number", type: "text", placeholder: "e.g. BATCH-2026A" },
      { key: "expiry_date", label: "Expiry Date", type: "date", placeholder: "YYYY-MM-DD" },
      { key: "salt_composition", label: "Generic Salt / Composition", type: "text", placeholder: "e.g. Paracetamol 500mg" },
      { key: "manufacturer", label: "Pharma Manufacturer", type: "text", placeholder: "e.g. Cipla, Sun Pharma" },
      { key: "schedule_drug", label: "Schedule Flag", type: "text", placeholder: "e.g. Schedule H, OTC" }
    ],
    suggestedCategories: ["Analgesics & Antipyretics", "Antibiotics", "Cardiovascular", "First Aid & Surgical", "Nutritional Supplements"]
  },
  {
    id: "restaurant_cafe",
    name: "Restaurant and Cafe",
    icon: "Utensils",
    description: "Dine-in, takeaway, quick-service food, beverages, and confectioneries",
    units: ["portion", "plate", "glass", "pcs", "cup", "bowl"],
    defaultUnit: "plate",
    allowFractional: false,
    productFields: [
      { key: "food_type", label: "Dietary Preference", type: "text", placeholder: "Veg / Non-Veg / Vegan" },
      { key: "prep_time", label: "Preparation Time", type: "text", placeholder: "e.g. 15 Mins" },
      { key: "spice_level", label: "Spice Level", type: "text", placeholder: "Mild / Medium / Spicy" }
    ],
    suggestedCategories: ["Starters & Appetizers", "Main Course", "Breads & Rice", "Beverages & Mocktails", "Desserts"]
  },
  {
    id: "wholesale_business",
    name: "Wholesale Business",
    icon: "Truck",
    description: "B2B trading, bulk cartons, master packs, distributor supply chain",
    units: ["box", "carton", "dozen", "pack", "kg", "pcs"],
    defaultUnit: "carton",
    allowFractional: true,
    productFields: [
      { key: "pack_size", label: "Items Per Master Pack", type: "text", placeholder: "e.g. 24 Pcs / Carton" },
      { key: "moq", label: "Minimum Order Qty (MOQ)", type: "text", placeholder: "e.g. 5 Cartons" },
      { key: "tier2_price", label: "Bulk Tier Price", type: "text", placeholder: "e.g. Rate for > 50 units" }
    ],
    suggestedCategories: ["Bulk Master Cases", "Pallet Lots", "Industrial Supplies", "Direct Factory Crates"]
  },
  {
    id: "mobile_accessories",
    name: "Mobile and Accessories Store",
    icon: "Smartphone",
    description: "Smartphones, tablets, wearable gadgets, chargers, cases, audio",
    units: ["pcs", "box", "pack"],
    defaultUnit: "pcs",
    allowFractional: false,
    productFields: [
      { key: "brand", label: "Brand", type: "text", placeholder: "e.g. Apple, OnePlus, Xiaomi" },
      { key: "model", label: "Model / Variant", type: "text", placeholder: "e.g. iPhone 15 Pro, 256GB" },
      { key: "imei_serial", label: "IMEI / Serial No.", type: "text", placeholder: "e.g. 352910293847581" },
      { key: "warranty", label: "Warranty Coverage", type: "text", placeholder: "e.g. 1 Year Official" }
    ],
    suggestedCategories: ["Smartphones", "Chargers & Cables", "Cases & Protection", "TWS & Headsets", "Smartwatches"]
  },
  {
    id: "stationery_shop",
    name: "Stationery Shop",
    icon: "BookOpen",
    description: "Books, office supplies, art materials, printing paper, school items",
    units: ["pcs", "pack", "box", "dozen", "ream", "set"],
    defaultUnit: "pcs",
    allowFractional: false,
    productFields: [
      { key: "brand", label: "Brand", type: "text", placeholder: "e.g. Camlin, Classmate, Reynolds" },
      { key: "grade", label: "GSM / Specification", type: "text", placeholder: "e.g. 75 GSM, Fine 0.7mm" }
    ],
    suggestedCategories: ["Notebooks & Registers", "Writing Instruments", "Office Supplies", "Art & Craft", "Paper & Envelopes"]
  },
  {
    id: "footwear_store",
    name: "Footwear Store",
    icon: "Footprints",
    description: "Shoes, sandals, slippers, sports sneakers, leather goods",
    units: ["pair", "box"],
    defaultUnit: "pair",
    allowFractional: false,
    productFields: [
      { key: "size", label: "Shoe Size (UK/US/EU)", type: "text", placeholder: "e.g. 7, 8, 9, 10, 42" },
      { key: "color", label: "Color", type: "text", placeholder: "e.g. Tan Brown, All Black" },
      { key: "brand", label: "Brand", type: "text", placeholder: "e.g. Bata, Woodland, Puma" },
      { key: "style", label: "Style / Category", type: "text", placeholder: "Formal, Casual, Sports, Ethnic" }
    ],
    suggestedCategories: ["Men's Footwear", "Women's Footwear", "Kids Footwear", "Sports & Running", "Shoe Care & Accessories"]
  },
  {
    id: "jewellery_store",
    name: "Jewellery Store",
    icon: "Gem",
    description: "Gold, silver, diamonds, platinum ornaments, and gemstone articles",
    units: ["gm", "mg", "pcs", "set"],
    defaultUnit: "gm",
    allowFractional: true,
    productFields: [
      { key: "metal_type", label: "Metal Type", type: "text", placeholder: "Gold / Silver / Platinum" },
      { key: "purity", label: "Purity (Karat / Hallmarking)", type: "text", placeholder: "e.g. 22K (916), 18K (750)" },
      { key: "gross_weight", label: "Gross Weight (Grams)", type: "text", placeholder: "e.g. 14.500" },
      { key: "net_weight", label: "Net Weight (Grams)", type: "text", placeholder: "e.g. 13.800" },
      { key: "making_charges", label: "Making Charges (₹ or %)", type: "text", placeholder: "e.g. ₹450/gm" }
    ],
    suggestedCategories: ["Gold Necklaces & Chains", "Bangles & Bracelets", "Rings & Bands", "Silver Articles", "Diamond Ornaments"]
  },
  {
    id: "general_trading",
    name: "General Trading Business",
    icon: "Briefcase",
    description: "Multi-commodity trading, import/export, supply contracts",
    units: ["pcs", "kg", "box", "pack", "metre", "hour", "set"],
    defaultUnit: "pcs",
    allowFractional: true,
    productFields: [
      { key: "brand", label: "Brand / Origin", type: "text", placeholder: "e.g. Universal" },
      { key: "specifications", label: "Technical Specifications", type: "text", placeholder: "e.g. ISO-certified" },
      { key: "hsn_code", label: "Statutory HSN / SAC Code", type: "text", placeholder: "e.g. 8471" }
    ],
    suggestedCategories: ["Commercial Supplies", "Equipment & Parts", "Commodity Lots", "General Assets"]
  },
  {
    id: "other_business",
    name: "Other Businesses",
    icon: "Layers",
    description: "Custom businesses, service providers, consultancy, and hybrid establishments",
    units: ["pcs", "hour", "service", "box", "pack", "kg", "set"],
    defaultUnit: "pcs",
    allowFractional: true,
    productFields: [
      { key: "custom_spec", label: "Item Details / Description", type: "text", placeholder: "Custom notes or model" },
      { key: "reference_code", label: "Internal Ref Code", type: "text", placeholder: "Ref #" }
    ],
    suggestedCategories: ["Primary Products", "Specialized Services", "Supplies & Extras", "Miscellaneous"]
  }
];

export const getCategoryConfig = (categoryId) => {
  return BUSINESS_CATEGORIES.find((c) => c.id === categoryId) || BUSINESS_CATEGORIES[0];
};
