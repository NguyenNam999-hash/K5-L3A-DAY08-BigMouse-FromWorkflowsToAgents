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

  function showEvent(index, trace) {
    els.detail.textContent = "";
    if (!trace || !trace.events[index]) {
      els.detail.appendChild(el("p", "step-empty", "Select an event to see its sanitized payload."));
      return;
    }
    var event = trace.events[index];
    var head = el("p", "eyebrow", "Event " + String(index + 1).padStart(2, "0") + " · " + event.kind);
    els.detail.appendChild(head);
    var pre = document.createElement("pre");
    pre.textContent = JSON.stringify(event.payload, null, 2);
    els.detail.appendChild(pre);
    var mapped = el("p", "note", trace.visited && trace.visited.length ? "Pipeline nodes visited: " + trace.visited.join(" → ") : "No pipeline nodes recorded.");
    els.detail.appendChild(mapped);
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
      var button = el("button", "step");
      button.type = "button";
      button.appendChild(el("span", "step-node", String(index + 1).padStart(2, "0")));
      button.appendChild(document.createTextNode(event.kind));
      if (index === 0) button.classList.add("is-active");
      button.addEventListener("click", function () {
        Array.prototype.forEach.call(els.steps.querySelectorAll(".step"), function (node) {
          node.classList.remove("is-active");
        });
        button.classList.add("is-active");
        showEvent(index, trace);
      });
      els.steps.appendChild(button);
    });
    showEvent(0, trace);
  }

  function renderDiagram() {
    els.diagram.textContent = "";
    var trial = trialFor(state.shape, state.claimId, state.seed);
    var trace = traceFor(trial);
    els.diagramNote.textContent = trace ? "visited " + trace.visited.length + " nodes" : "no trace";
    if (!trace) {
      els.diagram.appendChild(el("p", "step-empty", "No trace for this run."));
      return;
    }
    els.diagram.appendChild(el("p", "step-empty", "Pipeline map for " + state.shape + " — rendered in the next task."));
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
