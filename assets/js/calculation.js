/* ==========================================================================
   KAN UNIVERSAL — SALES QUOTATION SYSTEM
   calculation.js — Screen dimension calculation engine
   Supports all 6 LED display cases:
     Case 1 — 192 × 192 mm Module
     Case 2 — 320 × 160 mm Module
     Case 3 — 288 × 288 mm Module
     Case 4 — COB Cabinet (600 × 337.5 mm)
     Case 5 — 576 × 576 mm Cabinet (2×2 of 288mm modules)
     Case 6 — 192 × 192 mm Diecast Cabinet (3×3 of 192mm modules, 576×576 cabinet)

   ROUNDING POLICY: Always CEILING (round up) — LED units cannot be cut.
   The finished screen must never be smaller than the customer's request.
   UP = CEILING count (recommended default)
   DOWN = FLOOR count (user override via radio/stepper)
   ========================================================================== */

"use strict";

/* ============================================================
   CONSTANTS
   ============================================================ */
const MM_PER_FT = 304.8;

/* ============================================================
   MODULE / CABINET SIZE MAP
   Maps moduleSize radio value → calculation parameters
   unitW, unitH : the physical dimension of one unit in mm
   type         : "module" | "cabinet"
   label        : human-readable label for banner
   cabinetW     : (cabinet types) cabinet width in mm (= unitW)
   cabinetH     : (cabinet types) cabinet height in mm (= unitH)
   modPerCabW   : modules per cabinet in width direction (for cabinet types)
   modPerCabH   : modules per cabinet in height direction (for cabinet types)
   ============================================================ */
const MODULE_SIZE_MAP = {
    /* Case 1 — 192×192 Module */
    "192x192": {
        type:   "module",
        unitW:  192,
        unitH:  192,
        label:  "192 × 192 mm Module"
    },
    /* Case 2 — 320×160 Module */
    "320x160": {
        type:   "module",
        unitW:  320,
        unitH:  160,
        label:  "320 × 160 mm Module"
    },
    /* Case 3 — 288×288 Module */
    "288x288": {
        type:   "module",
        unitW:  288,
        unitH:  288,
        label:  "288 × 288 mm Module"
    },
    /* Case 4 — COB Cabinet 600×337.5 */
    "600x337.5": {
        type:   "cabinet",
        unitW:  600,
        unitH:  337.5,
        label:  "COB Cabinet 600 × 337.5 mm",
        /* COB cabinets have no standard internal module subdivision */
        modPerCabW: null,
        modPerCabH: null
    },
    /* Case 5 — 576×576 Cabinet (2×2 arrangement of 288×288 modules) */
    "576x576": {
        type:      "cabinet",
        unitW:     576,
        unitH:     576,
        label:     "576 × 576 mm Cabinet (2×2 of 288mm Modules)",
        modPerCabW: 2,
        modPerCabH: 2
    },
    /* Case 6 — 192×192 Diecast Cabinet (3×3 arrangement of 192×192 modules, 576×576 cabinet) */
    "diecast192": {
        type:      "cabinet",
        unitW:     576,
        unitH:     576,
        label:     "192 × 192 Diecast Cabinet (3×3 Modules, 576 × 576 mm)",
        modPerCabW: 3,
        modPerCabH: 3
    },
    /* New nested keys */
    "diecast_576_288": {
        type:      "cabinet",
        unitW:     576,
        unitH:     576,
        label:     "Diecast 576 × 576 mm Cabinet (2×2 of 288mm Modules)",
        modPerCabW: 2,
        modPerCabH: 2
    },
    "diecast_576_192": {
        type:      "cabinet",
        unitW:     576,
        unitH:     576,
        label:     "Diecast 576 × 576 mm Cabinet (3×3 of 192mm Modules)",
        modPerCabW: 3,
        modPerCabH: 3
    },
    "diecast_640_320": {
        type:      "cabinet",
        unitW:     640,
        unitH:     640,
        label:     "Diecast 640 × 640 mm Cabinet (2×4 of 320×160mm Modules)",
        modPerCabW: 2,
        modPerCabH: 4
    }
};

