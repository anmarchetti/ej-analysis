/* [ExcludeFromCodeCoverage] JS */

// Delete row
globalThis.scRmDeleteRow = function(rowId) {
    if (!confirm(scForm.translate('Are you sure you want to delete this mapping?'))) return;
    const row = document.getElementById(rowId);
    row?.remove?.();
    scForm?.setModified?.();
};

// Toggle summary visibility
globalThis.scRmToggleSummary = function(rowId) {
    const row = document.getElementById(rowId);
    if (!row) return;
    
    const summary = row.querySelector('[data-summary]');
    const toggleBtn = row.querySelector('[data-toggle-summary]');
    
    if (!summary) return;
    
    const isHidden = summary.classList.contains('scRmSummaryHidden');
    
    if (isHidden) {
        // Show summary
        summary.classList.remove('scRmSummaryHidden');
        summary.classList.add('scRmSummaryVisible');
        if (toggleBtn) toggleBtn.textContent = 'Hide Details';
    } else {
        // Hide summary
        summary.classList.remove('scRmSummaryVisible');
        summary.classList.add('scRmSummaryHidden');
        if (toggleBtn) toggleBtn.textContent = 'View Details';
    }
};

// Update Edit button state
globalThis.scRmUpdateEditBtn = function(valueDropdownId, editBtnId) {
    const dropdown = document.getElementById(valueDropdownId);
    const btn = document.getElementById(editBtnId);
    if (!dropdown || !btn) return;
    
    const hasValue = !!dropdown?.value?.trim() && dropdown.value !== 'JUST_REMOVE';
    btn.disabled = !hasValue;
    btn.classList.toggle('scRmEditBtnDisabled', !hasValue);
    btn.classList.toggle('scRmEditBtnEnabled', hasValue);
    if (hasValue) btn.removeAttribute('disabled');
    else btn.setAttribute('disabled', 'disabled');
    scForm?.setModified?.();
};

// Update summary display (updates content but respects toggle state)
globalThis.scRmUpdateSummary = function(rowId) {
    const row = document.getElementById(rowId);
    if (!row) return;
    
    const summary = row.querySelector('[data-summary]');
    const keySelect = row.querySelector('select[id$="_Key"]');
    const valueSelect = row.querySelector('select[id$="_Value"]');
    const toggleBtn = row.querySelector('[data-toggle-summary]');
    
    if (!summary) return;
    
    const hasData = (keySelect?.value) || (valueSelect?.value);
    
    // Show/hide toggle button based on whether there's data
    if (toggleBtn) {
        toggleBtn.style.display = hasData ? '' : 'none';
    }
    
    // Update key/value names with icons
    updateNameElement(summary.querySelector('[data-key-name]'), keySelect, 'data-key-id');
    updateNameElement(summary.querySelector('[data-value-name]'), valueSelect, 'data-value-id');
    
    scForm?.setModified(true);
};

function updateNameElement(el, select, idAttrName) {
    if (!el || !select) return;
    const opt = select?.options?.[select.selectedIndex];
    const icon = opt?.dataset?.icon ?? '';
    const text = opt?.text ?? '(not selected)';
    el.innerHTML = (text !== '(not selected)' && icon)
        ? '<img src="' + icon + '" width="16" height="16" class="scRmSummaryIcon" alt=""/>' + text
        : text;
    if (idAttrName) {
        el.setAttribute(idAttrName, select.value ?? '');
    }
}

function getStandardFieldNames(row) {
    const standardFieldsAttr = row?.dataset?.standardFields ?? null;
    return (standardFieldsAttr && standardFieldsAttr.trim()) ? standardFieldsAttr.toLowerCase().split(',') : [];
}

// Update parameter details - shows/hides and updates the params section
globalThis.scRmUpdateParamsDetails = function(rowId, parametersString) {
    const row = document.getElementById(rowId);
    if (!row) return;
    
    const paramsDetails = row.querySelector('[data-params-details]');
    const paramsHeader = row.querySelector('[data-params-header]');
    const paramsRow = row.querySelector('[data-params-row]');
    
    if (!paramsDetails) return;
    
    const params = parseParams(parametersString);
    const hasParams = Object.keys(params).length > 0;
    setParamsVisibility(paramsDetails, paramsHeader, paramsRow, hasParams);
    
    // Get standard field names from the row's data attribute (loaded from Sitecore template)
    const standardFields = getStandardFieldNames(row);
    
    const { standard, custom } = classifyParams(params, standardFields);
    
    updateParamsTable(paramsDetails.querySelector('[data-params-standard]') || paramsDetails.querySelector('.scRmParamsColumnStandard table'), standard);
    updateParamsTable(paramsDetails.querySelector('[data-params-custom]') || paramsDetails.querySelector('.scRmParamsColumn:not(.scRmParamsColumnStandard) table'), custom);
    scForm?.setModified(true);
};

