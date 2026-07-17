/* ==========================================================================
   KAN UNIVERSAL — SALES QUOTATION SYSTEM
   specs.js — Product Specifications Database
   Contains spec sheet URLs and product metadata for all catalog items.
   ========================================================================== */

"use strict";

/**
 * PRODUCT_SPECS
 * Key format: "CATEGORY|||ITEM" (upper-cased for lookup)
 * Each entry has: url, brand, description, pixelPitch, minViewDist, cabinetSize, weight, power
 */
const PRODUCT_SPECS = {

    /* ================================================================
       SCREEN — INDOOR STANDARD
       ================================================================ */
    "SCREEN|||P1.25 INDOOR":      { url: "https://www.kanuniversal.com/products/indoor-led/p1-25", brand: "KAN", description: "Ultra-fine pixel pitch indoor LED display, ideal for close-range control rooms and broadcast studios.", pixelPitch: "1.25mm", minViewDist: "1.5m", cabinetSize: "500×500mm / 500×1000mm", weight: "~8kg/sqm" },
    "SCREEN|||P1.53 INDOOR":      { url: "https://www.kanuniversal.com/products/indoor-led/p1-53", brand: "KAN", description: "High-resolution indoor LED panel for conference rooms and retail.", pixelPitch: "1.53mm", minViewDist: "2m",   cabinetSize: "500×500mm", weight: "~9kg/sqm" },
    "SCREEN|||P1.53 GOB INDOOR":  { url: "https://www.kanuniversal.com/products/indoor-led/p1-53-gob", brand: "KAN", description: "GOB-coated 1.53mm indoor panel for dustproof and moistureproof environments.", pixelPitch: "1.53mm", minViewDist: "2m", cabinetSize: "500×500mm", weight: "~9.5kg/sqm" },
    "SCREEN|||P1.86 INDOOR":      { url: "https://www.kanuniversal.com/products/indoor-led/p1-86", brand: "KAN", description: "P1.86 fine pixel pitch indoor display for boardrooms and showrooms.", pixelPitch: "1.86mm", minViewDist: "2.5m", cabinetSize: "480×480mm", weight: "~9kg/sqm" },
    "SCREEN|||P2.0 INDOOR":       { url: "https://www.kanuniversal.com/products/indoor-led/p2-0",  brand: "KAN", description: "P2.0 indoor LED, excellent for trade shows and exhibitions.", pixelPitch: "2.0mm", minViewDist: "3m", cabinetSize: "512×512mm", weight: "~10kg/sqm" },
    "SCREEN|||P2.5 INDOOR":       { url: "https://www.kanuniversal.com/products/indoor-led/p2-5",  brand: "KAN", description: "Popular P2.5 indoor panel for shopping malls and event venues.", pixelPitch: "2.5mm", minViewDist: "3.5m", cabinetSize: "640×640mm", weight: "~10kg/sqm" },
    "SCREEN|||P3.0 INDOOR":       { url: "https://www.kanuniversal.com/products/indoor-led/p3-0",  brand: "KAN", description: "P3.0 indoor display, cost-effective for large indoor spaces.", pixelPitch: "3.0mm", minViewDist: "4m", cabinetSize: "576×576mm", weight: "~11kg/sqm" },

    /* ================================================================
       SCREEN — OUTDOOR STANDARD
       ================================================================ */
    "SCREEN|||P2.5 OUTDOOR":      { url: "https://www.kanuniversal.com/products/outdoor-led/p2-5",  brand: "KAN", description: "P2.5 outdoor LED display, IP65 rated, suitable for semi-outdoor environments.", pixelPitch: "2.5mm", minViewDist: "4m",   cabinetSize: "640×640mm", weight: "~25kg/sqm" },
    "SCREEN|||P3 OUTDOOR":        { url: "https://www.kanuniversal.com/products/outdoor-led/p3",    brand: "KAN", description: "P3 outdoor LED, ideal for storefronts and corporate facades.", pixelPitch: "3.0mm", minViewDist: "5m",   cabinetSize: "576×576mm", weight: "~24kg/sqm" },
    "SCREEN|||P4 OUTDOOR":        { url: "https://www.kanuniversal.com/products/outdoor-led/p4",    brand: "KAN", description: "P4 outdoor display, excellent for gas stations and medium-distance viewing.", pixelPitch: "4.0mm", minViewDist: "6m",   cabinetSize: "512×512mm", weight: "~28kg/sqm" },
    "SCREEN|||P5 OUTDOOR":        { url: "https://www.kanuniversal.com/products/outdoor-led/p5",    brand: "KAN", description: "P5 outdoor LED panel, bright and weather-resistant for outdoor advertising.", pixelPitch: "5.0mm", minViewDist: "8m",   cabinetSize: "640×640mm", weight: "~30kg/sqm" },
    "SCREEN|||P6 OUTDOOR":        { url: "https://www.kanuniversal.com/products/outdoor-led/p6",    brand: "KAN", description: "P6 outdoor billboard display, widely used for large-format advertising.", pixelPitch: "6.0mm", minViewDist: "10m",  cabinetSize: "576×576mm", weight: "~32kg/sqm" },
    "SCREEN|||P 10 OUTDOOR":      { url: "https://www.kanuniversal.com/products/outdoor-led/p10",   brand: "KAN", description: "P10 large format outdoor LED, ideal for highways and stadiums.", pixelPitch: "10.0mm", minViewDist: "15m", cabinetSize: "960×960mm", weight: "~35kg/sqm" },

    /* ================================================================
       SCREEN — COB / FLIP CHIP
       ================================================================ */
    "SCREEN|||P0.62 COB/ FLIP CHIP":  { url: "https://www.kanuniversal.com/products/cob-led/p0-62", brand: "KAN", description: "P0.62 COB Flip Chip, ultra-premium indoor for command centers and luxury installations.", pixelPitch: "0.62mm", minViewDist: "1m", cabinetSize: "600×337.5mm", weight: "~12kg/sqm" },
    "SCREEN|||P0.78 COB/ FLIP CHIP":  { url: "https://www.kanuniversal.com/products/cob-led/p0-78", brand: "KAN", description: "P0.78 COB Flip Chip, dust & moisture proof, excellent for premium boardrooms.", pixelPitch: "0.78mm", minViewDist: "1.2m" },
    "SCREEN|||P0.93 COB/ FLIP CHIP":  { url: "https://www.kanuniversal.com/products/cob-led/p0-93", brand: "KAN", description: "P0.93 COB technology for seamless high-resolution walls.", pixelPitch: "0.93mm", minViewDist: "1.5m" },
    "SCREEN|||P1.25 COB/ FLIP CHIP":  { url: "https://www.kanuniversal.com/products/cob-led/p1-25", brand: "KAN", description: "P1.25 COB, anti-glare surface with outstanding color performance.", pixelPitch: "1.25mm", minViewDist: "2m" },
    "SCREEN|||P1.56 COB/ FLIP CHIP":  { url: "https://www.kanuniversal.com/products/cob-led/p1-56", brand: "KAN", description: "P1.56 COB display panel.", pixelPitch: "1.56mm", minViewDist: "2.5m" },
    "SCREEN|||P1.87 COB/ FLIP CHIP":  { url: "https://www.kanuniversal.com/products/cob-led/p1-87", brand: "KAN", description: "P1.87 COB flip-chip indoor display.", pixelPitch: "1.87mm", minViewDist: "3m" },

    /* ================================================================
       SCREEN — RENTAL
       ================================================================ */
    "SCREEN|||P2.976 RENTAL":     { url: "https://www.kanuniversal.com/products/rental-led/p2-976", brand: "KAN", description: "P2.976 lightweight rental LED panel with quick-lock system.", pixelPitch: "2.976mm", cabinetSize: "500×500mm or 500×1000mm", weight: "~7.5kg/panel" },
    "SCREEN|||P3.6 RENTAL":       { url: "https://www.kanuniversal.com/products/rental-led/p3-6",   brand: "KAN", description: "P3.6 rental display for stage events and concerts.", pixelPitch: "3.6mm" },
    "SCREEN|||P3.79 RENTAL":      { url: "https://www.kanuniversal.com/products/rental-led/p3-79",  brand: "KAN", description: "P3.79 outdoor rental LED cabinet.", pixelPitch: "3.79mm" },
    "SCREEN|||P3.91 RENTAL":      { url: "https://www.kanuniversal.com/products/rental-led/p3-91",  brand: "KAN", description: "P3.91 rental outdoor LED panel, die-cast aluminum, IP65.", pixelPitch: "3.91mm", cabinetSize: "500×500mm", weight: "~8kg/panel" },
    "SCREEN|||P4.8 RENTAL":       { url: "https://www.kanuniversal.com/products/rental-led/p4-8",   brand: "KAN", description: "P4.8 outdoor rental display, suitable for large event stages.", pixelPitch: "4.8mm" },
    "SCREEN|||P4.81 RENTAL":      { url: "https://www.kanuniversal.com/products/rental-led/p4-81",  brand: "KAN", description: "P4.81 rental LED, lightweight and portable for touring events.", pixelPitch: "4.81mm" },

    /* ================================================================
       SCREEN — KYSTAR CONTROLLERS (used as Screen category)
       ================================================================ */
    "SCREEN|||G608":  { url: "https://www.kystar.com.cn/product/G608",  brand: "KYSTAR", description: "KYSTAR G608 LED controller with dual RJ45 output." },
    "SCREEN|||R12":   { url: "https://www.kystar.com.cn/product/R12",   brand: "KYSTAR", description: "KYSTAR R12 receiving card, supports high-refresh rate displays." },

    /* ================================================================
       VIDEO PROCESSOR — KYSTAR
       ================================================================ */
    "VIDEO PROCESSOR|||ES2":          { url: "https://www.kystar.com.cn/product/ES2",       brand: "KYSTAR", description: "KYSTAR ES2 Seamless Video Processor with 2-channel HDMI input." },
    "VIDEO PROCESSOR|||GS061":        { url: "https://www.kystar.com.cn/product/GS061",     brand: "KYSTAR", description: "KYSTAR GS061 HD LED display controller." },
    "VIDEO PROCESSOR|||KLS2C":        { url: "https://www.kystar.com.cn/product/KLS2C",     brand: "KYSTAR", description: "KYSTAR KLS2C 2-port LED system controller." },
    "VIDEO PROCESSOR|||KLS4C":        { url: "https://www.kystar.com.cn/product/KLS4C",     brand: "KYSTAR", description: "KYSTAR KLS4C 4-port LED display controller." },
    "VIDEO PROCESSOR|||KLS6C":        { url: "https://www.kystar.com.cn/product/KLS6C",     brand: "KYSTAR", description: "KYSTAR KLS6C 6-port sending card." },
    "VIDEO PROCESSOR|||KLS8C":        { url: "https://www.kystar.com.cn/product/KLS8C",     brand: "KYSTAR", description: "KYSTAR KLS8C 8-port LED video processor." },
    "VIDEO PROCESSOR|||KLS12":        { url: "https://www.kystar.com.cn/product/KLS12",     brand: "KYSTAR", description: "KYSTAR KLS12 LED system controller, 12 ports." },
    "VIDEO PROCESSOR|||LA400":        { url: "https://www.kystar.com.cn/product/LA400",     brand: "KYSTAR", description: "KYSTAR LA400 video processor, 4K output." },
    "VIDEO PROCESSOR|||LS800":        { url: "https://www.kystar.com.cn/product/LS800",     brand: "KYSTAR", description: "KYSTAR LS800 LED display processor." },
    "VIDEO PROCESSOR|||LA1200":       { url: "https://www.kystar.com.cn/product/LA1200",    brand: "KYSTAR", description: "KYSTAR LA1200 professional video processor." },
    "VIDEO PROCESSOR|||LS16":         { url: "https://www.kystar.com.cn/product/LS16",      brand: "KYSTAR", description: "KYSTAR LS16 sending card with 16 ports." },
    "VIDEO PROCESSOR|||KLS24":        { url: "https://www.kystar.com.cn/product/KLS24",     brand: "KYSTAR", description: "KYSTAR KLS24 high-load LED controller." },

    /* ================================================================
       VIDEO PROCESSOR — NOVASTAR
       ================================================================ */
    "VIDEO PROCESSOR|||VX1":          { url: "https://www.novastar.tech/vx1",         brand: "NOVASTAR", description: "NovaStar VX1 all-in-one LED controller, 1 sending card port." },
    "VIDEO PROCESSOR|||VX400":        { url: "https://www.novastar.tech/vx400",       brand: "NOVASTAR", description: "NovaStar VX400 HD LED display controller." },
    "VIDEO PROCESSOR|||VX600":        { url: "https://www.novastar.tech/vx600",       brand: "NOVASTAR", description: "NovaStar VX600 multi-function LED display controller." },
    "VIDEO PROCESSOR|||VX1000":       { url: "https://www.novastar.tech/vx1000",      brand: "NOVASTAR", description: "NovaStar VX1000 full-featured LED video processor." },
    "VIDEO PROCESSOR|||4K PRIME":     { url: "https://www.novastar.tech/4k-prime",    brand: "NOVASTAR", description: "NovaStar 4K Prime ultra-high-definition LED controller." },
    "VIDEO PROCESSOR|||VX2000 PRO":   { url: "https://www.novastar.tech/vx2000-pro",  brand: "NOVASTAR", description: "NovaStar VX2000 Pro — premium all-in-one LED control solution." },

    /* ================================================================
       VIDEO PROCESSOR — HUIDU
       ================================================================ */
    "VIDEO PROCESSOR|||VP4060":       { url: "https://www.huidutech.com/product/VP4060",   brand: "HUIDU", description: "HUIDU VP4060 video processor." },
    "VIDEO PROCESSOR|||VP3060":       { url: "https://www.huidutech.com/product/VP3060",   brand: "HUIDU", description: "HUIDU VP3060 LED display video processor." },
    "VIDEO PROCESSOR|||VP2060":       { url: "https://www.huidutech.com/product/VP2060",   brand: "HUIDU", description: "HUIDU VP2060 video processor." },
    "VIDEO PROCESSOR|||VP2430":       { url: "https://www.huidutech.com/product/VP2430",   brand: "HUIDU", description: "HUIDU VP2430 LED processor, 4K input." },
    "VIDEO PROCESSOR|||VP1640A":      { url: "https://www.huidutech.com/product/VP1640A",  brand: "HUIDU", description: "HUIDU VP1640A LED video processor." },
    "VIDEO PROCESSOR|||VP1240A":      { url: "https://www.huidutech.com/product/VP1240A",  brand: "HUIDU", description: "HUIDU VP1240A video processor." },
    "VIDEO PROCESSOR|||VP1620S":      { url: "https://www.huidutech.com/product/VP1620S",  brand: "HUIDU", description: "HUIDU VP1620S synchronized video processor." },
    "VIDEO PROCESSOR|||VP1220S":      { url: "https://www.huidutech.com/product/VP1220S",  brand: "HUIDU", description: "HUIDU VP1220S video processor." },
    "VIDEO PROCESSOR|||VP830":        { url: "https://www.huidutech.com/product/VP830",    brand: "HUIDU", description: "HUIDU VP830 LED video processor." },
    "VIDEO PROCESSOR|||VP630":        { url: "https://www.huidutech.com/product/VP630",    brand: "HUIDU", description: "HUIDU VP630 LED display controller." },
    "VIDEO PROCESSOR|||VP820A":       { url: "https://www.huidutech.com/product/VP820A",   brand: "HUIDU", description: "HUIDU VP820A video processor." },
    "VIDEO PROCESSOR|||VP620A":       { url: "https://www.huidutech.com/product/VP620A",   brand: "HUIDU", description: "HUIDU VP620A LED video processor." },
    "VIDEO PROCESSOR|||VP410H":       { url: "https://www.huidutech.com/product/VP410H",   brand: "HUIDU", description: "HUIDU VP410H video processor, HDMI output." },
    "VIDEO PROCESSOR|||VP210H":       { url: "https://www.huidutech.com/product/VP210H",   brand: "HUIDU", description: "HUIDU VP210H compact LED processor." },
    "VIDEO PROCESSOR|||VP410S":       { url: "https://www.huidutech.com/product/VP410S",   brand: "HUIDU", description: "HUIDU VP410S video processor." },
    "VIDEO PROCESSOR|||VP210S":       { url: "https://www.huidutech.com/product/VP210S",   brand: "HUIDU", description: "HUIDU VP210S LED controller." },
    "VIDEO PROCESSOR|||KV410":        { url: "https://www.huidutech.com/product/KV410",    brand: "HUIDU", description: "HUIDU KV410 LED display controller." },
    "VIDEO PROCESSOR|||KV210":        { url: "https://www.huidutech.com/product/KV210",    brand: "HUIDU", description: "HUIDU KV210 LED controller." },
    "VIDEO PROCESSOR|||VP8000M-2U":   { url: "https://www.huidutech.com/product/VP8000M",  brand: "HUIDU", description: "HUIDU VP8000M-2U rack-mount video processor." },
    "VIDEO PROCESSOR|||VP8000M-3U":   { url: "https://www.huidutech.com/product/VP8000M",  brand: "HUIDU", description: "HUIDU VP8000M-3U rack-mount video processor." },
    "VIDEO PROCESSOR|||VP8000M-6U":   { url: "https://www.huidutech.com/product/VP8000M",  brand: "HUIDU", description: "HUIDU VP8000M-6U rack-mount video processor." },
    "VIDEO PROCESSOR|||VP8000M-12U":  { url: "https://www.huidutech.com/product/VP8000M",  brand: "HUIDU", description: "HUIDU VP8000M-12U rack-mount video processor, 12U." },

    /* ================================================================
       LED CONTROLLER — KYSTAR
       ================================================================ */
    "LED CONTROLLER|||KPB12":   { url: "https://www.kystar.com.cn/product/KPB12",  brand: "KYSTAR", description: "KYSTAR KPB12 LED sending card." },
    "LED CONTROLLER|||KP1HC":   { url: "https://www.kystar.com.cn/product/KP1HC",  brand: "KYSTAR", description: "KYSTAR KP1HC HD sending card." },
    "LED CONTROLLER|||KP2C":    { url: "https://www.kystar.com.cn/product/KP2C",   brand: "KYSTAR", description: "KYSTAR KP2C dual-port sending card." },
    "LED CONTROLLER|||KP1":     { url: "https://www.kystar.com.cn/product/KP1",    brand: "KYSTAR", description: "KYSTAR KP1 LED controller, 1 port." },
    "LED CONTROLLER|||KP2":     { url: "https://www.kystar.com.cn/product/KP2",    brand: "KYSTAR", description: "KYSTAR KP2 LED controller, 2 ports." },
    "LED CONTROLLER|||KP4":     { url: "https://www.kystar.com.cn/product/KP4",    brand: "KYSTAR", description: "KYSTAR KP4 LED controller, 4 ports." },
    "LED CONTROLLER|||KP2K":    { url: "https://www.kystar.com.cn/product/KP2K",   brand: "KYSTAR", description: "KYSTAR KP2K 4K LED controller." },
    "LED CONTROLLER|||KP4K":    { url: "https://www.kystar.com.cn/product/KP4K",   brand: "KYSTAR", description: "KYSTAR KP4K 4K sending card, 4 ports." },

    /* ================================================================
       LED CONTROLLER — HUIDU
       ================================================================ */
    "LED CONTROLLER|||HD-A3L":  { url: "https://www.huidutech.com/product/HD-A3L", brand: "HUIDU", description: "HUIDU HD-A3L asynchronous LED controller." },
    "LED CONTROLLER|||HD-A4L":  { url: "https://www.huidutech.com/product/HD-A4L", brand: "HUIDU", description: "HUIDU HD-A4L asynchronous LED controller." },
    "LED CONTROLLER|||HD-A5L":  { url: "https://www.huidutech.com/product/HD-A5L", brand: "HUIDU", description: "HUIDU HD-A5L multi-function LED controller." },
    "LED CONTROLLER|||HD-A6L":  { url: "https://www.huidutech.com/product/HD-A6L", brand: "HUIDU", description: "HUIDU HD-A6L advanced LED controller with Wi-Fi." },
    "LED CONTROLLER|||A8":      { url: "https://www.huidutech.com/product/A8",     brand: "HUIDU", description: "HUIDU A8 asynchronous LED control card." },
    "LED CONTROLLER|||A7":      { url: "https://www.huidutech.com/product/A7",     brand: "HUIDU", description: "HUIDU A7 LED controller." },
    "LED CONTROLLER|||A6L":     { url: "https://www.huidutech.com/product/A6L",    brand: "HUIDU", description: "HUIDU A6L LED control card." },
    "LED CONTROLLER|||A5L":     { url: "https://www.huidutech.com/product/A5L",    brand: "HUIDU", description: "HUIDU A5L LED controller." },
    "LED CONTROLLER|||A4L":     { url: "https://www.huidutech.com/product/A4L",    brand: "HUIDU", description: "HUIDU A4L LED controller." },
    "LED CONTROLLER|||A3L":     { url: "https://www.huidutech.com/product/A3L",    brand: "HUIDU", description: "HUIDU A3L LED controller." },
    "LED CONTROLLER|||H8":      { url: "https://www.huidutech.com/product/H8",     brand: "HUIDU", description: "HUIDU H8 smart LED controller." },
    "LED CONTROLLER|||H6":      { url: "https://www.huidutech.com/product/H6",     brand: "HUIDU", description: "HUIDU H6 LED controller." },
    "LED CONTROLLER|||H4K":     { url: "https://www.huidutech.com/product/H4K",    brand: "HUIDU", description: "HUIDU H4K 4K LED controller." },
    "LED CONTROLLER|||C16H":    { url: "https://www.huidutech.com/product/C16H",   brand: "HUIDU", description: "HUIDU C16H LED controller, 16 channels." },
    "LED CONTROLLER|||C16L":    { url: "https://www.huidutech.com/product/C16L",   brand: "HUIDU", description: "HUIDU C16L LED controller." },
    "LED CONTROLLER|||C08L":    { url: "https://www.huidutech.com/product/C08L",   brand: "HUIDU", description: "HUIDU C08L LED controller, 8 channels." },
    "LED CONTROLLER|||D16":     { url: "https://www.huidutech.com/product/D16",    brand: "HUIDU", description: "HUIDU D16 LED controller." },
    "LED CONTROLLER|||B8L":     { url: "https://www.huidutech.com/product/B8L",    brand: "HUIDU", description: "HUIDU B8L LED controller." },
    "LED CONTROLLER|||B6L":     { url: "https://www.huidutech.com/product/B6L",    brand: "HUIDU", description: "HUIDU B6L LED controller." },
    "LED CONTROLLER|||KP1HC":   { url: "https://www.kystar.com.cn/product/KP1hc",  brand: "KAN",   description: "KP1hc LED sending card." },

    /* ================================================================
       LED CONTROLLER — NOVASTAR
       ================================================================ */
    "LED CONTROLLER|||TB2-4G":  { url: "https://www.novastar.tech/tb2-4g",  brand: "NOVASTAR", description: "NovaStar TB2-4G 4G LED controller." },
    "LED CONTROLLER|||TB40-4G": { url: "https://www.novastar.tech/tb40-4g", brand: "NOVASTAR", description: "NovaStar TB40-4G LED control card." },
    "LED CONTROLLER|||TB60-4G": { url: "https://www.novastar.tech/tb60-4g", brand: "NOVASTAR", description: "NovaStar TB60-4G 4G LED controller." },
    "LED CONTROLLER|||TU15 PRO":{ url: "https://www.novastar.tech/tu15-pro",brand: "NOVASTAR", description: "NovaStar TU15 Pro advanced LED controller." },
    "LED CONTROLLER|||TU20 PRO":{ url: "https://www.novastar.tech/tu20-pro",brand: "NOVASTAR", description: "NovaStar TU20 Pro LED control system." },
    "LED CONTROLLER|||TU40 PRO":{ url: "https://www.novastar.tech/tu40-pro",brand: "NOVASTAR", description: "NovaStar TU40 Pro high-capacity LED controller." },

    /* ================================================================
       FABRICATION / FRAME
       ================================================================ */
    "FABRICATION / FRAME|||MAGNATIC FRAME STRUCTURE":   { url: "https://www.kanuniversal.com/products/fabrication/magnetic-frame",  brand: "Fabrication", description: "Magnetic LED frame structure for indoor wall installations." },
    "FABRICATION / FRAME|||OUTDOOR LED FRAME STRUCTURE":{ url: "https://www.kanuniversal.com/products/fabrication/outdoor-frame",   brand: "Fabrication", description: "Heavy-duty outdoor LED mounting structure, powder coated." },
    "FABRICATION / FRAME|||POLE WITH LED FRAME STRUCTURE":{ url: "https://www.kanuniversal.com/products/fabrication/pole-frame",  brand: "Fabrication", description: "Pole structure with integrated LED display frame for outdoor use." },
    "FABRICATION / FRAME|||MOVABLE FRAME STRUCTURE":    { url: "https://www.kanuniversal.com/products/fabrication/movable-frame",   brand: "Fabrication", description: "Wheeled movable frame structure for portable LED displays." },

    /* ================================================================
       MULTI VIEWER / ACCESSORIES
       ================================================================ */
    "MULTI VIEWER  - 4 IN 1|||MULTI VIEWER  - 4 IN 1": { url: "https://www.kanuniversal.com/products/accessories/multi-viewer",  brand: "KAN", description: "4-in-1 Multi Viewer to display 4 sources simultaneously on one LED screen." },
    "HDMI CABLE|||HDMI CABLE (4K)": { url: "https://www.kanuniversal.com/products/accessories/hdmi-4k", brand: "KAN", description: "4K HDMI cable for connecting video sources to processors, 5/10/20M available." },
    "LED MODULE|||P4 OUTDOOR":      { url: "https://www.kanuniversal.com/products/modules/p4-outdoor",  brand: "KAN", description: "Replacement LED module for P4 outdoor displays." },
    "RECEIVING CARD|||RECEIVING CARD": { url: "https://www.kystar.com.cn/product/receiving-card",        brand: "KYSTAR", description: "KYSTAR receiving card for LED cabinets." }
};

/**
 * Look up a spec entry by category and item.
 * Returns the spec object or null.
 */
function getProductSpec(category, item) {
    // Normalize arrow-style categories: "Screen → Module" → "SCREEN", "Cabinet" → "CABINET"
    function normalizeCategory(cat) {
        const raw = String(cat || "").trim();
        // Map display labels to PRODUCT_SPECS key prefix
        if (/screen\s*[→\->]\s*module/i.test(raw)) return "SCREEN";
        if (/^screen$/i.test(raw)) return "SCREEN";
        if (/^cabinet$/i.test(raw)) return "CABINET";
        return raw.toUpperCase();
    }
    const normCat = normalizeCategory(category);
    const normItem = String(item).toUpperCase().trim();
    const key = (normCat + "|||" + normItem).trim();
    return PRODUCT_SPECS[key] || null;
}

/**
 * Get the View Specs URL for a product.
 * Falls back to KAN Universal product page.
 */
function getSpecUrl(category, item) {
    const spec = getProductSpec(category, item);
    return spec ? spec.url : "https://www.kanuniversal.com/products";
}