/* ============================================================
   MODULE OVERRIDE STATE
   Tracks user-adjusted unit counts (via +/- steppers) per axis.
   choice: "up" = CEILING (recommended), "down" = FLOOR (user override)
   ============================================================ */
const _modState = {
    width:  { upCount: null, downCount: null, choice: null },
    height: { upCount: null, downCount: null, choice: null }
};

/* ============================================================
   HELPERS
   ============================================================ */

/**
 * Get the size spec for the currently selected module size radio.
 * Returns null if nothing selected or value not in map.
 */
function getSelectedSizeSpec() {
    const el = document.querySelector('input[name="moduleSize"]:checked');
    if (!el) return null;
    return MODULE_SIZE_MAP[el.value] || null;
}

/**
 * Legacy compatibility: parse "WxH" string → { w, h } in mm.
 * Used by script.js buildScreenDescription() via moduleDims().
 */
function moduleDims(moduleSizeValue) {
    /* Direct map lookup first */
    const spec = MODULE_SIZE_MAP[moduleSizeValue];
    if (spec) return { w: spec.unitW, h: spec.unitH };
    /* Fallback: parse "WxH" string */
    const [w, h] = String(moduleSizeValue).split("x").map(Number);
    return { w: w || 192, h: h || 192 };
}

/* ============================================================
   MAIN CALCULATION ENGINE
   Reads DOM inputs → computes → writes DOM outputs.
   ============================================================ */