function setParamsVisibility(paramsDetails, paramsHeader, paramsRow, hasParams) {
    if (paramsHeader) {
        paramsHeader.style.display = hasParams ? 'table-row' : 'none';
    }
    if (paramsRow) {
        paramsRow.style.display = hasParams ? 'table-row' : 'none';
    }
    try {
        paramsDetails.style.display = hasParams ? 'block' : 'none';
        paramsDetails.setAttribute('aria-hidden', hasParams ? 'false' : 'true');
    } catch (e) {
        console.warn('scRm: failed to update params visibility', e);
    }
}

function classifyParams(params, standardFields) {
    const standard = {}, custom = {};
    for (const k in params) {
        if (Object.hasOwn(params, k)) {
            const isStandard = standardFields.includes(k.toLowerCase());
            (isStandard ? standard : custom)[k] = params[k];
        }
    }
    return { standard, custom };
}

function parseParams(str) {
    const params = {};
    if (!str || !str.trim()) return params;
    try {
        const usp = new URLSearchParams(str);
        for (const [k, v] of usp.entries()) {
            if (typeof v === 'string' && v.trim()) {
                params[k] = v;
            }
        }
    } catch (e) {
        // Fallback: best-effort parse if URLSearchParams fails
        str.split('&').forEach(function(pair) {
            const p = pair.split('=');
            if (p.length === 2 && p[1].trim()) {
                try {
                    params[decodeURIComponent(p[0].replace(/\+/g, ' '))] = decodeURIComponent(p[1].replace(/\+/g, ' '));
                } catch { /* ignore */ }
            }
        });
    }
    return params;
}

function updateParamsTable(table, params) {
    if (!table) return;
    const tbody = table.querySelector('tbody') || table;
    const rows = tbody.querySelectorAll('tr:not(:first-child)');
    rows.forEach(function(r) { if (typeof r.remove === 'function') r.remove(); });
    
    const keys = Object.keys(params);
    if (keys.length) {
        keys.forEach(function(k) {
            const tr = document.createElement('tr');
            // Use textContent to safely set text (handles HTML entities and special chars)
            const keyCell = document.createElement('td');
            keyCell.className = 'scRmParamsKey';
            keyCell.textContent = k; // k is already decoded by URLSearchParams
            const valueCell = document.createElement('td');
            valueCell.className = 'scRmParamsValue';
            valueCell.setAttribute('data-param-key', k);
            valueCell.textContent = params[k]; // value is already decoded by URLSearchParams
            tr.appendChild(keyCell);
            tr.appendChild(valueCell);
            tbody.appendChild(tr);
        });
    } else {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="2" class="scRmParamsEmpty">—</td>';
        tbody.appendChild(tr);
    }
}

globalThis.restoreRenderingMappingLayout = function() {
    document.querySelectorAll('.scAdditionalParameters.scRmRow').forEach(function(row) {
        const dr = row.querySelector('.scRmDropdownsRow');
        if (dr) { dr.style.display = 'flex'; dr.style.flexWrap = 'nowrap'; dr.style.width = '100%'; }
    });
};



// Read the GUIDs from the AllowedRenderings multilist _selected <select>.
// Returns a Set<string> of upper-cased GUIDs, or null when the list is empty (= no filter).
// Handles both Sitecore Multilist format ("I{int}|{GUID}") and Treelist format ("{GUID}").
function getAllowedRenderingIdsFromMultilist() {
    // Selector constant - depends on aria-label "Allowed Renderings" text.
    // If label changes due to localization/rebranding, update this constant.
    var ALLOWED_RENDERINGS_SELECTOR = 'select[id$="_selected"][aria-label*="Allowed Renderings"]';
    var sel = document.querySelector(ALLOWED_RENDERINGS_SELECTOR);
    if (!sel || !sel.options.length) return null;
    var ids = new Set();
    var guidRe = /\{[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}\}/;
    for (var i = 0; i < sel.options.length; i++) {
        var val = sel.options[i].value;
        // Multilist: "I{int}|{GUID}"  →  take part after last |
        // Treelist:  "{GUID}"          →  use value directly
        var parts = val.split('|');
        var guid = parts.length > 1 ? parts[parts.length - 1] : val;
        if (guid && guidRe.test(guid)) ids.add(guid.toUpperCase());
    }
    return ids.size > 0 ? ids : null;
}

