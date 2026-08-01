/* ==========================================================================
   KAN UNIVERSAL — SALES QUOTATION SYSTEM
   script.js — Main application logic for create.html
   Requires: credentials.js, calculation.js (loaded before this file)
   ========================================================================== */

(() => {
    "use strict";

    function getDirectDownloadUrl(url) {
        if (!url) return "";
        if (url.includes("drive.google.com/uc") || url.includes("docs.google.com/uc")) {
            return url;
        }
        const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            return "https://drive.google.com/uc?export=download&id=" + match[1];
        }
        return url;
    }

    /* ============================================================
       0. AUTH GUARD
       ============================================================ */
    const sessionUser = getSessionUser();
    if (!sessionUser) {
        window.location.replace("../index.html");
        return;
    }

    /* ============================================================
       1. THEME
       ============================================================ */
    (function initTheme() {
        const saved = localStorage.getItem("kan_theme") || "dark";
        document.documentElement.setAttribute("data-theme", saved);
        updateThemeUI(saved);

        const btn = document.getElementById("themeToggle");
        if (btn) {
            btn.addEventListener("click", () => {
                const cur = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
                document.documentElement.setAttribute("data-theme", cur);
                localStorage.setItem("kan_theme", cur);
                updateThemeUI(cur);
            });
        }
    })();

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

    /* ============================================================
       2. TOPBAR USER INFO + LOGOUT
       ============================================================ */
    const nameEl = document.getElementById("topbarUserName");
    const roleEl = document.getElementById("topbarUserRole");
    if (nameEl) nameEl.textContent = sessionUser.name;
    if (roleEl) roleEl.textContent = sessionUser.role;

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to logout?")) {
                clearSession();
                window.location.href = "../index.html";
            }
        });
    }

    /* ============================================================
       3. DOM HELPERS
       ============================================================ */
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
    const fmt2 = n => (isFinite(parseFloat(n)) ? parseFloat(n) : 0).toFixed(2);
    const num = v => { const n = parseFloat(v); return isFinite(n) ? n : 0; };

    function escapeHtml(s) {
        return String(s == null ? "" : s).replace(/[&<>"']/g, m =>
            ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])
        );
    }

    /* ============================================================
       4. LOADING OVERLAY
       ============================================================ */
    function showLoading(text) {
        const el = $("#loadingText");
        if (el) el.textContent = text || "Working…";
        $("#loadingOverlay")?.classList.remove("hidden");
    }
    function hideLoading() {
        $("#loadingOverlay")?.classList.add("hidden");
    }

    /* ============================================================
       5. TOAST NOTIFICATIONS
       ============================================================ */
    function toast(message, type = "info") {
        const el = document.createElement("div");
        el.className = "toast " + (type === "success" ? "success" : type === "error" ? "error" : "");
        el.textContent = message;
        $("#toastContainer")?.appendChild(el);
        setTimeout(() => el.remove(), 4200);
    }

    /* ============================================================
       6. FIELD ERROR DISPLAY
       ============================================================ */
    function setFieldError(name, message) {
        const el = document.querySelector(`.error-msg[data-for="${name}"]`);
        if (el) el.textContent = message || "";
        const input = document.getElementById(name);
        if (input) {
            input.style.borderColor = message ? "var(--danger)" : "";
            if (message) {
                const parent = input.closest(".field") || input.parentElement;
                if (parent) {
                    parent.classList.remove("field-error-shake");
                    void parent.offsetWidth; // Force browser layout reflow
                    parent.classList.add("field-error-shake");
                    setTimeout(() => {
                        parent.classList.remove("field-error-shake");
                    }, 400);
                }
            }
        }
    }

    /* ============================================================
       7. APPLICATION STATE
       ============================================================ */
    const state = {
        lineItems: [],
        remarks: [""],
        status: "NEW",
        quotationNo: null,
        _id: null,
        createdAt: null,
        scopeValues: {},   // { transport: "KAN", siteReadiness: "BUYER", ... }
        hasBranchedRevision: false,
        attachment: null  // { base64: "", filename: "", mimeType: "" }
    };
    let lineIdCounter = 0;

    /* ============================================================
       8. SECTION LOADER — fetch HTML partials and inject
       ============================================================ */
    async function loadSections() {
        // Sections are now statically merged into create.html
        return Promise.resolve();
    }

    /* ============================================================
       9. SECTION 1 — SALES REPRESENTATIVE
       ============================================================ */
    function initSalesRep() {
        const sel = document.getElementById("salesRep");
        if (!sel) return;

        /* Populate dropdown */
        EMPLOYEES.forEach(emp => {
            const opt = document.createElement("option");
            opt.value = emp.name;
            opt.textContent = `${emp.name} — ${emp.role}`;
            sel.appendChild(opt);
        });

        /* Role-based access: Users see only their own name, Admin sees all */
        if (sessionUser.access !== "Admin") {
            /* Lock dropdown to logged-in user */
            sel.value = sessionUser.name;
            sel.disabled = true;
            sel.title = "You can only create quotations as yourself.";

            /* Reflect in title bar */
            updateSalesRepFields(sessionUser.name);
        } else {
            /* Admin: can select anyone */
            sel.addEventListener("change", () => {
                setFieldError("salesRep", "");
                updateSalesRepFields(sel.value);
            });
        }
    }

    function updateSalesRepFields(name) {
        const emp = EMPLOYEES.find(e => e.name === name);
        const emailEl = document.getElementById("salesEmail");
        const contactEl = document.getElementById("salesContact");
        if (emailEl) emailEl.value = emp ? emp.email : "";
        if (contactEl) contactEl.value = emp ? emp.contact : "";
    }

    /* ============================================================
       10. SECTION 2 — SAME ADDRESS CHECKBOX
       ============================================================ */
    function initSameAddress() {
        const chk = document.getElementById("sameAddressCheck");
        const clientAddr = document.getElementById("clientAddress");
        const siteAddr = document.getElementById("siteAddress");
        if (!chk || !clientAddr || !siteAddr) return;

        chk.addEventListener("change", () => {
            if (chk.checked) {
                siteAddr.value = clientAddr.value;
                siteAddr.readOnly = true;
                siteAddr.style.opacity = "0.65";
                siteAddr.style.cursor = "not-allowed";
            } else {
                siteAddr.readOnly = false;
                siteAddr.style.opacity = "";
                siteAddr.style.cursor = "";
            }
        });

        /* Mirror client address changes when same-address is ticked */
        clientAddr.addEventListener("input", () => {
            if (chk.checked) siteAddr.value = clientAddr.value;
        });
    }

    /* ============================================================
       11. SECTION 3 — SITE VISIT TOGGLE
       ============================================================ */
    function initSiteVisitToggle() {
        /* Listen on radio group via event delegation */
        document.addEventListener("change", e => {
            if (e.target.name === "siteVisit") {
                const momField = document.getElementById("momField");
                if (momField) {
                    momField.classList.toggle("hidden", e.target.value !== "YES");
                }
            }
            /* Sync screen row on any project-related radio change */
            if (["cabinetSolution", "mountingType", "amc", "siteVisit", "projectType", "moduleSize"].includes(e.target.name)) {
                syncScreenRow();
            }
        });
    }

    /* ============================================================
       12. SECTION 4 — SCOPE OF WORK (radio buttons: KAN / BUYER)
       ============================================================ */
    function initScopeOfWork() {
        const grid = document.getElementById("scopeGrid");
        if (!grid) return;

        SCOPE_FIELDS.forEach(field => {
            const wrap = document.createElement("div");
            wrap.className = "scope-item";
            wrap.innerHTML = `
                <span class="scope-label" style="display:flex; justify-content:space-between; align-items:center;">
                    <span>${escapeHtml(field.label)}</span>
                    <label class="hide-pdf-wrapper" style="font-size:10px; font-weight:normal; color:var(--text-dim); display:inline-flex; align-items:center; gap:4px; text-transform:none; margin:0; cursor:pointer;">
                        <input type="checkbox" class="hide-pdf-checkbox" data-field="scope_${field.key}" style="margin:0; width:12px; height:12px; cursor:pointer;"> Hide
                    </label>
                </span>
                <div class="scope-radio-group" data-scope-key="${field.key}">
                    <label class="radio-pill">
                        <input type="radio" name="scope_${field.key}" value="KAN">
                        <span>KAN</span>
                    </label>
                    <label class="radio-pill">
                        <input type="radio" name="scope_${field.key}" value="BUYER">
                        <span>BUYER</span>
                    </label>
                    <label class="radio-pill">
                        <input type="radio" name="scope_${field.key}" value="NOT REQUIRED">
                        <span>NOT REQUIRED</span>
                    </label>
                </div>
            `;
            grid.appendChild(wrap);
        });

        /* Event delegation for scope radio changes */
        grid.addEventListener("change", e => {
            const radio = e.target;
            if (!radio.matches('input[type="radio"]')) return;
            const key = radio.name.replace("scope_", "");
            const field = SCOPE_FIELDS.find(f => f.key === key);
            if (!field) return;
            state.scopeValues[key] = radio.value;
            handleScopeChange(field, radio.value);
        });
    }

    function handleScopeChange(field, value) {
        /* Remove any existing auto-row for this scope key */
        state.lineItems = state.lineItems.filter(li => li.scopeKey !== field.key);

        if (value === "KAN") {
            state.lineItems.push({
                id: ++lineIdCounter,
                category: field.category,
                item: field.category,
                brand: "KAN",
                spec: field.category,
                specLink: "",
                description: `${field.label} — KAN Scope`,
                qty: 1,
                unit: "Lot",
                unitPrice: 0,
                isScopeRow: true,
                scopeKey: field.key,
                locked: false
            });
        }
        renderLineItems();
    }

    /* ============================================================
       13. SCREEN ROW SYNC (called from calculation.js)
       ============================================================ */
    function syncScreenRow() {
        let screenRow = state.lineItems.find(li => li.isScreenRow);
        if (!screenRow) {
            screenRow = {
                id: ++lineIdCounter,
                category: "Screen → Module",
                item: "",
                brand: "",
                spec: "",
                specLink: "",
                description: "",
                qty: 0,
                unit: "Nos",
                unitPrice: 0,
                isScreenRow: true,
                locked: true
            };
            state.lineItems.unshift(screenRow);
        }
        screenRow.description = buildScreenDescription();
        const category = document.querySelector('input[name="moduleCategory"]:checked')?.value;
        if (category === "screen") {
            screenRow.qty = num(document.getElementById("totalArea")?.value || 0);
            screenRow.unit = "Total Area (SQFT)";
        } else if (category === "cob" || category === "diecast") {
            screenRow.qty = num(document.getElementById("totalCabinets")?.value || 0);
            screenRow.unit = "Total no. of Module/Cabinet";
        } else {
            screenRow.qty = num(document.getElementById("totalCabinets")?.value || 0);
            screenRow.unit = screenRow.unit || "Nos";
        }
        renderLineItems();
    }

    /* Make syncScreenRow globally accessible to calculation.js */
    window.syncScreenRow = syncScreenRow;

    /* ============================================================
       14. QUOTATION BREAKDOWN — LINE ITEMS TABLE
       ============================================================ */
    function categoryOptions() { return Object.keys(ITEM_CATALOG); }
    function itemOptions(cat) { return cat && ITEM_CATALOG[cat] ? Object.keys(ITEM_CATALOG[cat]) : []; }
    function brandOptions(cat, item) {
        return cat && item && ITEM_CATALOG[cat] && ITEM_CATALOG[cat][item]
            ? ITEM_CATALOG[cat][item] : [];
    }

    function addLineItem(prefill = {}) {
        state.lineItems.push(Object.assign({
            id: ++lineIdCounter, category: "", item: "", brand: "", spec: "", specLink: "",
            description: "", qty: 1, unit: "Nos", unitPrice: 0, locked: false
        }, prefill));
        renderLineItems();
    }

    function removeLineItem(id) {
        const row = state.lineItems.find(li => li.id === id);
        if (row?.isScreenRow) {
            toast("Row 1 (Screen → Module) is fixed and cannot be removed.", "error");
            return;
        }
        state.lineItems = state.lineItems.filter(li => li.id !== id);
        renderLineItems();
    }

    function renderLineItems() {
        const body = document.getElementById("lineItemsBody");
        if (!body) return;
        body.innerHTML = "";

        state.lineItems.forEach((li, idx) => {
            const tr = document.createElement("tr");
            tr.dataset.id = li.id;
            if (li.locked) tr.classList.add("row-fixed");

            const total = num(li.qty) * num(li.unitPrice);
            li.total = total;

            if (li.locked) {
                /* Screen row: Category fixed, Item/Brand/Spec ARE selectable so user can pick the screen model */
                const screenItems = itemOptions("Screen → Module");
                const screenBrands = brandOptions("Screen → Module", li.item);
                tr.innerHTML = `
                    <td class="col-sno">${idx + 1}</td>
                    <td><strong style="font-size:12px;">Screen &rarr; Module</strong></td>
                    <td>
                        <select data-field="item">
                            <option value="" ${!li.item ? "selected" : ""} disabled>Select Model</option>
                            ${screenItems.map(i => `<option value="${escapeHtml(i)}" ${i === li.item ? "selected" : ""}>${escapeHtml(i)}</option>`).join("")}
                        </select>
                    </td>
                    <td>
                        <select data-field="brand" ${!li.item ? "disabled" : ""}>
                            <option value="" ${!li.brand ? "selected" : ""} disabled>Select</option>
                            ${screenBrands.map(b => `<option value="${escapeHtml(b.brand)}" ${b.brand === li.brand ? "selected" : ""}>${escapeHtml(b.brand)}</option>`).join("")}
                        </select>
                    </td>
                    <td>
                        ${li.spec
                        ? `<a href="${escapeHtml(li.specLink || "#")}" target="_blank" rel="noopener" class="spec-link">${escapeHtml(li.spec)} · View Specs</a>`
                        : `<span class="calc-hint">Select model</span>`
                    }
                    </td>
                    <td class="col-desc"><textarea data-field="description" rows="3" style="font-size:11px;">${escapeHtml(li.description)}</textarea></td>
                    <td><input type="number" data-field="qty" value="${li.qty === 0 ? '' : li.qty}" step="any" min="0"></td>
                    <td>
                        <select data-field="unit">
                            ${(() => {
                                const opts = [...UNIT_OPTIONS];
                                if (li.unit && !opts.includes(li.unit)) opts.push(li.unit);
                                return opts.map(u => `<option value="${escapeHtml(u)}" ${u === li.unit ? "selected" : ""}>${escapeHtml(u)}</option>`).join("");
                            })()}
                        </select>
                    </td>
                    <td><input type="number" data-field="unitPrice" value="${li.unitPrice === 0 ? '' : li.unitPrice}" step="any" min="0"></td>
                    <td class="col-total row-total">${fmt2(total)}</td>
                    <td class="col-action">
                        <button type="button" class="remove-row-btn" disabled title="Row 1 is fixed">×</button>
                    </td>
                `;
            } else {
                const cats = categoryOptions();
                const items = itemOptions(li.category);
                const brands = brandOptions(li.category, li.item);

                tr.innerHTML = `
                    <td class="col-sno">${idx + 1}</td>
                    <td>
                        <select data-field="category">
                            <option value="" ${!li.category ? "selected" : ""} disabled>Select</option>
                            ${cats.map(c => `<option value="${escapeHtml(c)}" ${c === li.category ? "selected" : ""}>${escapeHtml(c)}</option>`).join("")}
                        </select>
                    </td>
                    <td>
                        <select data-field="item" ${!li.category ? "disabled" : ""}>
                            <option value="" ${!li.item ? "selected" : ""} disabled>Select</option>
                            ${items.map(i => `<option value="${escapeHtml(i)}" ${i === li.item ? "selected" : ""}>${escapeHtml(i)}</option>`).join("")}
                        </select>
                    </td>
                    <td>
                        <select data-field="brand" ${!li.item ? "disabled" : ""}>
                            <option value="" ${!li.brand ? "selected" : ""} disabled>Select</option>
                            ${brands.map(b => `<option value="${escapeHtml(b.brand)}" ${b.brand === li.brand ? "selected" : ""}>${escapeHtml(b.brand)}</option>`).join("")}
                        </select>
                    </td>
                    <td>
                        ${li.spec
                        ? `<a href="${escapeHtml(li.specLink || "#")}" target="_blank" rel="noopener" class="spec-link">${escapeHtml(li.spec)} · View Specs</a>`
                        : `<span class="calc-hint">Select brand</span>`
                    }
                    </td>
                    <td class="col-desc"><textarea data-field="description" rows="2" placeholder="Optional notes">${escapeHtml(li.description)}</textarea></td>
                    <td><input type="number" data-field="qty" value="${li.qty === 0 ? '' : li.qty}" step="any" min="0"></td>
                    <td>
                        <select data-field="unit">
                            ${(() => {
                                const opts = [...UNIT_OPTIONS];
                                if (li.unit && !opts.includes(li.unit)) opts.push(li.unit);
                                return opts.map(u => `<option value="${escapeHtml(u)}" ${u === li.unit ? "selected" : ""}>${escapeHtml(u)}</option>`).join("");
                            })()}
                        </select>
                    </td>
                    <td><input type="number" data-field="unitPrice" value="${li.unitPrice === 0 ? '' : li.unitPrice}" step="any" min="0"></td>
                    <td class="col-total row-total">${fmt2(total)}</td>
                    <td class="col-action">
                        <button type="button" class="remove-row-btn">×</button>
                    </td>
                `;
            }
            body.appendChild(tr);
        });

        recalcSummary();
    }

    function initLineItemsTable() {
        /* Remove-row clicks */
        document.getElementById("lineItemsBody")?.addEventListener("click", e => {
            const btn = e.target.closest(".remove-row-btn");
            if (!btn || btn.disabled) return;
            const tr = e.target.closest("tr");
            if (tr) removeLineItem(Number(tr.dataset.id));
        });

        /* Field changes via SELECT (change event) */
        document.getElementById("lineItemsBody")?.addEventListener("change", e => {
            const tr = e.target.closest("tr");
            if (!tr) return;
            const id = Number(tr.dataset.id);
            const li = state.lineItems.find(x => x.id === id);
            if (!li) return;
            const field = e.target.dataset.field;
            if (!field) return;

            const cat = li.isScreenRow ? "Screen → Module" : li.category;

            if (field === "category") {
                li.category = e.target.value; li.item = ""; li.brand = ""; li.spec = ""; li.specLink = "";
            } else if (field === "item") {
                li.item = e.target.value; li.brand = ""; li.spec = ""; li.specLink = "";
            } else if (field === "brand") {
                li.brand = e.target.value;
                const match = brandOptions(cat, li.item).find(b => b.brand === li.brand);
                li.spec = match ? match.spec : li.item;
                li.specLink = match ? match.link : "";
            } else if (field === "qty" || field === "unitPrice") {
                li[field] = num(e.target.value);
            } else {
                li[field] = e.target.value;
            }
            renderLineItems();
        });

        /* Real-time total update for number inputs (input event — fires on each keystroke) */
        document.getElementById("lineItemsBody")?.addEventListener("input", e => {
            const tr = e.target.closest("tr");
            if (!tr) return;
            const id = Number(tr.dataset.id);
            const li = state.lineItems.find(x => x.id === id);
            if (!li) return;
            const field = e.target.dataset.field;

            if (field === "qty" || field === "unitPrice") {
                /* Update state */
                li[field] = num(e.target.value);
                /* Update only the total cell — no full re-render to preserve focus */
                const totalCell = tr.querySelector(".row-total");
                if (totalCell) totalCell.textContent = fmt2(num(li.qty) * num(li.unitPrice));
                recalcSummary();
            } else if (e.target.tagName === "TEXTAREA" && field === "description") {
                li.description = e.target.value;
            }
        });

        /* Add line item button */
        document.getElementById("addLineItemBtn")?.addEventListener("click", () => addLineItem());
    }

    /* ============================================================
       15. SUMMARY CALCULATIONS
       ============================================================ */
    function recalcSummary() {
        const subtotal = state.lineItems.reduce((s, li) => s + num(li.qty) * num(li.unitPrice), 0);
        const gstPct = num(document.getElementById("gstPercent")?.value || 18);
        const gstAmt = subtotal * (gstPct / 100);
        const discount = num(document.getElementById("discountAmount")?.value || 0);
        const grand = subtotal + gstAmt - discount;

        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = fmt2(val); };
        set("summarySubtotal", subtotal);
        set("summaryGstAmount", gstAmt);
        set("summaryGrandTotal", grand);

        return { subtotal, gstPct, gstAmt, discount, grandTotal: grand };
    }

    function initSummaryInputs() {
        document.getElementById("gstPercent")?.addEventListener("input", recalcSummary);
        document.getElementById("discountAmount")?.addEventListener("input", recalcSummary);
    }

    /* ============================================================
       16. REMARKS (dynamic, max 10)
       ============================================================ */
    function renderRemarks() {
        const list = document.getElementById("remarksList");
        if (!list) return;
        list.innerHTML = "";
        state.remarks.forEach((val, idx) => {
            const row = document.createElement("div");
            row.className = "dynamic-row";
            row.dataset.index = idx;
            row.innerHTML = `
                <span class="row-index">${idx + 1}</span>
                <textarea rows="2" placeholder="Enter remark ${idx + 1}…">${escapeHtml(val)}</textarea>
                <button type="button" class="remove-row-btn" ${state.remarks.length <= 1 ? "disabled" : ""}>×</button>
            `;
            list.appendChild(row);
        });
        const addBtn = document.getElementById("addRemarkBtn");
        if (addBtn) addBtn.disabled = state.remarks.length >= 10;
    }

    function initRemarks() {
        renderRemarks();

        document.getElementById("addRemarkBtn")?.addEventListener("click", () => {
            if (state.remarks.length >= 10) { toast("Maximum 10 remarks allowed.", "error"); return; }
            state.remarks.push("");
            renderRemarks();
        });

        document.getElementById("remarksList")?.addEventListener("input", e => {
            if (e.target.tagName !== "TEXTAREA") return;
            const idx = Number(e.target.closest(".dynamic-row").dataset.index);
            state.remarks[idx] = e.target.value;
        });

        document.getElementById("remarksList")?.addEventListener("click", e => {
            const btn = e.target.closest(".remove-row-btn");
            if (!btn || btn.disabled) return;
            const idx = Number(e.target.closest(".dynamic-row").dataset.index);
            state.remarks.splice(idx, 1);
            renderRemarks();
        });
    }

    /* ============================================================
       17. TERMS & CONDITIONS
       ============================================================ */
    let termsState = TERMS.map(t => ({ ...t }));

    function renderTerms() {
        const list = document.getElementById("termsList");
        if (!list) return;
        list.innerHTML = "";
        termsState.forEach((t, idx) => {
            const row = document.createElement("div");
            row.className = "term-row" + (t.authority === "ADMIN" ? " locked" : "");
            row.dataset.index = idx;
            row.innerHTML = `
                <span class="term-index">${t.sno}</span>
                <textarea class="term-text" rows="1" ${t.authority === "ADMIN" ? "readonly" : ""}>${escapeHtml(t.text)}</textarea>
                <span class="tag ${t.authority === "ADMIN" ? "tag-admin" : "tag-user"}">${t.authority}</span>
                ${t.authority === "USER" ? `<button type="button" class="remove-row-btn remove-term-btn" style="margin-left: 8px;">×</button>` : ""}
            `;
            list.appendChild(row);
        });
    }

    function initTerms() {
        renderTerms();
        document.getElementById("termsList")?.addEventListener("input", e => {
            if (e.target.tagName !== "TEXTAREA" || e.target.readOnly) return;
            const idx = Number(e.target.closest(".term-row").dataset.index);
            termsState[idx].text = e.target.value;
        });

        document.getElementById("addTermBtn")?.addEventListener("click", () => {
            const nextSno = termsState.length + 1;
            termsState.push({
                sno: nextSno,
                text: "",
                authority: "USER"
            });
            renderTerms();
        });

        document.getElementById("termsList")?.addEventListener("click", e => {
            const btn = e.target.closest(".remove-term-btn");
            if (!btn) return;
            const idx = Number(e.target.closest(".term-row").dataset.index);
            termsState.splice(idx, 1);
            termsState.forEach((t, i) => {
                t.sno = i + 1;
            });
            renderTerms();
        });
    }

    /* ============================================================
       17B. SECTION 8 — ATTACHMENTS (Base64 file capture - Max 5 files)
       ============================================================ */
    function syncAttachmentUI() {
        const fileInput = document.getElementById("attachmentFile");
        const container = document.getElementById("attachmentsContainer");
        const wrapper = document.getElementById("attachmentInputWrapper");
        if (!container) return;

        // Initialize state.attachments if not present
        if (!state.attachments) {
            state.attachments = [];
            if (state.attachment && state.attachment.filename) {
                state.attachments.push(state.attachment);
            }
        }

        container.innerHTML = "";

        state.attachments.forEach((att, index) => {
            const kbSize = att.base64
                ? (att.base64.length * 0.75 / 1024).toFixed(1) + " KB"
                : (att.driveUrl ? "Google Drive" : "Synced");
            const row = document.createElement("div");
            row.className = "attachment-row";
            row.style.cssText = "display:flex; align-items:center; justify-content:space-between; background:var(--bg-card); border:1px solid var(--border-soft); padding:8px 12px; border-radius:var(--radius); margin-bottom:4px;";
            row.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="font-size:14px;">📎</span>
                    <span style="font-size:12px; font-weight:500; word-break:break-all; color:var(--text);">${escapeHtml(att.filename)}</span>
                    <span class="hint" style="font-size:10px; color:var(--text-dim);">(${kbSize})</span>
                </div>
                <button type="button" class="btn btn-danger btn-xs remove-attachment-btn" data-index="${index}" style="padding:2px 8px; font-size:11px;">× Remove</button>
            `;
            container.appendChild(row);
        });

        if (state.attachments.length >= 5) {
            if (wrapper) wrapper.style.display = "none";
        } else {
            if (wrapper) wrapper.style.display = "block";
            if (fileInput) fileInput.value = "";
        }
    }

    function initAttachment() {
        window.syncAttachmentUI = syncAttachmentUI;

        document.getElementById("slot-section8")?.addEventListener("change", e => {
            const fileInput = e.target.closest("#attachmentFile");
            if (!fileInput) return;

            if (!state.attachments) {
                state.attachments = [];
            }

            const files = Array.from(fileInput.files || []);
            if (files.length === 0) return;

            let addedCount = 0;
            let skippedSize = 0;
            let skippedLimit = false;

            const readPromises = files.map(file => {
                return new Promise((resolve) => {
                    if (state.attachments.length + addedCount >= 5) {
                        skippedLimit = true;
                        resolve();
                        return;
                    }

                    if (file.size > 4 * 1024 * 1024) {
                        skippedSize++;
                        resolve();
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = function (evt) {
                        const base64 = evt.target.result.split(",")[1];
                        state.attachments.push({
                            base64: base64,
                            filename: file.name,
                            mimeType: file.type
                        });
                        addedCount++;
                        resolve();
                    };
                    reader.readAsDataURL(file);
                });
            });

            Promise.all(readPromises).then(() => {
                // Update backward compatibility single attachment field
                state.attachment = state.attachments[0] || null;

                syncAttachmentUI();

                if (addedCount > 0) {
                    toast(`${addedCount} file(s) attached successfully!`, "success");
                }
                if (skippedSize > 0) {
                    toast(`${skippedSize} file(s) exceeded 4MB limit and were skipped.`, "error");
                }
                if (skippedLimit) {
                    toast("Maximum 5 attachments reached. Other files were skipped.", "warning");
                }
            });
        });

        document.getElementById("slot-section8")?.addEventListener("click", e => {
            const btn = e.target.closest(".remove-attachment-btn");
            if (!btn) return;

            const index = parseInt(btn.getAttribute("data-index"), 10);
            if (state.attachments && state.attachments[index]) {
                state.attachments.splice(index, 1);
                state.attachment = state.attachments[0] || null;
                syncAttachmentUI();
                toast("Attachment removed.", "info");
            }
        });
    }

    /* ============================================================
       18. FORM VALIDATION
       ============================================================ */
    function validateForm() {
        let valid = true;

        function fail(name, msg) { setFieldError(name, msg); valid = false; }
        function pass(name) { setFieldError(name, ""); }

        /* Section 1 */
        const rep = document.getElementById("salesRep");
        if (!rep || !rep.value) { fail("salesRep", "Select a sales representative."); } else pass("salesRep");

        /* Section 2 */
        const clientName = document.getElementById("clientName")?.value.trim() || "";
        if (clientName.length < 3) { fail("clientName", "Minimum 3 characters required."); } else pass("clientName");

        if (!document.getElementById("companyName")?.value.trim()) { fail("companyName", "Company name is required."); } else pass("companyName");

        const email = document.getElementById("clientEmail")?.value.trim() || "";
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { fail("clientEmail", "Enter a valid email address."); } else pass("clientEmail");

        const contact = document.getElementById("clientContact")?.value.trim() || "";
        if (!/^[0-9]{10}$/.test(contact)) { fail("clientContact", "Enter exactly 10 digits, numbers only."); } else pass("clientContact");

        const gst = document.getElementById("gstNumber")?.value.trim() || "";
        pass("gstNumber");

        if (!document.querySelector('input[name="orgType"]:checked')) { fail("orgType", "Select organization type."); } else pass("orgType");
        if (!document.getElementById("clientAddress")?.value.trim()) { fail("clientAddress", "Client address required."); } else pass("clientAddress");
        if (!document.getElementById("siteAddress")?.value.trim()) { fail("siteAddress", "Site address required."); } else pass("siteAddress");

        /* Section 3 */
        if (!document.querySelector('input[name="projectType"]:checked')) { fail("projectType", "Select project type."); } else pass("projectType");
        if (!document.querySelector('input[name="moduleSize"]:checked')) { fail("moduleSize", "Select module size."); } else pass("moduleSize");
        if (num(document.getElementById("screenWidth")?.value) <= 0) { fail("screenWidth", "Enter a valid screen width."); } else pass("screenWidth");
        if (num(document.getElementById("screenHeight")?.value) <= 0) { fail("screenHeight", "Enter a valid screen height."); } else pass("screenHeight");
        if (!document.querySelector('input[name="cabinetSolution"]:checked')) { fail("cabinetSolution", "Select cabinet solution."); } else pass("cabinetSolution");
        if (!document.querySelector('input[name="mountingType"]:checked')) { fail("mountingType", "Select mounting type."); } else pass("mountingType");
        if (!document.querySelector('input[name="amc"]:checked')) { fail("amc", "Select AMC option."); } else pass("amc");
        if (!document.querySelector('input[name="siteVisit"]:checked')) { fail("siteVisit", "Select site visit option."); } else pass("siteVisit");

        if (!valid) toast("Please fix the highlighted fields before continuing.", "error");
        return valid;
    }

    /* ============================================================
       19. DATA COLLECTION
       ============================================================ */
    function collectFormData() {
        const summary = recalcSummary();
        const get = id => document.getElementById(id)?.value || "";
        const radio = name => document.querySelector(`input[name="${name}"]:checked`)?.value || "";

        const hideFields = {};
        document.querySelectorAll(".hide-pdf-checkbox").forEach(cb => {
            const fieldId = cb.dataset.field;
            if (fieldId) hideFields[fieldId] = cb.checked;
        });

        return {
            _id: state._id,
            quotationNo: state.quotationNo,
            createdAt: state.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: state.status,
            hideGstInPdf: document.getElementById("hideGstInPdf")?.checked || false,
            hideDiscountInPdf: document.getElementById("hideDiscountInPdf")?.checked || false,
            hideFields,
            salesRep: {
                name: get("salesRep"),
                email: get("salesEmail"),
                contact: get("salesContact")
            },
            client: {
                name: get("clientName").toUpperCase(),
                company: get("companyName").toUpperCase(),
                email: get("clientEmail"),
                contact: get("clientContact"),
                gst: get("gstNumber").toUpperCase(),
                orgType: radio("orgType"),
                clientAddress: get("clientAddress"),
                siteAddress: get("siteAddress")
            },
            project: {
                projectType: radio("projectType"),
                moduleSize: radio("moduleSize"),
                screenWidth: get("screenWidth"),
                screenHeight: get("screenHeight"),
                numModulesW: get("numModulesW"),
                numModulesH: get("numModulesH"),
                totalCabinets: get("totalCabinets"),
                actualWidthMM: get("actualWidthMM"),
                actualHeightMM: get("actualHeightMM"),
                actualWidthFT: get("actualWidthFT"),
                actualHeightFT: get("actualHeightFT"),
                totalArea: get("totalArea"),
                heightFromGround: get("heightFromGround"),
                viewingDistance: get("viewingDistance"),
                powerPointDistance: get("powerPointDistance"),
                controlRoomDistance: get("controlRoomDistance"),
                cabinetSolution: radio("cabinetSolution"),
                mountingType: radio("mountingType"),
                amc: radio("amc"),
                siteVisit: radio("siteVisit"),
                momOfSiteVisit: get("momOfSiteVisit"),
                widthRounding: radio("widthRounding"),
                heightRounding: radio("heightRounding")
            },
            scope: { ...state.scopeValues },
            lineItems: state.lineItems,
            summary,
            remarks: state.remarks.filter(r => r.trim() !== ""),
            terms: termsState,
            attachment: state.attachment,
            attachments: state.attachments || (state.attachment ? [state.attachment] : []),
            masterNo: state.masterNo,
            revision: state.revision,
            parentRef: state.parentRef || null,
            prevRef: state.prevRef || null,
            revisionNotes: state.revisionNotes || sessionStorage.getItem("kan_edit_revision_notes") || ""
        };
    }

    /* ============================================================
       20. SAVE TO LOCALSTORAGE
       ============================================================ */
    const STORAGE_KEY = "kan_quotations";

    function getAllQuotations() {
        try {
            const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            let modified = false;
            list.forEach(q => {
                let saveNeeded = false;
                if (!q._id) {
                    q._id = generateStorageId();
                    saveNeeded = true;
                }
                if (q.quotationNo && (!q.masterNo || !q.revision)) {
                    const m = q.quotationNo.match(/^QT-(\d+)-L\d+$/);
                    if (m) {
                        q.masterNo = parseInt(m[1]);
                        q.revision = parseInt(m[2]);
                        saveNeeded = true;
                    }
                }
                if (saveNeeded) modified = true;
            });
            if (modified) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
            }
            return list;
        } catch { return []; }
    }

    function saveQuotationToStorage(data) {
        const all = getAllQuotations();
        const idx = all.findIndex(q => q._id === data._id);
        if (idx >= 0) {
            all[idx] = data;   // Update existing
        } else {
            all.push(data);    // Add new
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    }

    function generateStorageId() {
        return "qt-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
    }

    /**
     * Generate a REF number in format QT-NNNN-Lx
     * NNNN = sequential quote number starting at 1001 (stored in localStorage)
     * Lx   = revision level (L1 for new, L2, L3, ... for subsequent saves of same quote)
     */
    function generateQuotationNo() {
        return `DRAFT-${Math.floor(Math.random() * 1000000)}`;
    }

    function bumpRevision(currentNo) {
        if (!currentNo) return generateQuotationNo();
        if (currentNo.startsWith("DRAFT")) return currentNo;
        return currentNo;
    }

    async function fetchNextQuotationNo(masterNo = null) {
        if (typeof GOOGLE_SHEET_WEBAPP_URL === "undefined" || !GOOGLE_SHEET_WEBAPP_URL) return null;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const url = `${GOOGLE_SHEET_WEBAPP_URL}?action=getNextNumber${masterNo ? '&masterNo=' + masterNo : ''}`;
            const res = await fetch(url, { signal: controller.signal }).then(r => r.json());
            clearTimeout(timeoutId);

            if (res.status === "success") {
                return { nextNo: res.nextNo, masterNo: res.masterNo, revision: res.revision };
            }
        } catch(e) {
            console.warn("fetchNextQuotationNo error or timeout:", e);
        }
        return null;
    }

    /* ============================================================
       20B. GOOGLE SHEETS INTEGRATION
       ============================================================ */
    function prepareGoogleSheetRows(data) {
        const rows = [];
        const formattedDateTime = (iso) => {
            if (!iso) return "";
            const d = new Date(iso);
            const pad = n => String(n).padStart(2, '0');
            return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        };

        // Prepare remarks up to 10 columns
        const remarks = Array(10).fill("");
        if (data.remarks) {
            data.remarks.forEach((r, i) => {
                if (i < 10) remarks[i] = r;
            });
        }

        // Prepare terms string
        const termsStr = data.terms ? data.terms.map(t => `${t.sno}. ${t.text}`).join("\n") : "";

        // Combine multiple line items in cells using newline (\n) characters
        const snList = [];
        const catList = [];
        const itemList = [];
        const brandList = [];
        const specList = [];
        const descList = [];
        const qtyList = [];
        const unitList = [];
        const priceList = [];
        const totalList = [];

        data.lineItems.forEach((li, idx) => {
            snList.push(idx + 1);
            catList.push(li.category || "");
            itemList.push(li.item || li.category || "");
            brandList.push(li.brand || "—");
            specList.push(li.spec || "—");
            descList.push(li.description || "");
            qtyList.push(li.qty || 0);
            unitList.push(li.unit || "");
            priceList.push(li.unitPrice || 0);
            totalList.push((li.qty || 0) * (li.unitPrice || 0));
        });

        const row = [
            data.quotationNo || "",                         // REF (A)
            formattedDateTime(data.createdAt),               // TimeStamp (B)
            data.salesRep?.name || "",                      // Sales Person (C)
            data.salesRep?.email || "",                     // Sales Email (D)
            data.salesRep?.contact || "",                   // Sales Contact (E)
            data.client?.name || "",                        // Client Name (F)
            data.client?.company || "",                     // Company Name (G)
            data.client?.email || "",                       // Email (H)
            data.client?.contact || "",                     // Contact (I)
            data.client?.clientAddress || "",               // Client Address (J)
            data.client?.siteAddress || "",                 // Site Address (K)
            data.client?.gst || "",                         // GST NO (L)
            data.client?.orgType || "",                     // ORG TYPE (M)
            data.project?.projectType || "",                 // Project Type (N)
            data.project?.moduleSize || "",                  // Module Size (O)
            data.project?.screenWidth || "",                 // Screen Width (Ft) (P)
            data.project?.screenHeight || "",                // Screen Height (Ft) (Q)
            data.project?.totalCabinets || "",               // Total no. of Cabinets (R)
            data.project?.numModulesW || "",                 // No of Module in Width (S)
            data.project?.numModulesH || "",                 // No of Module in Height (T)
            data.project?.actualWidthMM || "",               // Actual Width (MM) (U)
            data.project?.actualHeightMM || "",              // Actual Height (MM) (V)
            data.project?.actualWidthFT || "",               // Actual Screen Width (FT) (W)
            data.project?.actualHeightFT || "",              // Actual Screen Height (Ft) (X)
            data.project?.totalArea || "",                   // Total Area (SQFT) (Y)
            data.project?.heightFromGround || "",            // Height From Ground (M) (Z)
            data.project?.viewingDistance || "",             // Viewing Distance (M) (AA)
            data.project?.powerPointDistance || "",          // Power Point Distance (M) (AB)
            data.project?.controlRoomDistance || "",         // Control Room Distance (M) (AC)
            data.project?.cabinetSolution || "",             // Cabinet Solution (AD)
            data.project?.mountingType || "",                // Mounting Type (AE)
            data.project?.amc || "",                         // AMC (AF)
            data.project?.siteVisit || "",                   // Site Visit (AG)
            data.project?.momOfSiteVisit || "",              // MOM of Site Visit (AH)
            data.scope?.transport || "",                     // Transport (AI)
            data.scope?.siteReadiness || "",                 // Site readyness & Civil Work (AJ)
            data.scope?.installation || "",                  // Installation (AK)
            data.scope?.fabrication || "",                   // Fabrication / Frame (AL)
            data.scope?.crane || "",                         // Crane (AM)
            data.scope?.scaffolding || "",                   // Scaffolding (AN)
            data.scope?.stabilizer || "",                    // Stablizer (AO)
            data.scope?.electrical || "",                    // Electrical Wiring & Earthing (AP)
            data.scope?.lanCable || "",                      // LAN Cable beyond 10 Mtr (AQ)
            snList.join("\n"),                               // S. N. (AR)
            catList.join("\n"),                              // Category (AS)
            itemList.join("\n"),                             // Item (AT)
            brandList.join("\n"),                            // Brand (AU)
            specList.join("\n"),                             // Specificiation (AV)
            descList.join("\n"),                             // Description (AW)
            qtyList.join("\n"),                              // Qty (AX)
            unitList.join("\n"),                             // Unit (AY)
            priceList.join("\n"),                            // Unit Price (AZ)
            totalList.join("\n"),                            // Total (BA)
            data.summary?.subtotal || 0,                     // Subtotal (BB)
            data.summary?.gstPct || 0,                       // GST % (BC)
            data.summary?.gstAmt || 0,                       // GST (BD)
            data.summary?.discount || 0,                     // Discount (BE)
            data.summary?.grandTotal || 0,                   // Grand Total (BF)
            termsStr,                                        // Terms & Condition (BG)
            remarks[0],                                      // Remarks 1 (BH)
            remarks[1],                                      // Remarks 2 (BI)
            remarks[2],                                      // Remarks 3 (BJ)
            remarks[3],                                      // Remarks 4 (BK)
            remarks[4],                                      // Remarks 5 (BL)
            remarks[5],                                      // Remarks 6 (BM)
            remarks[6],                                      // Remarks 7 (BN)
            remarks[7],                                      // Remarks 8 (BO)
            remarks[8],                                      // Remarks 9 (BP)
            remarks[9],                                      // Remarks 10 (BQ)
            "",                                              // Attachment Link (BR)
            "",                                              // PDF Link (BS)
            "",                                              // Drive PDF URL (BT)
            data.masterNo || "",                             // Master No (BU)
            data.revision || "",                             // Revision (BV)
            data.parentRef || "",                            // Parent Ref (BW)
            data.prevRef || "",                              // Prev Ref (BX)
            data.revisionNotes || "",                        // Revision Notes (BY)
            JSON.stringify(data.hideFields || {})            // Hide Fields (BZ)
        ];
        rows.push(row);
        return rows;
    }

    function renderQuotationHidden(q) {
        const doc = document.getElementById("pdfDocHidden");
        if (!doc) return;

        const formattedDateTime = (iso) => {
            if (!iso) return { date: "—", time: "—" };
            const d = new Date(iso);
            const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
            const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
            return { date, time };
        };

        const dt = formattedDateTime(q.createdAt);
        const validUntil = q.createdAt
            ? new Date(new Date(q.createdAt).getTime() + 15 * 86400000).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
            : "—";

        const repName = q.salesRep?.name || "";
        const emp = (typeof EMPLOYEES !== "undefined") ? EMPLOYEES.find(e => e.name === repName) : null;
        const designation = emp ? emp.role : "Business Development Executive";

        const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
        const fmtCurrency = (n) => "₹\u00A0" + (parseFloat(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const fmt2 = (n) => (parseFloat(n) || 0).toFixed(2);

        const scopeSpan = (val) => {
            if (!val) return "—";
            let cls = "scope-buyer";
            if (val === "KAN") cls = "scope-kan";
            else if (val === "NOT REQUIRED") cls = "scope-nr";
            return `<span class="${cls}">${esc(val)}</span>`;
        };

        const paginatePdf = (containerId) => {
            const docEl = document.getElementById(containerId);
            if (!docEl) return;

            const sections = Array.from(docEl.children);
            docEl.innerHTML = "";

            let currentPage = document.createElement("div");
            currentPage.className = "pdf-page";
            docEl.appendChild(currentPage);

            const pageHeightLimit = 1055;

            sections.forEach(section => {
                currentPage.appendChild(section);

                if (currentPage.scrollHeight > pageHeightLimit) {
                    const hasList = section.querySelector(".pdf-terms, .pdf-remarks, .pdf-attachments-list-container");
                    const hasTable = section.querySelector(".pdf-breakdown-table");
                    const hasGrid = section.querySelector(".pdf-grid-2, .pdf-grid-3");

                    if (hasList) {
                        currentPage = splitListSection(section, currentPage, docEl, pageHeightLimit);
                    } else if (hasTable) {
                        currentPage = splitTableSection(section, currentPage, docEl, pageHeightLimit);
                    } else if (hasGrid) {
                        currentPage = splitGridSection(section, currentPage, docEl, pageHeightLimit);
                    } else {
                        currentPage.removeChild(section);

                        currentPage = document.createElement("div");
                        currentPage.className = "pdf-page";
                        docEl.appendChild(currentPage);

                        currentPage.appendChild(section);
                    }
                }
            });

            // Helper to split grid sections row-by-row
            function splitGridSection(section, activePage, parentEl, limit) {
                const headerEl = section.querySelector(".pdf-section-header");
                const headerText = headerEl ? headerEl.textContent : "";
                const gridEl = section.querySelector(".pdf-grid-2, .pdf-grid-3");
                if (!gridEl) return activePage;

                const cols = gridEl.classList.contains("pdf-grid-2") ? 2 : 3;
                const cells = Array.from(gridEl.querySelectorAll(".pdf-cell"));
                if (cells.length === 0) return activePage;

                if (section.parentElement) section.parentElement.removeChild(section);

                let currentContainer = document.createElement("div");
                currentContainer.className = "pdf-section-container";
                if (headerEl) currentContainer.appendChild(headerEl.cloneNode(true));

                let currentGridEl = gridEl.cloneNode(false);
                currentContainer.appendChild(currentGridEl);
                activePage.appendChild(currentContainer);

                const rows = [];
                for (let i = 0; i < cells.length; i += cols) {
                    rows.push(cells.slice(i, i + cols));
                }

                for (let ri = 0; ri < rows.length; ri++) {
                    const rowCells = rows[ri];
                    rowCells.forEach(cell => currentGridEl.appendChild(cell.cloneNode(true)));

                    if (activePage.scrollHeight > limit) {
                        rowCells.forEach(() => currentGridEl.removeChild(currentGridEl.lastChild));

                        if (currentGridEl.children.length === 0) {
                            activePage.removeChild(currentContainer);
                        }

                        activePage = document.createElement("div");
                        activePage.className = "pdf-page";
                        parentEl.appendChild(activePage);

                        currentContainer = document.createElement("div");
                        currentContainer.className = "pdf-section-container";

                        if (headerEl) {
                            const hClone = headerEl.cloneNode(true);
                            hClone.innerHTML = esc(headerText) + " <span style='font-size:8px;font-weight:normal;opacity:0.7;'>(Contd.)</span>";
                            currentContainer.appendChild(hClone);
                        }

                        currentGridEl = gridEl.cloneNode(false);
                        currentContainer.appendChild(currentGridEl);
                        activePage.appendChild(currentContainer);

                        rowCells.forEach(cell => currentGridEl.appendChild(cell.cloneNode(true)));
                    }
                }

                return activePage;
            }

            // Helper to split terms and remarks lists
            function splitListSection(section, activePage, parentEl, limit) {
                const headerEl = section.querySelector(".pdf-section-header");
                const headerText = headerEl ? headerEl.textContent : "";
                const listContainer = section.querySelector(".pdf-terms, .pdf-remarks, .pdf-attachments-list-container");
                if (!listContainer) return activePage;

                const listEl = listContainer.querySelector("ol, ul, .pdf-attachments-list");
                if (!listEl) return activePage;

                const listItems = Array.from(listEl.children);
                if (listItems.length === 0) return activePage;

                if (section.parentElement) {
                    section.parentElement.removeChild(section);
                }

                let currentContainer = document.createElement("div");
                currentContainer.className = "pdf-section-container";

                if (headerEl) {
                    currentContainer.appendChild(headerEl.cloneNode(true));
                }

                const currentListContainer = listContainer.cloneNode(true);
                let currentListEl = currentListContainer.querySelector("ol, ul, .pdf-attachments-list");
                currentListEl.innerHTML = "";
                currentContainer.appendChild(currentListContainer);

                activePage.appendChild(currentContainer);

                let currentItemIndex = 1;

                for (let i = 0; i < listItems.length; i++) {
                    const li = listItems[i];
                    currentListEl.appendChild(li.cloneNode(true));

                    if (activePage.scrollHeight > limit) {
                        currentListEl.removeChild(currentListEl.lastChild);

                        if (currentListEl.children.length === 0) {
                            activePage.removeChild(currentContainer);
                        }

                        activePage = document.createElement("div");
                        activePage.className = "pdf-page";
                        parentEl.appendChild(activePage);

                        currentContainer = document.createElement("div");
                        currentContainer.className = "pdf-section-container";

                        if (headerEl) {
                            const headerClone = headerEl.cloneNode(true);
                            headerClone.innerHTML = esc(headerText) + " <span style='font-size:8px;font-weight:normal;opacity:0.8;'> (Contd.)</span>";
                            currentContainer.appendChild(headerClone);
                        }

                        const nextListContainer = listContainer.cloneNode(true);
                        const nextListEl = nextListContainer.querySelector("ol, ul, .pdf-attachments-list");
                        nextListEl.innerHTML = "";
                        if (nextListEl.tagName === "OL") nextListEl.setAttribute("start", currentItemIndex);

                        currentContainer.appendChild(nextListContainer);
                        activePage.appendChild(currentContainer);

                        nextListEl.appendChild(li.cloneNode(true));
                        currentListEl = nextListEl;
                    }

                    currentItemIndex++;
                }

                return activePage;
            }

            // Helper to split table breakdown rows
            function splitTableSection(section, activePage, parentEl, limit) {
                const headerEl = section.querySelector(".pdf-section-header");
                const tableEl = section.querySelector(".pdf-breakdown-table");
                if (!tableEl) return activePage;

                const rows = Array.from(tableEl.querySelectorAll("tbody tr"));
                if (rows.length === 0) return activePage;

                const totalsEl = section.querySelector(".pdf-totals");

                if (section.parentElement) {
                    section.parentElement.removeChild(section);
                }

                let currentContainer = document.createElement("div");
                currentContainer.className = "pdf-section-container";

                if (headerEl) {
                    currentContainer.appendChild(headerEl.cloneNode(true));
                }

                const currentTableEl = tableEl.cloneNode(true);
                let currentTbody = currentTableEl.querySelector("tbody");
                currentTbody.innerHTML = "";
                currentContainer.appendChild(currentTableEl);

                activePage.appendChild(currentContainer);

                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    currentTbody.appendChild(row.cloneNode(true));

                    if (activePage.scrollHeight > limit) {
                        currentTbody.removeChild(currentTbody.lastChild);

                        if (currentTbody.children.length === 0) {
                            activePage.removeChild(currentContainer);
                        }

                        activePage = document.createElement("div");
                        activePage.className = "pdf-page";
                        parentEl.appendChild(activePage);

                        currentContainer = document.createElement("div");
                        currentContainer.className = "pdf-section-container";

                        if (headerEl) {
                            const headerClone = headerEl.cloneNode(true);
                            headerClone.innerHTML = esc(headerEl.textContent) + " <span style='font-size:8px;font-weight:normal;opacity:0.8;'> (Contd.)</span>";
                            currentContainer.appendChild(headerClone);
                        }

                        const nextTableEl = tableEl.cloneNode(true);
                        const nextTbody = nextTableEl.querySelector("tbody");
                        nextTbody.innerHTML = "";
                        currentContainer.appendChild(nextTableEl);
                        activePage.appendChild(currentContainer);

                        nextTbody.appendChild(row.cloneNode(true));
                        currentTbody = nextTbody;
                    }
                }

                if (totalsEl) {
                    currentContainer.appendChild(totalsEl.cloneNode(true));
                    if (activePage.scrollHeight > limit) {
                        currentContainer.removeChild(currentContainer.lastChild);

                        activePage = document.createElement("div");
                        activePage.className = "pdf-page";
                        parentEl.appendChild(activePage);

                        currentContainer = document.createElement("div");
                        currentContainer.className = "pdf-section-container";

                        if (headerEl) {
                            const headerClone = headerEl.cloneNode(true);
                            headerClone.innerHTML = esc(headerEl.textContent) + " <span style='font-size:8px;font-weight:normal;opacity:0.8;'> (Totals)</span>";
                            currentContainer.appendChild(headerClone);
                        }

                        currentContainer.appendChild(totalsEl.cloneNode(true));
                        activePage.appendChild(currentContainer);
                    }
                }

                return activePage;
            }
        };

        const lineRows = (q.lineItems || []).map((li, i) => {
            const isScreen = /screen/i.test(li.category || "");
            // Normalize arrow-style categories for PRODUCT_SPECS lookup
            const normCat = (() => {
                const c = String(li.category || "").trim();
                if (/screen\s*[→\->]\s*module/i.test(c)) return "SCREEN";
                if (/^screen$/i.test(c)) return "SCREEN";
                if (/^cabinet$/i.test(c)) return "CABINET";
                return c.toUpperCase();
            })();
            const specKey = (normCat + "|||" + (li.item || li.category || "").toUpperCase()).trim();
            const specEntry = (typeof PRODUCT_SPECS !== "undefined") ? PRODUCT_SPECS[specKey] : null;
            const linkUrl = li.specLink || `../pages/specs.html?category=${encodeURIComponent(li.category)}&item=${encodeURIComponent(li.item || li.category)}`;

            let specCellHtml = "—";
            let descCellHtml = "—";

            if (li.specLink || isScreen || (li.spec && li.spec !== "—" && String(li.spec).trim() !== "")) {
                let sLink = li.specLink || linkUrl;
                if (sLink.startsWith("specs.html")) {
                    sLink = "../pages/" + sLink;
                }
                specCellHtml = `<a href="${esc(sLink)}" target="_blank" class="pdf-spec-link">View</a>`;
            }

            if (li.description && li.description !== "—" && String(li.description).trim() !== "") {
                let dLink = linkUrl + "&desc=" + encodeURIComponent(li.description);
                if (dLink.startsWith("specs.html")) {
                    dLink = "../pages/" + dLink;
                }
                descCellHtml = `<a href="${esc(dLink)}" target="_blank" class="pdf-spec-link">View</a>`;
            }

            return `
            <tr>
                <td class="pdf-sno">${i + 1}</td>
                <td>${esc(li.category || "—")}</td>
                <td>${esc(li.item || li.category || "—")}</td>
                <td>${esc(li.brand || "—")}</td>
                <td style="text-align: center;">${specCellHtml}</td>
                <td style="text-align: center;">${descCellHtml}</td>
                <td class="pdf-num">${fmt2(li.qty)}</td>
                <td>${esc(li.unit || "Nos")}</td>
                <td class="pdf-num">${fmtCurrency(li.unitPrice)}</td>
                <td class="pdf-num">${fmtCurrency((parseFloat(li.qty) || 0) * (parseFloat(li.unitPrice) || 0))}</td>
            </tr>
            `;
        }).join("");

        const filledRemarks = (q.remarks || []).filter(r => r && r.trim() !== "");
        const remarkHtml = filledRemarks.length > 0
            ? `
            <div class="pdf-section-container">
                <div class="pdf-section-header">7. Remarks</div>
                <div class="pdf-remarks">
                    <ol style="margin: 0; padding-left: 18px;">
                        ${filledRemarks.map(r => `<li>${esc(r)}</li>`).join("")}
                    </ol>
                </div>
            </div>
            `
            : "";

        const termItems = (q.terms || [])
            .map((t, i) => `<li>${esc(t.text)}</li>`)
            .join("");

        const attachmentsList = q.attachments || (q.attachment && q.attachment.filename ? [q.attachment] : []);

        const proj = q.project || {};
        const s = q.summary || {};

        doc.innerHTML = `
        <!-- ======= COMPANY DETAILS & BANK DETAILS HEADER ======= -->
        <div class="pdf-section-container" style="border:none;">
            <div class="pdf-company-header" style="border: 1px solid #582f4c; border-radius: 4px;">
                <div class="pdf-header-left-col">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
                        <img src="${typeof KAN_LOGO_BASE64 !== 'undefined' ? KAN_LOGO_BASE64 : '../assets/images/logo.jpg'}" alt="KAN Universal Logo" class="pdf-logo-img">
                        <div>
                            <h1 style="font-family:'Space Grotesk',sans-serif;font-size:22px;font-weight:700;color:#582f4c;margin:0;line-height:1.2;white-space:nowrap;">KAN UNIVERSAL PVT LTD</h1>
                            <p style="font-size:13px;font-weight:600;color:#666;margin:4px 0 0;">Professional LED Display Solutions</p>
                        </div>
                    </div>
                    <div style="font-size:9.5px;color:#444;line-height:1.4;">
                        367, 1st Floor, Kothi Wala Bagh, Bharat Nagar, Ashok Vihar Phase 4, New Delhi – 110052<br>
                        <strong>GST No. :</strong> 07AAECK5460B1ZU<br>
                        <strong>Email:</strong> sales@kanuniversal.com<br>
                        <strong>Website:</strong> <a href="https://www.kanuniversal.com" target="_blank" style="color:#2980b9; text-decoration:underline;">www.kanuniversal.com</a>
                    </div>
                </div>
                <div class="pdf-header-right-col">
                    <div class="pdf-ref-box">
                        <div style="font-size:11px;font-weight:700;color:#582f4c;">REF ID: <span style="font-family:'JetBrains Mono',monospace;color:#c0392b;">${esc(q.quotationNo || "—")}</span></div>
                        <div style="font-size:9.5px;color:#555;margin-top:2px;">Date: <strong>${dt.date}</strong> &nbsp;|&nbsp; Time: <strong>${dt.time}</strong></div>
                        <div style="font-size:9px;color:#666;margin-top:2px;">Valid until: <strong>${validUntil}</strong></div>
                    </div>
                    <div class="pdf-bank-box">
                        <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#582f4c;margin-bottom:3px;border-bottom:1px solid #ddd;padding-bottom:2px;">Bank Details</div>
                        <div style="font-size:9px;color:#444;line-height:1.35;">
                            <strong>Bank Name:</strong> ICICI Bank<br>
                            <strong>Branch:</strong> Chandani Chowk<br>
                            <strong>Account No.:</strong> 629205500585<br>
                            <strong>IFSC Code:</strong> ICIC0006292<br>
                            <strong>Address:</strong> 1820, Near Sis Ganj Gurudwara, Chandani Chowk, Delhi, 110006
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ======= SECTION 1: SALES REPRESENTATIVE ======= -->
        <div class="pdf-section-container">
            <div class="pdf-section-header">Sale Person</div>
            <div class="pdf-grid-2">
                <div class="pdf-cell">
                    <div class="pdf-cell-label">Sale’s person Name</div>
                    <div class="pdf-cell-value">${esc(q.salesRep?.name || "—")}</div>
                </div>
                <div class="pdf-cell">
                    <div class="pdf-cell-label">Contact No.</div>
                    <div class="pdf-cell-value">${esc(q.salesRep?.contact || "—")}</div>
                </div>
                <div class="pdf-cell">
                    <div class="pdf-cell-label">Email</div>
                    <div class="pdf-cell-value">${esc(q.salesRep?.email || "—")}</div>
                </div>
                <div class="pdf-cell">
                    <div class="pdf-cell-label">Designation</div>
                    <div class="pdf-cell-value">${esc(designation)}</div>
                </div>
            </div>
        </div>

        <!-- ======= SECTION 2: CLIENT INFORMATION ======= -->
        <div class="pdf-section-container">
            <div class="pdf-section-header">Client Information</div>
            <div class="pdf-grid-2">
                ${q.hideFields?.clientName ? "" : `
                <div class="pdf-cell">
                    <div class="pdf-cell-label">Client Name</div>
                    <div class="pdf-cell-value">${esc(q.client?.name || "—")}</div>
                </div>
                `}
                ${q.hideFields?.clientAddress ? "" : `
                <div class="pdf-cell">
                    <div class="pdf-cell-label">Client Address</div>
                    <div class="pdf-cell-value" style="white-space:pre-line;">${esc(q.client?.clientAddress || "—")}</div>
                </div>
                `}
                ${q.hideFields?.companyName ? "" : `
                <div class="pdf-cell">
                    <div class="pdf-cell-label">Company</div>
                    <div class="pdf-cell-value">${esc(q.client?.company || "—")}</div>
                </div>
                `}
                ${q.hideFields?.siteAddress ? "" : `
                <div class="pdf-cell">
                    <div class="pdf-cell-label">Site address</div>
                    <div class="pdf-cell-value" style="white-space:pre-line;">${esc(q.client?.siteAddress || "—")}</div>
                </div>
                `}
                ${q.hideFields?.clientEmail ? "" : `
                <div class="pdf-cell">
                    <div class="pdf-cell-label">Email</div>
                    <div class="pdf-cell-value">${esc(q.client?.email || "—")}</div>
                </div>
                `}
                ${q.hideFields?.gstNumber ? "" : `
                <div class="pdf-cell">
                    <div class="pdf-cell-label">GST No.</div>
                    <div class="pdf-cell-value">${esc(q.client?.gst || "—")}</div>
                </div>
                `}
                ${q.hideFields?.clientContact ? "" : `
                <div class="pdf-cell">
                    <div class="pdf-cell-label">Contact</div>
                    <div class="pdf-cell-value">${esc(q.client?.contact || "—")}</div>
                </div>
                `}
                ${q.hideFields?.orgType ? "" : `
                <div class="pdf-cell">
                    <div class="pdf-cell-label">Org Type</div>
                    <div class="pdf-cell-value">${esc(q.client?.orgType || "—")}</div>
                </div>
                `}
            </div>
        </div>

        <!-- ======= SECTION 3: PROJECT DETAILS ======= -->
        <div class="pdf-section-container">
            <div class="pdf-section-header">Project Details</div>
            <div class="pdf-grid-3">
                ${q.hideFields?.projectType ? "" : `
                <div class="pdf-cell"><div class="pdf-cell-label">Project Type</div><div class="pdf-cell-value">${esc(proj.projectType || "—")}</div></div>
                `}
                ${q.hideFields?.actualWidthFT ? "" : `
                <div class="pdf-cell"><div class="pdf-cell-label">Actual Screen Width (FT)</div><div class="pdf-cell-value">${esc(proj.actualWidthFT || "—")} FT</div></div>
                `}
                ${q.hideFields?.viewingDistance ? "" : `
                <div class="pdf-cell"><div class="pdf-cell-label">Viewing Distance (Ft)</div><div class="pdf-cell-value">${esc(proj.viewingDistance ? proj.viewingDistance + " Ft" : "0")}</div></div>
                `}
                ${q.hideFields?.moduleSize ? "" : `
                <div class="pdf-cell"><div class="pdf-cell-label">Module Size</div><div class="pdf-cell-value">${esc(proj.moduleSize || "—")}</div></div>
                `}
                ${q.hideFields?.actualHeightFT ? "" : `
                <div class="pdf-cell"><div class="pdf-cell-label">Actual Screen Height (FT)</div><div class="pdf-cell-value">${esc(proj.actualHeightFT || "—")} FT</div></div>
                `}
                ${q.hideFields?.heightFromGround ? "" : `
                <div class="pdf-cell"><div class="pdf-cell-label">Height From Ground (Ft)</div><div class="pdf-cell-value">${esc(proj.heightFromGround ? proj.heightFromGround + " Ft" : "0")}</div></div>
                `}
                ${q.hideFields?.screenWidth ? "" : `
                <div class="pdf-cell"><div class="pdf-cell-label">Screen Width (Ft)</div><div class="pdf-cell-value">${esc(proj.screenWidth || "0")} FT</div></div>
                `}
                ${q.hideFields?.totalArea ? "" : `
                <div class="pdf-cell"><div class="pdf-cell-label">Total Area (SQFT)</div><div class="pdf-cell-value">${esc(proj.totalArea || "0")} SQFT</div></div>
                `}
                ${q.hideFields?.controlRoomDistance ? "" : `
                <div class="pdf-cell"><div class="pdf-cell-label">Control Room Distance (Ft)</div><div class="pdf-cell-value">${esc(proj.controlRoomDistance ? proj.controlRoomDistance + " Ft" : "0")}</div></div>
                `}
                ${q.hideFields?.screenHeight ? "" : `
                <div class="pdf-cell"><div class="pdf-cell-label">Screen Height (Ft)</div><div class="pdf-cell-value">${esc(proj.screenHeight || "0")} FT</div></div>
                `}
                ${q.hideFields?.cabinetSolution ? "" : `
                <div class="pdf-cell"><div class="pdf-cell-label">Cabinet Solution</div><div class="pdf-cell-value">${esc(proj.cabinetSolution || "—")}</div></div>
                `}
                ${q.hideFields?.amc ? "" : `
                <div class="pdf-cell"><div class="pdf-cell-label">AMC</div><div class="pdf-cell-value">${esc(proj.amc || "—")}</div></div>
                `}
                ${q.hideFields?.actualWidthMM ? "" : `
                <div class="pdf-cell"><div class="pdf-cell-label">Actual Width (MM)</div><div class="pdf-cell-value">${esc(proj.actualWidthMM || "—")} (${esc(String(proj.widthRounding || "DOWN").toUpperCase())})</div></div>
                `}
                ${q.hideFields?.mountingType ? "" : `
                <div class="pdf-cell"><div class="pdf-cell-label">Mounting Type</div><div class="pdf-cell-value">${esc(proj.mountingType || "—")}</div></div>
                `}
                ${q.hideFields?.siteVisit ? "" : `
                <div class="pdf-cell"><div class="pdf-cell-label">Site Visit</div><div class="pdf-cell-value">${esc(proj.siteVisit || "—")}</div></div>
                `}
                ${q.hideFields?.actualHeightMM ? "" : `
                <div class="pdf-cell"><div class="pdf-cell-label">Actual Height (MM)</div><div class="pdf-cell-value">${esc(proj.actualHeightMM || "—")} (${esc(String(proj.heightRounding || "DOWN").toUpperCase())})</div></div>
                `}
                ${q.hideFields?.powerPointDistance ? "" : `
                <div class="pdf-cell"><div class="pdf-cell-label">Power Point Distance (Ft)</div><div class="pdf-cell-value">${esc(proj.powerPointDistance ? proj.powerPointDistance + " Ft" : "0")}</div></div>
                `}
                ${q.hideFields?.momOfSiteVisit ? "" : `
                <div class="pdf-cell"><div class="pdf-cell-label">MOM of Site Visit</div><div class="pdf-cell-value" style="white-space:pre-line;">${esc(proj.momOfSiteVisit || "—")}</div></div>
                `}
                ${q.hideFields?.numModulesW ? "" : `
                <div class="pdf-cell"><div class="pdf-cell-label">No of Module/Cabinet in Width</div><div class="pdf-cell-value">${esc(proj.numModulesW || "—")}</div></div>
                `}
                ${q.hideFields?.numModulesH ? "" : `
                <div class="pdf-cell"><div class="pdf-cell-label">No of Module/Cabinet in Height</div><div class="pdf-cell-value">${esc(proj.numModulesH || "—")}</div></div>
                `}
                ${q.hideFields?.totalCabinets ? "" : `
                <div class="pdf-cell"><div class="pdf-cell-label">Total no. of Module/Cabinet</div><div class="pdf-cell-value">${esc(proj.totalCabinets || "—")}</div></div>
                `}
            </div>
        </div>

        <!-- ======= SECTION 4: SCOPE OF WORK ======= -->
        <div class="pdf-section-container">
            <div class="pdf-section-header">Scope of Work</div>
            <div class="pdf-grid-3">
                ${q.hideFields?.scope_transport ? "" : `
                <div class="pdf-cell"><div class="pdf-cell-label">Transportation</div><div class="pdf-cell-value">${scopeSpan(q.scope?.transport)}</div></div>
                `}
                ${q.hideFields?.scope_fabrication ? "" : `
                <div class="pdf-cell"><div class="pdf-cell-label">Fabrication / Structure</div><div class="pdf-cell-value">${scopeSpan(q.scope?.fabrication)}</div></div>
                `}
                ${q.hideFields?.scope_stabilizer ? "" : `
                <div class="pdf-cell"><div class="pdf-cell-label">Stabilizer</div><div class="pdf-cell-value">${scopeSpan(q.scope?.stabilizer)}</div></div>
                `}
                ${q.hideFields?.scope_siteReadiness ? "" : `
                <div class="pdf-cell"><div class="pdf-cell-label">Civil work & Site Readiness</div><div class="pdf-cell-value">${scopeSpan(q.scope?.siteReadiness)}</div></div>
                `}
                ${q.hideFields?.scope_crane ? "" : `
                <div class="pdf-cell"><div class="pdf-cell-label">Crane / Hydra</div><div class="pdf-cell-value">${scopeSpan(q.scope?.crane)}</div></div>
                `}
                ${q.hideFields?.scope_electrical ? "" : `
                <div class="pdf-cell"><div class="pdf-cell-label">Electrical Wiring & Earthing</div><div class="pdf-cell-value">${scopeSpan(q.scope?.electrical)}</div></div>
                `}
                ${q.hideFields?.scope_installation ? "" : `
                <div class="pdf-cell"><div class="pdf-cell-label">Installation</div><div class="pdf-cell-value">${scopeSpan(q.scope?.installation)}</div></div>
                `}
                ${q.hideFields?.scope_scaffolding ? "" : `
                <div class="pdf-cell"><div class="pdf-cell-label">Scaffolding</div><div class="pdf-cell-value">${scopeSpan(q.scope?.scaffolding)}</div></div>
                `}
                ${q.hideFields?.scope_lanCable ? "" : `
                <div class="pdf-cell"><div class="pdf-cell-label">LAN Cabling</div><div class="pdf-cell-value">${scopeSpan(q.scope?.lanCable)}</div></div>
                `}
            </div>
        </div>

        <!-- ======= SECTION 5: QUOTATION BREAKDOWN ======= -->
        <div class="pdf-section-container">
            <div class="pdf-section-header">Quotation Breakdown</div>
            <table class="pdf-breakdown-table">
                <thead>
                    <tr>
                        <th style="width: 30px; text-align: center;">S. N.</th>
                        <th style="width: 70px;">Category</th>
                        <th style="width: 85px;">Item</th>
                        <th style="width: 45px;">Brand</th>
                        <th style="width: 50px; text-align: center;">Spec</th>
                        <th style="width: 80px; text-align: center;">Description</th>
                        <th style="width: 35px; text-align: right;">Qty</th>
                        <th style="width: 35px; text-align: center;">Unit</th>
                        <th style="width: 85px; text-align: right;">Unit Price</th>
                        <th style="width: 95px; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${lineRows || "<tr><td colspan='10' style='text-align:center;color:#aaa;'>No line items</td></tr>"}
                </tbody>
            </table>

            <!-- ======= TOTALS ======= -->
            <div class="pdf-totals">
                <div class="pdf-totals-box">
                    <div class="pdf-total-row"><span class="label">Subtotal :-</span><span class="value">${fmtCurrency(s.subtotal)}</span></div>
                    ${q.hideGstInPdf ? "" : `<div class="pdf-total-row"><span class="label">GST :- (${esc(String(s.gstPct || 18))}%)</span><span class="value">${fmtCurrency(s.gstAmt)}</span></div>`}
                    ${q.hideDiscountInPdf ? "" : `<div class="pdf-total-row"><span class="label">Discount :-</span><span class="value" style="color:#c00;">− ${fmtCurrency(s.discount)}</span></div>`}
                    <div class="pdf-total-row pdf-grand-total"><span class="label">Grand Total :-</span><span class="value">${fmtCurrency(s.grandTotal)}</span></div>
                </div>
            </div>
        </div>

        <!-- ======= SECTION 6: TERMS & CONDITIONS ======= -->
        <div class="pdf-section-container">
            <div class="pdf-section-header">6. Terms &amp; Conditions</div>
            <div class="pdf-terms">
                <ol style="margin: 0; padding-left: 16px;">
                    ${termItems || "<li>No terms specified</li>"}
                </ol>
            </div>
        </div>

        <!-- ======= SECTION 7: REMARKS ======= -->
        ${remarkHtml}

        <!-- ======= SECTION 8: ATTACHMENT ======= -->
        ${attachmentsList.length > 0 ? `
        <div class="pdf-section-container pdf-attachments-list-container">
            <div class="pdf-section-header">Quotation Attachment</div>
            <div style="display: flex; flex-direction: column;" class="pdf-attachments-list">
                ${attachmentsList.map((att, idx) => {
            const bg = idx % 2 === 0 ? '#fff' : '#f8fafc';
            const borderTop = idx > 0 ? '1px solid #e2e8f0' : 'none';
            return `
                    <div class="pdf-attachment-item" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; border:none; border-top:${borderTop}; padding:10px 12px; background:${bg};">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="font-size:18px;">📎</span>
                            <div>
                                <div style="font-size:10.5px; font-weight:700; color:#2c3e50; font-family:'Space Grotesk',sans-serif;">${esc(att.filename)}</div>
                                <div style="font-size:8.5px; color:#7f8c8d;">Supporting Document #${idx + 1}</div>
                            </div>
                        </div>
                        ${(() => {
                            const dlUrl = att.driveUrl ? getDirectDownloadUrl(att.driveUrl) : null;
                            if (dlUrl) {
                                return `<a href="${esc(dlUrl)}" target="_blank" class="pdf-btn" style="background:#582f4c; color:#fff; text-decoration:none; font-size:9.5px; padding:5px 10px; border-radius:4px; font-weight:600; display:inline-block;">📥 Download Attachment</a>`;
                            } else {
                                return `<span class="pdf-btn" style="background:#8c7b83; color:#fff; font-size:9.5px; padding:5px 10px; border-radius:4px; font-weight:600; display:inline-block; opacity:0.8;">📎 Attached</span>`;
                            }
                        })()}
                    </div>
                    `;
        }).join("")}
            </div>
        </div>
        ` : ""}


        <!-- ======= SIGNATURE & CLOSING FOOTER ======= -->
        <div style="text-align:center;padding:16px 20px;font-size:10px;color:#555;background:#fcfbfa;border:1px solid #582f4c;border-radius:4px;font-family:'Space Grotesk',sans-serif;margin-top:10px;box-sizing:border-box;">
            <div style="font-weight:700;margin-bottom:4px;color:#582f4c;">Thank you for choosing us—we appreciate the opportunity to serve you.</div>
            <div style="font-size:9px;color:#666;">This quotation is valid for 15 days from the date of issue. &nbsp;|&nbsp; KAN UNIVERSAL PVT LTD – Professional LED Display Solutions</div>
        </div>
        `;

        paginatePdf("pdfDocHidden");
    }

    async function generatePdfBase64(data) {
        const element = document.getElementById("pdfDocHidden");
        if (element) {
            element.style.display = "block";
        }
        renderQuotationHidden(data);
        if (!element) return null;

        try {
            const pages = element.querySelectorAll(".pdf-page");
            if (pages.length === 0) {
                element.style.display = "none";
                return null;
            }

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF("portrait", "mm", "a4");

            for (let i = 0; i < pages.length; i++) {
                if (i > 0) {
                    pdf.addPage();
                }
                const pageElement = pages[i];
                const canvas = await html2canvas(pageElement, {
                    scale: 1.2,         // 1.2x scale reduces latency significantly & prevents out-of-memory
                    useCORS: true,
                    letterRendering: true,
                    width: 724,
                    height: 1055
                });
                const sliceImgData = canvas.toDataURL("image/jpeg", 0.82);

                pdf.addImage(sliceImgData, "JPEG", 10, 10, 190, 277);
            }

            // Overlay clickable hyperlinks onto the rendered PDF document
            pages.forEach((page, pageIndex) => {
                const links = page.querySelectorAll("a");
                const pageRect = page.getBoundingClientRect();
                const pxToMm = 190 / 724;

                links.forEach(link => {
                    const href = link.getAttribute("href");
                    if (!href || href === "#" || href.startsWith("javascript:")) return;

                    let absoluteUrl = href;
                    if (href.startsWith("data:")) {
                        if (data && data.attachment && data.attachment.driveUrl) {
                            absoluteUrl = getDirectDownloadUrl(data.attachment.driveUrl);
                        } else {
                            return;
                        }
                    } else if (!href.startsWith("http://") && !href.startsWith("https://") && !href.startsWith("mailto:")) {
                        const loc = window.location;
                        absoluteUrl = loc.protocol + "//" + loc.host + "/" + href;
                    }

                    const linkRect = link.getBoundingClientRect();
                    const relativeX = linkRect.left - pageRect.left;
                    const relativeY = linkRect.top - pageRect.top;
                    const relativeW = linkRect.width;
                    const relativeH = linkRect.height;

                    const xInMm = 10 + (relativeX * pxToMm);
                    const yInMm = 10 + (relativeY * pxToMm);
                    const wInMm = relativeW * pxToMm;
                    const hInMm = relativeH * pxToMm;

                    if (pageIndex < pdf.getNumberOfPages()) {
                        pdf.setPage(pageIndex + 1);
                        pdf.link(xInMm, yInMm, wInMm, hInMm, { url: absoluteUrl });
                    }
                });
            });

            element.style.display = "none";
            const base64String = pdf.output("datauristring").split(",")[1];
            return base64String;
        } catch (error) {
            console.error("Error generating PDF base64:", error);
            element.style.display = "none";
            return null;
        }
    }

    async function sendToGoogleSheet(data, generateNumber = false) {
        if (typeof GOOGLE_SHEET_WEBAPP_URL === "undefined" || !GOOGLE_SHEET_WEBAPP_URL) {
            console.warn("Google Sheet Web App URL is not configured in credentials.js. Sheet sync skipped.");
            return;
        }

        const rows = prepareGoogleSheetRows(data);

        toast("Generating PDF for Google Drive...", "info");
        const pdfBase64 = await generatePdfBase64(data);
        const filename = `${data.quotationNo || "Quotation"}.pdf`;

        toast("Syncing with Google Sheet & Drive...", "info");

        try {
            // Use AbortController for a 45-second timeout guard
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 45000);

            const payload = {
                rows,
                pdfBase64,
                filename,
                attachments: data.attachments || (data.attachment ? [data.attachment] : []),
                attachmentBase64: data.attachment ? data.attachment.base64 : null,
                attachmentFilename: data.attachment ? data.attachment.filename : null,
                attachmentMimeType: data.attachment ? data.attachment.mimeType : null
            };

            if (generateNumber) {
                payload.generateNumber = true;
                payload.masterNo = data.masterNo || null;
                payload.isRevision = !!data.parentRef;
                payload.parentRef = data.parentRef;
                payload.prevRef = data.prevRef;
                payload.revisionNotes = data.revisionNotes;
                payload.quotationNo = data.quotationNo;
            } else {
                payload.generateNumber = false;
                payload.quotationNo = data.quotationNo;
            }

            const response = await fetch(GOOGLE_SHEET_WEBAPP_URL, {
                method: "POST",
                redirect: "follow",
                headers: {
                    "Content-Type": "text/plain"
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const res = await response.json();
            if (res && res.status === "success") {
                if (res.generatedQuotationNo && res.generatedQuotationNo !== data.quotationNo) {
                    data.quotationNo = res.generatedQuotationNo;
                    data.masterNo = res.generatedMasterNo;
                    data.revision = res.generatedRevision;
                    state.quotationNo = res.generatedQuotationNo;
                    state.masterNo = res.generatedMasterNo;
                    state.revision = res.generatedRevision;
                    saveQuotationToStorage(data);
                    toast("Note: Quotation number was adjusted by server to prevent duplicates.", "warning");
                }

                if (res.attachmentUrl && data._id) {
                    // attachmentUrl is a newline-joined string of one or more Drive URLs
                    const driveUrls = res.attachmentUrl.split("\n").map(u => u.trim()).filter(u => u.startsWith("http"));

                    const all = JSON.parse(localStorage.getItem("kan_quotations") || "[]");
                    const idx = all.findIndex(q => q._id === data._id);
                    if (idx !== -1) {
                        // Write each Drive URL back to q.attachments[i].driveUrl
                        if (!all[idx].attachments) all[idx].attachments = [];
                        driveUrls.forEach((url, i) => {
                            if (all[idx].attachments[i]) {
                                all[idx].attachments[i].driveUrl = url;
                            }
                        });
                        // Backward-compat: also save first URL to old single attachment field
                        if (driveUrls.length > 0) {
                            all[idx].attachment = all[idx].attachment || {};
                            all[idx].attachment.driveUrl = driveUrls[0];
                        }
                        localStorage.setItem("kan_quotations", JSON.stringify(all));

                        // Update in-memory state too
                        if (!state.attachments) state.attachments = [];
                        driveUrls.forEach((url, i) => {
                            if (state.attachments[i]) state.attachments[i].driveUrl = url;
                        });
                        if (driveUrls.length > 0) {
                            state.attachment = state.attachment || {};
                            state.attachment.driveUrl = driveUrls[0];
                        }
                    }
                }
                toast("Google Sheet & Drive sync completed!", "success");
            } else {
                console.warn("Sheet sync warning:", res ? res.message : "No response JSON");
                toast("Google Sheet sync warning: " + (res && res.message ? res.message : "Unknown error"), "warning");
            }
        } catch (error) {
            if (error.name === "AbortError") {
                console.warn("Google Sheet sync timed out (>45s).");
                toast("Google Sheet sync timed out. Quotation saved locally.", "warning");
            } else {
                console.error("Google Sheet sync error:", error);
                toast("Google Sheet sync failed. Check your Apps Script deployment.", "error");
            }
        }
    }


    /* ============================================================
       21. FORM ACTIONS
       ============================================================ */

    /* ---- Helper to disable buttons during async operations ---- */
    function setButtonsDisabled(disabled) {
        const btns = ["btnGenerate", "btnSaveDraft", "btnSaveAs", "btnClearForm"];
        btns.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.disabled = disabled;
        });
    }

    /* ---- Generate Quote (submit) ---- */
    function handleGenerate(e) {
        e.preventDefault();
        if (!validateForm()) return;

        setButtonsDisabled(true);
        showLoading("Reserving quotation number...");
        setTimeout(async () => {
            state.status = "GENERATED";

            let nextInfo = null;
            if (state.parentRef || (state._id && !state.quotationNo.startsWith("DRAFT"))) {
                 // We are revising an existing quote
                 nextInfo = await fetchNextQuotationNo(state.masterNo);
            } else {
                 // We are submitting a completely new quote
                 nextInfo = await fetchNextQuotationNo();
            }

            if (nextInfo) {
                 state.quotationNo = nextInfo.nextNo;
                 state.masterNo = nextInfo.masterNo;
                 state.revision = nextInfo.revision;
            } else if (!state.quotationNo || state.quotationNo.startsWith("DRAFT")) {
                 state.quotationNo = "QT-" + Math.floor(Math.random()*1000) + "-L1";
            }

            if (state._id && (state.parentRef || !state.quotationNo.startsWith("DRAFT"))) {
                /* Branch existing quote to new revision entry */
                const originalNo = state.prevRef || state.quotationNo;
                state.prevRef = originalNo;
                state.parentRef = state.parentRef || originalNo;
                
                state.revisionNotes = state.revisionNotes
                    || sessionStorage.getItem("kan_edit_revision_notes")
                    || ("Revision of " + originalNo);
                sessionStorage.removeItem("kan_edit_revision_notes");

                state._id = generateStorageId();
                state.createdAt = new Date().toISOString();
                sessionStorage.setItem("kan_active_quote", state._id);
            } else {
                /* Completely new quote */
                if (!state._id) {
                    state._id = generateStorageId();
                    state.createdAt = new Date().toISOString();
                }
                state.parentRef = null;
                state.prevRef = null;
                state.revisionNotes = "Initial creation";
            }

            const data = collectFormData();
            saveQuotationToStorage(data);

            // Update loader text to show PDF sync progress
            showLoading("Syncing with Google Sheet & Drive (generating PDF)...");

            try {
                /* Sync with Google Sheet & Drive (awaited for UI flow) */
                await sendToGoogleSheet(data, true);
            } catch (err) {
                console.error("Google Sheets sync failed:", err);
            }

            hideLoading();
            setButtonsDisabled(false);

            /* Update ref chip in topbar */
            const chip = document.getElementById("quoteRefChip");
            if (chip) { chip.textContent = data.quotationNo; chip.classList.remove("hidden"); }

            openModal(`
                <div class="success-icon">✓</div>
                <h3>Quotation Generated Successfully</h3>
                <p class="card-sub">
                    Quotation <strong>${escapeHtml(data.quotationNo)}</strong> for
                    <strong>${escapeHtml(data.client.company)}</strong> has been saved.
                </p>
                <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:20px;">
                    <button class="btn btn-outline" id="modalCloseBtn">Close</button>
                    <button class="btn btn-primary" id="modalViewPdfBtn">View PDF</button>
                    <button class="btn btn-outline" id="modalDashBtn">Go to Dashboard</button>
                </div>
            `);
            toast(`Quotation ${data.quotationNo} generated!`, "success");

            /* Wire modal buttons */
            document.getElementById("modalCloseBtn")?.addEventListener("click", closeModal);
            document.getElementById("modalViewPdfBtn")?.addEventListener("click", () => {
                window.location.href = `pdf.html?id=${encodeURIComponent(data._id)}`;
            });
            document.getElementById("modalDashBtn")?.addEventListener("click", () => {
                window.location.href = "dashboard.html";
            });
        }, 600);
    }

    /* ---- Save Draft ---- */
    function handleSaveDraft() {
        if (!validateForm()) return;

        setButtonsDisabled(true);
        showLoading("Saving draft…");
        setTimeout(() => {
            state.status = "DRAFT";

            if (state._id && (state.parentRef || !state.quotationNo.startsWith("DRAFT"))) {
                /* Branch existing quote to new draft revision entry */
                const originalNo = state.prevRef || state.quotationNo;
                state.prevRef = originalNo;
                state.parentRef = state.parentRef || originalNo;
                
                // Do NOT assign a new QT number yet, just keep the parent tracking
                state.revisionNotes = state.revisionNotes
                    || sessionStorage.getItem("kan_edit_revision_notes")
                    || ("Draft revision of " + originalNo);
                sessionStorage.removeItem("kan_edit_revision_notes");

                state._id = generateStorageId();
                state.createdAt = new Date().toISOString();
                sessionStorage.setItem("kan_active_quote", state._id);
            } else {
                /* Completely new quote draft */
                if (!state._id) {
                    state._id = generateStorageId();
                    state.quotationNo = generateQuotationNo();
                    state.createdAt = new Date().toISOString();
                }
                state.parentRef = null;
                state.prevRef = null;
                state.revisionNotes = "Initial draft";
            }

            const data = collectFormData();
            saveQuotationToStorage(data);

            // Do NOT sync drafts to Google Sheets to avoid creating garbage rows
            // Drafts are purely local until Generated
            
            /* Update ref chip */
            const chip = document.getElementById("quoteRefChip");
            if (chip) { chip.textContent = data.quotationNo; chip.classList.remove("hidden"); }

            hideLoading();
            setButtonsDisabled(false);
            toast(`Draft saved: ${data.quotationNo}`, "success");
        }, 400);
    }

    /* ---- Save As ---- */
    function handleSaveAs() {
        if (!validateForm()) return;

        setButtonsDisabled(true);
        showLoading("Saving as new quotation…");
        setTimeout(() => {
            state.status = "DRAFT";

            // Treat as brand new quotation draft
            state.quotationNo = generateQuotationNo();
            state._id = generateStorageId();
            state.createdAt = new Date().toISOString();
            state.parentRef = null;
            state.prevRef = null;
            state.revisionNotes = sessionStorage.getItem("kan_edit_revision_notes") || "Saved as new quotation";
            sessionStorage.removeItem("kan_edit_revision_notes");
            
            state.masterNo = null;
            state.revision = null;

            const data = collectFormData();
            saveQuotationToStorage(data);

            /* Update ref chip */
            const chip = document.getElementById("quoteRefChip");
            if (chip) { chip.textContent = data.quotationNo; chip.classList.remove("hidden"); }

            hideLoading();
            setButtonsDisabled(false);
            toast(`Saved as new quotation: ${data.quotationNo}`, "success");
        }, 400);
    }

    /* ---- Preview ---- */
    function handlePreview() {
        const data = collectFormData();
        openModal(buildPreviewHtml(data));
    }

    /* ---- Print ---- */
    function handlePrint() {
        const data = collectFormData();
        document.getElementById("printArea").innerHTML = buildPrintHtml(data);
        document.body.classList.add("form-print-active");
        window.print();
        document.body.classList.remove("form-print-active");
    }

    /* ---- Download PDF (via print dialog) ---- */
    function handleDownloadPdf() {
        /* Save first, then open PDF page */
        state._id = state._id || generateStorageId();
        state.quotationNo = state.quotationNo || generateQuotationNo();
        state.createdAt = state.createdAt || new Date().toISOString();
        const data = collectFormData();
        data._id = state._id;
        saveQuotationToStorage(data);
        /* Pass ID and download=true as URL query params */
        window.open(`pdf.html?id=${encodeURIComponent(state._id)}&download=true`, "_blank");
    }

    /* ---- Clear Form ---- */
    function handleClearForm() {
        if (!confirm("Clear the entire form? This cannot be undone.")) return;

        /* Reset form */
        document.getElementById("quotationForm")?.reset();

        /* Re-apply locked sales rep for non-admin */
        if (sessionUser.access !== "Admin") {
            const sel = document.getElementById("salesRep");
            if (sel) { sel.value = sessionUser.name; sel.disabled = true; }
            updateSalesRepFields(sessionUser.name);
        }

        /* Reset state */
        state.lineItems = [];
        state.remarks = [""];
        state.status = "NEW";
        state.quotationNo = null;
        state._id = null;
        state.createdAt = null;
        state.scopeValues = {};
        state.attachment = null;
        termsState = TERMS.map(t => ({ ...t }));
        if (typeof syncAttachmentUI === "function") syncAttachmentUI();

        /* Reset UI */
        document.getElementById("momField")?.classList.add("hidden");
        document.getElementById("calcBanner") && (document.getElementById("calcBanner").textContent = "Enter width, height & module size to calculate screen dimensions.");
        document.getElementById("quoteRefChip")?.classList.add("hidden");

        const subOptionsPanel = document.getElementById("subOptionsPanel");
        if (subOptionsPanel) subOptionsPanel.style.display = "none";
        document.querySelectorAll(".size-sub-container").forEach(el => el.style.display = "none");
        document.querySelectorAll(".size-sub-sub-container").forEach(el => el.style.display = "none");
        document.querySelectorAll('input[name="moduleCategory"]').forEach(r => r.checked = false);
        document.querySelectorAll('input[name="diecastCabinetSize"]').forEach(r => r.checked = false);
        document.querySelectorAll('input[name="moduleSize"]').forEach(r => r.checked = false);

        renderRemarks();
        renderTerms();
        syncScreenRow();
        toast("Form cleared.", "info");
    }

    /* ---- Back to Dashboard ---- */
    function handleBackToDashboard() {
        window.location.href = "dashboard.html";
    }

    /* ============================================================
       22. MODAL
       ============================================================ */
    function openModal(html) {
        const box = document.getElementById("modalBox");
        if (box) box.innerHTML = html;
        document.getElementById("modalOverlay")?.classList.remove("hidden");
    }

    function closeModal() {
        document.getElementById("modalOverlay")?.classList.add("hidden");
    }

    document.getElementById("modalOverlay")?.addEventListener("click", e => {
        if (e.target === document.getElementById("modalOverlay")) closeModal();
    });

    /* ============================================================
       23. PREVIEW HTML
       ============================================================ */
    function buildPreviewHtml(data) {
        return `
        <h3>Quotation Preview ${data.quotationNo ? "· " + escapeHtml(data.quotationNo) : ""}</h3>
        <div class="summary-grid">
            <div><span>Sales Rep</span>${escapeHtml(data.salesRep.name || "—")}</div>
            <div><span>Client</span>${escapeHtml(data.client.name || "—")}</div>
            <div><span>Company</span>${escapeHtml(data.client.company || "—")}</div>
            <div><span>Contact</span>${escapeHtml(data.client.contact || "—")}</div>
            <div><span>Project Type</span>${escapeHtml(data.project.projectType || "—")}</div>
            <div><span>Total Area</span>${escapeHtml(data.project.totalArea || "—")} SQFT</div>
        </div>
        <table class="preview-table">
            <thead><tr><th>#</th><th>Category</th><th>Item</th><th>Qty</th><th>Unit</th><th>Unit Price</th><th>Total</th></tr></thead>
            <tbody>
                ${data.lineItems.map((li, i) =>
            `<tr><td>${i + 1}</td><td>${escapeHtml(li.category)}</td><td>${escapeHtml(li.item || li.category)}</td>
                    <td>${fmt2(li.qty)}</td><td>${escapeHtml(li.unit)}</td><td>${fmt2(li.unitPrice)}</td>
                    <td>${fmt2(num(li.qty) * num(li.unitPrice))}</td></tr>`
        ).join("")}
            </tbody>
        </table>
        <div class="summary-grid">
            <div><span>Subtotal</span>${fmt2(data.summary.subtotal)}</div>
            <div><span>GST (${data.summary.gstPct}%)</span>${fmt2(data.summary.gstAmt)}</div>
            <div><span>Discount</span>${fmt2(data.summary.discount)}</div>
            <div><span>Grand Total</span><strong>${fmt2(data.summary.grandTotal)}</strong></div>
        </div>
        <div class="modal-close-row">
            <button type="button" class="btn btn-outline" id="modalCloseBtn">Close</button>
        </div>
        `;
    }

    /* ============================================================
       24. PRINT HTML
       ============================================================ */
    function buildPrintHtml(data) {
        return `
        <h2>KAN Universal Pvt Ltd</h2>
        <p>${data.quotationNo ? "Quotation No: " + data.quotationNo : "DRAFT QUOTATION"}</p>
        <p><strong>Client:</strong> ${escapeHtml(data.client.name)} — ${escapeHtml(data.client.company)}</p>
        <p><strong>Site Address:</strong> ${escapeHtml(data.client.siteAddress)}</p>
        <table><thead><tr><th>#</th><th>Category</th><th>Item</th><th>Description</th><th>Qty</th><th>Unit</th><th>Unit Price</th><th>Total</th></tr></thead>
        <tbody>
            ${data.lineItems.map((li, i) =>
            `<tr><td>${i + 1}</td><td>${escapeHtml(li.category)}</td><td>${escapeHtml(li.item || li.category)}</td>
                <td>${escapeHtml(li.description || "")}</td><td>${fmt2(li.qty)}</td><td>${escapeHtml(li.unit)}</td>
                <td>${fmt2(li.unitPrice)}</td><td>${fmt2(num(li.qty) * num(li.unitPrice))}</td></tr>`
        ).join("")}
        </tbody></table>
        <p>Subtotal: ${fmt2(data.summary.subtotal)} | GST: ${fmt2(data.summary.gstAmt)} | Discount: ${fmt2(data.summary.discount)} | <strong>Grand Total: ${fmt2(data.summary.grandTotal)}</strong></p>
        <h4>Terms &amp; Conditions</h4>
        <ol>${data.terms.map(t => `<li>${escapeHtml(t.text)}</li>`).join("")}</ol>
        `;
    }

    /* ============================================================
       25. POPULATE FORM FROM EXISTING QUOTATION (Edit mode)
       ============================================================ */
    function populateFormFromData(data) {
        if (!data) return;

        /* Restore state */
        state._id = data._id;
        state.quotationNo = data.quotationNo;
        state.status = data.status || "DRAFT";
        state.createdAt = data.createdAt;
        state.masterNo = data.masterNo;
        state.revision = data.revision;
        state.parentRef = data.parentRef;
        state.prevRef = data.prevRef;
        state.revisionNotes = data.revisionNotes || "";
        state.lineItems = (data.lineItems || []).map(li => ({ ...li, id: ++lineIdCounter }));
        state.remarks = data.remarks?.length ? data.remarks : [""];
        state.scopeValues = data.scope || {};
        state.hasBranchedRevision = false;
        termsState = data.terms?.length ? data.terms.map(t => ({ ...t })) : TERMS.map(t => ({ ...t }));
        state.attachment = data.attachment || null;
        // Restore multi-attachment state (with backward-compat for legacy single attachment)
        state.attachments = data.attachments && data.attachments.length
            ? data.attachments.map(a => ({ ...a }))
            : (data.attachment ? [{ ...data.attachment }] : []);
        setTimeout(() => { if (typeof syncAttachmentUI === "function") syncAttachmentUI(); }, 200);


        /* Update ref chip */
        const chip = document.getElementById("quoteRefChip");
        if (chip && data.quotationNo) {
            chip.textContent = data.quotationNo;
            chip.classList.remove("hidden");
        }

        /* Section 1 */
        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ""; };

        if (sessionUser.access === "Admin") {
            setVal("salesRep", data.salesRep?.name);
        }
        setVal("salesEmail", data.salesRep?.email);
        setVal("salesContact", data.salesRep?.contact);

        /* Section 2 */
        setVal("clientName", data.client?.name);
        setVal("companyName", data.client?.company);
        setVal("clientEmail", data.client?.email);
        setVal("clientContact", data.client?.contact);
        setVal("gstNumber", data.client?.gst);
        setVal("clientAddress", data.client?.clientAddress);
        setVal("siteAddress", data.client?.siteAddress);

        /* Org type radio */
        const orgRadio = document.querySelector(`input[name="orgType"][value="${data.client?.orgType}"]`);
        if (orgRadio) orgRadio.checked = true;

        const hideGst = document.getElementById("hideGstInPdf");
        if (hideGst) hideGst.checked = !!data.hideGstInPdf;
        const hideDiscount = document.getElementById("hideDiscountInPdf");
        if (hideDiscount) hideDiscount.checked = !!data.hideDiscountInPdf;

        /* Section 3 */
        setVal("screenWidth", data.project?.screenWidth);
        setVal("screenHeight", data.project?.screenHeight);
        setVal("numModulesW", data.project?.numModulesW);
        setVal("numModulesH", data.project?.numModulesH);
        setVal("totalCabinets", data.project?.totalCabinets);
        setVal("actualWidthMM", data.project?.actualWidthMM);
        setVal("actualHeightMM", data.project?.actualHeightMM);
        setVal("actualWidthFT", data.project?.actualWidthFT);
        setVal("actualHeightFT", data.project?.actualHeightFT);
        setVal("totalArea", data.project?.totalArea);
        setVal("heightFromGround", data.project?.heightFromGround);
        setVal("viewingDistance", data.project?.viewingDistance);
        setVal("powerPointDistance", data.project?.powerPointDistance);
        setVal("controlRoomDistance", data.project?.controlRoomDistance);
        setVal("momOfSiteVisit", data.project?.momOfSiteVisit);

        const setRadio = (name, val) => {
            const r = document.querySelector(`input[name="${name}"][value="${val}"]`);
            if (r) r.checked = true;
        };
        setRadio("projectType", data.project?.projectType);

        if (typeof syncSizeUIFromValue === "function") {
            syncSizeUIFromValue(data.project?.moduleSize);
        } else {
            setRadio("moduleSize", data.project?.moduleSize);
        }

        setRadio("cabinetSolution", data.project?.cabinetSolution);
        setRadio("mountingType", data.project?.mountingType);
        setRadio("amc", data.project?.amc);
        setRadio("siteVisit", data.project?.siteVisit);

        /* Restore width/height rounding stepper choices and radio states */
        if (data.project?.widthRounding) {
            setRadio("widthRounding", data.project.widthRounding);
            if (typeof _modState !== "undefined") {
                _modState.width.choice = data.project.widthRounding;
                const { w: modW } = moduleDims(data.project.moduleSize || "192x192");
                const count = Math.round(parseFloat(data.project.actualWidthMM || 0) / modW) || 1;
                if (data.project.widthRounding === "up") {
                    _modState.width.upCount = count;
                    _modState.width.downCount = Math.max(1, count - 1);
                } else {
                    _modState.width.downCount = count;
                    _modState.width.upCount = count + 1;
                }
            }
        }
        if (data.project?.heightRounding) {
            setRadio("heightRounding", data.project.heightRounding);
            if (typeof _modState !== "undefined") {
                _modState.height.choice = data.project.heightRounding;
                const { h: modH } = moduleDims(data.project.moduleSize || "192x192");
                const count = Math.round(parseFloat(data.project.actualHeightMM || 0) / modH) || 1;
                if (data.project.heightRounding === "up") {
                    _modState.height.upCount = count;
                    _modState.height.downCount = Math.max(1, count - 1);
                } else {
                    _modState.height.downCount = count;
                    _modState.height.upCount = count + 1;
                }
            }
        }

        /* Show MOM field if site visit = YES */
        if (data.project?.siteVisit === "YES") {
            document.getElementById("momField")?.classList.remove("hidden");
        }

        /* Section 4 — Scope */
        if (data.scope) {
            Object.entries(data.scope).forEach(([key, val]) => {
                const radio = document.querySelector(`input[name="scope_${key}"][value="${val}"]`);
                if (radio) radio.checked = true;
            });
        }

        /* Section 5 — Render line items */
        renderLineItems();

        /* Section 6 — Remarks */
        renderRemarks();

        /* Section 7 — Terms */
        renderTerms();

        /* Run calculation banner */
        runCalculationEngine();

        // Restore Hide in PDF checkbox states
        document.querySelectorAll(".hide-pdf-checkbox").forEach(cb => {
            const fieldId = cb.dataset.field;
            cb.checked = data.hideFields ? !!data.hideFields[fieldId] : false;
        });
    }

    /* ============================================================
       26. BUTTON WIRING
       ============================================================ */
    function initFormButtons() {
        document.getElementById("quotationForm")?.addEventListener("submit", handleGenerate);
        document.getElementById("btnSaveDraft")?.addEventListener("click", handleSaveDraft);
        document.getElementById("btnSaveAs")?.addEventListener("click", handleSaveAs);
        document.getElementById("btnPreview")?.addEventListener("click", handlePreview);
        document.getElementById("btnPrint")?.addEventListener("click", handlePrint);
        document.getElementById("btnDownloadPdf")?.addEventListener("click", handleDownloadPdf);
        document.getElementById("btnClearForm")?.addEventListener("click", handleClearForm);
        document.getElementById("btnBackDashboard")?.addEventListener("click", handleBackToDashboard);
        document.getElementById("btnSyncProducts")?.addEventListener("click", async () => {
            showLoading("Syncing product catalog...");
            await loadDynamicProducts();
            hideLoading();
            toast("Product catalog synchronized successfully!", "success");
        });

        /* Close modal when clicking "#modalCloseBtn" via delegation */
        document.getElementById("modalBox")?.addEventListener("click", e => {
            if (e.target.id === "modalCloseBtn") closeModal();
        });
    }

    /* ============================================================
       27. MAIN INIT — Load sections then wire everything
       ============================================================ */
    async function init() {
        showLoading("Loading form…");

        /* Load HTML partials and dynamic product data */
        await loadSections();
        await loadDynamicProducts();

        hideLoading();

        /* Wire all modules */
        initSalesRep();
        initSameAddress();
        initSiteVisitToggle();
        initScopeOfWork();
        initLineItemsTable();
        initSummaryInputs();
        initRemarks();
        initTerms();
        initAttachment();
        initFormButtons();

        /* calculation.js hooks */
        initCalculationListeners();
        initNumericOnlyFields();

        /* Seed screen row (Row 1) */
        syncScreenRow();

        /* Check if we're in edit mode */
        const editId = sessionStorage.getItem("kan_active_quote");
        const isEdit = sessionStorage.getItem("kan_edit_mode") === "true";

        if (editId && isEdit) {
            try {
                const all = JSON.parse(localStorage.getItem("kan_quotations") || "[]");
                const data = all.find(q => q._id === editId);
                if (data) {
                    const label = document.getElementById("quoteStatusLabel");
                    if (label) label.textContent = "◉ Edit Quotation";
                    populateFormFromData(data);
                    document.getElementById("btnSaveAs")?.classList.remove("hidden");
                }
            } catch (err) {
                console.error("Failed to load edit data:", err);
            }
            sessionStorage.removeItem("kan_edit_mode");
        }
    }

    document.addEventListener("DOMContentLoaded", init);

})();