function runCalculationEngine() {
    const spec      = getSelectedSizeSpec();
    const widthFtEl  = document.getElementById("screenWidth");
    const heightFtEl = document.getElementById("screenHeight");
    const calcBanner = document.getElementById("calcBanner");

    if (!widthFtEl || !heightFtEl) return;

    const widthFt  = parseFloat(widthFtEl.value)  || 0;
    const heightFt = parseFloat(heightFtEl.value) || 0;

    if (!spec || widthFt <= 0 || heightFt <= 0) {
        clearCalculations();
        return;
    }

    const { unitW, unitH } = spec;

    // Determine if it is a 576x576 cabinet type
    const is576Cabinet = spec && spec.unitW === 576 && spec.unitH === 576;
    const mmPerFt = is576Cabinet ? 305 : 304.8;

    /* Step 1 — Convert feet to mm */
    const reqWidthMM  = widthFt  * mmPerFt;
    const reqHeightMM = heightFt * mmPerFt;

    /* Step 2 — Raw fractional unit counts */
    const rawW = reqWidthMM  / unitW;
    const rawH = reqHeightMM / unitH;

    /* Step 3 — CEILING (up) and FLOOR (down) integer counts */
    const ceilW = Math.ceil(rawW);
    const floorW = Math.max(1, Math.floor(rawW));
    const ceilH = Math.ceil(rawH);
    const floorH = Math.max(1, Math.floor(rawH));

    /* Initialise state on first run — default to CEILING (up) */
    if (_modState.width.upCount   === null) _modState.width.upCount   = ceilW;
    if (_modState.width.downCount === null) _modState.width.downCount = floorW;
    if (_modState.height.upCount  === null) _modState.height.upCount  = ceilH;
    if (_modState.height.downCount=== null) _modState.height.downCount= floorH;

    /* Default selection: ROUND for 576x576 cabinet, UP (CEILING) otherwise */
    if (_modState.width.choice === null) {
        if (is576Cabinet) {
            const roundedW = Math.round(rawW);
            _modState.width.choice = (roundedW === ceilW) ? "up" : "down";
        } else {
            _modState.width.choice = "up";
        }
    }
    if (_modState.height.choice === null) {
        if (is576Cabinet) {
            const roundedH = Math.round(rawH);
            _modState.height.choice = (roundedH === ceilH) ? "up" : "down";
        } else {
            _modState.height.choice = "up";
        }
    }

    /* Step 4 — Render rounding cards */
    _updateRoundingCard("width",  rawW, unitW, spec.type);
    _updateRoundingCard("height", rawH, unitH, spec.type);

    /* Step 5 — Chosen unit counts */
    const unitsWide = (_modState.width.choice  === "up") ? _modState.width.upCount  : _modState.width.downCount;
    const unitsHigh = (_modState.height.choice === "up") ? _modState.height.upCount : _modState.height.downCount;

    /* Step 6 — Actual screen dimensions */
    const actualWidthMM  = unitsWide * unitW;
    const actualHeightMM = unitsHigh * unitH;
    const actualWidthFT  = actualWidthMM  / mmPerFt;
    const actualHeightFT = actualHeightMM / mmPerFt;
    const totalArea      = actualWidthFT  * actualHeightFT;

    /* Step 7 — Compute extra info for cabinet types */
    let bannerExtra = "";
    let modulesW = unitsWide;
    let modulesH = unitsHigh;
    if (spec.type === "cabinet" && spec.modPerCabW !== null) {
        modulesW = unitsWide * spec.modPerCabW;
        modulesH = unitsHigh * spec.modPerCabH;
        const totalMod  = modulesW * modulesH;
        bannerExtra = `  |  Modules: ${modulesW} × ${modulesH} = ${totalMod}`;
    }

    /* Step 8 — Update banner */
    const unitLabel = spec.type === "cabinet" ? "Cabinets" : "Modules";
    if (calcBanner) {
        calcBanner.textContent =
            `${unitLabel}: ${unitsWide} × ${unitsHigh}` +
            `  |  Size: ${actualWidthMM.toFixed(0)} × ${actualHeightMM.toFixed(0)} mm` +
            ` (${actualWidthFT.toFixed(2)} × ${actualHeightFT.toFixed(2)} ft)` +
            `  |  Area: ${totalArea.toFixed(2)} SQFT` +
            bannerExtra;
    }

    /* Step 9 — Write output fields */
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    
    const totalCabinetsCount = unitsWide * unitsHigh;

    setVal("numModulesW",    unitsWide);
    setVal("numModulesH",    unitsHigh);
    setVal("totalCabinets",  totalCabinetsCount);
    setVal("actualWidthMM",  actualWidthMM.toFixed(2));
    setVal("actualHeightMM", actualHeightMM.toFixed(2));
    setVal("actualWidthFT",  actualWidthFT.toFixed(2));
    setVal("actualHeightFT", actualHeightFT.toFixed(2));
    setVal("totalArea",      totalArea.toFixed(2));

    /* Step 10 — Sync Screen row in quotation breakdown table */
    if (typeof syncScreenRow === "function") syncScreenRow();
}

/* ============================================================
   UPDATE ONE ROUNDING CARD (width or height)
   ============================================================ */
function _updateRoundingCard(axis, rawUnits, unitMM, unitType) {
    const card = document.getElementById(axis + "RoundingCard");
    if (!card) return;
    card.style.display = "flex";

    /* Raw hint text */
    const hintId = "raw" + (axis === "width" ? "Width" : "Height") + "Hint";
    const hint = document.getElementById(hintId);
    const unitLabel = unitType === "cabinet" ? "Cabinet" : "Module";
    if (hint) hint.textContent = `⚙ Raw ${axis === "width" ? "Width" : "Height"} ${unitLabel}s: ${rawUnits.toFixed(4)}`;

    /* Counts */
    const upCount   = _modState[axis].upCount;
    const downCount = _modState[axis].downCount;
    const choice    = _modState[axis].choice;

    const upCountEl   = document.getElementById(axis + "UpCount");
    const downCountEl = document.getElementById(axis + "DownCount");
    if (upCountEl)   upCountEl.textContent   = upCount;
    if (downCountEl) downCountEl.textContent = downCount;

    /* Disable minus button at minimum = 1 */
    const upMinus   = document.querySelector(`.module-step-btn.minus[data-axis="${axis}"][data-rounding="up"]`);
    const downMinus = document.querySelector(`.module-step-btn.minus[data-axis="${axis}"][data-rounding="down"]`);
    if (upMinus)   upMinus.disabled   = upCount   <= 1;
    if (downMinus) downMinus.disabled = downCount <= 1;

    /* Sync radio checked state and is-selected highlight */
    const upRadio   = document.getElementById(axis + "RoundUp");
    const downRadio = document.getElementById(axis + "RoundDown");
    const upRow     = document.getElementById(axis + "UpRow");
    const downRow   = document.getElementById(axis + "DownRow");

    if (upRadio)   upRadio.checked   = (choice === "up");
    if (downRadio) downRadio.checked = (choice === "down");
    if (upRow)     upRow.classList.toggle("is-selected",   choice === "up");
    if (downRow)   downRow.classList.toggle("is-selected", choice === "down");
}