// Hide value-column dropdown options whose rendering GUID is not in AllowedRenderings.
// JUST_REMOVE and blank values are always kept visible.
// When AllowedRenderings has no selection, all options are shown (no filter).
globalThis.scRmApplyAllowedRenderingsFilter = function() {
    var allowedIds = getAllowedRenderingIdsFromMultilist();
    document.querySelectorAll('.scAdditionalParameters.scRmRow select[id$="_Value"]').forEach(function(sel) {
        for (var i = 0; i < sel.options.length; i++) {
            var opt = sel.options[i];
            if (!opt.value || opt.value === 'JUST_REMOVE') {
                opt.hidden = false;
                opt.style.display = '';
                continue;
            }

            var hide = allowedIds !== null && !allowedIds.has(opt.value.toUpperCase());
            opt.hidden = hide;
            opt.style.display = hide ? 'none' : '';
        }

        Array.from(sel.querySelectorAll('optgroup')).forEach(function(group) {
            var hasVisibleOptions = false;
            Array.from(group.querySelectorAll('option')).forEach(function(opt) {
                if (!opt.value || opt.value === 'JUST_REMOVE') return;
                if (!opt.hidden) hasVisibleOptions = true;
            });
            group.hidden = !hasVisibleOptions;
            group.style.display = hasVisibleOptions ? '' : 'none';
        });
    });
};

globalThis.initRenderingMappingButtons = function() {
    document.querySelectorAll('.scAdditionalParameters.scRmRow').forEach(function(row) {
        const vs = row.querySelector('select[id$="_Value"]');
        const btn = row.querySelector('.scEditParamsBtn');
        const toggleBtn = row.querySelector('[data-toggle-summary]');
        const keySelect = row.querySelector('select[id$="_Key"]');

        if (vs && btn) {
            const has = !!vs?.value?.trim() && vs.value !== 'JUST_REMOVE';
            btn.disabled = !has;
            btn.classList.toggle('scRmEditBtnDisabled', !has);
            btn.classList.toggle('scRmEditBtnEnabled', has);
            if (has) btn.removeAttribute('disabled');
            else btn.setAttribute('disabled', 'disabled');
        }

        if (toggleBtn) {
            const hasData = (keySelect?.value) || (vs?.value);
            toggleBtn.style.display = hasData ? '' : 'none';
        }
    });
};

