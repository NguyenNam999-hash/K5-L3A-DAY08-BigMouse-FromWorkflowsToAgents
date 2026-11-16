(function () {
  "use strict";

  var DATA = window.DEMO_DATA;
  if (!DATA) {
    document.body.innerHTML = "<p style='padding:2rem;font-family:monospace'>demo/data.js is missing. Run python3 tools/build_demo_ui.py</p>";
    return;
  }

  var SHAPE_LABELS = {
    workflow: "Workflow",
    single: "Single ReAct",
    orchestrator: "Orchestrator",
    swarm: "Swarm reference"
  };
  var SHAPES = Object.keys(DATA.shapes);

  // Hand-authored pipeline layouts. Node ids match tools/build_demo_ui.NODE_IDS.
  var GRAPHS = {
    workflow: {
      nodes: [
        { id: "claim", label: "claim", x: 14, y: 58, w: 88, h: 52, type: "code" },
        { id: "order_id", label: "order?", x: 120, y: 52, w: 96, h: 64, type: "branch" },
        { id: "lookup_order", label: "lookup", x: 234, y: 58, w: 88, h: 52, type: "code" },
        { id: "visible", label: "visible?", x: 340, y: 52, w: 96, h: 64, type: "branch" },
        { id: "quote", label: "quote", x: 454, y: 58, w: 88, h: 52, type: "code" },
        { id: "amount_positive", label: "amount?", x: 560, y: 52, w: 96, h: 64, type: "branch" },
        { id: "host_check", label: "host", x: 674, y: 58, w: 88, h: 52, type: "host" },
        { id: "ledger", label: "ledger", x: 780, y: 58, w: 80, h: 52, type: "ledger" },
        { id: "outcome", label: "outcome", x: 878, y: 58, w: 88, h: 52, type: "terminal" }
      ],
      edges: [
        ["claim", "order_id"], ["order_id", "lookup_order"], ["lookup_order", "visible"],
        ["visible", "quote"], ["quote", "amount_positive"], ["amount_positive", "host_check"],
        ["host_check", "ledger"], ["ledger", "outcome"]
      ],
      exits: [
        { id: "exit_needs_info", label: "needs_info", from: "order_id", x: 108, y: 230, w: 120 },
        { id: "exit_escalated", label: "escalated", from: "visible", x: 328, y: 230, w: 120 },
        { id: "exit_denied", label: "denied / failed", from: "amount_positive", x: 548, y: 230, w: 120 }
      ]
    },
    single: {
      nodes: [
        { id: "claim", label: "claim", x: 14, y: 58, w: 88, h: 52, type: "code" },
        { id: "react", label: "ReAct", x: 120, y: 58, w: 100, h: 52, type: "model" },
        { id: "ready", label: "ready?", x: 240, y: 52, w: 96, h: 64, type: "branch" },
        { id: "quote", label: "quote", x: 354, y: 58, w: 88, h: 52, type: "code" },
        { id: "amount_positive", label: "amount?", x: 460, y: 52, w: 96, h: 64, type: "branch" },
        { id: "host_check", label: "host", x: 574, y: 58, w: 88, h: 52, type: "host" },
        { id: "ledger", label: "ledger", x: 680, y: 58, w: 80, h: 52, type: "ledger" },
        { id: "outcome", label: "outcome", x: 778, y: 58, w: 100, h: 52, type: "terminal" }
      ],
      edges: [
        ["claim", "react"], ["react", "ready"], ["ready", "quote"], ["quote", "amount_positive"],
        ["amount_positive", "host_check"], ["host_check", "ledger"], ["ledger", "outcome"]
      ],
      loops: ["react"],
      exits: [
        { id: "exit_needs_escalated", label: "needs_info / escalated", from: "ready", x: 224, y: 230, w: 160 }
      ]
    },
    orchestrator: {
      nodes: [
        { id: "claim", label: "claim", x: 10, y: 58, w: 80, h: 52, type: "code" },
        { id: "order_id", label: "order?", x: 100, y: 52, w: 88, h: 64, type: "branch" },
        { id: "handoff", label: "handoff", x: 198, y: 58, w: 88, h: 52, type: "code" },
        { id: "investigator", label: "investigator", x: 296, y: 58, w: 104, h: 52, type: "model" },
        { id: "visible", label: "visible?", x: 410, y: 52, w: 88, h: 64, type: "branch" },
        { id: "quote", label: "quote", x: 508, y: 58, w: 88, h: 52, type: "code" },
        { id: "amount_positive", label: "amount?", x: 606, y: 52, w: 88, h: 64, type: "branch" },
        { id: "host_check", label: "host", x: 704, y: 58, w: 88, h: 52, type: "host" },
        { id: "ledger", label: "ledger", x: 802, y: 58, w: 76, h: 52, type: "ledger" },
        { id: "outcome", label: "outcome", x: 888, y: 58, w: 86, h: 52, type: "terminal" }
      ],
      edges: [
        ["claim", "order_id"], ["order_id", "handoff"], ["handoff", "investigator"],
        ["investigator", "visible"], ["visible", "quote"], ["quote", "amount_positive"],
        ["amount_positive", "host_check"], ["host_check", "ledger"], ["ledger", "outcome"]
      ],
      exits: [
        { id: "exit_needs_info", label: "needs_info", from: "order_id", x: 84, y: 230, w: 110 },
        { id: "exit_escalated", label: "escalated", from: "visible", x: 396, y: 230, w: 110 }
      ]
    },
    swarm: {
      nodes: [
        { id: "claim", label: "claim", x: 10, y: 58, w: 76, h: 52, type: "code" },
        { id: "peer_parse", label: "peer", x: 94, y: 58, w: 76, h: 52, type: "model" },
        { id: "order_id", label: "order?", x: 178, y: 52, w: 80, h: 64, type: "branch" },
        { id: "handoff", label: "handoff", x: 266, y: 58, w: 80, h: 52, type: "code" },
        { id: "investigator", label: "investigator", x: 354, y: 58, w: 96, h: 52, type: "model" },
        { id: "model_override", label: "override?", x: 458, y: 52, w: 84, h: 64, type: "branch" },
        { id: "quote", label: "quote", x: 550, y: 58, w: 76, h: 52, type: "code" },
        { id: "amount_positive", label: "amount?", x: 634, y: 52, w: 80, h: 64, type: "branch" },
        { id: "host_check", label: "host", x: 722, y: 58, w: 80, h: 52, type: "host" },
        { id: "ledger", label: "ledger", x: 810, y: 58, w: 70, h: 52, type: "ledger" },
        { id: "outcome", label: "outcome", x: 888, y: 58, w: 82, h: 52, type: "terminal" }
      ],
      edges: [
        ["claim", "peer_parse"], ["peer_parse", "order_id"], ["order_id", "handoff"],
        ["handoff", "investigator"], ["investigator", "model_override"],
        ["model_override", "quote"], ["quote", "amount_positive"],
        ["amount_positive", "host_check"], ["host_check", "ledger"], ["ledger", "outcome"]
      ],
      exits: [
        { id: "exit_needs_info", label: "needs_info", from: "order_id", x: 166, y: 230, w: 100 },
        { id: "exit_escalated", label: "escalated", from: "investigator", x: 348, y: 230, w: 110 }
      ]
    }
  };

  var EVENT_NODE = {
    workflow: { lookup_order: "lookup_order", quote: "quote", decision: "order_id", error: "claim", crash: "host_check" },
    single: { react: "react", quote: "quote", decision: "claim", error: "claim", crash: "host_check" },
    orchestrator: { handoff: "handoff", investigator: "investigator", quote: "quote", decision: "order_id", error: "claim", crash: "host_check" },
    swarm: { handoff: "handoff", investigator: "investigator", model_override: "model_override", quote: "quote", decision: "order_id", error: "claim", crash: "host_check" }
  };

  var state = {
    shape: SHAPES[0] || "workflow",
    claimId: DATA.claims.length ? DATA.claims[0].claim_id : null,
    seed: 11
  };

  var els = {
    tabs: document.getElementById("shape-tabs"),
    diagram: document.getElementById("diagram"),
    diagramNote: document.getElementById("diagram-note"),
    steps: document.getElementById("step-list"),
    rows: document.getElementById("claim-rows"),
    result: document.getElementById("result-card"),
    detail: document.getElementById("event-detail"),
    compare: document.getElementById("compare"),
    crash: document.getElementById("crash-card"),
    asOf: document.getElementById("dateline-asof"),
    counts: document.getElementById("dateline-counts"),
    builtFrom: document.getElementById("built-from")
  };

  var vnd = new Intl.NumberFormat("vi-VN");

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function formatVnd(value) {
    return value === null || value === undefined ? "—" : vnd.format(value) + " ₫";
  }

  function formatPct(value) {
    if (value === null || value === undefined) return "—";
    var pct = value * 100;
    return (Math.round(pct * 10) / 10).toFixed(pct % 1 === 0 ? 0 : 1) + "%";
  }

  function formatRate(value) {
    if (value === null || value === undefined) return "—";
    return Number(value).toFixed(3);
  }

  function statusPill(status) {
    var known = ["resolved", "needs_info", "escalated", "denied", "failed"];
    var cls = known.indexOf(status) === -1 ? "unknown" : status;
    return el("span", "status-pill " + cls, status || "no run");
  }

  function trialFor(shape, claimId, seed) {
    for (var i = 0; i < DATA.trials.length; i++) {
      var trial = DATA.trials[i];
      if (trial.shape === shape && trial.claim_id === claimId && trial.seed === seed) return trial;
    }
    return null;
  }

  function seedsFor(shape, claimId) {
    var seeds = [];
    DATA.trials.forEach(function (trial) {
      if (trial.shape === shape && trial.claim_id === claimId && seeds.indexOf(trial.seed) === -1) {
        seeds.push(trial.seed);
      }
    });
    return seeds.sort(function (a, b) { return a - b; });
  }

  function traceFor(trial) {
    return trial && DATA.traces[trial.run_id] ? DATA.traces[trial.run_id] : null;
  }

  function claimFor(claimId) {
    for (var i = 0; i < DATA.claims.length; i++) {
      if (DATA.claims[i].claim_id === claimId) return DATA.claims[i];
    }
    return null;
  }

  function switchShape(shape) {
    state.shape = shape;
    var seeds = state.claimId ? seedsFor(shape, state.claimId) : [];
    if (!seeds.length) {
      state.claimId = DATA.claims.length ? DATA.claims[0].claim_id : null;
      seeds = state.claimId ? seedsFor(shape, state.claimId) : [];
    }
    state.seed = seeds.length ? seeds[0] : 11;
    render();
  }

  function selectClaim(claimId) {
    state.claimId = claimId;
    var seeds = seedsFor(state.shape, claimId);
    if (seeds.indexOf(11) !== -1) state.seed = 11;
    else if (seeds.length) state.seed = seeds[0];
    render();
  }

  function selectSeed(seed) {
    state.seed = seed;
    render();
  }

  function renderTabs() {
    els.tabs.textContent = "";
    SHAPES.forEach(function (shape, index) {
      var metrics = DATA.shapes[shape] || {};
      var tab = el("button", "shape-tab");
      tab.type = "button";
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", String(shape === state.shape));
      tab.dataset.shape = shape;
      tab.appendChild(el("span", "tab-letter", "ABCD"[index] || String(index + 1)));
      tab.appendChild(el("span", "tab-name", SHAPE_LABELS[shape] || shape));
      tab.appendChild(el("span", "tab-meta", formatPct(metrics.pass_rate) + " pass · " + formatVnd(Math.round(metrics.cost_per_success_vnd || 0)) + "/success"));
      tab.addEventListener("click", function () { switchShape(shape); });
      els.tabs.appendChild(tab);
    });
  }

  function renderDateline() {
    var asOf = (DATA.benchmark.controlled_variables || {}).as_of || "—";
    els.asOf.textContent = "data as of " + asOf;
    els.counts.textContent = DATA.claims.length + " claims · " + DATA.trials.length + " trials · " + DATA.generated_from.trace_count + " traces";
    els.builtFrom.textContent = "Generated from existing evidence · " + DATA.generated_from.generated_at;
  }

  function renderClaims() {
    els.rows.textContent = "";
    DATA.claims.forEach(function (claim) {
      var row = el("tr", "claim-row");
      row.tabIndex = 0;
      row.dataset.claimId = claim.claim_id;
      if (claim.claim_id === state.claimId) row.classList.add("is-selected");

      row.appendChild(el("td", "matrix-cell", claim.matrix_id || "—"));
      row.appendChild(el("td", "claim-cell", claim.claim_id));

      var ticketCell = el("td", "ticket-cell", claim.ticket || "—");
      ticketCell.title = claim.ticket || "";
      row.appendChild(ticketCell);

      var expectedCell = el("td");
      expectedCell.appendChild(statusPill(claim.expected.status));
      row.appendChild(expectedCell);

      row.appendChild(el("td", "money", formatVnd(claim.expected.refund_vnd)));

      var seedCell = el("td");
      var group = el("div", "seed-group");
      seedsFor(state.shape, claim.claim_id).forEach(function (seed) {
        var trial = trialFor(state.shape, claim.claim_id, seed);
        var chip = el("button", "seed-chip " + (trial && trial.passed ? "pass" : "fail"));
        chip.type = "button";
        chip.textContent = seed + (trial && trial.passed ? " ✓" : " ✗");
        chip.setAttribute("aria-label", "seed " + seed + ", " + (trial && trial.passed ? "pass" : "fail"));
        if (claim.claim_id === state.claimId && seed === state.seed) {
          chip.classList.add("is-selected");
          chip.setAttribute("aria-current", "true");
        }
        chip.addEventListener("click", function (event) {
          event.stopPropagation();
          state.claimId = claim.claim_id;
          selectSeed(seed);
        });
        group.appendChild(chip);
      });
      seedCell.appendChild(group);
      row.appendChild(seedCell);

      var trial = trialFor(state.shape, claim.claim_id, state.seed);
      var runCell = el("td");
      runCell.appendChild(statusPill(trial ? trial.status : null));
      row.appendChild(runCell);

      function activate() { selectClaim(claim.claim_id); }
      row.addEventListener("click", activate);
      row.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate();
        }
      });

      els.rows.appendChild(row);
    });
  }

  function renderResult() {
    els.result.textContent = "";
    var claim = claimFor(state.claimId);
    if (!claim) {
      els.result.appendChild(el("p", "run-missing", "No claim selected."));
      return;
    }

    var trial = trialFor(state.shape, claim.claim_id, state.seed);
    var trace = traceFor(trial);

    els.result.appendChild(el("p", "eyebrow", "Selected run"));
    els.result.appendChild(el("div", "result-claim", claim.claim_id));
    els.result.appendChild(el("div", "result-meta", (claim.matrix_id || "—") + " · " + state.shape + " · seed " + state.seed));

    var ticket = el("p", "ticket", claim.ticket || "No ticket text.");
    els.result.appendChild(ticket);

    var line = el("div", "status-line");
    var pair = el("div", "status-pair");
    var actualLabel = el("span", null, "Actual");
    pair.appendChild(actualLabel);
    pair.appendChild(el("strong", null, trial ? trial.status : "no run"));
    line.appendChild(pair);
    line.appendChild(statusPill(trial ? trial.status : null));
    els.result.appendChild(line);

    var verdict = el("div", "status-line");
    var verdictPair = el("div", "status-pair");
    verdictPair.appendChild(el("span", null, "Expected"));
    verdictPair.appendChild(el("strong", null, claim.expected.status));
    verdict.appendChild(verdictPair);
    if (trial) {
      var match = trial.status === claim.expected.status;
      verdict.appendChild(el("span", "verdict " + (match ? "pass" : "mismatch"), match ? "PASS" : "MISMATCH"));
    } else {
      verdict.appendChild(el("span", "verdict mismatch", "NO TRACE"));
    }
    els.result.appendChild(verdict);

    var facts = el("dl", "facts");
    function fact(label, value, extraClass) {
      facts.appendChild(el("dt", null, label));
      facts.appendChild(el("dd", extraClass || null, value));
    }
    fact("Quote (proposal)", trace ? formatVnd(trace.quote_vnd) : "—");
    fact("Refund expected", formatVnd(claim.expected.refund_vnd));
    fact("Pass reason", trial ? trial.reason : "—");
    fact("Cost", trial ? formatVnd(Math.round(trial.cost_estimate || 0)) : "—");
    fact("Steps", trial ? trial.steps : "—");
    fact("Model calls", trial ? trial.model_calls : "—");
    fact("Tool calls", trial ? trial.tool_calls : "—");
    els.result.appendChild(facts);

    els.result.appendChild(el("p", "note", "Refund expected is the claim's label, not a measured ledger entry. Status is the measured pass criterion."));
    if (!trace) {
      els.result.appendChild(el("p", "note", "No trace file found for this run in the bundle."));
    }
  }

  var SVG_NS = "http://www.w3.org/2000/svg";

  function svgEl(tag, attrs) {
    var node = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      node.setAttribute(key, attrs[key]);
    });
    return node;
  }

  function highlightNode(nodeId) {
    Array.prototype.forEach.call(els.diagram.querySelectorAll(".node"), function (node) {
      node.classList.toggle("is-active", node.getAttribute("data-node-id") === nodeId);
    });
  }

  function clearActiveStep() {
    Array.prototype.forEach.call(els.steps.querySelectorAll(".step"), function (node) {
      node.classList.remove("is-active");
      node.removeAttribute("aria-current");
    });
  }

  function showEvent(index, trace, nodeId) {
    els.detail.textContent = "";
    if (!trace || !trace.events[index]) {
      els.detail.appendChild(el("p", "step-empty", "Select an event to see its sanitized payload."));
      return;
    }
    var event = trace.events[index];
    els.detail.appendChild(el("p", "eyebrow", "Event " + String(index + 1).padStart(2, "0") + " · " + event.kind));
    var pre = document.createElement("pre");
    pre.textContent = JSON.stringify(event.payload, null, 2);
    els.detail.appendChild(pre);
    if (nodeId) {
      els.detail.appendChild(el("p", "note", "Maps to pipeline node: " + nodeId + ". Payload is the sanitized trace event."));
    } else {
      els.detail.appendChild(el("p", "note", "This event has no pipeline node in the diagram."));
    }
    if (trace.visited && trace.visited.length) {
      els.detail.appendChild(el("p", "note", "Nodes visited: " + trace.visited.join(" → ")));
    }
  }

  function activateStep(index, trace) {
    var event = trace.events[index];
    var nodeId = (EVENT_NODE[state.shape] || {})[event.kind] || null;
    clearActiveStep();
    var button = els.steps.querySelector('[data-step-index="' + index + '"]');
    if (button) {
      button.classList.add("is-active");
      button.setAttribute("aria-current", "true");
    }
    highlightNode(nodeId);
    showEvent(index, trace, nodeId);
  }

  function showNodeInfo(node, trace, status) {
    clearActiveStep();
    highlightNode(node.id);
    els.detail.textContent = "";
    els.detail.appendChild(el("p", "eyebrow", "Pipeline node · " + node.id));
    els.detail.appendChild(el("p", "note", "No trace event maps to this node. Its visited state is inferred from the run status \"" + status + "\". The step list shows the events this run recorded."));
    if (trace && trace.visited && trace.visited.length) {
      els.detail.appendChild(el("p", "note", "Nodes visited: " + trace.visited.join(" → ")));
    }
  }

  function stepForNode(shape, nodeId, events) {
    var mapping = EVENT_NODE[shape] || {};
    for (var i = 0; i < events.length; i++) {
      if (mapping[events[i].kind] === nodeId) return i;
    }
    return -1;
  }

  function renderSteps() {
    els.steps.textContent = "";
    var trial = trialFor(state.shape, state.claimId, state.seed);
    var trace = traceFor(trial);
    if (!trace || !trace.events.length) {
      els.steps.appendChild(el("span", "step-empty", "No trace events for this run."));
      return;
    }
    trace.events.forEach(function (event, index) {
      var mapped = (EVENT_NODE[state.shape] || {})[event.kind];
      var button = el("button", "step");
      button.type = "button";
      button.dataset.stepIndex = index;
      button.appendChild(el("span", "step-node", String(index + 1).padStart(2, "0")));
      button.appendChild(document.createTextNode(event.kind));
      if (mapped) button.appendChild(el("span", "step-map", "node: " + mapped));
      button.addEventListener("click", function () { activateStep(index, trace); });
      els.steps.appendChild(button);
    });
    activateStep(0, trace);
  }

  function drawEdge(parent, from, to, exitEdge) {
    var x1 = from.x + from.w / 2;
    var y1 = from.y + from.h;
    var x2 = to.x + to.w / 2;
    var y2 = to.y;
    var d;
    if (exitEdge) {
      var midY = (y1 + y2) / 2;
      d = Math.abs(x1 - x2) < 1
        ? "M" + x1 + " " + y1 + " V" + y2
        : "M" + x1 + " " + y1 + " V" + midY + " H" + x2 + " V" + y2;
    } else {
      var sx = from.x + from.w;
      var sy = from.y + from.h / 2;
      var ex = to.x;
      var ey = to.y + to.h / 2;
      d = "M" + sx + " " + sy + " H" + ex + (Math.abs(sy - ey) < 1 ? "" : " V" + ey + " H" + (to.x + 1));
    }
    var path = svgEl("path", {
      d: d,
      class: exitEdge ? "edge edge-exit" : "edge",
      "marker-end": exitEdge ? "url(#arrowExit)" : "url(#arrow)"
    });
    parent.appendChild(path);
  }

  function drawNodeShape(g, node) {
    if (node.type === "branch") {
      var cx = node.x + node.w / 2;
      var cy = node.y + node.h / 2;
      g.appendChild(svgEl("polygon", {
        class: "node-shape",
        points: cx + "," + node.y + " " + (node.x + node.w) + "," + cy + " " + cx + "," + (node.y + node.h) + " " + node.x + "," + cy
      }));
      return;
    }
    if (node.type === "ledger") {
      g.appendChild(svgEl("rect", { class: "node-shape", x: node.x, y: node.y + 7, width: node.w, height: node.h - 7, rx: 5 }));
      g.appendChild(svgEl("ellipse", { class: "node-shape", cx: node.x + node.w / 2, cy: node.y + 7, rx: node.w / 2, ry: 7 }));
      return;
    }
    var rx = node.type === "terminal" ? 18 : node.type === "model" ? 10 : 2;
    g.appendChild(svgEl("rect", { class: "node-shape", x: node.x, y: node.y, width: node.w, height: node.h, rx: rx }));
  }

  function drawNode(parent, node, visited, status, trace) {
    var isVisited = visited.indexOf(node.id) !== -1;
    var cls = "node state-" + (isVisited ? "visited" : "unvisited") + " type-" + node.type;
    if (node.type === "terminal" && isVisited) cls += " result-" + status;
    var g = svgEl("g", {
      class: cls,
      "data-node-id": node.id,
      tabindex: "0",
      role: "button",
      "aria-label": node.label + " node, " + (isVisited ? "visited" : "not visited")
    });
    var title = svgEl("title", {});
    title.textContent = node.label + " · " + (isVisited ? "visited" : "not visited") + " · " + node.type;
    g.appendChild(title);
    drawNodeShape(g, node);

    var text = svgEl("text", {
      x: node.x + node.w / 2,
      y: node.y + node.h / 2 + 3,
      "text-anchor": "middle"
    });
    text.textContent = node.label;
    g.appendChild(text);

    function open() {
      var index = stepForNode(state.shape, node.id, trace ? trace.events : []);
      if (index >= 0) activateStep(index, trace);
      else showNodeInfo(node, trace, trialStatus());
    }
    g.addEventListener("click", open);
    g.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
    parent.appendChild(g);
  }

  function trialStatus() {
    var trial = trialFor(state.shape, state.claimId, state.seed);
    return trial ? trial.status : "no run";
  }

  function renderLegend(container) {
    var legend = el("div", "legend");
    [
      ["code", "code step"],
      ["model", "model step"],
      ["branch", "branch"],
      ["host", "host check"],
      ["ledger", "ledger"],
      ["resolved", "resolved"],
      ["denied", "denied / failed"],
      ["needs", "needs info / escalated"]
    ].forEach(function (item) {
      var entry = el("span", "legend-item");
      entry.appendChild(el("span", "swatch type-" + item[0]));
      entry.appendChild(document.createTextNode(item[1]));
      legend.appendChild(entry);
    });
    container.appendChild(legend);
  }

  function renderDiagram() {
    els.diagram.textContent = "";
    var graph = GRAPHS[state.shape];
    if (!graph) {
      els.diagram.appendChild(el("p", "step-empty", "No diagram for this shape."));
      return;
    }
    var trial = trialFor(state.shape, state.claimId, state.seed);
    var trace = traceFor(trial);
    var status = trial ? trial.status : "no run";
    var visited = trace ? trace.visited || [] : [];

    var wrap = el("div", "diagram-wrap");
    var svg = svgEl("svg", {
      viewBox: "0 0 980 290",
      role: "img",
      "aria-label": state.shape + " pipeline, " + visited.length + " of " + graph.nodes.length + " nodes visited"
    });
    var defs = svgEl("defs", {});
    [
      ["arrow", "#4a463c"],
      ["arrowExit", "#b9ae96"]
    ].forEach(function (marker) {
      var node = svgEl("marker", {
        id: marker[0],
        viewBox: "0 0 10 10",
        refX: "9",
        refY: "5",
        markerWidth: "7",
        markerHeight: "7",
        orient: "auto-start-reverse"
      });
      node.appendChild(svgEl("path", { d: "M0,0 L10,5 L0,10 z", fill: marker[1] }));
      defs.appendChild(node);
    });
    svg.appendChild(defs);

    var byId = {};
    graph.nodes.forEach(function (node) { byId[node.id] = node; });

    var edges = svgEl("g", { class: "edges" });
    graph.edges.forEach(function (pair) {
      drawEdge(edges, byId[pair[0]], byId[pair[1]], false);
    });
    (graph.exits || []).forEach(function (exit) {
      drawEdge(edges, byId[exit.from], exit, true);
    });
    svg.appendChild(edges);

    (graph.loops || []).forEach(function (loopId) {
      var node = byId[loopId];
      var path = svgEl("path", {
        class: "edge edge-loop",
        d: "M" + (node.x + 18) + " " + node.y + " Q" + (node.x + node.w / 2) + " " + (node.y - 30) + " " + (node.x + node.w - 18) + " " + node.y,
        "marker-end": "url(#arrow)"
      });
      svg.appendChild(path);
    });

    var exits = svgEl("g", { class: "exits" });
    (graph.exits || []).forEach(function (exit) {
      var g = svgEl("g", { class: "exit-node", "data-exit-id": exit.id });
      g.appendChild(svgEl("rect", { x: exit.x, y: exit.y, width: exit.w, height: 34, rx: 4 }));
      var text = svgEl("text", { x: exit.x + exit.w / 2, y: exit.y + 21, "text-anchor": "middle" });
      text.textContent = exit.label;
      g.appendChild(text);
      exits.appendChild(g);
    });
    svg.appendChild(exits);

    var nodes = svgEl("g", { class: "nodes" });
    graph.nodes.forEach(function (node) {
      drawNode(nodes, node, visited, status, trace);
    });
    svg.appendChild(nodes);

    wrap.appendChild(svg);
    wrap.appendChild(el("p", "diagram-state", "visited " + visited.length + " of " + graph.nodes.length + " nodes · status " + status));
    renderLegend(wrap);
    els.diagram.appendChild(wrap);

    els.diagramNote.textContent = visited.length + " of " + graph.nodes.length + " nodes visited";
    if (!trace) {
      els.diagram.appendChild(el("p", "step-note", "No trace for this run. The map stays unvisited."));
    }
  }

  function render() {
    renderTabs();
    renderClaims();
    renderResult();
    renderDiagram();
    renderSteps();
  }

  if (state.claimId) {
    var initialSeeds = seedsFor(state.shape, state.claimId);
    if (initialSeeds.indexOf(11) === -1 && initialSeeds.length) state.seed = initialSeeds[0];
  }

  renderDateline();
  render();
})();