/* ============================================================
   HIDE ROUNDING CARDS when inputs are incomplete
   ============================================================ */
function _hideRoundingCards() {
    const wc = document.getElementById("widthRoundingCard");
    const hc = document.getElementById("heightRoundingCard");
    if (wc) wc.style.display = "none";
    if (hc) hc.style.display = "none";
}

/* ============================================================
   RESET MODULE STATE
   Called when width/height/moduleSize changes to force recalculation
   with fresh CEILING defaults.
   ============================================================ */
function _resetModuleState() {
    _modState.width  = { upCount: null, downCount: null, choice: null };
    _modState.height = { upCount: null, downCount: null, choice: null };
}

/* ============================================================
   BUILD SCREEN DESCRIPTION STRING
   Used by syncScreenRow() in script.js to populate Row 1 description.
   ============================================================ */
function buildScreenDescription() {
    const get   = id => { const el = document.getElementById(id); return el ? el.value : ""; };
    const radio = name => document.querySelector(`input[name="${name}"]:checked`)?.value || "";

    const spec      = getSelectedSizeSpec();
    const unitLabel = spec ? (spec.type === "cabinet" ? "Cabinet" : "Module") : "Module";
    const sizeLabel = spec ? spec.label : (radio("moduleSize") || "-");

    /* Computed unit counts */
    const unitsWide = (_modState.width.choice  === "up") ? (_modState.width.upCount  || "—") : (_modState.width.downCount  || "—");
    const unitsHigh = (_modState.height.choice === "up") ? (_modState.height.upCount || "—") : (_modState.height.downCount || "—");

    let cabinetInfo = "";
    let moduleInfo = "";
    if (spec) {
        if (spec.type === "cabinet") {
            cabinetInfo = `CABINETS IN WIDTH: ${unitsWide} | CABINETS IN HEIGHT: ${unitsHigh} | `;
            const mw = document.getElementById("numModulesW")?.value || "—";
            const mh = document.getElementById("numModulesH")?.value || "—";
            const tot = (parseInt(mw) && parseInt(mh)) ? (parseInt(mw) * parseInt(mh)) : "—";
            moduleInfo = `MODULES IN WIDTH: ${mw} | MODULES IN HEIGHT: ${mh} | TOTAL MODULES: ${tot}`;
        } else {
            moduleInfo = `MODULES IN WIDTH: ${unitsWide} | MODULES IN HEIGHT: ${unitsHigh}`;
        }
    }

    return [
        `PROJECT TYPE: ${radio("projectType") || "-"}`,
        `${unitLabel.toUpperCase()} SIZE: ${sizeLabel}`,
        `SCREEN WIDTH (FT): ${get("screenWidth")  || "-"}`,
        `SCREEN HEIGHT (FT): ${get("screenHeight") || "-"}`,
        `ACTUAL WIDTH (MM): ${get("actualWidthMM")  || "-"}`,
        `ACTUAL HEIGHT (MM): ${get("actualHeightMM") || "-"}`,
        `ACTUAL SCREEN WIDTH (FT): ${get("actualWidthFT")  || "-"}`,
        `ACTUAL SCREEN HEIGHT (FT): ${get("actualHeightFT") || "-"}`,
        `TOTAL AREA (SQFT): ${get("totalArea") || "-"}`,
        cabinetInfo + moduleInfo,
        `CABINET: ${radio("cabinetSolution") || "-"}`,
        `MOUNTING: ${radio("mountingType") || "-"}`,
        `AMC: ${radio("amc") || "-"}`,
        `SITE VISIT: ${radio("siteVisit") || "-"}`
    ].join(" | ");
}