(function() {
    const inited = new Set(); let obsInit = false;
    const watchers = new WeakMap(); // WeakMap: keys are element references; allows GC when element is detached

    function extractUidOptionsFromDom() {
        if (window._scRmAllUidOptions && window._scRmAllUidOptions.length > 0) return;
        var allOptions = [];
        var seen = {};
        var hasRenderingId = false;
        document.querySelectorAll('.scAdditionalParameters.scRmRow select[id$="_Uid"] option').forEach(function(opt) {
            if (!opt.value) return; // skip placeholder
            if (seen[opt.value]) return;
            seen[opt.value] = true;
            var rid = opt.dataset ? (opt.dataset.renderingId || '') : '';
            if (rid) hasRenderingId = true;
            allOptions.push({
                uid: opt.value,
                label: opt.textContent || opt.value,
                renderingId: rid
            });
        });
        // Only treat DOM options as valid when at least one has a data-rendering-id.
        // Server-side fallback renders bare-GUID options (no renderingId, label === uid)
        // when GetPageRenderingInstances() cannot resolve the item (e.g. tree-navigation
        // postback without ?fo= in the query string). Accepting those would block the
        // deferred server callback (scRmAutoPopulate) from fetching the real options.
        if (allOptions.length > 0 && hasRenderingId) {
            window._scRmAllUidOptions = allOptions;
            window._scRmAutoPopulateCompleted = true;
        }
    }
    
    function initRow(row) {
        if (!row || !row.id) return;
        extractUidOptionsFromDom();

        // Determine row position — stable across SetInnerHtml re-renders (IDs change, positions don't).
        var rowPosition = -1;
        try {
            var allRows = document.querySelectorAll('.scAdditionalParameters.scRmRow');
            for (var ri = 0; ri < allRows.length; ri++) { if (allRows[ri] === row) { rowPosition = ri; break; } }
        } catch(e) {}

        const vs = row.querySelector('select[id$="_Value"]');
        const btn = row.querySelector('.scEditParamsBtn');
        const rid = row.id;

        if (vs && btn && !vs._rmInit) {
            vs._rmInit = true;
            vs.addEventListener('change', function() {
                const has = !!vs?.value?.trim() && vs.value !== 'JUST_REMOVE';
                btn.disabled = !has;
                btn.classList.toggle('scRmEditBtnDisabled', !has);
                btn.classList.toggle('scRmEditBtnEnabled', has);
                if (has) btn.removeAttribute('disabled');
                else btn.setAttribute('disabled', 'disabled');
                globalThis.scRmUpdateSummary(rid);
            });
        }

        const ks = row.querySelector('select[id$="_Key"]');
        if (ks && !ks._rmInit) {
            ks._rmInit = true;
            ks.addEventListener('change', function() {
                globalThis.scRmUpdateSummary(rid);
                try { globalThis.scRmFilterUidForRow(row, true); } catch(e) {}
            });
        }
        // Apply initial UID filter without noInstancesForKey flag (initial load = neutral state)
        try { globalThis.scRmFilterUidForRow(row, false); } catch(e) {}

        // Watch hidden params field for changes and update details automatically
        const hidden = row.querySelector('input[type="hidden"][id*="_Params"]');
        if (hidden && !hidden._rmWatch) {
            hidden._rmWatch = true;

            try {
                var pendingParams = null;
                if (rowPosition >= 0 && window._scRmPendingParamsByIdx && window._scRmPendingParamsByIdx[rowPosition] !== undefined) {
                    pendingParams = window._scRmPendingParamsByIdx[rowPosition];
                } else if (window._scRmPendingParams && window._scRmPendingParams[rid]) {
                    pendingParams = window._scRmPendingParams[rid];
                }
                if (pendingParams && !hidden.value) {
                    hidden.value = pendingParams;
                    hidden.setAttribute('value', pendingParams);
                    if (rowPosition >= 0 && window._scRmPendingParamsByIdx) {
                        delete window._scRmPendingParamsByIdx[rowPosition];
                    }
                    if (window._scRmPendingParams && window._scRmPendingParams[rid]) {
                        delete window._scRmPendingParams[rid];
                    }
                }
            } catch(e) { console.warn('scRm: failed applying pending params', e); }

            var initialValue = hidden.value || hidden.getAttribute('value') || "";
            watchers.set(hidden, initialValue);

            const updateIfChanged = function() {
                try {
                    if (!document.body.contains(hidden)) {
                        clearInterval(intervalId);
                        if (mo) { try { mo.disconnect(); } catch(_e) {} }
                        return;
                    }
                    var propValue = hidden.value || "";
                    var attrValue = hidden.getAttribute('value') || "";
                    var current = attrValue !== propValue ? attrValue : propValue;
                    if (attrValue && attrValue !== propValue) {
                        hidden.value = attrValue;
                        current = attrValue;
                    }
                    if (current !== watchers.get(hidden)) {
                        watchers.set(hidden, current);
                        globalThis.scRmUpdateParamsDetails(rid, current);
                    }
                } catch (e) { console.warn('scRm: failed updating params details', e); }
            };

            const intervalId = setInterval(updateIfChanged, 300);
            hidden._rmIntervalId = intervalId;

            var mo = null;
            try {
                mo = new MutationObserver(function() { updateIfChanged(); });
                mo.observe(hidden, { attributes: true, attributeFilter: ['value'] });
                hidden._rmObserver = mo;
            } catch (e) { console.warn('scRm: MutationObserver unsupported', e); }
        }
    }
    
    // Schedule a deferred server call to populate UID dropdowns when
    // the initial DOM render contains no UID options (e.g. renderings inherited
    // from standard values). The guard prevents concurrent scheduling but resets
    // after each attempt so that MutationObserver-driven retries can re-trigger
    // if the first attempt fails (e.g. Section_ element not yet in DOM).
    function scheduleAutoPopulateIfNeeded() {
        if (window._scRmAllUidOptions && window._scRmAllUidOptions.length > 0) return;
        if (window._scRmAutoPopulateScheduled) return;
        var rows = document.querySelectorAll('.scAdditionalParameters.scRmRow');
        if (!rows.length) return;
        window._scRmAutoPopulateScheduled = true;
        setTimeout(function() {
            // Reset guard BEFORE the attempt so future MutationObserver events
            // can re-schedule if this attempt fails (no uid0, no ecrItemGuid, etc.)
            window._scRmAutoPopulateScheduled = false;
            if (window._scRmAllUidOptions && window._scRmAllUidOptions.length > 0) return;
            var called = false;
            try { called = scRmAutoPopulate(); } catch(e) { console.warn('scRm: auto-populate fallback failed', e); }
            // If scRmAutoPopulate could not make a server call (returned false)
            // and options are still empty, retry once after 1s — the DOM may not
            // have been fully settled on the first attempt.
            if (!called && (!window._scRmAllUidOptions || !window._scRmAllUidOptions.length)) {
                setTimeout(function() {
                    if (window._scRmAllUidOptions && window._scRmAllUidOptions.length > 0) return;
                    try { scRmAutoPopulate(); } catch(e2) { /* silent retry */ }
                }, 1000);
            }
        }, 300);
    }

    function initAll() {
        document.querySelectorAll('.scAdditionalParameters.scRmRow').forEach(initRow);
        globalThis.restoreRenderingMappingLayout();
        globalThis.initRenderingMappingButtons();
        scheduleAutoPopulateIfNeeded();
        globalThis.scRmApplyAllowedRenderingsFilter();
    }
    
    function setupObs() {
        if (obsInit || !document.body) return;
        obsInit = true;
        const c = document.body || document.documentElement;
        const obs = new MutationObserver(function(muts) {
            if (obs._p) return;
            obs._p = true;
            try {
                muts.forEach(function(m) {
                    // When existing .scRmRow elements are removed (CE item navigation),
                    // reset the fired flag so the next item's rows trigger auto-populate.
                    m.removedNodes.forEach(function(n) {
                        if (n.nodeType !== 1) return;
                        var hasRows = n.classList?.contains('scAdditionalParameters') || n.querySelector?.('.scAdditionalParameters');
                        if (hasRows) {
                            // Only clear cached options if NO other .scRmRow elements remain.
                            // This prevents a race condition where rapid add/remove of a single row
                            // clears state that other existing rows still depend on.
                            var remaining = document.querySelectorAll('.scAdditionalParameters.scRmRow');
                            if (!remaining.length) {
                                window._scRmAllUidOptions = null;
                                window._scRmAutoPopulateCompleted = false;
                                window._scRmAutoPopulateScheduled = false;
                            }
                        }
                        // Intervals/observers self-terminate via document.body.contains() check in updateIfChanged.
                    });
                    m.addedNodes.forEach(processAddedNode);
                });
            } finally { obs._p = false; }
        });
        obs.observe(c, { childList: true, subtree: true });
    }

    var _scRmRefreshScheduled = false;
    var _scRmAllowedFilterPending = false;
    function processAddedNode(n) {
        if (n.nodeType !== 1) return;
        if (n.nodeName === 'OPTION' && n.parentElement) {
            var p = n.parentElement;
            if (p.id && p.id.slice(-9) === '_selected' &&
                (p.getAttribute('aria-label') || '').indexOf('Allowed Renderings') !== -1) {
                if (!_scRmAllowedFilterPending) {
                    _scRmAllowedFilterPending = true;
                    setTimeout(function() {
                        _scRmAllowedFilterPending = false;
                        try { globalThis.scRmApplyAllowedRenderingsFilter(); } catch(e) {}
                    }, 50);
                }
                return;
            }
        }

        var isRow = n.classList?.contains('scAdditionalParameters');
        var nestedRows = !isRow && n.querySelectorAll?.('.scAdditionalParameters.scRmRow');
        var hasNestedRows = nestedRows && nestedRows.length > 0;

        // Only act on actual row additions, not on <option> elements we insert ourselves
        if (!isRow && !hasNestedRows) return;

        if (isRow) {
            initRow(n);
            globalThis.restoreRenderingMappingLayout();
        }
        if (hasNestedRows) {
            nestedRows.forEach(function(r) { initRow(r); });
            globalThis.restoreRenderingMappingLayout();
            globalThis.initRenderingMappingButtons();
        }
        // After postback, server re-renders bare-GUID options (no ?fo= on postback).
        // If we already have cached UID options from a previous load, re-apply them
        // via a debounced setTimeout to avoid re-triggering the MutationObserver.
        if (_scRmRefreshScheduled) return;
        _scRmRefreshScheduled = true;
        setTimeout(function() {
            _scRmRefreshScheduled = false;
            if (window._scRmAllUidOptions && window._scRmAllUidOptions.length > 0) {
                try { globalThis.scRmRefreshUidDropdowns(window._scRmAllUidOptions); } catch(e) {}
            } else {
                scheduleAutoPopulateIfNeeded();
            }
            try { globalThis.scRmApplyAllowedRenderingsFilter(); } catch(e) {}
        }, 50);
    }
    
    document.addEventListener('change', function(e) {
        var t = e && e.target;
        if (t && t.id && t.id.slice(-9) === '_selected' &&
            t.getAttribute && (t.getAttribute('aria-label') || '').indexOf('Allowed Renderings') !== -1) {
            globalThis.scRmApplyAllowedRenderingsFilter();
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { initAll(); setupObs(); });
    } else {
        (globalThis.requestAnimationFrame || function(f) { setTimeout(f, 100); })(function() { initAll(); setupObs(); });
    }
})();

/* Post-load safety: ensure functions are available on window/top and patch params visibility if needed */
(function() {
    var names = ['scRmDeleteRow','scRmToggleSummary','scRmUpdateEditBtn','scRmUpdateSummary','scRmUpdateParamsDetails','restoreRenderingMappingLayout','initRenderingMappingButtons','scRmRefreshUidDropdowns','scRmFilterUidForRow','scRmFilterKeyDropdowns'];

    function copyGlobal(name) {
        try {
            if (typeof globalThis !== 'undefined' && typeof globalThis[name] === 'function') {
                try { if (typeof window !== 'undefined') window[name] = globalThis[name]; } catch(e) {}
                try { if (typeof top !== 'undefined' && top !== window) top[name] = globalThis[name]; } catch(e) {}
            }
        } catch (e) { /* ignore */ }
    }

    // Wrap update params details to force visible styles after the original runs
    try {
        if (typeof globalThis !== 'undefined' && typeof globalThis.scRmUpdateParamsDetails === 'function') {
            var _origUpdateParams = globalThis.scRmUpdateParamsDetails;
            globalThis.scRmUpdateParamsDetails = function(rowId, parametersString) {
                try { _origUpdateParams(rowId, parametersString); } catch(e) { console.warn('scRm: original updateParams error', e); }
                try {
                    var row = document.getElementById(rowId);
                    if (row) {
                        var paramsDetails = row.querySelector('[data-params-details]');
                        if (paramsDetails) {
                            paramsDetails.style.display = 'block';
                            paramsDetails.style.visibility = 'visible';
                            paramsDetails.style.opacity = '1';
                            paramsDetails.style.maxHeight = 'none';
                            paramsDetails.removeAttribute('aria-hidden');
                            var header = row.querySelector('[data-params-header]');
                            var paramsRow = row.querySelector('[data-params-row]');
                            if (header) header.style.display = 'table-row';
                            if (paramsRow) paramsRow.style.display = 'table-row';
                        }
                    }
                } catch(e) { console.warn('scRm: wrapper updateParams error', e); }
            };
        }
    } catch (e) { /* ignore */ }

    // Copy functions now and again after DOM ready to ensure availability
    try { names.forEach(copyGlobal); } catch(e) {}
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function(){ try { names.forEach(copyGlobal); } catch(e){} });
    } else {
        try { names.forEach(copyGlobal); } catch(e) {}
    }

    // Backstop: once _scRmAllUidOptions is populated, ensure Key filter has run.
    // Guards against cases where scRmRefreshUidDropdowns ran in a different frame
    // context before scRmFilterKeyDropdowns was copied to that frame.
    (function pollKeyFilter() {
        setTimeout(function() {
            try {
                if (window._scRmKeyFilterCompleted) return; // already done
                var opts = window._scRmAllUidOptions;
                if (!opts || !opts.length) { pollKeyFilter(); return; } // not ready yet — retry
                var pageRids = {};
                opts.forEach(function(o) { if (o.renderingId) pageRids[o.renderingId.toUpperCase()] = true; });
                var ridList = Object.keys(pageRids);
                if (ridList.length && typeof window.scRmFilterKeyDropdowns === 'function') {
                    window.scRmFilterKeyDropdowns(ridList);
                }
            } catch(e) {}
        }, 1000); // run 1s after script load; by then AJAX/DOM-scan should have set _scRmAllUidOptions
    })();
})();

