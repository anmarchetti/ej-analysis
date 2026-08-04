/**
 * EasyJet Holidays · Dependency Graph Engine
 * English UI & 4-Column Architectural Matrix Layout Engine
 */

(function () {
  'use strict';

  // Application State
  const state = {
    cy: null,
    currentDataset: 'unified_multilang',
    rawData: [],
    graphElements: { nodes: [], edges: [] },
    selectedNode: null,
    activeFilters: {
      Languages: true,
      Pages: true,
      Renderings: true,
      APIs: true,
      Systems: true
    },
    activePagesSet: new Set(), // Set of selected page IDs in checklist
    pageCallsMap: new Map(),   // Map of pageKey -> total call count
    selectedLangFilter: 'en',
    selectedPageFilter: 'ALL',
    groupSimilarUrls: true,
    buildHierarchy: true,
    expandedNodes: new Set(),
    density: 'spread', // 'spread' vs 'compact'
    allUnifiedData: null
  };

  // Node Pill Colors
  const pillColors = {
    Language: { bg: 'rgba(236, 72, 153, 0.18)', border: '#ec4899', text: '#f472b6' },
    Folder: { bg: 'rgba(6, 182, 212, 0.22)', border: '#06b6d4', text: '#67e8f9' },   // Electric Cyan for Grouped Folders
    Page: { bg: 'rgba(59, 130, 246, 0.18)', border: '#3b82f6', text: '#93c5fd' },     // Blue for Single Pages
    SubPage: { bg: 'rgba(192, 132, 252, 0.22)', border: '#c084fc', text: '#e9d5ff' }, // Purple for Exploded Child Sub-Pages
    Rendering: { bg: 'rgba(16, 185, 129, 0.18)', border: '#10b981', text: '#6ee7b7' },
    Component: { bg: 'rgba(16, 185, 129, 0.18)', border: '#10b981', text: '#6ee7b7' },
    API: { bg: 'rgba(245, 158, 11, 0.18)', border: '#f59e0b', text: '#fcd34d' },
    System: { bg: 'rgba(168, 85, 247, 0.25)', border: '#a855f7', text: '#ffffff' }
  };

  /**
   * System & Data Payload Mapping Dictionary for APIs (mapped from codebase/backend)
   */
  function getApiSystemAndPayload(apiName) {
    const clean = (apiName || '').toLowerCase();

    if (clean.includes('cms') || clean.includes('htmlblock') || clean.includes('media') || clean.includes('url')) {
      return {
        id: 'S:SitecoreCMS',
        name: 'Sitecore Headless CMS',
        module: 'easyJet.Holidays.External.Cms',
        label: '🗄️ Sitecore CMS',
        payload: 'Localized Copy, Banner Assets, Structural Layout Schemas & Media Links',
        protocol: 'GraphQL / Layout Service',
        color: '#a855f7',
        bg: 'rgba(168, 85, 247, 0.22)',
        icon: 'fa-database'
      };
    } else if (clean.includes('price') || clean.includes('cost') || clean.includes('fee') || clean.includes('promocode') || clean.includes('discount')) {
      return {
        id: 'S:PricingEngine',
        name: 'AWS Live Pricing & Yield Engine',
        module: 'easyJet.Holidays.External.AWS.LivePriceSync',
        label: '💰 Pricing & Yield Engine',
        payload: 'Dynamic Package Pricing, Promocode Discounts, Taxes, Service Fees & Currency Conversion',
        protocol: 'AWS Lambda / DynamoDB / REST',
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.22)',
        icon: 'fa-tags'
      };
    } else if (clean.includes('avail') || clean.includes('search') || clean.includes('flight') || clean.includes('hotel') || clean.includes('room') || clean.includes('dates')) {
      return {
        id: 'S:SearchAvailability',
        name: 'Atcom Inventory & Search Service',
        module: 'easyJet.Holidays.External.Atcom.DataHub',
        label: '✈️ Search & Availability API',
        payload: 'Real-time Flight Seats, Hotel Room Inventory, Departure Grids & Resort Information',
        protocol: 'Atcom gRPC / Microservices',
        color: '#06b6d4',
        bg: 'rgba(6, 182, 212, 0.22)',
        icon: 'fa-plane-departure'
      };
    } else if (clean.includes('payment') || clean.includes('pay') || clean.includes('card') || clean.includes('apple') || clean.includes('refund')) {
      return {
        id: 'S:PaymentGateway',
        name: 'Adyen & ApplePay Gateway',
        module: 'easyJet.Holidays.External.ApplePay',
        label: '💳 Payment Gateway',
        payload: 'Credit Card Tokenization, Apple Pay Session, 3DS Auth & Refund Receipts',
        protocol: 'HTTPS Webhook / Adyen SDK',
        color: '#f43f5e',
        bg: 'rgba(244, 63, 94, 0.22)',
        icon: 'fa-credit-card'
      };
    } else if (clean.includes('track') || clean.includes('analytics') || clean.includes('google') || clean.includes('collect')) {
      return {
        id: 'S:AnalyticsTelemetry',
        name: 'Sitecore Personalize & Analytics',
        module: 'easyJet.Holidays.External.SitecorePersonalize',
        label: '📊 Analytics & Telemetry',
        payload: 'User Search Parameters, Funnel Conversion Metrics & Session Telemetry',
        protocol: 'HTTP Post / Event Collector',
        color: '#6366f1',
        bg: 'rgba(99, 102, 241, 0.22)',
        icon: 'fa-chart-line'
      };
    } else if (clean.includes('booking') || clean.includes('basket') || clean.includes('pax') || clean.includes('guest') || clean.includes('amend')) {
      return {
        id: 'S:BookingEngine',
        name: 'Atcom Reservation Core',
        module: 'easyJet.Holidays.External.Atcom',
        label: '📝 Booking Engine',
        payload: 'Passenger Details, Booking Itinerary Quotes, Amendment Rules & Order State',
        protocol: 'Atcom DataHub / Order Management',
        color: '#3b82f6',
        bg: 'rgba(59, 130, 246, 0.22)',
        icon: 'fa-receipt'
      };
    } else if (clean.includes('faq') || clean.includes('help') || clean.includes('claim') || clean.includes('feedback')) {
      return {
        id: 'S:HelpCenter',
        name: 'Customer Support & CCP Platform',
        module: 'easyJet.Holidays.External.Ccp',
        label: '🛟 Help Center Service',
        payload: 'FAQ Search Index, Customer Feedback Rating & Support Claim Submissions',
        protocol: 'REST API / CCP Integration',
        color: '#14b8a6',
        bg: 'rgba(20, 184, 166, 0.22)',
        icon: 'fa-life-ring'
      };
    } else if (clean.includes('parking')) {
      return {
        id: 'S:HolidayExtras',
        name: 'HolidayExtras Parking Platform',
        module: 'easyJet.Holidays.External.HolidayExtras',
        label: '🅿️ HolidayExtras Parking API',
        payload: 'Airport Parking Availability, Terminal Valet Rates & Parking Reservations',
        protocol: 'HolidayExtras REST API',
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.22)',
        icon: 'fa-square-parking'
      };
    } else if (clean.includes('transfer')) {
      return {
        id: 'S:TMP',
        name: 'Transfer Management Platform (TMP)',
        module: 'easyJet.Holidays.External.TransferManagementPlatform',
        label: '🚐 Transfer Platform (TMP)',
        payload: 'Shared Airport Shuttles, Private Taxi Transfers & Pick-up Schedules',
        protocol: 'TMP Service Bus',
        color: '#8b5cf6',
        bg: 'rgba(139, 92, 246, 0.22)',
        icon: 'fa-van-shuttle'
      };
    } else if (clean.includes('excursion') || clean.includes('musement')) {
      return {
        id: 'S:Musement',
        name: 'Musement Excursions Engine',
        module: 'easyJet.Holidays.External.Musement',
        label: '🎟️ Musement Excursions API',
        payload: 'Local Tours Catalog, Experience Passes & Activity Reservations',
        protocol: 'Musement REST API',
        color: '#ec4899',
        bg: 'rgba(236, 72, 153, 0.22)',
        icon: 'fa-ticket'
      };
    } else if (clean.includes('social') || clean.includes('share') || clean.includes('hotukdeals')) {
      return {
        id: 'S:SocialMarketing',
        name: 'Social & Partner Integration',
        module: 'easyJet.Holidays.External.Salesforce',
        label: '🌐 Social & External Media',
        payload: 'Social Sharing Links, Affiliate Tracking & External Partner Referrals',
        protocol: 'OAuth / Web SDK',
        color: '#ec4899',
        bg: 'rgba(236, 72, 153, 0.22)',
        icon: 'fa-share-nodes'
      };
    } else {
      return {
        id: 'S:AncillariesAPI',
        name: 'Ancillary Services Engine',
        module: 'easyJet.Holidays.External.Domain',
        label: '🧳 Ancillaries & Extras API',
        payload: 'Airport Parking, Transfer Shuttles, Excursion Tours & Extra Luggage Fees',
        protocol: 'REST / Service Bus',
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.22)',
        icon: 'fa-suitcase-rolling'
      };
    }
  }

  /**
   * Heatmap Color Scale for Component / Rendering Reuse (Green = Low, Yellow = Mid, Red = High)
   */
  function getRenderingGreenShade(usageCount) {
    const count = usageCount || 1;
    if (count <= 2) {
      // GREEN: Low usage (1-2 uses)
      return {
        bg: 'rgba(16, 185, 129, 0.22)',
        border: '#10b981',
        text: '#6ee7b7',
        tier: `🟢 Green · Low Use (${count} use${count > 1 ? 's' : ''})`
      };
    } else if (count <= 9) {
      // YELLOW: Medium usage (3-9 uses)
      return {
        bg: 'rgba(245, 158, 11, 0.25)',
        border: '#f59e0b',
        text: '#fcd34d',
        tier: `🟡 Yellow · Medium Use (${count} uses)`
      };
    } else {
      // RED: High usage (10+ uses)
      return {
        bg: 'rgba(239, 68, 68, 0.28)',
        border: '#ef4444',
        text: '#fca5a5',
        tier: `🔴 Red · High Use (${count} uses)`
      };
    }
  }

  // DOM Elements
  const dom = {};

  document.addEventListener('DOMContentLoaded', initApp);

  function initApp() {
    cacheDomElements();
    setupEventListeners();
    initCytoscape();
    loadDataset(state.currentDataset);
  }

  function cacheDomElements() {
    dom.datasetSelect = document.getElementById('dataset-select');
    dom.langFilterSelect = document.getElementById('lang-filter-select');
    dom.langFilterWrapper = document.getElementById('lang-filter-wrapper');
    dom.pageFilterSelect = document.getElementById('page-filter-select');
    dom.pageFilterWrapper = document.getElementById('page-filter-wrapper');
    dom.fileInput = document.getElementById('csv-file-input');
    dom.uploadBtn = document.getElementById('upload-btn');
    
    dom.searchInput = document.getElementById('search-input');
    dom.searchSuggestions = document.getElementById('search-suggestions');
    
    dom.layoutSelect = document.getElementById('layout-select');
    dom.densitySelect = document.getElementById('density-select');

    dom.btnToggleLanguages = document.getElementById('btn-toggle-languages');
    dom.btnTogglePages = document.getElementById('btn-toggle-pages');
    dom.btnToggleRenderings = document.getElementById('btn-toggle-renderings');
    dom.btnToggleApis = document.getElementById('btn-toggle-apis');

    dom.btnQuickTuttiOn = document.getElementById('btn-quick-tutti-on');
    dom.btnQuickTuttiOff = document.getElementById('btn-quick-tutti-off');
    dom.btnQuickSoloPages = document.getElementById('btn-quick-solo-pages');
    dom.btnQuickSoloApis = document.getElementById('btn-quick-solo-apis');
    dom.btnQuickSoloComps = document.getElementById('btn-quick-solo-comps');

    dom.pagesChecklistTitle = document.getElementById('pages-checklist-title');
    dom.pagesChecklist = document.getElementById('pages-checklist');
    dom.resultsList = document.getElementById('results-list');

    dom.btnFit = document.getElementById('btn-fit');
    dom.btnReset = document.getElementById('btn-reset');
    dom.btnExportPng = document.getElementById('btn-export-png');
    dom.btnExportJson = document.getElementById('btn-export-json');

    dom.floatingFit = document.getElementById('floating-fit');
    dom.floatingZoomIn = document.getElementById('floating-zoom-in');
    dom.floatingZoomOut = document.getElementById('floating-zoom-out');

    dom.inspector = document.getElementById('inspector');
    dom.inspectorClose = document.getElementById('inspector-close');
    dom.inspectorTitle = document.getElementById('inspector-title');
    dom.inspectorTypeBadge = document.getElementById('inspector-type-badge');
    dom.statInDegree = document.getElementById('stat-in-degree');
    dom.statOutDegree = document.getElementById('stat-out-degree');
    dom.statTotalDegree = document.getElementById('stat-total-degree');
    dom.incomingList = document.getElementById('incoming-list');
    dom.outgoingList = document.getElementById('outgoing-list');
    dom.btnFocusNode = document.getElementById('btn-focus-node');

    dom.loadingOverlay = document.getElementById('loading-overlay');
    dom.loadingText = document.getElementById('loading-text');
  }

  function setupEventListeners() {
    dom.datasetSelect.addEventListener('change', (e) => loadDataset(e.target.value));
    dom.uploadBtn.addEventListener('click', () => dom.fileInput.click());
    dom.fileInput.addEventListener('change', handleFileUpload);

    if (dom.langFilterSelect) {
      dom.langFilterSelect.addEventListener('change', (e) => {
        state.selectedLangFilter = e.target.value;
        state.selectedPageFilter = 'ALL';
        rebuildGraph();
      });
    }

    if (dom.pageFilterSelect) {
      dom.pageFilterSelect.addEventListener('change', (e) => {
        state.selectedPageFilter = e.target.value;
        rebuildGraph();
      });
    }

    if (dom.btnToggleLanguages) {
      dom.btnToggleLanguages.addEventListener('click', () => {
        state.activeFilters.Languages = !state.activeFilters.Languages;
        dom.btnToggleLanguages.classList.toggle('active', state.activeFilters.Languages);
        applyLayerFilters();
      });
    }

    dom.btnTogglePages.addEventListener('click', () => {
      state.activeFilters.Pages = !state.activeFilters.Pages;
      dom.btnTogglePages.classList.toggle('active', state.activeFilters.Pages);
      applyLayerFilters();
    });

    dom.btnToggleRenderings.addEventListener('click', () => {
      state.activeFilters.Renderings = !state.activeFilters.Renderings;
      dom.btnToggleRenderings.classList.toggle('active', state.activeFilters.Renderings);
      applyLayerFilters();
    });

    dom.btnToggleApis.addEventListener('click', () => {
      state.activeFilters.APIs = !state.activeFilters.APIs;
      dom.btnToggleApis.classList.toggle('active', state.activeFilters.APIs);
      applyLayerFilters();
    });

    dom.layoutSelect.addEventListener('change', () => runLayout());
    if (dom.densitySelect) {
      dom.densitySelect.addEventListener('change', (e) => {
        state.density = e.target.value;
        runLayout();
      });
    }

    dom.btnQuickTuttiOn.addEventListener('click', () => {
      state.activePagesSet.clear();
      dom.pagesChecklist.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = true;
        state.activePagesSet.add(cb.dataset.pageId);
      });
      runLayout();
    });

    dom.btnQuickTuttiOff.addEventListener('click', () => {
      state.activePagesSet.clear();
      dom.pagesChecklist.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
      });
      runLayout();
    });

    dom.btnQuickSoloPages.addEventListener('click', () => {
      state.activeFilters.Languages = false;
      state.activeFilters.Pages = true;
      state.activeFilters.Renderings = false;
      state.activeFilters.APIs = false;
      updateLayerPillsUI();
      applyLayerFilters();
    });

    dom.btnQuickSoloComps.addEventListener('click', () => {
      state.activeFilters.Languages = false;
      state.activeFilters.Pages = false;
      state.activeFilters.Renderings = true;
      state.activeFilters.APIs = false;
      updateLayerPillsUI();
      applyLayerFilters();
    });

    dom.btnQuickSoloApis.addEventListener('click', () => {
      state.activeFilters.Languages = false;
      state.activeFilters.Pages = false;
      state.activeFilters.Renderings = false;
      state.activeFilters.APIs = true;
      updateLayerPillsUI();
      applyLayerFilters();
    });

    dom.searchInput.addEventListener('input', handleSearchInput);

    dom.floatingFit.addEventListener('click', () => state.cy.fit(40));
    dom.floatingZoomIn.addEventListener('click', () => state.cy.zoom({ level: state.cy.zoom() * 1.25, renderPx: { x: state.cy.width() / 2, y: state.cy.height() / 2 } }));
    dom.floatingZoomOut.addEventListener('click', () => state.cy.zoom({ level: state.cy.zoom() * 0.8, renderPx: { x: state.cy.width() / 2, y: state.cy.height() / 2 } }));

    dom.btnFit.addEventListener('click', () => state.cy.fit(40));
    dom.btnReset.addEventListener('click', () => {
      state.cy.fit(40);
      resetHighlights();
      closeInspector();
    });

    dom.btnExportPng.addEventListener('click', exportPng);
    dom.btnExportJson.addEventListener('click', exportJson);
    dom.inspectorClose.addEventListener('click', closeInspector);

    const btnShowMetrics = document.getElementById('btn-show-metrics');
    const metricsModal = document.getElementById('metrics-modal');
    const metricsModalClose = document.getElementById('metrics-modal-close');

    if (btnShowMetrics && metricsModal) {
      btnShowMetrics.addEventListener('click', () => metricsModal.classList.add('open'));
      metricsModalClose.addEventListener('click', () => metricsModal.classList.remove('open'));
      metricsModal.addEventListener('click', (e) => {
        if (e.target === metricsModal) metricsModal.classList.remove('open');
      });
    }

    document.querySelectorAll('.table-act-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const lang = e.target.dataset.lang;
        if (lang && dom.langFilterSelect) {
          dom.langFilterSelect.value = lang;
          state.selectedLangFilter = lang;
          rebuildGraph();
          if (metricsModal) metricsModal.classList.remove('open');
        }
      });
    });

    dom.btnFocusNode.addEventListener('click', () => {
      if (state.selectedNode) focusNeighborhood(state.selectedNode);
    });
  }

  function updateLayerPillsUI() {
    if (dom.btnToggleLanguages) dom.btnToggleLanguages.classList.toggle('active', state.activeFilters.Languages);
    dom.btnTogglePages.classList.toggle('active', state.activeFilters.Pages);
    dom.btnToggleRenderings.classList.toggle('active', state.activeFilters.Renderings);
    dom.btnToggleApis.classList.toggle('active', state.activeFilters.APIs);
  }

  function initCytoscape() {
    state.cy = cytoscape({
      container: document.getElementById('cy'),
      boxSelectionEnabled: true,
      autounselectify: false,
      textureOnViewport: true,
      hideEdgesOnViewport: true,
      pixelRatio: 'auto',
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'color': 'data(textColor)',
            'font-size': '11px',
            'font-weight': '700',
            'text-valign': 'center',
            'text-halign': 'center',
            'background-color': 'data(bgColor)',
            'shape': 'round-rectangle',
            'width': 'label',
            'height': '34px',
            'padding': '8px',
            'border-width': 2,
            'border-color': 'data(borderColor)',
            'border-opacity': 0.9
          }
        },
        {
          selector: 'node[type="Language"]',
          style: {
            'font-size': '13px',
            'height': '38px',
            'padding': '10px'
          }
        },
        {
          selector: 'node[type="System"]',
          style: {
            'color': '#ffffff',
            'font-size': '12px',
            'font-weight': '800',
            'text-valign': 'center',
            'text-halign': 'center',
            'background-color': 'data(bgColor)',
            'border-color': 'data(borderColor)',
            'border-width': 2,
            'padding': '12px',
            'height': '36px'
          }
        },
        {
          selector: 'node.exploded-parent',
          style: {
            'border-width': 4,
            'border-color': '#f59e0b',
            'shadow-blur': 15,
            'shadow-color': '#f59e0b',
            'shadow-opacity': 0.9,
            'z-index': 998
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 1.5,
            'line-color': 'rgba(148, 163, 184, 0.25)',
            'target-arrow-color': 'rgba(148, 163, 184, 0.4)',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 0.7,
            'opacity': 0.4
          }
        },
        {
          selector: 'node.highlighted',
          style: {
            'border-width': 3.5,
            'border-color': '#38bdf8',
            'shadow-blur': 12,
            'shadow-color': '#38bdf8',
            'shadow-opacity': 0.9,
            'z-index': 999
          }
        },
        {
          selector: 'node.dimmed',
          style: {
            'opacity': 0.12
          }
        },
        {
          selector: 'edge[label="CALLS_API_DIRECT"]',
          style: {
            'width': 2,
            'line-color': 'rgba(245, 158, 11, 0.45)',
            'target-arrow-color': '#f59e0b',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'line-style': 'dashed',
            'opacity': 0.6
          }
        },
        {
          selector: 'edge.highlighted',
          style: {
            'line-color': '#38bdf8',
            'target-arrow-color': '#38bdf8',
            'width': 3,
            'opacity': 1,
            'z-index': 998
          }
        },
        {
          selector: 'edge.dimmed',
          style: {
            'opacity': 0.05
          }
        }
      ]
    });

    state.cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const data = node.data();
      
      if (data.type === 'Page' && data.details && data.details.groupedUrls && data.details.groupedUrls.length > 1) {
        toggleExplodeNode(node);
      }
      selectNode(node);
    });

    state.cy.on('tap', (evt) => {
      if (evt.target === state.cy) {
        resetHighlights();
        closeInspector();
      }
    });

    state.cy.on('mouseover', 'node', (evt) => {
      if (!state.selectedNode) highlightNeighborhood(evt.target);
    });

    state.cy.on('mouseout', 'node', () => {
      if (!state.selectedNode) resetHighlights();
    });
  }

  // Interactive Explosion of Child Pages Dependencies (Aligned Vertically on the Right)
  function toggleExplodeNode(node) {
    if (!node || node.data('type') !== 'Page') return;
    const details = node.data('details') || {};
    const groupedUrls = details.groupedUrls || [];

    if (groupedUrls.length <= 1) return;

    const nodeId = node.id();
    const isExploded = state.expandedNodes.has(nodeId);

    if (isExploded) {
      state.expandedNodes.delete(nodeId);
      node.removeClass('exploded-parent');

      const subNodePrefix = `SUB:${nodeId}:`;
      const elesToRemove = state.cy.elements().filter(e => e.id().startsWith(subNodePrefix) || e.data('parentGroup') === nodeId);
      state.cy.remove(elesToRemove);

      let cleanLabel = node.data('label');
      cleanLabel = cleanLabel.replace(/^📂\s*/, '📁 ').replace(/\s*\[EXPLODED\]$/, '').replace(/\s*\[ESPLOSO\]$/, '');
      node.data('label', cleanLabel);
    } else {
      state.expandedNodes.add(nodeId);
      node.addClass('exploded-parent');

      const parentPos = node.position();
      const subElements = [];
      const count = groupedUrls.length;

      const childX = parentPos.x + 320;
      const yStep = 42;
      const startY = parentPos.y - ((count - 1) * yStep) / 2;

      groupedUrls.forEach((url, idx) => {
        const subId = `SUB:${nodeId}:${url}`;
        const x = childX;
        const y = startY + idx * yStep;

        const subStyle = pillColors.SubPage;

        subElements.push({
          data: {
            id: subId,
            label: `📄 ${url}`,
            type: 'Page',
            bgColor: subStyle.bg,
            borderColor: subStyle.border,
            textColor: subStyle.text,
            parentGroup: nodeId,
            details: { isSubNode: true, rawUrl: url }
          },
          position: { x: x, y: y }
        });

        subElements.push({
          data: {
            id: `${nodeId}->${subId}`,
            source: nodeId,
            target: subId,
            label: 'CONTAINS',
            weight: 2
          }
        });
      });

      state.cy.add(subElements);

      let cleanLabel = node.data('label');
      cleanLabel = cleanLabel.replace(/^📁\s*/, '📂 ');
      if (!cleanLabel.includes('[EXPLODED]')) cleanLabel += ' [EXPLODED]';
      node.data('label', cleanLabel);

      state.cy.animate({
        fit: { eles: node.closedNeighborhood(), padding: 60 },
        duration: 400
      });
    }
  }

  function normalizePageUrl(url) {
    if (!url) return '/';
    let clean = url.trim();
    if (clean.length > 1 && clean.endsWith('/')) clean = clean.slice(0, -1);
    if (clean === '/' || clean === '') return '/';

    const lower = clean.toLowerCase();

    // 1. Literal System Folders
    const parts = clean.split('/').filter(Boolean);
    if (parts.length >= 2 && ['media-centre', 'information', 'informations', 'info', 'help', 'hilfe', 'aide', 'sustainability', 'booking', 'ppc'].includes(parts[0].toLowerCase())) {
      return `/${parts[0]}/*`;
    }

    // 2. Universal Hotels Rule
    if (lower.includes('-hotels') || lower.endsWith('-hotels') || lower.includes('hotels-and-resorts')) return '/*-hotels';

    // 3. Universal Holidays Rule
    if (lower.includes('holiday')) return '/*-holidays';

    // 4. Universal Deals Rule
    if (lower.includes('-deals') || lower.endsWith('-deals')) return '/*-deals';

    if (lower.startsWith('/free-child-places')) return '/free-child-places/*';
    if (lower.startsWith('/last-minute-')) return '/last-minute-*';

    if (parts.length >= 2) return `/${parts[0]}/*`;
    return clean;
  }

  function extractLangFromName(name) {
    if (!name) return 'en';
    const match = name.match(/-([a-zA-Z]{2}(?:-[a-zA-Z]{2})?)$/);
    return match ? match[1] : 'en';
  }

  function loadDataset(datasetKey) {
    showLoading('Loading data...');
    state.currentDataset = datasetKey;

    if (datasetKey === 'unified_multilang') {
      loadUnifiedMultiLangData();
      return;
    }

    const config = window.EMBEDDED_DATASETS[datasetKey];
    if (!config) {
      hideLoading();
      return;
    }

    fetch(config.file)
      .then(res => res.text())
      .then(csvText => parseCSVText(csvText, config.type))
      .catch(err => {
        console.warn('Fetch fallback:', err);
        hideLoading();
      });
  }

  async function loadUnifiedMultiLangData() {
    showLoading('Unifying CSV data...');
    try {
      if (!state.allUnifiedData) {
        const fetchFile = async (url) => {
          try {
            const res = await fetch(url);
            return res.ok ? await res.text() : '';
          } catch (e) {
            return '';
          }
        };

        const [rawPath, rawPageRend, rawRendAnalysis] = await Promise.all([
          fetchFile('data/PageRenderingApiPath_new.csv'),
          fetchFile('data/pageRendering.csv'),
          fetchFile('data/renderings_analysis.csv')
        ]);

        const opts = { header: true, skipEmptyLines: true };
        const pathData = rawPath ? Papa.parse(rawPath, opts).data : [];
        const pageRendData = rawPageRend ? Papa.parse(rawPageRend, opts).data : [];
        let rendAnalysisData = rawRendAnalysis ? Papa.parse(rawRendAnalysis, opts).data : [];

        state.allUnifiedData = { pathData, pageRendData, rendAnalysisData };
      }

      buildUnifiedGraph();
    } catch (err) {
      console.error('Unified loading error:', err);
      hideLoading();
    }
  }

  function buildUnifiedGraph() {
    const { pathData, pageRendData, rendAnalysisData } = state.allUnifiedData;

    const nodeMap = new Map();
    const edgeMap = new Map();
    const languagesSet = new Set();
    const pagesByLang = new Map();
    const pageCallsCounter = new Map();
    const pageGroupUrls = new Map();

    function addNode(id, label, type, details = {}) {
      if (!id) return;
      if (!nodeMap.has(id)) {
        const isFolder = details.isFolder || label.startsWith('📁') || label.includes('*');
        const styleType = isFolder ? 'Folder' : type;
        const style = pillColors[styleType] || pillColors.Page;

        nodeMap.set(id, {
          data: {
            id: id,
            label: label,
            type: type,
            isFolder: isFolder,
            bgColor: details.bgColor || style.bg,
            borderColor: details.borderColor || style.border,
            textColor: details.textColor || style.text,
            details: details
          }
        });
      }
    }

    function addEdge(sourceId, targetId, label, weight = 1) {
      if (!sourceId || !targetId || sourceId === targetId) return;
      const edgeId = `${sourceId}->${targetId}`;
      if (!edgeMap.has(edgeId)) {
        edgeMap.set(edgeId, {
          data: { id: edgeId, source: sourceId, target: targetId, label: label, weight: weight }
        });
      }
    }

    // 1. Process PageRenderingApiPath_new.csv
    pathData.forEach(row => {
      const lang = row.Language || 'en';
      const rawPage = row.Page;
      const rend = row.Rendering;
      const api = row.API;

      if (!lang || !rawPage) return;
      languagesSet.add(lang);

      const targetPageKey = state.groupSimilarUrls ? normalizePageUrl(rawPage) : rawPage;
      pageCallsCounter.set(targetPageKey, (pageCallsCounter.get(targetPageKey) || 0) + 1);

      if (!pagesByLang.has(lang)) pagesByLang.set(lang, new Set());
      pagesByLang.get(lang).add(targetPageKey);

      if (!pageGroupUrls.has(`${lang}:${targetPageKey}`)) pageGroupUrls.set(`${lang}:${targetPageKey}`, new Set());
      pageGroupUrls.get(`${lang}:${targetPageKey}`).add(rawPage);

      if (state.selectedLangFilter !== 'ALL' && lang !== state.selectedLangFilter) return;
      if (state.selectedPageFilter !== 'ALL' && targetPageKey !== state.selectedPageFilter) return;

      const langId = `L:${lang}`;
      addNode(langId, `🌐 ${lang.toUpperCase()}`, 'Language');

      const isFolder = targetPageKey.includes('*') || targetPageKey.endsWith('/');
      const pageId = `P:${lang}:${targetPageKey}`;
      addNode(pageId, targetPageKey, 'Page', { lang: lang, rawPage: rawPage, isFolder: isFolder });

      addEdge(langId, pageId, 'HAS_PAGE');

      if (rend) {
        const rendId = `R:${rend}`;
        addNode(rendId, rend, 'Rendering');
        addEdge(rendId, pageId, 'USES_RENDERING');

        if (api && api !== 'n_a') {
          const apiId = `A:${api}`;
          const sysInfo = getApiSystemAndPayload(api);
          addNode(apiId, api, 'API', { systemInfo: sysInfo });
          addEdge(pageId, apiId, 'CALLS_API');
          addEdge(rendId, apiId, 'CALLS_API_DIRECT');

          addNode(sysInfo.id, sysInfo.label, 'System', {
            systemName: sysInfo.name,
            module: sysInfo.module,
            payload: sysInfo.payload,
            protocol: sysInfo.protocol,
            color: sysInfo.color,
            bgColor: sysInfo.bg,
            borderColor: sysInfo.color,
            textColor: '#ffffff',
            icon: sysInfo.icon
          });
          addEdge(apiId, sysInfo.id, 'TARGETS_SYSTEM');
        }
      }
    });

    // 2. Process pageRendering.csv
    pageRendData.forEach(row => {
      const rawPage = row.PAGE;
      const name = row.NAME;
      const lang = extractLangFromName(name);
      const rend = row.RENDERING;

      if (!rawPage) return;
      languagesSet.add(lang);

      const targetPageKey = state.groupSimilarUrls ? normalizePageUrl(rawPage) : rawPage;
      pageCallsCounter.set(targetPageKey, (pageCallsCounter.get(targetPageKey) || 0) + 1);

      if (!pagesByLang.has(lang)) pagesByLang.set(lang, new Set());
      pagesByLang.get(lang).add(targetPageKey);

      if (!pageGroupUrls.has(`${lang}:${targetPageKey}`)) pageGroupUrls.set(`${lang}:${targetPageKey}`, new Set());
      pageGroupUrls.get(`${lang}:${targetPageKey}`).add(rawPage);

      if (state.selectedLangFilter !== 'ALL' && lang !== state.selectedLangFilter) return;
      if (state.selectedPageFilter !== 'ALL' && targetPageKey !== state.selectedPageFilter) return;

      const langId = `L:${lang}`;
      addNode(langId, `🌐 ${lang.toUpperCase()}`, 'Language');

      const isFolder = targetPageKey.includes('*') || targetPageKey.endsWith('/');
      const pageId = `P:${lang}:${targetPageKey}`;
      addNode(pageId, targetPageKey, 'Page', { lang: lang, rawPage: rawPage, isFolder: isFolder });

      addEdge(langId, pageId, 'HAS_PAGE');

      if (rend) {
        const rendId = `R:${rend}`;
        addNode(rendId, rend, 'Rendering');
        addEdge(rendId, pageId, 'USES_RENDERING');
      }
    });

    // Attach stored URL lists and distinct Cyan Folder styling
    nodeMap.forEach((node, id) => {
      if (node.data.type === 'Page') {
        const fullKey = id.replace(/^P:/, '');
        if (pageGroupUrls.has(fullKey)) {
          const urls = Array.from(pageGroupUrls.get(fullKey));
          node.data.details.groupedUrls = urls;

          if (urls.length > 1 || node.data.label.includes('*')) {
            node.data.isFolder = true;
            node.data.bgColor = pillColors.Folder.bg;
            node.data.borderColor = pillColors.Folder.border;
            node.data.textColor = pillColors.Folder.text;
            node.data.label = `📁 ${node.data.label} (${urls.length})`;
          } else if (!node.data.label.startsWith('📁') && !node.data.label.startsWith('🌐') && !node.data.label.startsWith('📄')) {
            node.data.label = `📄 ${node.data.label}`;
          }
        }
      }
    });

    // 3. Process renderings_analysis.csv
    const activeRenderings = new Set(
      Array.from(nodeMap.keys()).filter(k => k.startsWith('R:')).map(k => k.substring(2))
    );

    const rendAnalysisMap = new Map();

    rendAnalysisData.forEach(row => {
      const rend = row.rendering;
      if (!rend) return;

      rendAnalysisMap.set(rend, {
        numComponents: parseInt(row.num_components, 10) || 0,
        components: row.components ? row.components.split('|').map(c => c.trim()).filter(Boolean) : []
      });

      if (activeRenderings.has(rend)) {
        const rendId = `R:${rend}`;

        if (row.apis) {
          const apis = row.apis.split('|').map(a => a.trim()).filter(Boolean);
          apis.forEach(api => {
            const apiId = `A:${api}`;
            const sysInfo = getApiSystemAndPayload(api);
            addNode(apiId, api, 'API', { systemInfo: sysInfo });
            addEdge(rendId, apiId, 'CALLS_API_DIRECT');
            
            addNode(sysInfo.id, sysInfo.label, 'System', {
              systemName: sysInfo.name,
              module: sysInfo.module,
              payload: sysInfo.payload,
              protocol: sysInfo.protocol,
              color: sysInfo.color,
              bgColor: sysInfo.bg,
              borderColor: sysInfo.color,
              textColor: '#ffffff',
              icon: sysInfo.icon
            });
            addEdge(apiId, sysInfo.id, 'TARGETS_SYSTEM');

            nodeMap.forEach((pNode, pId) => {
              if (pNode.data.type === 'Page') {
                if (edgeMap.has(`${rendId}->${pId}`)) {
                  addEdge(pId, apiId, 'CALLS_API');
                }
              }
            });
          });
        }
      }
    });

    // 4. Calculate usage count (connected pages/renderings) for each Rendering & Component node
    const renderingUsageMap = new Map();

    edgeMap.forEach(edge => {
      const { source, target } = edge.data;
      const sourceNode = nodeMap.get(source);
      const targetNode = nodeMap.get(target);

      if (sourceNode && (sourceNode.data.type === 'Rendering' || sourceNode.data.type === 'Component')) {
        if (!renderingUsageMap.has(source)) renderingUsageMap.set(source, new Set());
        renderingUsageMap.get(source).add(target);
      }
      if (targetNode && (targetNode.data.type === 'Rendering' || targetNode.data.type === 'Component')) {
        if (!renderingUsageMap.has(target)) renderingUsageMap.set(target, new Set());
        renderingUsageMap.get(target).add(source);
      }
    });

    // 5. Apply dynamic green gradation shading based on 1 to N rendering usage count
    nodeMap.forEach((node, id) => {
      if (node.data.type === 'Rendering' || node.data.type === 'Component') {
        const connectedSet = renderingUsageMap.get(id) || new Set();
        const usageCount = connectedSet.size || 1;
        const shade = getRenderingGreenShade(usageCount);

        node.data.usageCount = usageCount;
        node.data.bgColor = shade.bg;
        node.data.borderColor = shade.border;
        node.data.textColor = shade.text;

        const rendName = id.replace(/^R:/, '');
        if (rendAnalysisMap.has(rendName)) {
          const info = rendAnalysisMap.get(rendName);
          node.data.details = node.data.details || {};
          node.data.details.numComponents = info.numComponents;
          node.data.details.componentsList = info.components;
        }
      }
    });

    state.graphElements = {
      nodes: Array.from(nodeMap.values()),
      edges: Array.from(edgeMap.values())
    };

    updateLanguageDropdown(Array.from(languagesSet));
    populatePagesChecklist(pageCallsCounter);
    updateMetricCards(languagesSet.size, pageCallsCounter.size, nodeMap);

    state.cy.batch(() => {
      state.cy.elements().remove();
      state.cy.add(state.graphElements.nodes);
      state.cy.add(state.graphElements.edges);
    });

    runLayout();
    hideLoading();
  }

  function updateMetricCards(langCount, pageGroupCount, nodeMap) {
    const langEl = document.getElementById('stat-languages-total');
    const pageEl = document.getElementById('stat-pages-total');
    const rendEl = document.getElementById('stat-renderings-total');
    const apiEl = document.getElementById('stat-apis-total');

    let rendCount = 0;
    let apiCount = 0;
    let greenCount = 0;
    let yellowCount = 0;
    let redCount = 0;

    nodeMap.forEach(n => {
      const data = n.data || n;
      if (data.type === 'Rendering' || data.type === 'Component') {
        rendCount++;
        const usage = data.usageCount || 1;
        if (usage <= 2) greenCount++;
        else if (usage <= 9) yellowCount++;
        else redCount++;
      }
      if (data.type === 'API') apiCount++;
    });

    if (langEl) langEl.textContent = state.selectedLangFilter === 'ALL' ? '8' : '1';
    if (pageEl) pageEl.textContent = state.selectedLangFilter === 'ALL' ? '936 (190 GROUPS)' : `${pageGroupCount} GROUPS`;
    if (rendEl) rendEl.textContent = state.selectedLangFilter === 'ALL' ? '321 (30 COMPS)' : `${rendCount} REND`;
    if (apiEl) apiEl.textContent = state.selectedLangFilter === 'ALL' ? '881' : `${apiCount}`;

    const elGreen = document.getElementById('legend-count-green');
    const elYellow = document.getElementById('legend-count-yellow');
    const elRed = document.getElementById('legend-count-red');

    if (elGreen) elGreen.textContent = greenCount;
    if (elYellow) elYellow.textContent = yellowCount;
    if (elRed) elRed.textContent = redCount;
  }

  function populatePagesChecklist(callsMap) {
    if (!dom.pagesChecklist) return;
    state.pageCallsMap = callsMap;

    const sortedPages = Array.from(callsMap.entries()).sort((a, b) => b[1] - a[1]);
    
    dom.pagesChecklistTitle.textContent = `PAGES (${sortedPages.length})`;
    dom.pagesChecklist.innerHTML = '';
    state.activePagesSet.clear();

    sortedPages.forEach(([pageKey, calls]) => {
      const pageId = state.cy.nodes(`[type="Page"][label="${pageKey}"]`).id() || `P:${state.selectedLangFilter}:${pageKey}`;
      state.activePagesSet.add(pageId);

      const div = document.createElement('div');
      div.className = 'page-check-item';
      div.innerHTML = `
        <label class="page-check-label">
          <input type="checkbox" checked data-page-id="${pageId}">
          <span>${pageKey}</span>
        </label>
        <span class="page-check-calls">${calls} CALLS</span>
      `;

      const checkbox = div.querySelector('input');
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          state.activePagesSet.add(pageId);
        } else {
          state.activePagesSet.delete(pageId);
        }
        runLayout();
      });

      dom.pagesChecklist.appendChild(div);
    });
  }

  /**
   * 4-Column Architectural Dependency Matrix Layout Engine
   */
  function runDependencyMatrixLayout() {
    showLoading('Generating 5-Column Matrix (Language ➔ Component ➔ Page ➔ API ➔ System)...');

    setTimeout(() => {
      const cy = state.cy;
      const isSpread = state.density === 'spread';
      const yStep = isSpread ? 54 : 38;

      const languages = [];
      const renderings = [];
      const pages = [];
      const apis = [];
      const systems = [];

      cy.nodes().forEach(node => {
        const type = node.data('type');
        if (type === 'Language') {
          languages.push(node);
        } else if (type === 'Rendering' || type === 'Component') {
          renderings.push(node);
        } else if (type === 'Page') {
          if (state.activePagesSet.has(node.id())) {
            pages.push(node);
          }
        } else if (type === 'API') {
          apis.push(node);
        } else if (type === 'System') {
          systems.push(node);
        }
      });

      languages.sort((a, b) => a.data('label').localeCompare(b.data('label')));
      
      // Sort Renderings & Components: Most used (Red/Yellow) at top, least used (Green) at bottom
      renderings.sort((a, b) => {
        const usageA = a.data('usageCount') || (a.indegree() + a.outdegree()) || 0;
        const usageB = b.data('usageCount') || (b.indegree() + b.outdegree()) || 0;
        if (usageB !== usageA) return usageB - usageA;
        return a.data('label').localeCompare(b.data('label'));
      });

      // Sort Pages by calls / degree descending
      pages.sort((a, b) => {
        const callsA = state.pageCallsMap.get(a.data('label')) || (a.indegree() + a.outdegree()) || 0;
        const callsB = state.pageCallsMap.get(b.data('label')) || (b.indegree() + b.outdegree()) || 0;
        if (callsB !== callsA) return callsB - callsA;
        return a.data('label').localeCompare(b.data('label'));
      });

      // Sort APIs by degree descending
      apis.sort((a, b) => {
        const degA = a.indegree() + a.outdegree();
        const degB = b.indegree() + b.outdegree();
        if (degB !== degA) return degB - degA;
        return a.data('label').localeCompare(b.data('label'));
      });

      // Sort Systems by degree descending
      systems.sort((a, b) => {
        const degA = a.indegree() + a.outdegree();
        const degB = b.indegree() + b.outdegree();
        if (degB !== degA) return degB - degA;
        return a.data('label').localeCompare(b.data('label'));
      });

      const colLangX = 100;
      const colLeftX = 440;
      const colMidX = 820;
      const colRightX = 1200;
      const colSystemX = 1600;
      const startY = 80;

      cy.batch(() => {
        languages.forEach((lNode, idx) => {
          lNode.position({ x: colLangX, y: startY + idx * (yStep + 20) });
        });

        renderings.forEach((rNode, idx) => {
          rNode.position({ x: colLeftX, y: startY + idx * yStep });
        });

        pages.forEach((pNode, idx) => {
          pNode.position({ x: colMidX, y: startY + idx * (yStep + 4) });
        });

        apis.forEach((aNode, idx) => {
          aNode.position({ x: colRightX, y: startY + idx * yStep });
        });

        systems.forEach((sNode, idx) => {
          sNode.position({ x: colSystemX, y: startY + idx * (yStep + 28) });
        });

        cy.nodes('[type="Page"]').forEach(node => {
          if (state.activePagesSet.has(node.id())) {
            node.style('display', 'element');
          } else {
            node.style('display', 'none');
          }
        });
      });

      cy.viewport({ zoom: 0.7, pan: { x: 30, y: 40 } });
      hideLoading();
    }, 25);
  }

  function runCustomTreeLayout() {
    showLoading('Generating Mindmap Tree...');

    setTimeout(() => {
      const cy = state.cy;
      const langNode = cy.nodes('[type="Language"]')[0] || cy.nodes()[0];
      if (!langNode) {
        hideLoading();
        return;
      }

      const folders = [];
      const standalonePages = [];

      cy.nodes('[type="Page"]').forEach(node => {
        const label = node.data('label') || '';
        if (label.startsWith('📁') || label.includes('*')) {
          folders.push(node);
        } else {
          standalonePages.push(node);
        }
      });

      folders.sort((a, b) => a.data('label').localeCompare(b.data('label')));
      standalonePages.sort((a, b) => a.data('label').localeCompare(b.data('label')));

      const startX = 80;
      const colWidth = 340;
      const rowHeight = 58;

      cy.batch(() => {
        let currentY = 80;

        folders.forEach(fNode => {
          fNode.position({ x: startX + colWidth, y: currentY });

          let childY = currentY;
          const rends = fNode.outgoers('node[type="Rendering"]');
          rends.forEach(rNode => {
            rNode.position({ x: startX + colWidth * 2, y: childY });

            const apis = rNode.outgoers('node[type="API"]');
            apis.forEach((aNode, idx) => {
              aNode.position({ x: startX + colWidth * 3, y: childY + (idx * 40) });
            });

            childY += Math.max(50, apis.length * 40);
          });
          if (rends.length === 0) childY += 50;

          currentY = Math.max(currentY + rowHeight, childY + 15);
        });

        currentY += 50;

        standalonePages.forEach(pNode => {
          pNode.position({ x: startX + colWidth, y: currentY });

          let childY = currentY;
          const rends = pNode.outgoers('node[type="Rendering"]');
          rends.forEach(rNode => {
            rNode.position({ x: startX + colWidth * 2, y: childY });

            const apis = pNode.outgoers('node[type="API"]');
            apis.forEach((aNode, idx) => {
              aNode.position({ x: startX + colWidth * 3, y: childY + (idx * 40) });
            });

            childY += Math.max(50, apis.length * 40);
          });
          if (rends.length === 0) childY += 50;

          currentY = Math.max(currentY + rowHeight, childY + 15);
        });

        const totalHeight = currentY - 80;
        langNode.position({ x: startX, y: 80 + totalHeight / 2 });
      });

      cy.viewport({ zoom: 0.85, pan: { x: 40, y: 40 } });
      hideLoading();
    }, 25);
  }

  function runLayout() {
    const layoutMode = dom.layoutSelect.value;
    if (layoutMode === 'dependency_matrix') {
      runDependencyMatrixLayout();
    } else {
      runCustomTreeLayout();
    }
  }

  function applyLayerFilters() {
    state.cy.batch(() => {
      state.cy.nodes().forEach(node => {
        const type = node.data('type');
        if (type === 'Language') {
          node.style('display', state.activeFilters.Languages ? 'element' : 'none');
        } else if (type === 'Page') {
          node.style('display', state.activeFilters.Pages ? 'element' : 'none');
        } else if (type === 'Rendering' || type === 'Component') {
          node.style('display', state.activeFilters.Renderings ? 'element' : 'none');
        } else if (type === 'API') {
          node.style('display', state.activeFilters.APIs ? 'element' : 'none');
        }
      });
    });
  }

  function updateLanguageDropdown(languages) {
    if (!dom.langFilterSelect) return;
    dom.langFilterWrapper.style.display = 'flex';
    dom.langFilterSelect.innerHTML = '<option value="ALL">All Languages (Root)</option>';
    languages.sort().forEach(l => {
      const opt = document.createElement('option');
      opt.value = l;
      opt.textContent = `🌐 Language: ${l.toUpperCase()}`;
      if (l === state.selectedLangFilter) opt.selected = true;
      dom.langFilterSelect.appendChild(opt);
    });
  }

  function handleFileUpload(evt) {
    const file = evt.target.files[0];
    if (!file) return;
    showLoading(`Reading file ${file.name}...`);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        parseCSVText(file, 'auto');
      }
    });
  }

  function parseCSVText(csvText, schemaType) {
    showLoading('Parsing dataset...');
    try {
      const parsed = typeof csvText === 'string' ? Papa.parse(csvText, { header: true, skipEmptyLines: true }) : csvText;
      const data = parsed.data || [];

      const nodeMap = new Map();
      const edgeMap = new Map();
      const usageCounter = new Map();

      function addNode(id, label, type) {
        if (!nodeMap.has(id)) {
          const style = pillColors[type] || pillColors.Rendering;
          nodeMap.set(id, {
            data: {
              id: id,
              label: label,
              type: type,
              bgColor: style.bg,
              borderColor: style.border,
              textColor: style.text,
              details: {}
            }
          });
        }
      }

      function addEdge(sourceId, targetId, label) {
        if (!sourceId || !targetId || sourceId === targetId) return;
        const edgeId = `${sourceId}->${targetId}`;
        if (!edgeMap.has(edgeId)) {
          edgeMap.set(edgeId, {
            data: { id: edgeId, source: sourceId, target: targetId, label: label }
          });
        }
      }

      if (schemaType === 'rendering_analysis') {
        data.forEach(row => {
          const rend = row.rendering;
          if (!rend) return;

          const rendId = `R:${rend}`;
          addNode(rendId, rend, 'Rendering');

          if (row.components) {
            const comps = row.components.split('|').map(c => c.trim()).filter(Boolean);
            comps.forEach(comp => {
              const compId = `C:${comp}`;
              addNode(compId, comp, 'Component');
              addEdge(rendId, compId, 'USES_COMPONENT');
              usageCounter.set(compId, (usageCounter.get(compId) || 0) + 1);
            });
          }

          if (row.apis) {
            const apis = row.apis.split('|').map(a => a.trim()).filter(Boolean);
            apis.forEach(api => {
              const apiId = `A:${api}`;
              const sysInfo = getApiSystemAndPayload(api);
              addNode(apiId, api, 'API', { systemInfo: sysInfo });
              addEdge(rendId, apiId, 'CALLS_API');

              addNode(sysInfo.id, sysInfo.label, 'System', {
                systemName: sysInfo.name,
                module: sysInfo.module,
                payload: sysInfo.payload,
                protocol: sysInfo.protocol,
                color: sysInfo.color,
                bgColor: sysInfo.bg,
                borderColor: sysInfo.color,
                textColor: '#ffffff',
                icon: sysInfo.icon
              });
              addEdge(apiId, sysInfo.id, 'TARGETS_SYSTEM');
            });
          }
        });

        nodeMap.forEach((node, id) => {
          if (node.data.type === 'Component' || node.data.type === 'Rendering') {
            const usageCount = node.data.type === 'Component' ? (usageCounter.get(id) || 1) : 1;
            const shade = getRenderingGreenShade(usageCount);
            node.data.usageCount = usageCount;
            node.data.bgColor = shade.bg;
            node.data.borderColor = shade.border;
            node.data.textColor = shade.text;
          }
        });
      } else {
        data.forEach(row => {
          const page = row.Page || row.PAGE;
          const rend = row.Rendering || row.RENDERING;
          const api = row.API;

          if (page) {
            const pageId = `P:${page}`;
            addNode(pageId, page, 'Page');
            if (rend) {
              const rendId = `R:${rend}`;
              addNode(rendId, rend, 'Rendering');
              addEdge(pageId, rendId, 'USES_RENDERING');
              usageCounter.set(rendId, (usageCounter.get(rendId) || 0) + 1);
            }
          }

          if (api && api !== 'n_a') {
            const apiId = `A:${api}`;
            const sysInfo = getApiSystemAndPayload(api);
            addNode(apiId, api, 'API', { systemInfo: sysInfo });

            addNode(sysInfo.id, sysInfo.label, 'System', {
              systemName: sysInfo.name,
              module: sysInfo.module,
              payload: sysInfo.payload,
              protocol: sysInfo.protocol,
              color: sysInfo.color,
              bgColor: sysInfo.bg,
              borderColor: sysInfo.color,
              textColor: '#ffffff',
              icon: sysInfo.icon
            });
            addEdge(apiId, sysInfo.id, 'TARGETS_SYSTEM');
          }
        });

        nodeMap.forEach((node, id) => {
          if (node.data.type === 'Rendering' || node.data.type === 'Component') {
            const usageCount = usageCounter.get(id) || 1;
            const shade = getRenderingGreenShade(usageCount);
            node.data.usageCount = usageCount;
            node.data.bgColor = shade.bg;
            node.data.borderColor = shade.border;
            node.data.textColor = shade.text;
          }
        });
      }

      state.graphElements = {
        nodes: Array.from(nodeMap.values()),
        edges: Array.from(edgeMap.values())
      };

      state.cy.batch(() => {
        state.cy.elements().remove();
        state.cy.add(state.graphElements.nodes);
        state.cy.add(state.graphElements.edges);
      });

      runLayout();
      hideLoading();
    } catch (err) {
      console.error('Parse CSV error:', err);
      hideLoading();
    }
  }

  function rebuildGraph() {
    buildUnifiedGraph();
  }

  function selectNode(node) {
    state.selectedNode = node;
    highlightNeighborhood(node);
    openInspector(node);
  }

  function highlightNeighborhood(node) {
    state.cy.batch(() => {
      state.cy.elements().removeClass('highlighted').addClass('dimmed');
      const neighborhood = node.closedNeighborhood();
      neighborhood.removeClass('dimmed').addClass('highlighted');
    });
  }

  function resetHighlights() {
    state.selectedNode = null;
    state.cy.batch(() => {
      state.cy.elements().removeClass('highlighted dimmed');
    });
  }

  function focusNeighborhood(node) {
    state.cy.fit(node.closedNeighborhood(), 50);
  }

  function openInspector(node) {
    const data = node.data();
    dom.inspectorTitle.textContent = data.label;
    dom.inspectorTypeBadge.textContent = data.isFolder ? 'Folder Group' : data.type;
    dom.inspectorTypeBadge.style.backgroundColor = data.borderColor || '#3b82f6';

    const inDegree = node.indegree();
    const outDegree = node.outdegree();
    dom.statInDegree.textContent = inDegree;
    dom.statOutDegree.textContent = outDegree;
    dom.statTotalDegree.textContent = inDegree + outDegree;

    dom.incomingList.innerHTML = '';
    node.incomers('node').forEach(inNode => {
      dom.incomingList.appendChild(createConnItem(inNode));
    });

    dom.outgoingList.innerHTML = '';

    if (data.type === 'Page' && data.details && data.details.groupedUrls && data.details.groupedUrls.length > 1) {
      const isExploded = state.expandedNodes.has(node.id());
      const explodeBtn = document.createElement('button');
      explodeBtn.className = isExploded ? 'btn btn-accent' : 'btn btn-primary';
      explodeBtn.style.width = '100%';
      explodeBtn.style.marginBottom = '0.75rem';
      explodeBtn.style.fontSize = '0.82rem';
      explodeBtn.innerHTML = isExploded
        ? `<i class="fa-solid fa-compress"></i> Collapse Child Pages (${data.details.groupedUrls.length})`
        : `<i class="fa-solid fa-burst"></i> Explode Child Dependencies (${data.details.groupedUrls.length})`;
      
      explodeBtn.addEventListener('click', () => {
        toggleExplodeNode(node);
        openInspector(node);
      });
      dom.outgoingList.appendChild(explodeBtn);

      const titleDiv = document.createElement('div');
      titleDiv.style.fontSize = '0.8rem';
      titleDiv.style.fontWeight = '700';
      titleDiv.style.color = 'var(--accent-cyan)';
      titleDiv.style.marginBottom = '0.4rem';
      titleDiv.textContent = `📦 Dependent Child Pages (${data.details.groupedUrls.length}):`;
      dom.outgoingList.appendChild(titleDiv);

      const urlBox = document.createElement('div');
      urlBox.style.maxHeight = '140px';
      urlBox.style.overflowY = 'auto';
      urlBox.style.background = 'rgba(17, 24, 39, 0.6)';
      urlBox.style.padding = '0.5rem';
      urlBox.style.borderRadius = '8px';
      urlBox.style.fontSize = '0.78rem';
      urlBox.style.marginBottom = '0.75rem';

      data.details.groupedUrls.forEach(u => {
        const item = document.createElement('div');
        item.style.padding = '2px 0';
        item.style.color = 'var(--text-muted)';
        item.textContent = `• ${u}`;
        urlBox.appendChild(item);
      });
      dom.outgoingList.appendChild(urlBox);
    }

    if (data.type === 'Rendering' || data.type === 'Component') {
      const usageCount = data.usageCount || (node.indegree() + node.outdegree()) || 1;
      const shade = getRenderingGreenShade(usageCount);

      const usageBadge = document.createElement('div');
      usageBadge.style.padding = '0.5rem 0.75rem';
      usageBadge.style.marginBottom = '0.75rem';
      usageBadge.style.borderRadius = '8px';
      usageBadge.style.background = shade.bg;
      usageBadge.style.border = `1px solid ${shade.border}`;
      usageBadge.style.color = shade.text;
      usageBadge.style.fontSize = '0.8rem';
      usageBadge.style.fontWeight = '600';
      usageBadge.style.display = 'flex';
      usageBadge.style.alignItems = 'center';
      usageBadge.style.justifyContent = 'space-between';

      usageBadge.innerHTML = `
        <span><i class="fa-solid fa-layer-group"></i> ${shade.tier}</span>
        <span style="background: rgba(0,0,0,0.35); padding: 2px 7px; border-radius: 4px; font-weight: 700;">${usageCount} Use(s)</span>
      `;
      dom.outgoingList.appendChild(usageBadge);

      if (data.details && data.details.componentsList && data.details.componentsList.length > 0) {
        const subTitle = document.createElement('div');
        subTitle.style.fontSize = '0.8rem';
        subTitle.style.fontWeight = '700';
        subTitle.style.color = 'var(--color-rendering)';
        subTitle.style.marginBottom = '0.4rem';
        subTitle.textContent = `🧩 Sub-Components (${data.details.numComponents || data.details.componentsList.length}):`;
        dom.outgoingList.appendChild(subTitle);

        const compBox = document.createElement('div');
        compBox.style.maxHeight = '130px';
        compBox.style.overflowY = 'auto';
        compBox.style.background = 'rgba(17, 24, 39, 0.6)';
        compBox.style.padding = '0.5rem';
        compBox.style.borderRadius = '8px';
        compBox.style.fontSize = '0.78rem';
        compBox.style.marginBottom = '0.75rem';

        data.details.componentsList.forEach(c => {
          const item = document.createElement('div');
          item.style.padding = '2px 0';
          item.style.color = 'var(--text-muted)';
          item.textContent = `• ${c}`;
          compBox.appendChild(item);
        });
        dom.outgoingList.appendChild(compBox);
      }

      const directApis = node.neighborhood('node[type="API"]');
      if (directApis.length > 0) {
        const apiTitle = document.createElement('div');
        apiTitle.style.fontSize = '0.8rem';
        apiTitle.style.fontWeight = '700';
        apiTitle.style.color = '#f59e0b';
        apiTitle.style.marginBottom = '0.4rem';
        apiTitle.textContent = `⚡ Directly Invoked APIs & Systems (${directApis.length}):`;
        dom.outgoingList.appendChild(apiTitle);

        const apiBox = document.createElement('div');
        apiBox.style.background = 'rgba(245, 158, 11, 0.12)';
        apiBox.style.border = '1px solid rgba(245, 158, 11, 0.3)';
        apiBox.style.padding = '0.5rem';
        apiBox.style.borderRadius = '8px';
        apiBox.style.fontSize = '0.78rem';
        apiBox.style.marginBottom = '0.75rem';

        directApis.forEach(aNode => {
          const aData = aNode.data();
          const sys = aData.details && aData.details.systemInfo;
          const item = document.createElement('div');
          item.style.padding = '3px 0';
          item.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
          item.innerHTML = `
            <div style="font-weight: 600; color: #fcd34d;">⚡ ${aData.label}</div>
            ${sys ? `<div style="font-size: 0.72rem; color: var(--text-dim);">↳ <strong>System:</strong> ${sys.name} (${sys.module})</div>` : ''}
          `;
          apiBox.appendChild(item);
        });
        dom.outgoingList.appendChild(apiBox);
      }
    }

    if (data.type === 'API') {
      const callerComps = node.neighborhood('node[type="Rendering"], node[type="Component"]');
      if (callerComps.length > 0) {
        const compTitle = document.createElement('div');
        compTitle.style.fontSize = '0.8rem';
        compTitle.style.fontWeight = '700';
        compTitle.style.color = '#10b981';
        compTitle.style.marginBottom = '0.4rem';
        compTitle.textContent = `🧩 React Components Calling this API (${callerComps.length}):`;
        dom.outgoingList.appendChild(compTitle);

        const compBox = document.createElement('div');
        compBox.style.background = 'rgba(16, 185, 129, 0.12)';
        compBox.style.border = '1px solid rgba(16, 185, 129, 0.3)';
        compBox.style.padding = '0.5rem';
        compBox.style.borderRadius = '8px';
        compBox.style.fontSize = '0.78rem';
        compBox.style.marginBottom = '0.75rem';

        callerComps.forEach(cNode => {
          const cData = cNode.data();
          const item = document.createElement('div');
          item.style.padding = '2px 0';
          item.style.color = '#6ee7b7';
          item.textContent = `• ${cData.label}`;
          compBox.appendChild(item);
        });
        dom.outgoingList.appendChild(compBox);
      }
    }

    if (data.type === 'API' && data.details && data.details.systemInfo) {
      const sys = data.details.systemInfo;
      const sysBox = document.createElement('div');
      sysBox.style.padding = '0.75rem';
      sysBox.style.marginBottom = '0.75rem';
      sysBox.style.borderRadius = '8px';
      sysBox.style.background = sys.bg;
      sysBox.style.border = `1px solid ${sys.color}`;
      sysBox.style.color = '#fff';

      sysBox.innerHTML = `
        <div style="font-weight: 700; font-size: 0.85rem; color: ${sys.color}; margin-bottom: 0.35rem;">
          <i class="fa-solid ${sys.icon}"></i> ${sys.name}
        </div>
        <div style="font-size: 0.76rem; color: var(--text-muted); margin-bottom: 0.3rem;">
          <strong>Backend Module:</strong> <code style="color: #93c5fd;">${sys.module}</code>
        </div>
        <div style="font-size: 0.78rem; color: var(--text-main); margin-bottom: 0.3rem;">
          <strong>Retrieved Data Payload:</strong> ${sys.payload}
        </div>
        <div style="font-size: 0.72rem; color: var(--text-dim);">
          <strong>Protocol / Integration:</strong> ${sys.protocol}
        </div>
      `;
      dom.outgoingList.appendChild(sysBox);
    }

    if (data.type === 'System') {
      const sysBox = document.createElement('div');
      sysBox.style.padding = '0.75rem';
      sysBox.style.marginBottom = '0.75rem';
      sysBox.style.borderRadius = '8px';
      sysBox.style.background = data.bgColor || 'rgba(168, 85, 247, 0.22)';
      sysBox.style.border = `1px solid ${data.borderColor || '#a855f7'}`;
      sysBox.style.color = '#fff';

      sysBox.innerHTML = `
        <div style="font-weight: 700; font-size: 0.9rem; color: ${data.borderColor || '#a855f7'}; margin-bottom: 0.4rem;">
          <i class="fa-solid ${data.details.icon || 'fa-database'}"></i> ${data.details.systemName || data.label}
        </div>
        <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 0.4rem;">
          <strong>Backend Module:</strong> <code style="color: #c084fc;">${data.details.module || 'codebase/backend'}</code>
        </div>
        <div style="font-size: 0.8rem; color: var(--text-main); margin-bottom: 0.4rem;">
          <strong>Retrieved Data Payload:</strong> ${data.details.payload || 'Backend System Data'}
        </div>
        <div style="font-size: 0.74rem; color: var(--text-dim);">
          <strong>Protocol:</strong> ${data.details.protocol || 'REST / Service Bus'}
        </div>
      `;
      dom.outgoingList.appendChild(sysBox);
    }

    node.outgoers('node').forEach(outNode => {
      dom.outgoingList.appendChild(createConnItem(outNode));
    });

    dom.inspector.classList.add('open');
  }

  function createConnItem(targetNode) {
    const div = document.createElement('div');
    div.className = 'conn-item';
    div.innerHTML = `
      <span>${targetNode.data('label')}</span>
      <span class="node-dot" style="background-color: ${targetNode.data('borderColor')}"></span>
    `;
    div.addEventListener('click', () => {
      selectNode(targetNode);
      state.cy.animate({ center: { eles: targetNode }, zoom: 1.5, duration: 300 });
    });
    return div;
  }

  function closeInspector() {
    dom.inspector.classList.remove('open');
  }

  function handleSearchInput(e) {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      dom.searchSuggestions.style.display = 'none';
      dom.resultsList.innerHTML = '';
      return;
    }

    const matches = state.cy.nodes().filter(n => n.data('label').toLowerCase().includes(query));
    
    dom.resultsList.innerHTML = '';
    if (matches.length > 0) {
      matches.slice(0, 15).forEach(n => {
        const div = document.createElement('div');
        div.className = 'result-item-pill';
        div.innerHTML = `
          <span class="result-tag">${n.data('type')}</span>
          <span class="result-name">${n.data('label')}</span>
        `;
        div.addEventListener('click', () => {
          selectNode(n);
          state.cy.animate({ center: { eles: n }, zoom: 1.6, duration: 400 });
        });
        dom.resultsList.appendChild(div);
      });
    }
  }

  function exportPng() {
    const png64 = state.cy.png({ full: true, bg: '#090d16', scale: 2 });
    const downloadLink = document.createElement('a');
    downloadLink.href = png64;
    downloadLink.download = `dependency-graph-${state.currentDataset}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }

  function exportJson() {
    const jsonStr = JSON.stringify(state.cy.json(), null, 2);
    const blobObj = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blobObj);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `dependency-graph-${state.currentDataset}.json`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
  }

  function showLoading(msg) {
    if (dom.loadingText) dom.loadingText.textContent = msg || 'Loading...';
    if (dom.loadingOverlay) dom.loadingOverlay.style.display = 'flex';
  }

  function hideLoading() {
    if (dom.loadingOverlay) dom.loadingOverlay.style.display = 'none';
  }

})();