/* ============================================================
   ATTACH INPUT EVENT LISTENERS
   Called once during page init from script.js
   ============================================================ */
function initCalculationListeners() {
    /* Width / Height inputs — reset module state and recalculate */
    ["screenWidth", "screenHeight"].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener("input", () => {
            _resetModuleState();
            runCalculationEngine();
        });
    });

    /* Module size radio — reset and recalculate */
    document.querySelectorAll('input[name="moduleSize"]').forEach(r =>
        r.addEventListener("change", () => {
            _resetModuleState();
            runCalculationEngine();
        })
    );

    /* Rounding radio buttons (UP / DOWN selection) */
    document.addEventListener("change", e => {
        if (e.target.name === "widthRounding") {
            _modState.width.choice = e.target.value;
            runCalculationEngine();
        }
        if (e.target.name === "heightRounding") {
            _modState.height.choice = e.target.value;
            runCalculationEngine();
        }
    });

    /* +/- stepper buttons via event delegation */
    document.addEventListener("click", e => {
        const btn = e.target.closest(".module-step-btn");
        if (!btn) return;
        const axis     = btn.dataset.axis;
        const rounding = btn.dataset.rounding;   /* "up" | "down" */
        const dir      = btn.classList.contains("plus") ? 1 : -1;
        if (!axis || !rounding || !_modState[axis]) return;

        const key    = rounding === "up" ? "upCount" : "downCount";
        const newVal = (_modState[axis][key] || 1) + dir;
        if (newVal < 1) return;
        _modState[axis][key] = newVal;

        /* Auto-select the row being adjusted */
        _modState[axis].choice = rounding;
        runCalculationEngine();
    });

    /* Click on module-row wrapper to select it */
    document.addEventListener("click", e => {
        const row = e.target.closest(".module-row");
        if (!row || e.target.closest(".module-stepper") || e.target.tagName === "INPUT") return;
        const radio = row.querySelector('input[type="radio"]');
        if (radio) {
            radio.checked = true;
            radio.dispatchEvent(new Event("change", { bubbles: true }));
        }
    });

    /* Sync screen row on project/cabinet/mounting/amc/siteVisit changes */
    document.addEventListener("change", e => {
        if (["cabinetSolution", "mountingType", "amc", "siteVisit", "projectType"].includes(e.target.name)) {
            if (typeof syncScreenRow === "function") syncScreenRow();
        }
    });

    /* Manual input on modules/cabinets count — recalculate dimensions */
    ["numModulesW", "numModulesH"].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener("input", () => {
            const numModulesW = parseInt(document.getElementById("numModulesW")?.value) || 0;
            const numModulesH = parseInt(document.getElementById("numModulesH")?.value) || 0;
            
            const spec = getSelectedSizeSpec();
            if (!spec) return;

            const totalCabinets = numModulesW * numModulesH;

            const totalCabinetsEl = document.getElementById("totalCabinets");
            if (totalCabinetsEl) totalCabinetsEl.value = totalCabinets || "";
            
            const is576Cabinet = spec.unitW === 576 && spec.unitH === 576;
            const mmPerFt = is576Cabinet ? 305 : 304.8;
            
            const actualWidthMM = numModulesW * spec.unitW;
            const actualHeightMM = numModulesH * spec.unitH;
            const actualWidthFT = actualWidthMM / mmPerFt;
            const actualHeightFT = actualHeightMM / mmPerFt;
            const totalArea = actualWidthFT * actualHeightFT;
            
            const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
            setVal("actualWidthMM",  actualWidthMM.toFixed(2));
            setVal("actualHeightMM", actualHeightMM.toFixed(2));
            setVal("actualWidthFT",  actualWidthFT.toFixed(2));
            setVal("actualHeightFT", actualHeightFT.toFixed(2));
            setVal("totalArea",      totalArea.toFixed(2));
            
            if (typeof syncScreenRow === "function") syncScreenRow();
        });
    });

    /* Initialize nested size selectors */
    initNestedSizeSelector();
}