function scRmPopulateUidSelect(uidSelect, options, currentVal, noInstancesForKey) {
    while (uidSelect.options.length > 0) { uidSelect.remove(0); }
    var anyOpt = document.createElement('option');
    anyOpt.value = '';
    anyOpt.textContent = noInstancesForKey ? '-- No instances found --' : '-- Any instance --';
    uidSelect.appendChild(anyOpt);
    var foundCurrent = false;
    options.forEach(function(o) {
        var opt = document.createElement('option');
        opt.value = o.uid;
        opt.textContent = o.label;
        opt.title = o.uid || '';
        if (o.renderingId) { opt.dataset.renderingId = o.renderingId; }
        if (o.uid === currentVal) { opt.selected = true; foundCurrent = true; }
        uidSelect.appendChild(opt);
    });
    if (currentVal && !foundCurrent) {
        var custom = document.createElement('option');
        custom.value = currentVal;
        custom.textContent = currentVal;
        custom.selected = true;
        uidSelect.appendChild(custom);
        foundCurrent = true;
    }
    if (!currentVal || !foundCurrent) { anyOpt.selected = true; }
    uidSelect.disabled = !!noInstancesForKey;
    uidSelect.classList.toggle('scRmUidDisabled', !!noInstancesForKey);
}

// Filter and repopulate the UID dropdown for one row based on its Key (rendering-to-be-replaced).
globalThis.scRmFilterUidForRow = function(row, allowDisable) {
    var uidSelect = row.querySelector('select[id$="_Uid"]');
    if (!uidSelect) return;
    var keySelect = row.querySelector('select[id$="_Key"]');
    var keyVal = (keySelect && keySelect.value) ? keySelect.value.toUpperCase() : '';
    var allOptions = window._scRmAllUidOptions;
    if (allOptions) {
        var filtered = keyVal
            ? allOptions.filter(function(o) { return (o.renderingId || '').toUpperCase() === keyVal; })
            : allOptions;
        var noInstancesForKey = !!(allowDisable && keyVal && allOptions.length > 0 && filtered.length === 0);
        scRmPopulateUidSelect(uidSelect, filtered, uidSelect.value || '', noInstancesForKey);
    } else {
        // Fallback: hide DOM options whose data-rendering-id doesn't match Key
        var visibleCount = 0;
        var hiddenCount = 0;
        Array.from(uidSelect.options).forEach(function(opt) {
            if (!opt.value) return; // keep placeholder
            var rid = (opt.dataset.renderingId || '').toUpperCase();
            var hide = !!(keyVal && rid && rid !== keyVal);
            opt.hidden = hide;
            if (!hide) visibleCount++; else hiddenCount++;
        });
        var noInstances = !!(allowDisable && keyVal && visibleCount === 0 && hiddenCount > 0);
        uidSelect.disabled = noInstances;
        uidSelect.classList.toggle('scRmUidDisabled', noInstances);
        var placeholder = uidSelect.options[0];
        if (placeholder && !placeholder.value) {
            placeholder.textContent = noInstances ? '-- No instances found --' : '-- Any instance --';
        }
    }
};

