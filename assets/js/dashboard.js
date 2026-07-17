/* ==========================================================================
   KAN UNIVERSAL — DASHBOARD 2.0
   Central BI Control Panel & State Controller
   ========================================================================== */
(function () {
    "use strict";

    /* ============================================================
       0. AUTH GUARD & SYSTEM THEME
       ============================================================ */
    const user = getSessionUser();
    if (!user) { window.location.replace("../index.html"); return; }

    const savedTheme = localStorage.getItem("kan_theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeUI(savedTheme);

    function updateThemeUI(theme) {
        const label = document.getElementById("themeLabel");
        const moon = document.getElementById("themeIconMoon");
        const sun = document.getElementById("themeIconSun");
        if (theme === "light") {
            moon && moon.classList.add("hidden");
            sun && sun.classList.remove("hidden");
            if (label) label.textContent = "Dark";
        } else {
            moon && moon.classList.remove("hidden");
            sun && sun.classList.add("hidden");
            if (label) label.textContent = "Light";
        }
    }

    document.getElementById("themeToggle").addEventListener("click", () => {
        const cur = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", cur);
        localStorage.setItem("kan_theme", cur);
        updateThemeUI(cur);
        // Resize charts on theme change for clean color/theme swap
        resizeAllCharts();
    });

    document.getElementById("topbarUserName").textContent = user.name;
    document.getElementById("topbarUserRole").textContent = user.role;

    document.getElementById("logoutBtn").addEventListener("click", () => {
        if (confirm("Are you sure you want to logout?")) {
            clearSession();
            window.location.href = "../index.html";
        }
    });

    /* ============================================================
       1. STATIC CONSTANTS & STATE INDEX
       ============================================================ */
    const STORAGE_KEY = "kan_quotations";
    const LAYOUT_KEY = "kan_bi_layout_2.0";

    // Application state
    const state = {
        allQuotations: [],     // All items from local storage + Sheet
        filtered: [],          // Filtered list
        paginated: [],         // Items on the current page
        searchQuery: "",
        groupBy: "none",
        sortBy: "createdAt-desc",
        pageSize: 50,
        currentPage: 1,
        selectedIds: new Set(),
        activePreset: "all",

        // Active filters
        filters: {
            status: "",
            projectType: "",
            salesRep: "",
            clientName: "",
            company: "",
            state: "",
            amtMin: "",
            amtMax: "",
            category: "",
            brand: "",
            dateStart: "",
            dateEnd: "",
            hasAttachment: false,
            hasDiscount: false,
            hasGst: false
        },

        // Visible columns configurations
        columns: [
            { key: "select", label: "⬜", visible: true, resizeWidth: 40 },
            { key: "quotationNo", label: "Ref No.", visible: true, resizeWidth: 120 },
            { key: "createdAt", label: "Date", visible: true, resizeWidth: 140 },
            { key: "salesRep", label: "Sales Rep", visible: true, resizeWidth: 110 },
            { key: "client", label: "Client Name", visible: true, resizeWidth: 130 },
            { key: "company", label: "Company", visible: true, resizeWidth: 130 },
            { key: "projectType", label: "Project Type", visible: true, resizeWidth: 110 },
            { key: "grandTotal", label: "Grand Total", visible: true, resizeWidth: 130 },
            { key: "status", label: "Status", visible: true, resizeWidth: 100 },
            { key: "actions", label: "Actions", visible: true, resizeWidth: 260 }
        ]
    };

    // Keep ECharts instances
    const echartsInstances = {};

    /* ============================================================
       2. REUSABLE UTILITIES
       ============================================================ */
    function toast(msg, type = "info") {
        const el = document.createElement("div");
        el.className = "toast " + (type === "success" ? "success" : type === "error" ? "error" : "");
        el.textContent = msg;
        document.getElementById("toastContainer").appendChild(el);
        setTimeout(() => el.remove(), 4200);
    }

    function escapeHtml(str) {
        return String(str == null ? "" : str).replace(/[&<>"']/g, m =>
            ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])
        );
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function highlightText(text, query) {
        let str = String(text == null ? "" : text);
        if (!query) return escapeHtml(str);
        const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
        if (tokens.length === 0) return escapeHtml(str);

        let escaped = escapeHtml(str);
        try {
            const pattern = new RegExp("(" + tokens.map(t => escapeRegExp(t)).join("|") + ")", "gi");
            return escaped.replace(pattern, '<mark class="search-highlight">$1</mark>');
        } catch (e) {
            return escaped;
        }
    }

    function parseDateMs(val) {
        if (!val) return 0;
        if (val instanceof Date) return val.getTime();
        const s = String(val).trim();
        // Indian DD/MM/YYYY
        const indMatch = s.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:[\s,T](\d{2}:\d{2}(?::\d{2})?))?/);
        if (indMatch) {
            const [, dd, mm, yyyy, time = "00:00:00"] = indMatch;
            return new Date(`${yyyy}-${mm}-${dd}T${time}`).getTime();
        }
        return new Date(s).getTime() || 0;
    }

    function fmtDate(iso) {
        if (!iso) return "—";
        const ms = parseDateMs(iso);
        if (!ms) return String(iso);
        const d = new Date(ms);
        const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
        return `${date} ${time}`;
    }

    function fmtCurrency(n) {
        const num = parseFloat(n) || 0;
        return "₹ " + num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function statusBadge(status) {
        const map = {
            "GENERATED": "status-generated",
            "DRAFT": "status-draft",
            "NEW": "status-new",
            "APPROVED": "status-generated",
            "REJECTED": "status-new",
            "CANCELLED": "status-new",
            "EXPIRED": "status-draft",
            "PENDING": "status-draft"
        };
        const cls = map[status] || "status-new";
        return `<span class="status-badge ${cls}">${status || "NEW"}</span>`;
    }

    // Debounce function helper
    function debounce(func, delay = 250) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    /* ============================================================
       3. STORAGE & LIVE GOOGLE SHEET SYNC
       ============================================================ */
    function loadLocalQuotations() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        } catch { return []; }
    }

    function saveLocalQuotations(list) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }

    function getLatestTimestamp(quotes) {
        let maxMs = 0;
        quotes.forEach(q => {
            if (q.status !== "DRAFT" && q.status !== "NEW") {
                const ms = parseDateMs(q.createdAt);
                if (ms > maxMs) maxMs = ms;
            }
        });
        return maxMs;
    }

    async function syncWithSheet(forceFull = false) {
        const startTime = Date.now();
        document.getElementById("syncDot").className = "monitor-dot syncing";
        document.getElementById("syncStatus").textContent = "SYNCING...";

        try {
            const locals = loadLocalQuotations();
            let sinceMs = 0;
            if (!forceFull && locals.length > 0) {
                sinceMs = getLatestTimestamp(locals);
            }

            const url = `${GOOGLE_SHEET_WEBAPP_URL}?action=getAllQuotations` + (sinceMs > 0 ? `&since=${sinceMs}` : '');
            const res = await fetch(url);
            const apiTime = Date.now() - startTime;
            document.getElementById("apiResponseTime").textContent = apiTime;

            const json = await res.json();
            if (json.status === "success" && json.data) {
                if (sinceMs > 0 && json.data.length === 0) {
                    return;
                }
                // Group by REF to isolate latest
                const groups = {};
                json.data.forEach(row => {
                    const ref = row["REF"];
                    if (!ref) return;
                    if (!groups[ref]) groups[ref] = [];
                    groups[ref].push(row);
                });

                const liveQuotes = Object.values(groups).map(rows => {
                    const first = rows[rows.length - 1];

                    const snVals = String(first["S. N."] || "").split("\n");
                    const catVals = String(first["Category"] || "").split("\n");
                    const itemVals = String(first["Item"] || "").split("\n");
                    const brandVals = String(first["Brand"] || "").split("\n");
                    const specVals = String(first["Specificiation"] || "").split("\n");
                    const descVals = String(first["Description"] || "").split("\n");
                    const qtyVals = String(first["Qty"] || "").split("\n");
                    const unitVals = String(first["Unit"] || "").split("\n");
                    const priceVals = String(first["Unit Price"] || "").split("\n");
                    const totalVals = String(first["Total"] || "").split("\n");

                    const len = Math.max(
                        snVals.length, catVals.length, itemVals.length, brandVals.length,
                        specVals.length, descVals.length, qtyVals.length, unitVals.length,
                        priceVals.length, totalVals.length
                    );

                    const lineItems = [];
                    for (let i = 0; i < len; i++) {
                        const cat = catVals[i] || "";
                        if (!cat && !itemVals[i]) continue;
                        const isScreen = cat.toLowerCase().includes("screen");
                        lineItems.push({
                            sn: snVals[i] || (i + 1),
                            category: cat,
                            item: itemVals[i] || "",
                            brand: brandVals[i] || "",
                            spec: specVals[i] || "",
                            description: descVals[i] || "",
                            qty: parseFloat(qtyVals[i]) || 0,
                            unit: unitVals[i] || "Nos",
                            unitPrice: parseFloat(priceVals[i]) || 0,
                            total: parseFloat(totalVals[i]) || 0,
                            isScreenRow: isScreen,
                            locked: isScreen
                        });
                    }

                    const docsStr = first["Docs"] || "";
                    const docUrls = docsStr.split("\n").map(u => u.trim()).filter(Boolean);
                    const attachments = docUrls.map((url, i) => ({
                        filename: `Supporting_Document_${i + 1}.pdf`,
                        mimeType: "application/pdf",
                        base64: "",
                        driveUrl: url
                    }));

                    return {
                        _id: first["REF"],
                        quotationNo: first["REF"],
                        masterNo: parseInt(first["Master No"]) || 1000,
                        revision: parseInt(first["Revision"]) || 1,
                        parentRef: first["Parent Ref"] || null,
                        prevRef: first["Prev Ref"] || null,
                        revisionNotes: first["Revision Notes"] || "",
                        createdAt: first["TimeStamp"],
                        status: first["Status"] || "GENERATED",
                        salesRep: {
                            name: first["Sales Person"],
                            email: first["Sales Email"],
                            contact: first["Sales Contact"]
                        },
                        client: {
                            name: first["Client Name"],
                            company: first["Company Name"],
                            email: first["Email"],
                            contact: first["Contact"],
                            clientAddress: first["Client Address"],
                            siteAddress: first["Site Address"],
                            gst: first["GST NO"],
                            orgType: first["ORG TYPE"]
                        },
                        project: {
                            projectType: first["Project Type"],
                            moduleSize: first["Module Size"],
                            screenWidth: first["Screen Width (Ft)"],
                            screenHeight: first["Screen Height (Ft)"],
                            totalCabinets: first["Total no. of Module/Cabinet"],
                            numModulesW: first["No of Module/Cabinet in Width"],
                            numModulesH: first["No of Module/Cabinet in Height"],
                            actualWidthMM: first["Actual Width (MM)"],
                            actualHeightMM: first["Actual Height (MM)"],
                            actualWidthFT: first["Actual Screen Width (FT)"],
                            actualHeightFT: first["Actual Screen Height (Ft)"],
                            totalArea: first["Total Area (SQFT)"],
                            heightFromGround: first["Height From Ground (M)"],
                            viewingDistance: first["Viewing Distance (M)"],
                            powerPointDistance: first["Power Point Distance (M)"],
                            controlRoomDistance: first["Control Room Distance (M)"],
                            cabinetSolution: first["Cabinet Solution"],
                            mountingType: first["Mounting Type"],
                            amc: first["AMC"],
                            siteVisit: first["Site Visit"],
                            momOfSiteVisit: first["MOM of Site Visit"],
                            widthRounding: first["Width Rounding"] || "DOWN",
                            heightRounding: first["Height Rounding"] || "DOWN"
                        },
                        scope: {
                            transport: first["Transport"],
                            siteReadiness: first["Site readyness & Civil Work"],
                            installation: first["Installation"],
                            fabrication: first["Fabrication / Frame"],
                            crane: first["Crane"],
                            scaffolding: first["Scaffolding"],
                            stabilizer: first["Stablizer"],
                            electrical: first["Electrical Wiring & Earthing"],
                            lanCable: first["LAN Cable beyond 10 Mtr"]
                        },
                        summary: {
                            subtotal: parseFloat(first["Subtotal"]) || 0,
                            gstPct: parseFloat(first["GST %"]) || 18,
                            gstAmt: parseFloat(first["GST"]) || 0,
                            discount: parseFloat(first["Discount"]) || 0,
                            grandTotal: parseFloat(first["Grand Total"]) || 0
                        },
                        remarks: [
                            first["Remarks 1"] || "", first["Remarks 2"] || "", first["Remarks 3"] || "",
                            first["Remarks 4"] || "", first["Remarks 5"] || "", first["Remarks 6"] || "",
                            first["Remarks 7"] || "", first["Remarks 8"] || "", first["Remarks 9"] || "",
                            first["Remarks 10"] || ""
                        ],
                        terms: (first["Terms & Condition"] || "").split("\n").map((t, i) => ({
                            sno: i + 1,
                            text: t.replace(/^\d+\.\s*/, "").trim()
                        })).filter(t => t.text),
                        pdfUrl: first["PDF Link"] || "",
                        lineItems: lineItems,
                        attachments: attachments,
                        attachment: attachments[0] || null,
                        hideFields: (() => {
                            try { return JSON.parse(first["Hide Fields"] || "{}"); } catch { return {}; }
                        })()
                    };
                });

                let merged;
                if (sinceMs > 0) {
                    // Update/merge delta
                    const liveMap = {};
                    liveQuotes.forEach(q => { liveMap[q._id] = q; });

                    merged = locals.map(q => {
                        return liveMap[q._id] ? liveMap[q._id] : q;
                    });

                    // Add any brand new quotations not present locally
                    const existingIds = new Set(locals.map(q => q._id));
                    liveQuotes.forEach(q => {
                        if (!existingIds.has(q._id)) {
                            merged.push(q);
                        }
                    });
                } else {
                    // Full sync: replace all live quotations, keep only drafts
                    const drafts = locals.filter(l => l.status === "DRAFT" || l.status === "NEW");
                    merged = [...liveQuotes, ...drafts];
                }
                saveLocalQuotations(merged);
            }
        } catch (e) {
            console.error(e);
            toast("Connection to Live Sheet failed. Displaying offline data.", "error");
        } finally {
            document.getElementById("syncDot").className = "monitor-dot";
            document.getElementById("syncStatus").textContent = "CONNECTED";
            document.getElementById("lastSyncTime").textContent = new Date().toLocaleTimeString("en-IN");
        }
    }

    /* ============================================================
       4. BI AGGREGATION & METRICS CONTROLLER
       ============================================================ */
    function calculateBIMetrics() {
        const quotes = state.filtered;

        let revenue = 0;
        let drafts = 0;
        let generated = 0;
        let cancelled = 0;
        let expired = 0;
        let pending = 0;
        let totalDiscount = 0;
        let totalGst = 0;
        let totalSubtotal = 0;

        const clientSet = new Set();
        const companySet = new Set();
        const repSales = {};
        const itemsFreq = {};
        const brandFreq = {};
        const catFreq = {};

        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        let todayQuotes = 0;
        let weeklyQuotes = 0;
        let monthlyQuotes = 0;
        let maxQuoteValue = 0;

        quotes.forEach(q => {
            const sum = q.summary || {};
            const total = sum.grandTotal || 0;
            const discount = sum.discount || 0;
            const gst = sum.gstAmt || 0;
            const sub = sum.subtotal || 0;

            revenue += total;
            totalDiscount += discount;
            totalGst += gst;
            totalSubtotal += sub;

            if (total > maxQuoteValue) maxQuoteValue = total;

            if (q.status === "GENERATED" || q.status === "APPROVED") generated++;
            else if (q.status === "DRAFT" || q.status === "NEW") drafts++;
            else if (q.status === "CANCELLED") cancelled++;
            else if (q.status === "EXPIRED") expired++;
            else if (q.status === "PENDING") pending++;

            if (q.client?.name) clientSet.add(q.client.name.trim().toUpperCase());
            if (q.client?.company) companySet.add(q.client.company.trim().toUpperCase());

            const rep = q.salesRep?.name || "Unknown";
            repSales[rep] = (repSales[rep] || 0) + total;

            // Date tracking
            const dateMs = parseDateMs(q.createdAt);
            if (dateMs) {
                const qDate = new Date(dateMs);
                const diffTime = Math.abs(new Date() - qDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays <= 1) todayQuotes++;
                if (qDate >= startOfWeek) weeklyQuotes++;
                if (qDate >= startOfMonth) monthlyQuotes++;
            }

            // Products
            if (q.lineItems) {
                q.lineItems.forEach(li => {
                    if (li.item) itemsFreq[li.item] = (itemsFreq[li.item] || 0) + li.qty;
                    if (li.brand) brandFreq[li.brand] = (brandFreq[li.brand] || 0) + li.qty;
                    if (li.category) catFreq[li.category] = (catFreq[li.category] || 0) + li.qty;
                });
            }
        });

        // Top parameters
        let topRep = "—";
        let maxRepVal = 0;
        Object.entries(repSales).forEach(([k, v]) => {
            if (v > maxRepVal) { maxRepVal = v; topRep = k; }
        });

        // Render Cards UI
        document.getElementById("kpiTotalRevenue").textContent = fmtCurrency(revenue);
        document.getElementById("kpiTotalQuotes").textContent = quotes.length;
        document.getElementById("kpiGenVsDraft").textContent = `${generated} / ${drafts}`;

        const convRate = quotes.length ? ((generated / quotes.length) * 100).toFixed(1) : "0.0";
        document.getElementById("kpiConversionRate").textContent = `${convRate}%`;

        const avgVal = quotes.length ? (revenue / quotes.length) : 0;
        document.getElementById("kpiAvgQuoteValue").textContent = fmtCurrency(avgVal);

        const avgDisc = totalSubtotal ? ((totalDiscount / totalSubtotal) * 100).toFixed(1) : "0.0";
        document.getElementById("kpiAvgDiscount").textContent = `${avgDisc}%`;
        document.getElementById("kpiClientsCount").textContent = `${companySet.size} / ${clientSet.size}`;
        document.getElementById("kpiTopRep").textContent = topRep;

        // Sparklines rendering
        renderSparkline("sparklineRevenue", quotes.map(q => q.summary?.grandTotal || 0), "line");
        renderSparkline("sparklineQuotes", quotes.map(() => 1), "bar");
        renderSparkline("sparklineGen", quotes.map(q => q.status === "GENERATED" ? 1 : 0), "bar");
        renderSparkline("sparklineAvg", quotes.map(q => q.summary?.grandTotal || 0), "line");
        renderSparkline("sparklineClients", quotes.map(() => 1), "line");
    }

    function renderSparkline(elementId, dataArray, type = "line") {
        const el = document.getElementById(elementId);
        if (!el) return;

        if (echartsInstances[elementId]) {
            echartsInstances[elementId].dispose();
        }

        // Take last 15 points
        const subset = dataArray.slice(-15);
        if (subset.length === 0) subset.push(0);

        const chart = echarts.init(el);
        echartsInstances[elementId] = chart;

        const option = {
            grid: { left: 0, right: 0, top: 0, bottom: 0 },
            xAxis: { type: 'category', show: false },
            yAxis: { type: 'value', show: false },
            series: [{
                data: subset,
                type: type,
                smooth: true,
                symbol: 'none',
                lineStyle: { width: 1.5, color: '#ab97a5' },
                itemStyle: { color: '#ab97a5' },
                areaStyle: type === 'line' ? { color: 'rgba(171, 151, 165, 0.2)' } : null
            }]
        };

        chart.setOption(option);
    }

    /* ============================================================
       5. FUZZY SEARCH & DYNAMIC FILTERING PIPELINE
       ============================================================ */
    function filterAndSearchPipeline() {
        const all = state.allQuotations;

        // Apply Filters
        state.filtered = all.filter(q => {
            // Role restriction - Non Admin can only see their own
            if (user.access !== "Admin") {
                const uName = (user.name || "").trim().toLowerCase();
                const sName = (q.salesRep && q.salesRep.name) ? q.salesRep.name.trim().toLowerCase() : "";
                if (sName !== uName) return false;
            }

            // Quick Date Presets
            if (state.activePreset !== "all") {
                const dMs = parseDateMs(q.createdAt);
                if (!dMs) return false;
                const d = new Date(dMs);
                const today = new Date();

                if (state.activePreset === "today") {
                    if (d.toDateString() !== today.toDateString()) return false;
                } else if (state.activePreset === "yesterday") {
                    const yes = new Date(today);
                    yes.setDate(yes.getDate() - 1);
                    if (d.toDateString() !== yes.toDateString()) return false;
                } else if (state.activePreset === "this-week") {
                    const start = new Date(today.setDate(today.getDate() - today.getDay()));
                    if (d < start) return false;
                } else if (state.activePreset === "this-month") {
                    if (d.getMonth() !== today.getMonth() || d.getFullYear() !== today.getFullYear()) return false;
                } else if (state.activePreset === "last-month") {
                    const lm = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    if (d.getMonth() !== lm.getMonth() || d.getFullYear() !== lm.getFullYear()) return false;
                } else if (state.activePreset === "this-year") {
                    if (d.getFullYear() !== today.getFullYear()) return false;
                }
            }

            // Advanced Filters Panel
            const f = state.filters;
            if (f.status && q.status !== f.status) return false;
            if (f.projectType && q.project?.projectType !== f.projectType) return false;

            if (f.salesRep) {
                const rep = (q.salesRep?.name || "").trim().toUpperCase();
                if (rep !== f.salesRep) return false;
            }
            if (f.clientName) {
                const client = (q.client?.name || "").trim().toUpperCase();
                if (client !== f.clientName) return false;
            }
            if (f.company) {
                const comp = (q.client?.company || "").trim().toUpperCase();
                if (comp !== f.company) return false;
            }
            if (f.state) {
                const st = extractState(q.client?.clientAddress || q.client?.siteAddress).toUpperCase();
                if (st !== f.state) return false;
            }
            if (f.category) {
                const hasCat = q.lineItems && q.lineItems.some(li => (li.category || "").toUpperCase() === f.category);
                if (!hasCat) return false;
            }
            if (f.brand) {
                const hasBrand = q.lineItems && q.lineItems.some(li => (li.brand || "").toUpperCase() === f.brand);
                if (!hasBrand) return false;
            }

            // Range Filters
            const grandTotal = q.summary?.grandTotal || 0;
            if (f.amtMin && grandTotal < parseFloat(f.amtMin)) return false;
            if (f.amtMax && grandTotal > parseFloat(f.amtMax)) return false;

            // Date Range
            if (f.dateStart || f.dateEnd) {
                const dMs = parseDateMs(q.createdAt);
                if (!dMs) return false;
                if (f.dateStart && dMs < new Date(f.dateStart).getTime()) return false;
                // Add 1 day to end date to make it inclusive of that day's timestamps
                if (f.dateEnd && dMs > new Date(f.dateEnd).getTime() + 86400000) return false;
            }

            // Booleans
            if (f.hasAttachment && (!q.attachments || q.attachments.length === 0)) return false;
            if (f.hasDiscount && (q.summary?.discount || 0) <= 0) return false;
            if (f.hasGst && (q.summary?.gstAmt || 0) <= 0) return false;

            return true;
        });

        // Apply Search (Fuzzy/Instant Multi-Field Matcher)
        if (state.searchQuery) {
            const queryTokens = state.searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
            state.filtered = state.filtered.filter(q => {
                // Flatten quotation fields into single searchable string
                let searchableStr = [
                    q.quotationNo, q.client?.name, q.client?.company, q.salesRep?.name,
                    q.project?.projectType, q.status, q.client?.email, q.client?.contact,
                    q.client?.gst, q.client?.clientAddress, q.client?.siteAddress,
                    q.summary?.grandTotal, q.summary?.discount, q.createdAt, q.revision
                ].join(" ").toLowerCase();

                if (q.lineItems) {
                    q.lineItems.forEach(li => {
                        searchableStr += " " + [li.category, li.item, li.brand, li.spec, li.description].join(" ").toLowerCase();
                    });
                }

                // Check that every search token is partially matched in the flattened string
                return queryTokens.every(token => searchableStr.includes(token));
            });
        }

        // Apply Sorting
        sortFilteredData();

        // Recalculate Metrics and render
        calculateBIMetrics();
        renderCharts();

        state.currentPage = 1;
        renderQuotesTable();
        renderActiveFilterBadges();
    }

    function sortFilteredData() {
        const [field, direction] = state.sortBy.split("-");
        const asc = direction === "asc";

        state.filtered.sort((a, b) => {
            let valA = getSortValue(a, field);
            let valB = getSortValue(b, field);

            if (typeof valA === "string") valA = valA.toLowerCase();
            if (typeof valB === "string") valB = valB.toLowerCase();

            if (valA < valB) return asc ? -1 : 1;
            if (valA > valB) return asc ? 1 : -1;
            return 0;
        });
    }

    function getSortValue(q, field) {
        switch (field) {
            case "quotationNo": return q.quotationNo || "";
            case "createdAt": return parseDateMs(q.createdAt);
            case "salesRep": return q.salesRep?.name || "";
            case "client": return q.client?.name || "";
            case "company": return q.client?.company || "";
            case "grandTotal": return q.summary?.grandTotal || 0;
            case "status": return q.status || "";
            case "projectType": return q.project?.projectType || "";
            case "revision": return q.revision || 1;
            default: return 0;
        }
    }

    function extractState(addr) {
        if (!addr) return "Unknown";
        const clean = String(addr).replace(/\r?\n/g, ", ").trim();
        const parts = clean.split(",").map(p => p.trim());
        // Simple state lookup fallback from ending elements
        if (parts.length > 1) {
            const candidate = parts[parts.length - 2];
            // If candidate looks like a postcode or state, clean and return
            if (candidate && !/india/i.test(candidate)) return candidate;
        }
        return parts[parts.length - 1] || "Delhi";
    }

    /* ============================================================
       6. ECHARTS DATA VISUALIZATION
       ============================================================ */
    function renderCharts() {
        const quotes = state.filtered;

        // Verify ECharts loaded
        if (typeof echarts === "undefined") return;

        // Group data for Line/Bar charts
        const monthlyRevenue = {};
        const monthlyCount = {};
        const repRevenue = {};
        const statusCounts = { GENERATED: 0, DRAFT: 0, APPROVED: 0, REJECTED: 0, CANCELLED: 0, EXPIRED: 0, PENDING: 0 };
        const categoryProjectCount = {}; // Stacked bar
        const productVolume = {}; // Treemap
        const revisionStats = { L1: 0, L2: 0, L3: 0, L4: 0, "L5+": 0 };
        const regionalCount = {};
        const dailyActivity = {}; // Heatmap Calendar
        const grossSubtotal = {};
        const grossDiscount = {};
        const grossTax = {};

        quotes.forEach(q => {
            const total = q.summary?.grandTotal || 0;
            const sub = q.summary?.subtotal || 0;
            const disc = q.summary?.discount || 0;
            const tax = q.summary?.gstAmt || 0;
            const status = q.status || "DRAFT";

            // Status Distribution
            if (statusCounts[status] !== undefined) statusCounts[status]++;

            // Parsing monthly timeline
            const dateMs = parseDateMs(q.createdAt);
            if (dateMs) {
                const d = new Date(dateMs);
                const monthName = d.toLocaleString("default", { month: "short", year: "2-digit" });
                monthlyRevenue[monthName] = (monthlyRevenue[monthName] || 0) + total;
                monthlyCount[monthName] = (monthlyCount[monthName] || 0) + 1;

                grossSubtotal[monthName] = (grossSubtotal[monthName] || 0) + sub;
                grossDiscount[monthName] = (grossDiscount[monthName] || 0) + disc;
                grossTax[monthName] = (grossTax[monthName] || 0) + tax;

                // Calendar date format YYYY-MM-DD
                const calStr = d.toISOString().split("T")[0];
                dailyActivity[calStr] = (dailyActivity[calStr] || 0) + 1;
            }

            // Sales Executives
            const rep = q.salesRep?.name || "Unknown";
            repRevenue[rep] = (repRevenue[rep] || 0) + total;

            // Categories & Project types
            const projType = q.project?.projectType || "INDOOR";
            if (q.lineItems) {
                q.lineItems.forEach(li => {
                    const cat = li.category || "General";
                    if (!categoryProjectCount[cat]) categoryProjectCount[cat] = { INDOOR: 0, OUTDOOR: 0 };
                    if (categoryProjectCount[cat][projType] !== undefined) {
                        categoryProjectCount[cat][projType] += li.qty;
                    }

                    // Treemap scales
                    const label = `${li.brand || 'KAN'} ${li.item || 'Hardware'}`;
                    productVolume[label] = (productVolume[label] || 0) + li.qty;
                });
            }

            // Revisions
            const rev = q.revision || 1;
            if (rev === 1) revisionStats.L1++;
            else if (rev === 2) revisionStats.L2++;
            else if (rev === 3) revisionStats.L3++;
            else if (rev === 4) revisionStats.L4++;
            else revisionStats["L5+"]++;

            // Regions
            const st = extractState(q.client?.clientAddress || q.client?.siteAddress);
            regionalCount[st] = (regionalCount[st] || 0) + total;
        });

        // Chart 1: Revenue & Counts Trend
        const months = Object.keys(monthlyRevenue);
        renderOption("chartRevenueTrend", {
            tooltip: { trigger: 'axis' },
            legend: { data: ['Revenue', 'Quotations'], textStyle: { color: 'var(--text)' } },
            xAxis: { type: 'category', data: months, axisLabel: { color: 'var(--text-dim)' } },
            yAxis: [
                { type: 'value', name: 'Revenue', axisLabel: { formatter: '₹{value}', color: 'var(--text-dim)' } },
                { type: 'value', name: 'Quotes', position: 'right', axisLabel: { color: 'var(--text-dim)' } }
            ],
            series: [
                { name: 'Revenue', type: 'line', data: Object.values(monthlyRevenue), smooth: true, itemStyle: { color: '#ab97a5' } },
                { name: 'Quotations', type: 'bar', yAxisIndex: 1, data: Object.values(monthlyCount), itemStyle: { color: '#582f4c' } }
            ]
        });

        // Chart 2: Sales Executive Bar Chart
        renderOption("chartSalesRep", {
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            xAxis: { type: 'value', axisLabel: { color: 'var(--text-dim)' } },
            yAxis: { type: 'category', data: Object.keys(repRevenue), axisLabel: { color: 'var(--text-dim)' } },
            series: [{
                name: 'Revenue',
                type: 'bar',
                data: Object.values(repRevenue),
                itemStyle: { color: '#ab97a5', borderRadius: [0, 4, 4, 0] }
            }]
        });

        // Chart 3: Donut Status Breakdown
        const pieData = Object.entries(statusCounts).map(([k, v]) => ({ name: k, value: v })).filter(d => d.value > 0);
        renderOption("chartStatusBreakdown", {
            tooltip: { trigger: 'item' },
            legend: { orient: 'vertical', left: 'left', textStyle: { color: 'var(--text-dim)' } },
            series: [{
                name: 'Status',
                type: 'pie',
                radius: ['40%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: { borderRadius: 8, borderColor: 'var(--bg-card)', borderWidth: 2 },
                label: { show: false },
                data: pieData
            }]
        });

        // Chart 4: Conversion Gauge
        const generatedCount = statusCounts.GENERATED + statusCounts.APPROVED;
        const ratio = quotes.length ? ((generatedCount / quotes.length) * 100).toFixed(1) : 0;
        renderOption("chartGaugeConversion", {
            series: [{
                type: 'gauge',
                startAngle: 180,
                endAngle: 0,
                center: ['50%', '75%'],
                radius: '90%',
                min: 0,
                max: 100,
                splitNumber: 5,
                axisLine: { lineStyle: { width: 6, color: [[0.3, '#ff5a5a'], [0.7, '#ff9f43'], [1, '#3ddc84']] } },
                pointer: { icon: 'path://M12.8,18.3L12.8,18.3c-0.4-2.9-2.2-5.3-4.9-6.3L6.2,11L4.5,7.3c-0.6-1.3-1.6-2.3-2.9-2.9L0,2.6l4.5,1.7C7.2,5.3,9,7.7,9.4,10.6L9.4,10.6c0.1,1.1,0.2,2.2,0.2,3.3', width: 6, length: '60%', offsetCenter: [0, '8%'], itemStyle: { color: 'var(--text)' } },
                axisTick: { length: 8, lineStyle: { color: 'auto', width: 2 } },
                splitLine: { length: 15, lineStyle: { color: 'auto', width: 3 } },
                title: { offsetCenter: [0, '-20%'], fontSize: 13, color: 'var(--text-faint)' },
                detail: { fontSize: 24, offsetCenter: [0, '25%'], valueAnimation: true, formatter: '{value}%', color: 'var(--text)' },
                data: [{ value: ratio, name: 'Conversion' }]
            }]
        });

        // Chart 5: Stacked Category Bar
        const categories = Object.keys(categoryProjectCount).slice(0, 8); // Top 8
        const indoorVals = categories.map(c => categoryProjectCount[c].INDOOR);
        const outdoorVals = categories.map(c => categoryProjectCount[c].OUTDOOR);
        renderOption("chartCategoryBreakdown", {
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            legend: { data: ['Indoor', 'Outdoor'], textStyle: { color: 'var(--text-dim)' } },
            xAxis: { type: 'category', data: categories, axisLabel: { rotate: 30, color: 'var(--text-dim)' } },
            yAxis: { type: 'value', axisLabel: { color: 'var(--text-dim)' } },
            series: [
                { name: 'Indoor', type: 'bar', stack: 'total', data: indoorVals, itemStyle: { color: '#8a6d81' } },
                { name: 'Outdoor', type: 'bar', stack: 'total', data: outdoorVals, itemStyle: { color: '#582f4c' } }
            ]
        });

        // Chart 6: Product Treemap
        const treemapData = Object.entries(productVolume).map(([k, v]) => ({ name: k, value: v })).slice(0, 15);
        renderOption("chartProductTreemap", {
            tooltip: { trigger: 'item' },
            series: [{
                type: 'treemap',
                data: treemapData,
                breadcrumb: { show: false },
                label: { show: true, formatter: '{b}' },
                itemStyle: { borderColor: '#fff' }
            }]
        });

        // Chart 7: Revision Funnel
        const funnelData = Object.entries(revisionStats).map(([k, v]) => ({ name: k, value: v })).filter(d => d.value > 0);
        renderOption("chartRevisionFunnel", {
            tooltip: { trigger: 'item', formatter: '{b} : {c}' },
            legend: { data: Object.keys(revisionStats), textStyle: { color: 'var(--text-dim)' } },
            series: [{
                name: 'Revision Dropoff',
                type: 'funnel',
                left: '10%',
                top: 60,
                bottom: 20,
                width: '80%',
                min: 0,
                maxSize: '100%',
                sort: 'descending',
                gap: 2,
                label: { show: true, position: 'inside' },
                data: funnelData
            }]
        });

        // Chart 8: Regional Distribution (Top 5 states)
        const topStates = Object.keys(regionalCount).sort((a, b) => regionalCount[b] - regionalCount[a]).slice(0, 5);
        const topStateValues = topStates.map(s => regionalCount[s]);
        renderOption("chartRegionalDistribution", {
            tooltip: { trigger: 'item' },
            xAxis: { type: 'category', data: topStates, axisLabel: { color: 'var(--text-dim)' } },
            yAxis: { type: 'value', axisLabel: { color: 'var(--text-dim)' } },
            series: [{
                type: 'bar',
                data: topStateValues,
                itemStyle: { color: '#ab97a5', borderRadius: [4, 4, 0, 0] }
            }]
        });

        // Chart 9: Activity Calendar
        const calData = Object.entries(dailyActivity);
        const year = new Date().getFullYear();
        renderOption("chartCalendarActivity", {
            tooltip: { position: 'top', formatter: p => `${p.value[0]}: ${p.value[1]} Quotes` },
            visualMap: { min: 0, max: 10, type: 'piecewise', orient: 'horizontal', left: 'center', top: 0, textStyle: { color: 'var(--text-dim)' } },
            calendar: { top: 40, bottom: 10, left: 30, right: 30, cellSize: ['auto', 13], range: year, itemStyle: { borderWidth: 0.5 }, yearLabel: { show: false } },
            series: [{ type: 'heatmap', coordinateSystem: 'calendar', data: calData }]
        });

        // Chart 10: Gross Area Breakdown
        renderOption("chartGrossBreakdown", {
            tooltip: { trigger: 'axis' },
            legend: { data: ['Subtotal', 'Tax (GST)', 'Discounts'], textStyle: { color: 'var(--text-dim)' } },
            xAxis: { type: 'category', boundaryGap: false, data: months, axisLabel: { color: 'var(--text-dim)' } },
            yAxis: { type: 'value', axisLabel: { color: 'var(--text-dim)' } },
            series: [
                { name: 'Subtotal', type: 'line', stack: 'Total', areaStyle: {}, emphasis: { focus: 'series' }, data: Object.values(grossSubtotal) },
                { name: 'Tax (GST)', type: 'line', stack: 'Total', areaStyle: {}, emphasis: { focus: 'series' }, data: Object.values(grossTax) },
                { name: 'Discounts', type: 'line', stack: 'Total', areaStyle: {}, emphasis: { focus: 'series' }, data: Object.values(grossDiscount) }
            ]
        });
    }

    function renderOption(elementId, option) {
        const el = document.getElementById(elementId);
        if (!el) return;

        let chart = echartsInstances[elementId];
        if (!chart) {
            chart = echarts.init(el);
            echartsInstances[elementId] = chart;
        }

        // Apply global configuration overrides for clean UI
        const isDark = document.documentElement.getAttribute("data-theme") !== "light";
        const baseOption = {
            backgroundColor: 'transparent',
            textStyle: { fontFamily: 'var(--font-body)' },
            title: { textStyle: { color: isDark ? '#f5f5f3' : '#0a0a0a' } }
        };

        chart.setOption(Object.assign({}, baseOption, option), true);
    }

    function resizeAllCharts() {
        Object.values(echartsInstances).forEach(chart => {
            if (chart) chart.resize();
        });
    }

    /* ============================================================
       7. DYNAMIC TABLE RENDERING, BULK AND COLUMN HANDLERS
       ============================================================ */
    function renderActiveFilterBadges() {
        const container = document.getElementById("activeFiltersContainer");
        const countBadge = document.getElementById("activeFiltersCount");
        container.innerHTML = "";

        let activeCount = 0;

        // Presets badge
        if (state.activePreset !== "all") {
            createBadge(`Time: ${state.activePreset.toUpperCase()}`, () => {
                state.activePreset = "all";
                document.querySelectorAll(".preset-badge").forEach(b => b.classList.remove("active"));
                document.querySelector("[data-preset='all']").classList.add("active");
                filterAndSearchPipeline();
            });
            activeCount++;
        }

        // Filters badges
        Object.entries(state.filters).forEach(([key, val]) => {
            if (val === true || (typeof val === "string" && val.trim() !== "")) {
                let text = `${key.toUpperCase()}: ${val === true ? "YES" : val}`;
                createBadge(text, () => {
                    if (typeof val === "boolean") state.filters[key] = false;
                    else state.filters[key] = "";

                    const inputEl = document.getElementById(`filter${key.charAt(0).toUpperCase() + key.slice(1)}`);
                    if (inputEl) {
                        if (inputEl.type === "checkbox") inputEl.checked = false;
                        else inputEl.value = "";
                    }
                    filterAndSearchPipeline();
                });
                activeCount++;
            }
        });

        if (activeCount > 0) {
            countBadge.style.display = "inline-block";
            countBadge.textContent = activeCount;
        } else {
            countBadge.style.display = "none";
        }

        function createBadge(text, onRemove) {
            const badge = document.createElement("div");
            badge.className = "preset-badge";
            badge.style.display = "flex";
            badge.style.alignItems = "center";
            badge.style.gap = "6px";
            badge.style.background = "var(--bg-input)";
            badge.style.borderColor = "var(--accent)";
            badge.innerHTML = `<span>${text}</span><span style="cursor:pointer; font-weight:700;">✕</span>`;
            badge.querySelector("span:last-child").addEventListener("click", onRemove);
            container.appendChild(badge);
        }
    }

    function renderTableHeader() {
        const headerRow = document.getElementById("tableHeaderRow");
        headerRow.innerHTML = "";

        state.columns.forEach(col => {
            if (!col.visible) return;

            const th = document.createElement("th");
            th.style.width = `${col.resizeWidth}px`;

            if (col.key === "select") {
                th.innerHTML = `<input type="checkbox" id="bulkSelectAll" class="bulk-checkbox">`;
            } else {
                let sortIndicator = "";
                if (state.sortBy.startsWith(col.key)) {
                    sortIndicator = state.sortBy.endsWith("asc") ? " ▲" : " ▼";
                }
                th.innerHTML = `<span>${col.label}</span><span class="sort-indicator">${sortIndicator}</span>`;
                th.addEventListener("click", (e) => {
                    if (e.target.classList.contains("col-resizer")) return;
                    handleHeaderSort(col.key);
                });
            }

            // Drag handle resizer
            const resizer = document.createElement("div");
            resizer.className = "col-resizer";
            resizer.addEventListener("mousedown", (e) => initColResize(e, th, col));
            th.appendChild(resizer);

            headerRow.appendChild(th);
        });

        // Bind Select All event listener
        const selectAllCheck = document.getElementById("bulkSelectAll");
        if (selectAllCheck) {
            selectAllCheck.checked = state.filtered.length > 0 && state.filtered.every(q => state.selectedIds.has(q._id));
            selectAllCheck.addEventListener("change", handleBulkSelectAll);
        }
    }

    function handleHeaderSort(key) {
        if (key === "actions" || key === "select") return;
        const current = state.sortBy;
        if (current.startsWith(key)) {
            const nextDirection = current.endsWith("asc") ? "desc" : "asc";
            state.sortBy = `${key}-${nextDirection}`;
        } else {
            state.sortBy = `${key}-desc`;
        }
        document.getElementById("selectSortBy").value = state.sortBy;
        filterAndSearchPipeline();
    }

    // Column resizing drag handlers
    let currentResizer = null;
    function initColResize(e, th, colConfig) {
        e.preventDefault();
        currentResizer = {
            th: th,
            colConfig: colConfig,
            startX: e.clientX,
            startWidth: th.offsetWidth
        };
        document.addEventListener("mousemove", handleColResize);
        document.addEventListener("mouseup", stopColResize);
    }

    function handleColResize(e) {
        if (!currentResizer) return;
        const delta = e.clientX - currentResizer.startX;
        const newWidth = Math.max(30, currentResizer.startWidth + delta);
        currentResizer.th.style.width = `${newWidth}px`;
        currentResizer.colConfig.resizeWidth = newWidth;
    }

    function stopColResize() {
        document.removeEventListener("mousemove", handleColResize);
        document.removeEventListener("mouseup", stopColResize);
        currentResizer = null;
        saveLayout();
    }

    function renderQuotesTable() {
        renderTableHeader();

        const tbody = document.getElementById("quotesBody");
        tbody.innerHTML = "";

        const total = state.filtered.length;
        const size = parseInt(state.pageSize);
        const pages = Math.ceil(total / size) || 1;

        if (state.currentPage > pages) state.currentPage = pages;

        const startIdx = (state.currentPage - 1) * size;
        const endIdx = Math.min(startIdx + size, total);
        state.paginated = state.filtered.slice(startIdx, endIdx);

        // Update pagination descriptors
        document.getElementById("paginatedInfoRange").textContent = total ? `${startIdx + 1} - ${endIdx}` : "0";
        document.getElementById("paginatedInfoTotal").textContent = total;
        document.getElementById("paginatedGrandTotal").textContent = state.allQuotations.length;

        const diffText = document.getElementById("filteredDiffText");
        if (total !== state.allQuotations.length) {
            diffText.style.display = "inline";
        } else {
            diffText.style.display = "none";
        }

        const empty = document.getElementById("emptyState");
        if (total === 0) {
            empty.classList.remove("hidden");
            return;
        }
        empty.classList.add("hidden");

        // Table groupings logic
        if (state.groupBy !== "none") {
            renderGroupedRows(tbody);
        } else {
            renderNormalRows(tbody, state.paginated);
        }

        updateBulkActionBar();
    }

    function renderNormalRows(tbody, rowsList) {
        rowsList.forEach((q, idx) => {
            const tr = document.createElement("tr");
            tr.dataset.id = q._id;

            state.columns.forEach(col => {
                if (!col.visible) return;

                const td = document.createElement("td");
                td.style.width = `${col.resizeWidth}px`;

                switch (col.key) {
                    case "select":
                        td.innerHTML = `<input type="checkbox" class="bulk-checkbox row-select" data-id="${q._id}" ${state.selectedIds.has(q._id) ? "checked" : ""}>`;
                        break;
                    case "quotationNo":
                        td.innerHTML = `<span class="ref-chip font-mono" style="font-size:11px;">${highlightText(q.quotationNo || "DRAFT-" + (idx + 1), state.searchQuery)}</span>`;
                        break;
                    case "createdAt":
                        td.innerHTML = highlightText(fmtDate(q.createdAt), state.searchQuery);
                        break;
                    case "salesRep":
                        td.innerHTML = highlightText(q.salesRep?.name || "—", state.searchQuery);
                        break;
                    case "client":
                        td.innerHTML = highlightText(q.client?.name || "—", state.searchQuery);
                        break;
                    case "company":
                        td.innerHTML = highlightText(q.client?.company || "—", state.searchQuery);
                        break;
                    case "projectType":
                        td.innerHTML = highlightText(q.project?.projectType || "—", state.searchQuery);
                        break;
                    case "grandTotal":
                        td.className = "font-mono";
                        td.style.textAlign = "right";
                        td.innerHTML = highlightText(fmtCurrency(q.summary?.grandTotal), state.searchQuery);
                        break;
                    case "status":
                        td.innerHTML = statusBadge(q.status);
                        break;
                    case "actions":
                        const pdfBtn = q.status === "GENERATED" || q.status === "APPROVED"
                            ? `<button class="btn btn-outline btn-xs" data-action="pdf" data-id="${q._id}">📄 PDF</button>`
                            : "";
                        td.className = "actions-cell";
                        td.innerHTML = `
                            <button class="btn btn-outline btn-xs" data-action="view"   data-id="${q._id}">👁 View</button>
                            <button class="btn btn-outline btn-xs" data-action="edit"   data-id="${q._id}">✏️ Edit</button>
                            <button class="btn btn-outline btn-xs" data-action="dup"    data-id="${q._id}">⧉ Dup</button>
                            <button class="btn btn-danger  btn-xs" data-action="delete" data-id="${q._id}">🗑 Del</button>
                            ${pdfBtn}
                        `;
                        break;
                }
                tr.appendChild(td);
            });

            tbody.appendChild(tr);
            setTimeout(() => tr.classList.add("row-visible"), idx * 25);
        });
    }

    function renderGroupedRows(tbody) {
        // Group the paginated list locally
        const groups = {};
        state.paginated.forEach(q => {
            let key = "Unknown";
            if (state.groupBy === "salesRep") key = q.salesRep?.name || "Unknown";
            else if (state.groupBy === "client") key = q.client?.name || "Unknown";
            else if (state.groupBy === "company") key = q.client?.company || "Unknown";
            else if (state.groupBy === "status") key = q.status || "DRAFT";
            else if (state.groupBy === "projectType") key = q.project?.projectType || "INDOOR";
            else if (state.groupBy === "state") key = extractState(q.client?.clientAddress || q.client?.siteAddress);

            if (!groups[key]) groups[key] = [];
            groups[key].push(q);
        });

        // Render each group
        Object.entries(groups).forEach(([groupName, rows]) => {
            const groupRow = document.createElement("tr");
            groupRow.className = "group-header-row";

            const visibleColsCount = state.columns.filter(c => c.visible).length;
            const td = document.createElement("td");
            td.colSpan = visibleColsCount;
            td.innerHTML = `📁 ${groupName.toUpperCase()} &nbsp;(${rows.length} quotes, sum: ${fmtCurrency(rows.reduce((acc, r) => acc + (r.summary?.grandTotal || 0), 0))})`;
            groupRow.appendChild(td);
            tbody.appendChild(groupRow);

            renderNormalRows(tbody, rows);
        });
    }

    /* ============================================================
       8. SELECTIONS & BULK OPERATIONS CONTROLLER
       ============================================================ */
    function handleBulkSelectAll(e) {
        const checked = e.target.checked;
        state.filtered.forEach(q => {
            if (checked) state.selectedIds.add(q._id);
            else state.selectedIds.delete(q._id);
        });

        document.querySelectorAll(".row-select").forEach(cb => {
            cb.checked = checked;
        });

        updateBulkActionBar();
    }

    function updateBulkActionBar() {
        const bar = document.getElementById("bulkActionBar");
        const countText = document.getElementById("bulkSelectedCount");
        const count = state.selectedIds.size;

        if (count > 0) {
            bar.style.display = "flex";
            countText.textContent = count;
        } else {
            bar.style.display = "none";
        }
    }

    /* Bulk actions triggers */
    async function bulkDelete() {
        if (!confirm(`Are you sure you want to delete all ${state.selectedIds.size} selected quotations? This cannot be undone.`)) return;
        const all = loadLocalQuotations();
        const remaining = all.filter(q => !state.selectedIds.has(q._id));
        saveLocalQuotations(remaining);
        state.selectedIds.clear();
        toast("Selected quotations deleted.", "info");
        filterAndSearchPipeline();
    }

    function bulkDuplicate() {
        const notes = prompt("Provide duplicate revision notes for audit log:", `Bulk Duplicated from selection`);
        if (notes === null) return;

        const all = loadLocalQuotations();
        let created = 0;

        state.selectedIds.forEach(id => {
            const orig = all.find(q => q._id === id);
            if (orig) {
                const dup = JSON.parse(JSON.stringify(orig));
                dup._id = "qt-" + Date.now() + "-" + Math.floor(Math.random() * 100000);
                dup.quotationNo = `QT-${Date.now() + created}-L1`;
                dup.createdAt = new Date().toISOString();
                dup.status = "DRAFT";
                dup.revisionNotes = notes;
                all.push(dup);
                created++;
            }
        });

        saveLocalQuotations(all);
        state.selectedIds.clear();
        toast(`Successfully duplicated ${created} quotations as Drafts.`, "success");
        filterAndSearchPipeline();
    }

    function bulkStatusUpdate(newStatus) {
        if (!newStatus) return;
        const all = loadLocalQuotations();
        let updated = 0;
        all.forEach(q => {
            if (state.selectedIds.has(q._id)) {
                q.status = newStatus;
                updated++;
            }
        });
        saveLocalQuotations(all);
        state.selectedIds.clear();
        document.getElementById("bulkSelectStatus").selectedIndex = 0;
        toast(`Successfully updated status for ${updated} quotations.`, "success");
        filterAndSearchPipeline();
    }

    function bulkPrint() {
        state.selectedIds.forEach(id => {
            window.open(`pdf.html?id=${encodeURIComponent(id)}`, "_blank");
        });
    }

    function bulkPdfExport() {
        state.selectedIds.forEach(id => {
            window.open(`pdf.html?id=${encodeURIComponent(id)}&download=true`, "_blank");
        });
    }

    /* ============================================================
       9. REPORTING & SPREADSHEET EXPORTS (XLSX, CSV, PDF, JSON)
       ============================================================ */
    function handleReportingExport(format) {
        if (state.filtered.length === 0) {
            toast("No data available to export.", "error");
            return;
        }

        switch (format) {
            case "excel":
                exportToExcel();
                break;
            case "csv":
                exportToCSV();
                break;
            case "pdf":
                exportToPDF();
                break;
            case "json":
                exportToJSON();
                break;
            case "print":
                window.print();
                break;
        }
        document.getElementById("selectExport").selectedIndex = 0;
    }

    function flattenDataForExcel() {
        return state.filtered.map(q => ({
            "Quotation Ref": q.quotationNo || "",
            "Master No": q.masterNo || "",
            "Revision": q.revision || 1,
            "Date": fmtDate(q.createdAt),
            "Sales Executive": q.salesRep?.name || "",
            "Client Name": q.client?.name || "",
            "Company": q.client?.company || "",
            "Client Address": q.client?.clientAddress || "",
            "Site Address": q.client?.siteAddress || "",
            "State": extractState(q.client?.clientAddress || q.client?.siteAddress),
            "Project Type": q.project?.projectType || "",
            "Subtotal": q.summary?.subtotal || 0,
            "GST Amount": q.summary?.gstAmt || 0,
            "Discount": q.summary?.discount || 0,
            "Grand Total": q.summary?.grandTotal || 0,
            "Status": q.status || ""
        }));
    }

    function exportToExcel() {
        if (typeof XLSX === "undefined") {
            toast("Excel exporter library not loaded.", "error");
            return;
        }
        const data = flattenDataForExcel();
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "BI Summary Report");
        XLSX.writeFile(wb, `KAN_BI_Quotation_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast("Excel spreadsheet downloaded successfully.", "success");
    }

    function exportToCSV() {
        const data = flattenDataForExcel();
        if (data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(",")];

        data.forEach(row => {
            const values = headers.map(header => {
                const escaped = String(row[header]).replace(/"/g, '\\"');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(","));
        });

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `KAN_BI_Quotation_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast("CSV sheet downloaded successfully.", "success");
    }

    function exportToJSON() {
        const jsonStr = JSON.stringify(state.filtered, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `KAN_BI_Quotations_Raw_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        toast("Raw JSON exported successfully.", "success");
    }

    function exportToPDF() {
        // PDF Summary Page assembling
        const el = document.body;
        if (typeof html2canvas === "undefined" || typeof jspdf === "undefined") {
            toast("PDF library missing.", "error");
            return;
        }
        toast("Generating PDF screenshot...", "info");
        window.scrollTo(0, 0);
        html2canvas(el, { scale: 1.5, useCORS: true }).then(canvas => {
            const { jsPDF } = window.jspdf;
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const imgWidth = 210;
            const pageHeight = 295;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            pdf.save(`KAN_BI_Executive_Summary_${new Date().toISOString().split('T')[0]}.pdf`);
            toast("PDF exported successfully.", "success");
        });
    }

    /* ============================================================
       10. LAYOUT SAVER & ACTIVE INTERACTIVE INITIALIZERS
       ============================================================ */
    function saveLayout() {
        try {
            const config = {
                columns: state.columns.map(c => ({ key: c.key, visible: c.visible, width: c.resizeWidth })),
                sortBy: state.sortBy,
                pageSize: state.pageSize,
                groupBy: state.groupBy,
                filters: state.filters
            };
            localStorage.setItem(LAYOUT_KEY, JSON.stringify(config));
        } catch (e) { console.error(e); }
    }

    function loadLayout() {
        try {
            const raw = localStorage.getItem(LAYOUT_KEY);
            if (!raw) return;
            const config = JSON.parse(raw);
            if (config.columns) {
                config.columns.forEach(storedCol => {
                    const c = state.columns.find(x => x.key === storedCol.key);
                    if (c) {
                        c.visible = storedCol.visible;
                        c.resizeWidth = storedCol.width;
                    }
                });
            }
            if (config.sortBy) {
                state.sortBy = config.sortBy;
                document.getElementById("selectSortBy").value = config.sortBy;
            }
            if (config.pageSize) {
                state.pageSize = config.pageSize;
                document.getElementById("selectPageSize").value = config.pageSize;
            }
            if (config.groupBy) {
                state.groupBy = config.groupBy;
                document.getElementById("selectGroupBy").value = config.groupBy;
            }
            if (config.filters) {
                state.filters = config.filters;
                // Populating Filter inputs
                Object.entries(config.filters).forEach(([k, v]) => {
                    const el = document.getElementById(`filter${k.charAt(0).toUpperCase() + k.slice(1)}`);
                    if (el) {
                        if (el.type === "checkbox") el.checked = !!v;
                        else el.value = v;
                    }
                });
            }
        } catch (e) { console.error(e); }
    }

    function populateFilterDropdowns() {
        const reps = new Set();
        const clients = new Set();
        const companies = new Set();
        const states = new Set();
        const categories = new Set();
        const brands = new Set();

        state.allQuotations.forEach(q => {
            if (q.salesRep?.name) reps.add(q.salesRep.name.trim().toUpperCase());
            if (q.client?.name) clients.add(q.client.name.trim().toUpperCase());
            if (q.client?.company) companies.add(q.client.company.trim().toUpperCase());

            const st = extractState(q.client?.clientAddress || q.client?.siteAddress);
            states.add(st.trim().toUpperCase());

            if (q.lineItems) {
                q.lineItems.forEach(li => {
                    if (li.category) categories.add(li.category.trim().toUpperCase());
                    if (li.brand) brands.add(li.brand.trim().toUpperCase());
                });
            }
        });

        bindOptions("filterSalesRep", reps);
        bindOptions("filterClientName", clients);
        bindOptions("filterCompany", companies);
        bindOptions("filterState", states);
        bindOptions("filterCategory", categories);
        bindOptions("filterBrand", brands);

        function bindOptions(elId, set) {
            const select = document.getElementById(elId);
            if (!select) return;
            const originalVal = select.value;
            select.innerHTML = `<option value="">All ${elId.replace('filter', '')}s</option>`;
            Array.from(set).sort().forEach(val => {
                select.innerHTML += `<option value="${val}">${val}</option>`;
            });
            select.value = originalVal;
        }
    }

    function initColumnSettings() {
        const container = document.getElementById("columnSettingsDropdown");
        container.innerHTML = "";

        state.columns.forEach(col => {
            if (col.key === "select" || col.key === "actions") return;

            const label = document.createElement("label");
            label.style.display = "flex";
            label.style.alignItems = "center";
            label.style.gap = "8px";
            label.style.fontSize = "12px";
            label.style.cursor = "pointer";
            label.innerHTML = `<input type="checkbox" ${col.visible ? "checked" : ""} style="width:14px; height:14px;"> <span>${col.label}</span>`;

            label.querySelector("input").addEventListener("change", (e) => {
                col.visible = e.target.checked;
                renderQuotesTable();
                saveLayout();
            });
            container.appendChild(label);
        });

        document.getElementById("btnColumnSettings").addEventListener("click", (e) => {
            e.stopPropagation();
            container.classList.toggle("hidden");
        });

        document.addEventListener("click", (e) => {
            if (!container.classList.contains("hidden") && !e.target.closest("#columnSettingsDropdownWrapper")) {
                container.classList.add("hidden");
            }
        });
    }

    /* Event Listeners binding */
    function initEventHandlers() {
        // Toggle Advanced filters drawer
        const drawer = document.getElementById("filterDrawer");
        const overlay = document.getElementById("drawerOverlay");

        document.getElementById("btnToggleFilters").addEventListener("click", () => {
            drawer.classList.add("open");
            overlay.classList.add("visible");
        });

        document.getElementById("btnCloseDrawer").addEventListener("click", closeDrawer);
        overlay.addEventListener("click", closeDrawer);

        function closeDrawer() {
            drawer.classList.remove("open");
            overlay.classList.remove("visible");
        }

        // Apply filters in drawer
        document.getElementById("drawerApplyBtn").addEventListener("click", () => {
            state.filters.status = document.getElementById("filterStatus").value;
            state.filters.projectType = document.getElementById("filterProjectType").value;
            state.filters.salesRep = document.getElementById("filterSalesRep").value;
            state.filters.clientName = document.getElementById("filterClientName").value;
            state.filters.company = document.getElementById("filterCompany").value;
            state.filters.state = document.getElementById("filterState").value;
            state.filters.amtMin = document.getElementById("filterAmtMin").value;
            state.filters.amtMax = document.getElementById("filterAmtMax").value;
            state.filters.category = document.getElementById("filterCategory").value;
            state.filters.brand = document.getElementById("filterBrand").value;
            state.filters.dateStart = document.getElementById("filterDateStart").value;
            state.filters.dateEnd = document.getElementById("filterDateEnd").value;
            state.filters.hasAttachment = document.getElementById("filterHasAttachment").checked;
            state.filters.hasDiscount = document.getElementById("filterHasDiscount").checked;
            state.filters.hasGst = document.getElementById("filterHasGst").checked;

            closeDrawer();
            saveLayout();
            filterAndSearchPipeline();
        });

        // Reset drawer filters
        document.getElementById("drawerResetBtn").addEventListener("click", () => {
            Object.keys(state.filters).forEach(k => {
                if (typeof state.filters[k] === "boolean") state.filters[k] = false;
                else state.filters[k] = "";
            });
            document.querySelectorAll(".filter-drawer-body select, .filter-drawer-body input").forEach(el => {
                if (el.type === "checkbox") el.checked = false;
                else el.value = "";
            });
            closeDrawer();
            saveLayout();
            filterAndSearchPipeline();
        });

        document.getElementById("btnClearFilters").addEventListener("click", () => {
            document.getElementById("drawerResetBtn").click();
        });

        // Search debouncer
        document.getElementById("biSearchInput").addEventListener("input", debounce(e => {
            state.searchQuery = e.target.value.trim();
            filterAndSearchPipeline();
        }, 300));

        // Sorting & Grouping
        document.getElementById("selectSortBy").addEventListener("change", e => {
            state.sortBy = e.target.value;
            saveLayout();
            filterAndSearchPipeline();
        });

        document.getElementById("selectGroupBy").addEventListener("change", e => {
            state.groupBy = e.target.value;
            saveLayout();
            renderQuotesTable();
        });

        // Export Selector
        document.getElementById("selectExport").addEventListener("change", e => {
            handleReportingExport(e.target.value);
        });

        // Page Size
        document.getElementById("selectPageSize").addEventListener("change", e => {
            state.pageSize = parseInt(e.target.value);
            state.currentPage = 1;
            saveLayout();
            renderQuotesTable();
        });

        // Pagination buttons
        document.getElementById("btnPagePrev").addEventListener("click", () => {
            if (state.currentPage > 1) {
                state.currentPage--;
                renderQuotesTable();
            }
        });
        document.getElementById("btnPageNext").addEventListener("click", () => {
            const total = state.filtered.length;
            const size = parseInt(state.pageSize);
            const maxPage = Math.ceil(total / size) || 1;
            if (state.currentPage < maxPage) {
                state.currentPage++;
                renderQuotesTable();
            }
        });

        // Date Quick Presets Click
        document.querySelectorAll(".preset-badge[data-preset]").forEach(btn => {
            btn.addEventListener("click", () => {
                document.querySelectorAll(".preset-badge").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                state.activePreset = btn.dataset.preset;
                filterAndSearchPipeline();
            });
        });

        // Bulk Actions buttons
        document.getElementById("bulkBtnDelete").addEventListener("click", bulkDelete);
        document.getElementById("bulkBtnDuplicate").addEventListener("click", bulkDuplicate);
        document.getElementById("bulkBtnPrint").addEventListener("click", bulkPrint);
        document.getElementById("bulkBtnPdf").addEventListener("click", bulkPdfExport);
        document.getElementById("bulkSelectStatus").addEventListener("change", e => {
            bulkStatusUpdate(e.target.value);
        });

        // Row individual checkbox selection
        document.getElementById("quotesBody").addEventListener("change", e => {
            if (e.target.classList.contains("row-select")) {
                const id = e.target.dataset.id;
                if (e.target.checked) state.selectedIds.add(id);
                else state.selectedIds.delete(id);
                updateBulkActionBar();
            }
        });

        // Table Action buttons view/edit/dup/delete/pdf
        let pendingDeleteId = null;
        document.getElementById("quotesBody").addEventListener("click", e => {
            const btn = e.target.closest("[data-action]");
            if (!btn) return;
            const action = btn.dataset.action;
            const id = btn.dataset.id;

            if (action === "view") {
                sessionStorage.setItem("kan_view_quote_id", id);
                window.location.href = `pdf.html?id=${encodeURIComponent(id)}`;
            } else if (action === "edit") {
                const q = state.allQuotations.find(x => x._id === id);
                const defaultNotes = `Revised version of ${q?.quotationNo || "original"}`;
                const notes = prompt("Provide details about this revision for the audit trail:", defaultNotes);
                if (notes === null) return;
                sessionStorage.setItem("kan_edit_revision_notes", notes.trim() || defaultNotes);
                sessionStorage.setItem("kan_active_quote", id);
                sessionStorage.setItem("kan_edit_mode", "true");
                window.location.href = "create.html";
            } else if (action === "dup") {
                const orig = state.allQuotations.find(q => q._id === id);
                if (!orig) return;
                const defaultNotes = `Duplicated from ${orig.quotationNo || "original"}`;
                const notes = prompt("Provide details about this duplicate for the audit trail:", defaultNotes);
                if (notes === null) return;

                const dup = JSON.parse(JSON.stringify(orig));
                dup._id = "qt-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
                dup.createdAt = new Date().toISOString();
                dup.status = "DRAFT";
                dup.revisionNotes = notes;

                // Get next QT ID
                const counter = parseInt(localStorage.getItem("kan_quote_counter") || "1000");
                dup.quotationNo = `QT-${counter + 1}-L1`;
                localStorage.setItem("kan_quote_counter", String(counter + 1));

                state.allQuotations.push(dup);
                saveLocalQuotations(state.allQuotations);
                toast("Quotation duplicated as Draft.", "success");
                filterAndSearchPipeline();
            } else if (action === "delete") {
                pendingDeleteId = id;
                const q = state.allQuotations.find(x => x._id === id);
                document.getElementById("deleteModalTitle").textContent = "Delete Quotation?";
                document.getElementById("deleteModalMsg").textContent = `Delete "${q?.quotationNo || "this quotation"}"? This cannot be undone.`;
                document.getElementById("deleteModal").classList.remove("hidden");
            } else if (action === "pdf") {
                window.open(`pdf.html?id=${encodeURIComponent(id)}`, "_blank");
            }
        });

        // Cancel modal
        document.getElementById("deleteCancelBtn").addEventListener("click", () => {
            document.getElementById("deleteModal").classList.add("hidden");
            pendingDeleteId = null;
        });

        // Confirm modal delete
        document.getElementById("deleteConfirmBtn").addEventListener("click", () => {
            if (!pendingDeleteId) return;
            const updated = state.allQuotations.filter(q => q._id !== pendingDeleteId);
            saveLocalQuotations(updated);
            document.getElementById("deleteModal").classList.add("hidden");
            pendingDeleteId = null;
            toast("Quotation deleted.", "info");
            loadDashboard();
        });

        // Tabs click
        document.querySelectorAll(".tab-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");

                document.querySelectorAll(".tab-panel").forEach(p => p.classList.add("hidden"));
                document.getElementById(btn.dataset.target).classList.remove("hidden");

                // ECharts resize to align container widths correctly
                setTimeout(resizeAllCharts, 50);
            });
        });

        // Create page trigger
        document.getElementById("btnNewQuote").addEventListener("click", () => {
            sessionStorage.removeItem("kan_active_quote");
            sessionStorage.removeItem("kan_edit_mode");
            window.location.href = "create.html";
        });

        // Manual Refresh trigger
        document.getElementById("btnRefresh").addEventListener("click", async () => {
            toast("Syncing with Live Google Sheet...", "info");
            document.getElementById("loadingOverlay").classList.remove("hidden");
            await syncWithSheet(true);
            document.getElementById("loadingOverlay").classList.add("hidden");
            toast("Google Sheet data synced successfully!", "success");
            loadDashboard();
        });
    }

    // Auto-refresh interval setter
    let autoRefreshTimer = null;
    function initAutoRefreshTimer() {
        const intervalSelect = document.getElementById("autoRefreshInterval");

        intervalSelect.addEventListener("change", e => {
            const val = parseInt(e.target.value);
            clearInterval(autoRefreshTimer);
            if (val > 0) {
                autoRefreshTimer = setInterval(async () => {
                    await syncWithSheet();
                    loadDashboard();
                }, val * 1000);
            }
        });

        // Trigger default timer (60 seconds)
        autoRefreshTimer = setInterval(async () => {
            await syncWithSheet();
            loadDashboard();
        }, 60000);
    }

    /* Boot elements loader */
    async function loadDashboard() {
        state.allQuotations = loadLocalQuotations();
        populateFilterDropdowns();
        filterAndSearchPipeline();
    }

    // Window Resize event
    window.addEventListener("resize", debounce(resizeAllCharts, 150));

    // Boot
    (async function init() {
        loadLayout();
        initColumnSettings();
        initEventHandlers();
        initAutoRefreshTimer();

        document.getElementById("loadingOverlay").classList.remove("hidden");
        await syncWithSheet();
        document.getElementById("loadingOverlay").classList.add("hidden");

        await loadDashboard();
    })();

})();