/* ============================================================
   NESTED SIZE SELECTOR UI WIRING
   ============================================================ */
function initNestedSizeSelector() {
    const categoryGroup = document.getElementById("moduleCategoryGroup");
    const cabinetGroup = document.getElementById("diecastCabinetSizeGroup");
    const subOptionsPanel = document.getElementById("subOptionsPanel");
    
    if (!categoryGroup) return;

    // Listen to changes in Category (Screen, COB, Diecast)
    categoryGroup.addEventListener("change", (e) => {
        const category = e.target.value;
        
        // Show panel
        if (subOptionsPanel) subOptionsPanel.style.display = "block";
        
        // Hide all sub containers
        document.querySelectorAll(".size-sub-container").forEach(el => el.style.display = "none");
        
        // Uncheck all moduleSize and cabinetSize radios
        document.querySelectorAll('input[name="moduleSize"]').forEach(r => r.checked = false);
        document.querySelectorAll('input[name="diecastCabinetSize"]').forEach(r => r.checked = false);
        document.querySelectorAll(".size-sub-sub-container").forEach(el => el.style.display = "none");

        if (category === "screen") {
            document.getElementById("categoryScreenContainer").style.display = "block";
        } else if (category === "cob") {
            document.getElementById("categoryCOBContainer").style.display = "block";
        } else if (category === "diecast") {
            document.getElementById("categoryDiecastContainer").style.display = "block";
        }
        
        // Clear calculations because no leaf option is selected yet
        clearCalculations();
    });

    if (cabinetGroup) {
        // Listen to changes in Diecast Cabinet Size (576x576, 640x640)
        cabinetGroup.addEventListener("change", (e) => {
            const size = e.target.value;
            
            // Hide sub-sub containers
            document.querySelectorAll(".size-sub-sub-container").forEach(el => el.style.display = "none");
            
            // Uncheck all moduleSize radios under Diecast
            document.querySelectorAll('#categoryDiecastContainer input[name="moduleSize"]').forEach(r => r.checked = false);

            if (size === "576x576") {
                document.getElementById("diecast576SubContainer").style.display = "block";
            } else if (size === "640x640") {
                document.getElementById("diecast640SubContainer").style.display = "block";
            }
            
            // Clear calculations because no leaf option is selected yet
            clearCalculations();
        });
    }
}

/**
 * Resets calculation fields to blank and displays selection instruction in banner.
 */
function clearCalculations() {
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    setVal("numModulesW", "");
    setVal("numModulesH", "");
    setVal("totalCabinets", "");
    setVal("actualWidthMM", "");
    setVal("actualHeightMM", "");
    setVal("actualWidthFT", "");
    setVal("actualHeightFT", "");
    setVal("totalArea", "");

    const calcBanner = document.getElementById("calcBanner");
    if (calcBanner) {
        calcBanner.textContent = "Please select a specific module/cabinet size to calculate dimensions.";
    }

    // Hide rounding cards since we don't have counts
    const wc = document.getElementById("widthRoundingCard");
    const hc = document.getElementById("heightRoundingCard");
    if (wc) wc.style.display = "none";
    if (hc) hc.style.display = "none";

    // Sync Screen Row
    if (typeof syncScreenRow === "function") {
        syncScreenRow();
    }
}