// Refresh all UID dropdowns with new options from the server.
// Sets window._scRmAutoPopulateCompleted = true so E2E tests can poll for a stable state
// before interacting with dropdowns or opening dialogs.
globalThis.scRmRefreshUidDropdowns = function(options) {
    if (!Array.isArray(options)) return;
    window._scRmAllUidOptions = options;
    window._scRmAutoPopulateCompleted = true;
    // Derive page rendering IDs and apply Key dropdown CSS filter
    var pageRids = {};
    options.forEach(function(o) { if (o.renderingId) pageRids[o.renderingId.toUpperCase()] = true; });
    var ridList = Object.keys(pageRids);
    if (ridList.length) globalThis.scRmFilterKeyDropdowns(ridList);
    document.querySelectorAll('.scAdditionalParameters.scRmRow').forEach(function(row) {
        var uidSelect = row.querySelector('select[id$="_Uid"]');
        if (!uidSelect) return;
        var keySelect = row.querySelector('select[id$="_Key"]');
        var keyVal = (keySelect && keySelect.value) ? keySelect.value.toUpperCase() : '';
        var filtered = keyVal
            ? options.filter(function(o) { return (o.renderingId || '').toUpperCase() === keyVal; })
            : options;
        scRmPopulateUidSelect(uidSelect, filtered, uidSelect.value || '', false);
    });
};

// Filter Key dropdowns so only renderings present on the current ECP page remain visible.
// Called automatically from scRmRefreshUidDropdowns once page rendering IDs are known.
// Uses CSS hiding (style.display='none') so options are never destroyed — reversible.
// Sets window._scRmAllowedRenderingIds and window._scRmKeyFilterCompleted for E2E polling.
globalThis.scRmFilterKeyDropdowns = function(allowedIds) {
    window._scRmAllowedRenderingIds = Array.isArray(allowedIds) ? allowedIds : [];
    window._scRmKeyFilterCompleted = true;
    if (!Array.isArray(allowedIds) || !allowedIds.length) return;

    var allowed = {};
    allowedIds.forEach(function(id) { if (id) allowed[id.toUpperCase()] = true; });

    document.querySelectorAll('.scAdditionalParameters.scRmRow select[id$="_Key"]').forEach(function(sel) {
        Array.from(sel.querySelectorAll('optgroup')).forEach(function(og) {
            var anyVisible = false;
            Array.from(og.querySelectorAll('option')).forEach(function(opt) {
                if (!opt.value) return; // keep placeholder options
                var hide = !allowed[opt.value.toUpperCase()];
                opt.hidden = hide;
                opt.style.display = hide ? 'none' : '';
                if (!hide) anyVisible = true;
            });
            og.hidden = !anyVisible; // hide empty group headers
            og.style.display = anyVisible ? '' : 'none';
        });
    });
};