/**
 * Synchronizes the category and cabinet selectors with a leaf moduleSize value.
 * Used during form editing/populating.
 */
function syncSizeUIFromValue(val) {
    if (!val) return;
    
    let category = "screen";
    let cabinetSize = "";

    // Legacy values fallback
    if (val === "576x576") val = "diecast_576_288";
    if (val === "diecast192") val = "diecast_576_192";

    if (val === "192x192" || val === "320x160" || val === "288x288") {
        category = "screen";
    } else if (val === "600x337.5") {
        category = "cob";
    } else if (val === "diecast_576_288" || val === "diecast_576_192") {
        category = "diecast";
        cabinetSize = "576x576";
    } else if (val === "diecast_640_320") {
        category = "diecast";
        cabinetSize = "640x640";
    }

    const subOptionsPanel = document.getElementById("subOptionsPanel");
    if (subOptionsPanel) subOptionsPanel.style.display = "block";

    // Set category radio checked
    const catRadio = document.querySelector(`input[name="moduleCategory"][value="${category}"]`);
    if (catRadio) catRadio.checked = true;

    // Show/hide sub containers
    document.querySelectorAll(".size-sub-container").forEach(el => el.style.display = "none");
    if (category === "screen") {
        document.getElementById("categoryScreenContainer").style.display = "block";
    } else if (category === "cob") {
        document.getElementById("categoryCOBContainer").style.display = "block";
    } else if (category === "diecast") {
        document.getElementById("categoryDiecastContainer").style.display = "block";
        
        if (cabinetSize) {
            const cabRadio = document.querySelector(`input[name="diecastCabinetSize"][value="${cabinetSize}"]`);
            if (cabRadio) cabRadio.checked = true;

            document.querySelectorAll(".size-sub-sub-container").forEach(el => el.style.display = "none");
            if (cabinetSize === "576x576") {
                document.getElementById("diecast576SubContainer").style.display = "block";
            } else if (cabinetSize === "640x640") {
                document.getElementById("diecast640SubContainer").style.display = "block";
            }
        }
    }

    // Finally, ensure the correct leaf radio is checked
    const leafRadio = document.querySelector(`input[name="moduleSize"][value="${val}"]`);
    if (leafRadio) leafRadio.checked = true;
}

/* ============================================================
   NUMERIC-ONLY FIELD ENFORCEMENT
   Blocks letters, commas, symbols, negatives, scientific notation.
   ============================================================ */
function initNumericOnlyFields() {
    const numericFieldIds = [
        "screenWidth", "screenHeight",
        "numModulesW", "numModulesH",
        "actualWidthMM", "actualHeightMM",
        "actualWidthFT", "actualHeightFT",
        "totalArea",
        "heightFromGround", "viewingDistance",
        "powerPointDistance", "controlRoomDistance"
    ];

    numericFieldIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        /* Block non-numeric keys at keydown level */
        el.addEventListener("keydown", e => {
            const allowed = [
                "Backspace", "Delete", "Tab", "Escape", "Enter",
                "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
                "Home", "End", "."
            ];
            if (allowed.includes(e.key)) return;
            if (e.ctrlKey || e.metaKey) return;
            if (!/^[0-9]$/.test(e.key)) e.preventDefault();
        });

        /* Strip any remaining non-numeric chars on input */
        el.addEventListener("input", () => {
            const prev    = el.value;
            const cleaned = prev.replace(/[^0-9.]/g, "").replace(/(\..*)\./, "$1");
            if (cleaned !== prev) el.value = cleaned;
        });

        /* Block paste of non-numeric content */
        el.addEventListener("paste", e => {
            e.preventDefault();
            const pasted  = (e.clipboardData || window.clipboardData).getData("text");
            const cleaned = pasted.replace(/[^0-9.]/g, "").replace(/(\..*)\./, "$1");
            document.execCommand("insertText", false, cleaned);
        });
    });
}