window.scRmAutoPopulate = function() {
    var rows = document.querySelectorAll('.scAdditionalParameters.scRmRow');
    if (!rows.length) { return false; }

    if (window._scRmAllUidOptions && window._scRmAllUidOptions.length > 0) {
        try { globalThis.scRmRefreshUidDropdowns(window._scRmAllUidOptions); } catch(e) {}
        return false;
    }
    var allOptions = [];
    var seen = {};
    var hasRenderingId = false;
    rows.forEach(function(row) {
        var sel = row.querySelector('select[id$="_Uid"]');
        if (!sel) return;
        Array.prototype.forEach.call(sel.options, function(opt) {
            if (!opt.value || seen[opt.value]) return;
            seen[opt.value] = true;
            var rid = opt.dataset ? (opt.dataset.renderingId || '') : '';
            if (rid) hasRenderingId = true;
            allOptions.push({
                uid: opt.value,
                label: opt.textContent || opt.value,
                renderingId: rid
            });
        });
    });
    if (allOptions.length > 0 && hasRenderingId) {
        window._scRmAllUidOptions = allOptions;
        window._scRmAutoPopulateCompleted = true;
        try { globalThis.scRmRefreshUidDropdowns(allOptions); } catch(e) {}
        return false;
    }

    var uid0 = rows[0].querySelector('select[id$="_Uid"]');
    if (!uid0) { return false; }
    var idx = uid0.id.indexOf('_Row');
    if (idx < 0) { return false; }
    var ctrlId = uid0.id.substring(0, idx);

    var ecrItemGuid = null;
    var el = rows[0].parentElement;
    while (el && el !== document.body && !ecrItemGuid) {
        if (el.id && /^Section_/.test(el.id)) {
            var m = el.id.match(/([0-9A-F]{8})([0-9A-F]{4})([0-9A-F]{4})([0-9A-F]{4})([0-9A-F]{12})$/i);
            if (m) { ecrItemGuid = '{' + m[1] + '-' + m[2] + '-' + m[3] + '-' + m[4] + '-' + m[5] + '}'; }
        }
        el = el.parentElement;
    }

    if (!ecrItemGuid) {
        var sections = document.querySelectorAll('[id^="Section_"]');
        for (var i = 0; i < sections.length && !ecrItemGuid; i++) {
            var m2 = sections[i].id.match(/([0-9A-F]{8})([0-9A-F]{4})([0-9A-F]{4})([0-9A-F]{4})([0-9A-F]{12})$/i);
            if (m2) { ecrItemGuid = '{' + m2[1] + '-' + m2[2] + '-' + m2[3] + '-' + m2[4] + '-' + m2[5] + '}'; }
        }
    }

    if (!ecrItemGuid) { return false; }

    try {
        scForm.invoke(ctrlId + '.AutoRefreshUidDropdowns("' + ecrItemGuid + '")');
        return true;
    } catch (e) {
        console.warn('scRm auto-populate failed', e);
        return false;
    }
};


