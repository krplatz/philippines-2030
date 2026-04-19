/* ============================================================
   Philippines 2030 — Chart rendering (vanilla SVG)
   Each chart exposes a `render(el)` function. Scenario-aware
   charts subscribe to `scenarioChange` events.
   ============================================================ */

const ns = "http://www.w3.org/2000/svg";
function svg(el, a = {}, kids = []) {
  const node = document.createElementNS(ns, el);
  for (const k in a) node.setAttribute(k, a[k]);
  for (const c of kids) node.appendChild(c);
  return node;
}
function text(x, y, t, cls = "") {
  const n = svg("text", { x, y });
  if (cls) n.setAttribute("class", cls);
  n.textContent = t;
  return n;
}

// ---------- shared scenario state ----------
let currentScenario = "base";
const scenarioSubs = [];
function onScenario(fn) { scenarioSubs.push(fn); fn(currentScenario); }
function setScenario(s) {
  currentScenario = s;
  document.body.setAttribute("data-scenario", s);
  scenarioSubs.forEach(fn => fn(s));
}

// ---------- Chart 1: BPO headcount 2025→2030 (scenario-aware) ----------
function renderBpoChart(container) {
  const W = 900, H = 420, M = { t: 30, r: 80, b: 50, l: 64 };
  const years = [2025, 2026, 2027, 2028, 2029, 2030];
  const scenarios = {
    base:   [1.90, 1.92, 1.88, 1.80, 1.75, 1.71],   // M workers
    accel:  [1.90, 1.88, 1.78, 1.60, 1.48, 1.42],
    crisis: [1.90, 1.85, 1.68, 1.42, 1.25, 1.15],
  };
  const yMax = 2.1, yMin = 1.0;
  const iw = W - M.l - M.r, ih = H - M.t - M.b;
  const x = i => M.l + (i / (years.length - 1)) * iw;
  const y = v => M.t + (1 - (v - yMin) / (yMax - yMin)) * ih;

  const root = svg("svg", { viewBox: `0 0 ${W} ${H}`, role: "img" });

  // gridlines
  const gridG = svg("g", { class: "axis" });
  for (let v = 1.0; v <= 2.1; v += 0.2) {
    gridG.appendChild(svg("line", { class: "gridline", x1: M.l, x2: W - M.r, y1: y(v), y2: y(v) }));
    gridG.appendChild(text(M.l - 10, y(v) + 4, v.toFixed(1) + "M", "")).setAttribute("text-anchor", "end");
  }
  root.appendChild(gridG);

  // x axis
  const xAx = svg("g", { class: "axis" });
  xAx.appendChild(svg("line", { x1: M.l, x2: W - M.r, y1: H - M.b, y2: H - M.b }));
  years.forEach((yr, i) => {
    xAx.appendChild(svg("line", { x1: x(i), x2: x(i), y1: H - M.b, y2: H - M.b + 5 }));
    const t = text(x(i), H - M.b + 20, yr);
    t.setAttribute("text-anchor", "middle");
    xAx.appendChild(t);
  });
  root.appendChild(xAx);

  // ghost lines for inactive scenarios
  const ghostG = svg("g");
  root.appendChild(ghostG);

  // active line
  const pathActive = svg("path", { fill: "none", stroke: "var(--accent)", "stroke-width": 2.5 });
  root.appendChild(pathActive);

  // dots
  const dotsG = svg("g");
  root.appendChild(dotsG);

  // end label
  const endLabel = svg("g");
  root.appendChild(endLabel);

  // y axis title
  root.appendChild(text(M.l, M.t - 12, "Direct BPO workers (millions)", "axis-title"));

  function pathFor(data) {
    return data.map((v, i) => (i === 0 ? "M" : "L") + x(i) + "," + y(v)).join(" ");
  }

  function update(s) {
    // ghosts
    ghostG.innerHTML = "";
    ["base", "accel", "crisis"].forEach(k => {
      if (k === s) return;
      const p = svg("path", {
        d: pathFor(scenarios[k]),
        fill: "none",
        stroke: "var(--ink-faded)",
        "stroke-width": 1,
        "stroke-dasharray": "2 3",
        opacity: 0.35,
      });
      ghostG.appendChild(p);
      const lbl = text(x(years.length - 1) + 8, y(scenarios[k][years.length - 1]) + 4, k.toUpperCase(), "label");
      lbl.setAttribute("fill", "var(--ink-faded)");
      ghostG.appendChild(lbl);
    });

    // active path with draw animation
    const d = pathFor(scenarios[s]);
    pathActive.setAttribute("d", d);
    const len = pathActive.getTotalLength();
    pathActive.style.transition = "none";
    pathActive.style.strokeDasharray = len;
    pathActive.style.strokeDashoffset = len;
    requestAnimationFrame(() => {
      pathActive.style.transition = "stroke-dashoffset 1.1s ease-out";
      pathActive.style.strokeDashoffset = 0;
    });

    // dots
    dotsG.innerHTML = "";
    scenarios[s].forEach((v, i) => {
      dotsG.appendChild(svg("circle", {
        cx: x(i), cy: y(v), r: 3.5,
        fill: "var(--paper)", stroke: "var(--accent)", "stroke-width": 1.5,
      }));
    });

    // end label active
    endLabel.innerHTML = "";
    const endV = scenarios[s][years.length - 1];
    const endX = x(years.length - 1);
    const endY = y(endV);
    const labelMap = { base: "OPTIMISTIC", accel: "ACCELERATED", crisis: "CRISIS" };
    const lb = text(endX + 8, endY - 10, labelMap[s], "label");
    lb.setAttribute("fill", "var(--accent)");
    lb.setAttribute("font-weight", "600");
    endLabel.appendChild(lb);
    const vb = text(endX + 8, endY + 6, endV.toFixed(2) + "M", "label");
    vb.setAttribute("fill", "var(--accent)");
    endLabel.appendChild(vb);
  }

  container.appendChild(root);
  onScenario(update);
}

// ---------- Chart 2: Remittance share of GDP 2015→2035 ----------
function renderRemitChart(container) {
  const W = 900, H = 360, M = { t: 20, r: 60, b: 50, l: 56 };
  // historical + projected per scenario
  const hist = [
    [2015, 8.9], [2017, 8.8], [2019, 8.8], [2021, 8.9],
    [2023, 7.9], [2024, 7.6], [2025, 7.3]
  ];
  const proj = {
    base:   [[2025, 7.3], [2027, 6.8], [2030, 6.0], [2033, 5.5], [2035, 5.2]],
    accel:  [[2025, 7.3], [2027, 6.5], [2030, 5.4], [2033, 4.3], [2035, 3.6]],
    crisis: [[2025, 7.3], [2027, 6.2], [2030, 4.8], [2033, 3.2], [2035, 2.2]],
  };
  const yMax = 10, yMin = 0;
  const xMin = 2015, xMax = 2035;
  const iw = W - M.l - M.r, ih = H - M.t - M.b;
  const xs = xv => M.l + ((xv - xMin) / (xMax - xMin)) * iw;
  const ys = v => M.t + (1 - (v - yMin) / (yMax - yMin)) * ih;

  const root = svg("svg", { viewBox: `0 0 ${W} ${H}` });

  // gridlines
  const grid = svg("g", { class: "axis" });
  for (let v = 0; v <= 10; v += 2) {
    grid.appendChild(svg("line", { class: "gridline", x1: M.l, x2: W - M.r, y1: ys(v), y2: ys(v) }));
    const t = text(M.l - 10, ys(v) + 4, v + "%", "");
    t.setAttribute("text-anchor", "end");
    grid.appendChild(t);
  }
  root.appendChild(grid);

  // x axis years
  const xAx = svg("g", { class: "axis" });
  xAx.appendChild(svg("line", { x1: M.l, x2: W - M.r, y1: H - M.b, y2: H - M.b }));
  [2015, 2020, 2025, 2030, 2035].forEach(yr => {
    xAx.appendChild(svg("line", { x1: xs(yr), x2: xs(yr), y1: H - M.b, y2: H - M.b + 5 }));
    const t = text(xs(yr), H - M.b + 20, yr);
    t.setAttribute("text-anchor", "middle");
    xAx.appendChild(t);
  });
  root.appendChild(xAx);

  // "today" divider
  root.appendChild(svg("line", {
    x1: xs(2025), x2: xs(2025), y1: M.t, y2: H - M.b,
    stroke: "var(--ink-faded)", "stroke-dasharray": "2 3", "stroke-width": 1,
  }));
  const todayLbl = text(xs(2025) + 6, M.t + 12, "2025", "label");
  todayLbl.setAttribute("fill", "var(--ink-faded)");
  root.appendChild(todayLbl);

  // historical path
  const histPath = svg("path", {
    d: hist.map((p, i) => (i === 0 ? "M" : "L") + xs(p[0]) + "," + ys(p[1])).join(" "),
    fill: "none", stroke: "var(--ink)", "stroke-width": 2,
  });
  root.appendChild(histPath);

  // scenario paths (always shown, but active highlighted)
  const pathGroup = svg("g");
  const scenarioPaths = {};
  const colors = { base: "var(--s-base)", accel: "var(--s-accel)", crisis: "var(--s-crisis)" };
  const labels = { base: "Optimistic", accel: "Accelerated", crisis: "Crisis" };
  for (const k of ["base", "accel", "crisis"]) {
    const d = proj[k].map((p, i) => (i === 0 ? "M" : "L") + xs(p[0]) + "," + ys(p[1])).join(" ");
    const p = svg("path", { d, fill: "none", stroke: colors[k], "stroke-width": 1.5 });
    pathGroup.appendChild(p);
    scenarioPaths[k] = p;

    const endP = proj[k][proj[k].length - 1];
    const lbl = text(xs(endP[0]) + 6, ys(endP[1]) + 4, labels[k], "label");
    lbl.setAttribute("fill", colors[k]);
    pathGroup.appendChild(lbl);
    scenarioPaths[k + "_label"] = lbl;
  }
  root.appendChild(pathGroup);

  root.appendChild(text(M.l, M.t - 4, "Remittance share of GDP", "axis-title"));

  function update(s) {
    for (const k of ["base", "accel", "crisis"]) {
      const active = k === s;
      scenarioPaths[k].setAttribute("stroke-width", active ? 2.5 : 1);
      scenarioPaths[k].setAttribute("opacity", active ? 1 : 0.35);
      scenarioPaths[k + "_label"].setAttribute("opacity", active ? 1 : 0.4);
      scenarioPaths[k + "_label"].setAttribute("font-weight", active ? 600 : 400);
    }
  }

  container.appendChild(root);
  onScenario(update);
}

// ---------- Chart 3: AGI probability curve ----------
function renderAgiChart(container) {
  const W = 900, H = 380, M = { t: 20, r: 60, b: 50, l: 48 };
  // aggregated forecast
  const points = [
    [2026, 0.08], [2027, 0.14], [2028, 0.23], [2029, 0.33],
    [2030, 0.40], [2031, 0.48], [2032, 0.57], [2033, 0.65],
    [2034, 0.73], [2035, 0.80]
  ];
  const asiPoints = [
    [2026, 0.02], [2027, 0.05], [2028, 0.08], [2029, 0.12],
    [2030, 0.18], [2031, 0.25], [2032, 0.32], [2033, 0.40],
    [2034, 0.47], [2035, 0.52]
  ];
  const xMin = 2026, xMax = 2035;
  const iw = W - M.l - M.r, ih = H - M.t - M.b;
  const xs = xv => M.l + ((xv - xMin) / (xMax - xMin)) * iw;
  const ys = v => M.t + (1 - v) * ih;

  const root = svg("svg", { viewBox: `0 0 ${W} ${H}` });

  // grid
  const grid = svg("g", { class: "axis" });
  for (let v = 0; v <= 1; v += 0.2) {
    grid.appendChild(svg("line", { class: "gridline", x1: M.l, x2: W - M.r, y1: ys(v), y2: ys(v) }));
    const t = text(M.l - 10, ys(v) + 4, Math.round(v * 100) + "%", "");
    t.setAttribute("text-anchor", "end");
    grid.appendChild(t);
  }
  root.appendChild(grid);

  // x axis
  const xAx = svg("g", { class: "axis" });
  xAx.appendChild(svg("line", { x1: M.l, x2: W - M.r, y1: H - M.b, y2: H - M.b }));
  for (let y = 2026; y <= 2035; y++) {
    xAx.appendChild(svg("line", { x1: xs(y), x2: xs(y), y1: H - M.b, y2: H - M.b + 4 }));
    if (y % 2 === 0 || y === 2035) {
      const t = text(xs(y), H - M.b + 20, y);
      t.setAttribute("text-anchor", "middle");
      xAx.appendChild(t);
    }
  }
  root.appendChild(xAx);

  // shaded area under AGI
  const agiArea = svg("path", {
    d: "M" + xs(points[0][0]) + "," + ys(0) + " " +
       points.map(p => "L" + xs(p[0]) + "," + ys(p[1])).join(" ") +
       " L" + xs(points[points.length - 1][0]) + "," + ys(0) + " Z",
    fill: "var(--accent)", opacity: 0.08,
  });
  root.appendChild(agiArea);

  // AGI line
  const agiPath = svg("path", {
    d: points.map((p, i) => (i === 0 ? "M" : "L") + xs(p[0]) + "," + ys(p[1])).join(" "),
    fill: "none", stroke: "var(--accent)", "stroke-width": 2.5,
  });
  root.appendChild(agiPath);

  // ASI line (dashed)
  const asiPath = svg("path", {
    d: asiPoints.map((p, i) => (i === 0 ? "M" : "L") + xs(p[0]) + "," + ys(p[1])).join(" "),
    fill: "none", stroke: "var(--navy)", "stroke-width": 1.8, "stroke-dasharray": "4 3",
  });
  root.appendChild(asiPath);

  // Key year markers
  const markers = [
    { year: 2030, val: 0.40, label: "40%\nby 2030" },
    { year: 2033, val: 0.65, label: "65%\nby 2033" },
  ];
  markers.forEach(m => {
    root.appendChild(svg("line", {
      x1: xs(m.year), x2: xs(m.year), y1: ys(m.val), y2: H - M.b,
      stroke: "var(--accent)", "stroke-dasharray": "2 2", "stroke-width": 1, opacity: 0.5,
    }));
    root.appendChild(svg("circle", {
      cx: xs(m.year), cy: ys(m.val), r: 4.5,
      fill: "var(--accent)", stroke: "var(--paper)", "stroke-width": 2,
    }));
    const lines = m.label.split("\n");
    lines.forEach((ln, i) => {
      const t = text(xs(m.year) + 10, ys(m.val) + 4 + i * 13, ln, "label");
      t.setAttribute("fill", "var(--accent)");
      t.setAttribute("font-weight", "600");
      root.appendChild(t);
    });
  });

  // legend
  const lg = svg("g");
  const lgX = W - M.r - 140;
  lg.appendChild(svg("line", { x1: lgX, x2: lgX + 20, y1: M.t + 12, y2: M.t + 12, stroke: "var(--accent)", "stroke-width": 2.5 }));
  lg.appendChild(text(lgX + 26, M.t + 16, "AGI-level capability", "label"));
  lg.appendChild(svg("line", { x1: lgX, x2: lgX + 20, y1: M.t + 30, y2: M.t + 30, stroke: "var(--navy)", "stroke-width": 1.8, "stroke-dasharray": "4 3" }));
  lg.appendChild(text(lgX + 26, M.t + 34, "ASI arrival", "label"));
  root.appendChild(lg);

  // draw animation
  container.appendChild(root);
  [agiPath, asiPath].forEach(p => {
    const len = p.getTotalLength();
    p.style.strokeDasharray = p === asiPath ? `${len} ${len}` : len;
    p.style.strokeDashoffset = len;
  });

  const io = new IntersectionObserver(es => {
    es.forEach(e => {
      if (e.isIntersecting) {
        agiPath.style.transition = "stroke-dashoffset 1.6s ease-out";
        agiPath.style.strokeDashoffset = 0;
        setTimeout(() => {
          asiPath.style.transition = "stroke-dashoffset 1.4s ease-out";
          asiPath.style.strokeDashoffset = 0;
          setTimeout(() => { asiPath.style.strokeDasharray = "4 3"; }, 1400);
        }, 400);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  io.observe(container);
}

// ---------- Chart 4: Sector small multiples ----------
function renderSectorMultiples(container) {
  const sectors = [
    { key: "bpo", name: "BPO headcount", unit: "M", now: 1.90, end: { base: 1.71, accel: 1.42, crisis: 1.15 }, max: 2.1, min: 1.0, invert: true },
    { key: "remit", name: "Remittance / GDP", unit: "%", now: 7.3, end: { base: 5.2, accel: 3.6, crisis: 2.2 }, max: 10, min: 0, invert: true },
    { key: "peso", name: "PHP / USD", unit: "", now: 59, end: { base: 63, accel: 70, crisis: 82 }, max: 90, min: 50, invert: false },
    { key: "debt", name: "Debt / GDP", unit: "%", now: 63.2, end: { base: 67, accel: 72, crisis: 78 }, max: 85, min: 55, invert: false },
    { key: "gdp", name: "GDP growth", unit: "%", now: 4.4, end: { base: 5.0, accel: 3.5, crisis: 1.8 }, max: 6.5, min: 0, invert: true },
    { key: "rice", name: "Rice self-sufficiency", unit: "%", now: 71.7, end: { base: 70, accel: 65, crisis: 58 }, max: 90, min: 50, invert: true },
  ];

  const grid = document.createElement("div");
  grid.style.cssText = `display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1px; background: var(--rule); border: 1px solid var(--rule);`;
  container.appendChild(grid);

  const cards = [];
  sectors.forEach(s => {
    const card = document.createElement("div");
    card.style.cssText = `background: var(--paper); padding: 20px 18px;`;
    const header = document.createElement("div");
    header.style.cssText = `display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 14px;`;
    header.innerHTML = `
      <div style="font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-muted);">${s.name}</div>
      <div style="font-family: var(--mono); font-size: 10px; color: var(--ink-faded);">2025 → 2030</div>
    `;
    card.appendChild(header);

    // sparkline svg
    const W = 260, H = 80, M = { t: 10, r: 10, b: 10, l: 10 };
    const chartSvg = svg("svg", { viewBox: `0 0 ${W} ${H}`, style: "display:block;width:100%;" });
    const x0 = M.l, x1 = W - M.r;
    const yS = v => M.t + (1 - (v - s.min) / (s.max - s.min)) * (H - M.t - M.b);

    // baseline
    chartSvg.appendChild(svg("line", {
      x1: x0, x2: x1, y1: yS(s.now), y2: yS(s.now),
      stroke: "var(--rule)", "stroke-dasharray": "2 2", "stroke-width": 1
    }));

    // ghost lines for other scenarios
    const ghostG = svg("g");
    chartSvg.appendChild(ghostG);
    // active line
    const pathEl = svg("path", { fill: "none", stroke: "var(--accent)", "stroke-width": 2 });
    chartSvg.appendChild(pathEl);
    // start+end dots
    const startDot = svg("circle", { cx: x0, cy: yS(s.now), r: 3, fill: "var(--ink)" });
    const endDot = svg("circle", { cx: x1, cy: yS(s.end.base), r: 3.5, fill: "var(--accent)" });
    chartSvg.appendChild(startDot);
    chartSvg.appendChild(endDot);
    card.appendChild(chartSvg);

    // value row
    const values = document.createElement("div");
    values.style.cssText = `display: flex; justify-content: space-between; align-items: baseline; margin-top: 12px; font-family: var(--mono); font-size: 11px;`;
    values.innerHTML = `
      <div><span style="color: var(--ink-faded);">NOW </span><span style="color: var(--ink); font-weight: 600;">${s.now}${s.unit}</span></div>
      <div data-end><span style="color: var(--ink-faded);">2030 </span><span style="color: var(--accent); font-weight: 600;">—</span></div>
    `;
    card.appendChild(values);

    grid.appendChild(card);
    cards.push({ s, pathEl, endDot, ghostG, values, yS, x0, x1 });
  });

  function update(scn) {
    cards.forEach(({ s, pathEl, endDot, ghostG, values, yS, x0, x1 }) => {
      const endV = s.end[scn];
      // active path: curve from now→end
      const midX = (x0 + x1) / 2;
      pathEl.setAttribute("d", `M${x0},${yS(s.now)} Q${midX},${yS((s.now + endV) / 2 + (endV - s.now) * 0.1)} ${x1},${yS(endV)}`);
      endDot.setAttribute("cy", yS(endV));

      // ghosts
      ghostG.innerHTML = "";
      for (const k of ["base", "accel", "crisis"]) {
        if (k === scn) continue;
        const v = s.end[k];
        const midX2 = (x0 + x1) / 2;
        const p = svg("path", {
          d: `M${x0},${yS(s.now)} Q${midX2},${yS((s.now + v) / 2)} ${x1},${yS(v)}`,
          fill: "none", stroke: "var(--ink-faded)", "stroke-width": 1,
          "stroke-dasharray": "2 2", opacity: 0.3
        });
        ghostG.appendChild(p);
      }

      // value
      const endSpan = values.querySelector("[data-end] span:last-child");
      const delta = endV - s.now;
      const sign = delta >= 0 ? "+" : "";
      const bad = s.invert ? delta < 0 : delta > 0;
      endSpan.textContent = `${endV}${s.unit} (${sign}${delta.toFixed(1)})`;
      endSpan.style.color = bad ? "var(--accent)" : "var(--s-base)";
    });
  }
  onScenario(update);
}

// ---------- Chart 5: Energy mix donut ----------
function renderEnergyMix(container) {
  const data = [
    { label: "Coal", value: 60, color: "#3a3a3f" },
    { label: "Gas", value: 16, color: "#6b6b72" },
    { label: "Renewables", value: 22, color: "#5B7B54" },
    { label: "Other", value: 2, color: "#B4452C" },
  ];
  const W = 260, H = 260, cx = W / 2, cy = H / 2, r = 95, ri = 55;
  const root = svg("svg", { viewBox: `0 0 ${W} ${H}`, style: "max-width: 260px; margin: 0 auto; display: block;" });

  let a0 = -Math.PI / 2;
  data.forEach(d => {
    const a1 = a0 + (d.value / 100) * Math.PI * 2;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const x0 = cx + Math.cos(a0) * r, y0 = cy + Math.sin(a0) * r;
    const x1_ = cx + Math.cos(a1) * r, y1_ = cy + Math.sin(a1) * r;
    const x2 = cx + Math.cos(a1) * ri, y2 = cy + Math.sin(a1) * ri;
    const x3 = cx + Math.cos(a0) * ri, y3 = cy + Math.sin(a0) * ri;
    const path = svg("path", {
      d: `M${x0},${y0} A${r},${r} 0 ${large} 1 ${x1_},${y1_} L${x2},${y2} A${ri},${ri} 0 ${large} 0 ${x3},${y3} Z`,
      fill: d.color,
      opacity: 0,
    });
    root.appendChild(path);
    setTimeout(() => {
      path.style.transition = "opacity 0.6s";
      path.style.opacity = 1;
    }, data.indexOf(d) * 200 + 100);
    a0 = a1;
  });

  // center text
  const tA = text(cx, cy - 4, "200 MW", "label");
  tA.setAttribute("text-anchor", "middle");
  tA.setAttribute("fill", "var(--ink)");
  tA.setAttribute("font-size", "22");
  tA.setAttribute("font-family", "var(--serif)");
  tA.setAttribute("font-weight", "500");
  root.appendChild(tA);
  const tB = text(cx, cy + 16, "DC capacity", "label");
  tB.setAttribute("text-anchor", "middle");
  root.appendChild(tB);

  const wrap = document.createElement("div");
  wrap.className = "energy-wrap";
  const left = document.createElement("div");
  left.appendChild(root);
  wrap.appendChild(left);

  const legend = document.createElement("div");
  legend.style.cssText = "font-family: var(--mono); font-size: 12px;";
  legend.innerHTML = data.map(d => `
    <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--rule-soft);">
      <span style="width:10px;height:10px;background:${d.color};display:inline-block;"></span>
      <span style="flex:1;color:var(--ink);">${d.label}</span>
      <span style="color:var(--ink-muted);font-variant-numeric:tabular-nums;">${d.value}%</span>
    </div>
  `).join("");
  wrap.appendChild(legend);
  container.appendChild(wrap);
}

// ---------- Chart 6: Humanoid cost crossover ----------
function renderCrossover(container) {
  const W = 900, H = 360, M = { t: 20, r: 100, b: 50, l: 72 };
  const years = [2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033];
  const human =  [10500, 10700, 10900, 11100, 11300, 11500, 11700, 11900, 12100]; // $/yr
  const robot =  [22000, 18000, 14500, 11000,  8500,  6500,  5200,  4200,  3600]; // $/yr RaaS
  const yMin = 0, yMax = 24000;
  const iw = W - M.l - M.r, ih = H - M.t - M.b;
  const xs = i => M.l + (i / (years.length - 1)) * iw;
  const ys = v => M.t + (1 - (v - yMin) / (yMax - yMin)) * ih;

  const root = svg("svg", { viewBox: `0 0 ${W} ${H}` });

  // grid
  const grid = svg("g", { class: "axis" });
  for (let v = 0; v <= 24000; v += 6000) {
    grid.appendChild(svg("line", { class: "gridline", x1: M.l, x2: W - M.r, y1: ys(v), y2: ys(v) }));
    const t = text(M.l - 10, ys(v) + 4, "$" + (v / 1000) + "k", "");
    t.setAttribute("text-anchor", "end");
    grid.appendChild(t);
  }
  root.appendChild(grid);

  // x axis
  const xAx = svg("g", { class: "axis" });
  xAx.appendChild(svg("line", { x1: M.l, x2: W - M.r, y1: H - M.b, y2: H - M.b }));
  years.forEach((y, i) => {
    xAx.appendChild(svg("line", { x1: xs(i), x2: xs(i), y1: H - M.b, y2: H - M.b + 4 }));
    if (i % 2 === 0 || i === years.length - 1) {
      const t = text(xs(i), H - M.b + 20, y);
      t.setAttribute("text-anchor", "middle");
      xAx.appendChild(t);
    }
  });
  root.appendChild(xAx);

  // find crossover
  let crossX = null, crossY = null;
  for (let i = 1; i < years.length; i++) {
    if ((human[i - 1] - robot[i - 1]) * (human[i] - robot[i]) < 0) {
      // linear interp
      const d1 = human[i - 1] - robot[i - 1];
      const d2 = human[i] - robot[i];
      const t = d1 / (d1 - d2);
      crossX = xs(i - 1) + t * (xs(i) - xs(i - 1));
      crossY = ys(human[i - 1] + t * (human[i] - human[i - 1]));
      break;
    }
  }

  // shaded zone past crossover
  if (crossX) {
    root.appendChild(svg("rect", {
      x: crossX, y: M.t, width: (W - M.r) - crossX, height: ih,
      fill: "var(--s-crisis)", opacity: 0.06,
    }));
  }

  // lines
  const humanPath = svg("path", {
    d: human.map((v, i) => (i === 0 ? "M" : "L") + xs(i) + "," + ys(v)).join(" "),
    fill: "none", stroke: "var(--navy)", "stroke-width": 2.5,
  });
  const robotPath = svg("path", {
    d: robot.map((v, i) => (i === 0 ? "M" : "L") + xs(i) + "," + ys(v)).join(" "),
    fill: "none", stroke: "var(--accent)", "stroke-width": 2.5,
  });
  root.appendChild(humanPath);
  root.appendChild(robotPath);

  // labels
  const hl = text(xs(years.length - 1) + 8, ys(human[years.length - 1]) + 4, "Gulf domestic helper (all-in)", "label");
  hl.setAttribute("fill", "var(--navy)");
  root.appendChild(hl);
  const rl = text(xs(years.length - 1) + 8, ys(robot[years.length - 1]) + 4, "Humanoid RaaS", "label");
  rl.setAttribute("fill", "var(--accent)");
  root.appendChild(rl);

  // crossover marker
  if (crossX) {
    root.appendChild(svg("circle", {
      cx: crossX, cy: crossY, r: 6, fill: "var(--paper)", stroke: "var(--s-crisis)", "stroke-width": 2,
    }));
    root.appendChild(svg("line", {
      x1: crossX, x2: crossX, y1: crossY + 8, y2: H - M.b,
      stroke: "var(--s-crisis)", "stroke-dasharray": "2 2", "stroke-width": 1,
    }));
    const lbl = text(crossX, crossY - 14, "CROSSOVER", "label");
    lbl.setAttribute("text-anchor", "middle");
    lbl.setAttribute("fill", "var(--s-crisis)");
    lbl.setAttribute("font-weight", "600");
    root.appendChild(lbl);
  }

  root.appendChild(text(M.l, M.t - 4, "Annual cost per worker (USD)", "axis-title"));
  container.appendChild(root);

  // animate
  [humanPath, robotPath].forEach(p => {
    const len = p.getTotalLength();
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
  });
  const io = new IntersectionObserver(es => {
    es.forEach(e => {
      if (e.isIntersecting) {
        humanPath.style.transition = "stroke-dashoffset 1.4s ease-out";
        humanPath.style.strokeDashoffset = 0;
        robotPath.style.transition = "stroke-dashoffset 1.4s ease-out 0.2s";
        robotPath.style.strokeDashoffset = 0;
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  io.observe(container);
}

// ---------- Chart 7: Exposure map of regional BPO concentration ----------
function renderExposureBars(container) {
  const cities = [
    { name: "Metro Manila", share: 66, voice: 58 },
    { name: "Cebu",         share: 15, voice: 62 },
    { name: "Clark",        share: 4,  voice: 55 },
    { name: "Davao",        share: 3,  voice: 60 },
    { name: "Iloilo",       share: 2,  voice: 55 },
    { name: "Bacolod",      share: 1.5,voice: 65 },
  ];
  const W = 900, H = 280, M = { t: 30, r: 110, b: 40, l: 160 };
  const iw = W - M.l - M.r, ih = H - M.t - M.b;
  const rowH = ih / cities.length;
  const maxShare = 70;

  const root = svg("svg", { viewBox: `0 0 ${W} ${H}` });

  // grid
  for (let v = 0; v <= 70; v += 10) {
    const x = M.l + (v / maxShare) * iw;
    root.appendChild(svg("line", { class: "gridline", x1: x, x2: x, y1: M.t, y2: H - M.b }));
    if (v % 20 === 0) {
      const t = text(x, H - M.b + 18, v + "%", "");
      t.setAttribute("text-anchor", "middle");
      root.appendChild(t);
    }
  }
  root.appendChild(svg("line", { x1: M.l, x2: M.l, y1: M.t, y2: H - M.b, stroke: "var(--ink)", "stroke-width": 1 }));

  cities.forEach((c, i) => {
    const y0 = M.t + i * rowH + 8;
    const barH = rowH - 16;
    // name
    const t = text(M.l - 12, y0 + barH / 2 + 4, c.name, "label");
    t.setAttribute("text-anchor", "end");
    t.setAttribute("fill", "var(--ink)");
    t.setAttribute("font-size", 12);
    root.appendChild(t);

    // total bar (background)
    const wTot = (c.share / maxShare) * iw;
    const bar = svg("rect", {
      x: M.l, y: y0, width: 0, height: barH,
      fill: "var(--navy)", opacity: 0.25,
    });
    root.appendChild(bar);

    // voice bar (darker portion)
    const wVoice = wTot * (c.voice / 100);
    const voiceBar = svg("rect", {
      x: M.l, y: y0, width: 0, height: barH,
      fill: "var(--accent)",
    });
    root.appendChild(voiceBar);

    // label
    const lbl = text(M.l + wTot + 8, y0 + barH / 2 + 4, c.share + "% of sector", "label");
    lbl.setAttribute("fill", "var(--ink-muted)");
    root.appendChild(lbl);

    // animate
    setTimeout(() => {
      bar.style.transition = "width 0.9s ease-out";
      voiceBar.style.transition = "width 0.9s ease-out";
      bar.setAttribute("width", wTot);
      voiceBar.setAttribute("width", wVoice);
    }, i * 120 + 200);
  });

  // legend
  const lgY = M.t - 16;
  root.appendChild(svg("rect", { x: M.l, y: lgY - 8, width: 10, height: 10, fill: "var(--accent)" }));
  root.appendChild(text(M.l + 14, lgY + 1, "Voice-tier share (most AI-exposed)", "label"));
  root.appendChild(svg("rect", { x: M.l + 260, y: lgY - 8, width: 10, height: 10, fill: "var(--navy)", opacity: 0.25 }));
  root.appendChild(text(M.l + 274, lgY + 1, "Non-voice / back-office", "label"));

  container.appendChild(root);

  const io = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); } });
  }, { threshold: 0.2 });
  io.observe(container);
}

// ---------- Chart 8: Probability distribution (scenarios) ----------
function renderScenarioBars(container) {
  const data = [
    { key: "base", name: "OPTIMISTIC",  p: 50, desc: "Managed erosion.\nGrowth-lite but stable." },
    { key: "accel", name: "ACCELERATED", p: 35, desc: "Sharp adjustment.\nPolitical stress.\nFDI deters." },
    { key: "crisis", name: "CRISIS",     p: 15, desc: "Co-moving shocks.\nSovereign downgrade.\nCapital controls." },
  ];
  const wrap = document.createElement("div");
  wrap.className = "scenario-grid";
  const colors = { base: "var(--s-base)", accel: "var(--s-accel)", crisis: "var(--s-crisis)" };

  data.forEach(d => {
    const card = document.createElement("button");
    card.className = "scenario-card";
    card.setAttribute("data-scenario", d.key);
    card.style.cssText = `
      background: var(--paper); padding: 28px 24px; text-align: left;
      border: none; cursor: pointer; font-family: var(--serif);
      display: flex; flex-direction: column; gap: 16px;
      transition: background 0.2s;
      min-height: 260px;
    `;
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:baseline;">
        <div style="font-family: var(--mono); font-size: 11px; letter-spacing: 0.18em; color: ${colors[d.key]}; font-weight: 600;">${d.name}</div>
        <div style="font-family: var(--serif); font-size: 44px; font-weight: 500; color: var(--ink); line-height: 1; font-variant-numeric: tabular-nums;"><span class="prob-num">${d.p}</span><span style="font-size:22px;color:var(--ink-muted);">%</span></div>
      </div>
      <div style="height:4px;background:var(--rule-soft);position:relative;">
        <div class="prob-fill" style="position:absolute;left:0;top:0;bottom:0;width:0;background:${colors[d.key]};transition:width 1s ease-out;"></div>
      </div>
      <div style="font-family: var(--serif); font-size: 17px; line-height: 1.4; color: var(--ink-2); white-space: pre-line; font-style: italic;">${d.desc}</div>
      <div style="margin-top:auto;font-family:var(--mono);font-size:10px;letter-spacing:0.14em;color:var(--ink-faded);text-transform:uppercase;">Click to explore →</div>
    `;
    card.addEventListener("click", () => setScenario(d.key));
    wrap.appendChild(card);

    // animate fill
    const io = new IntersectionObserver(es => {
      es.forEach(e => {
        if (e.isIntersecting) {
          // Use MC-derived probability if already patched, else fall back to static value
          const target = card.dataset.mcProb !== undefined ? card.dataset.mcProb : d.p;
          card.querySelector(".prob-fill").style.width = target + "%";
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.3 });
    io.observe(card);
  });

  container.appendChild(wrap);

  // highlight active
  function update(s) {
    wrap.querySelectorAll("[data-scenario]").forEach(el => {
      const active = el.getAttribute("data-scenario") === s;
      el.style.background = active ? "var(--paper-2)" : "var(--paper)";
      el.style.boxShadow = active ? "inset 0 2px 0 var(--accent)" : "none";
    });
  }
  onScenario(update);
}

// ---------- Chart 9: Displacement wave (animated area) ----------
function renderDisplacementWave(container) {
  const W = 900, H = 300, M = { t: 30, r: 50, b: 40, l: 60 };
  // cumulative displaced BPO workers by year
  const years = [2026, 2027, 2028, 2029, 2030];
  // base / accel / crisis trajectories (K workers)
  const data = {
    base:   [40, 120, 260, 400, 540],
    accel:  [90, 240, 460, 680, 880],
    crisis: [140, 340, 640, 920, 1200],
  };
  const yMax = 1400, yMin = 0;
  const iw = W - M.l - M.r, ih = H - M.t - M.b;
  const xs = i => M.l + (i / (years.length - 1)) * iw;
  const ys = v => M.t + (1 - (v - yMin) / (yMax - yMin)) * ih;

  const root = svg("svg", { viewBox: `0 0 ${W} ${H}` });

  // grid
  const grid = svg("g", { class: "axis" });
  for (let v = 0; v <= 1400; v += 400) {
    grid.appendChild(svg("line", { class: "gridline", x1: M.l, x2: W - M.r, y1: ys(v), y2: ys(v) }));
    const t = text(M.l - 10, ys(v) + 4, v + "K", "");
    t.setAttribute("text-anchor", "end");
    grid.appendChild(t);
  }
  root.appendChild(grid);

  // x axis
  const xAx = svg("g", { class: "axis" });
  xAx.appendChild(svg("line", { x1: M.l, x2: W - M.r, y1: H - M.b, y2: H - M.b }));
  years.forEach((y, i) => {
    xAx.appendChild(svg("line", { x1: xs(i), x2: xs(i), y1: H - M.b, y2: H - M.b + 4 }));
    const t = text(xs(i), H - M.b + 20, y);
    t.setAttribute("text-anchor", "middle");
    xAx.appendChild(t);
  });
  root.appendChild(xAx);

  const area = svg("path", { fill: "var(--accent)", opacity: 0.15 });
  const line = svg("path", { fill: "none", stroke: "var(--accent)", "stroke-width": 2.5 });
  root.appendChild(area);
  root.appendChild(line);

  const endTag = svg("g");
  root.appendChild(endTag);

  root.appendChild(text(M.l, M.t - 4, "Cumulative displaced BPO workers", "axis-title"));

  function update(s) {
    const arr = data[s];
    const linePath = arr.map((v, i) => (i === 0 ? "M" : "L") + xs(i) + "," + ys(v)).join(" ");
    const areaPath = `M${xs(0)},${ys(0)} ` + arr.map((v, i) => "L" + xs(i) + "," + ys(v)).join(" ") + ` L${xs(years.length - 1)},${ys(0)} Z`;
    line.setAttribute("d", linePath);
    area.setAttribute("d", areaPath);

    // animate
    const len = line.getTotalLength();
    line.style.transition = "none";
    line.style.strokeDasharray = len;
    line.style.strokeDashoffset = len;
    requestAnimationFrame(() => {
      line.style.transition = "stroke-dashoffset 1.1s ease-out";
      line.style.strokeDashoffset = 0;
    });

    // end tag
    endTag.innerHTML = "";
    const endV = arr[arr.length - 1];
    const endX = xs(years.length - 1);
    const endY = ys(endV);
    const t = text(endX - 8, endY - 10, `~${endV}K by 2030`, "label");
    t.setAttribute("text-anchor", "end");
    t.setAttribute("fill", "var(--accent)");
    t.setAttribute("font-weight", 600);
    endTag.appendChild(t);
    endTag.appendChild(svg("circle", { cx: endX, cy: endY, r: 4, fill: "var(--accent)" }));
  }
  onScenario(update);
  container.appendChild(root);
}

// ---------- Monte Carlo scenario simulation ----------
let _mc = null;

function runMC() {
  if (_mc) return _mc;
  const N = 8000;

  function tri(a, mode, b) {
    const u = Math.random(), fc = (mode - a) / (b - a);
    return u < fc
      ? a + Math.sqrt(u * (b - a) * (mode - a))
      : b - Math.sqrt((1 - u) * (b - a) * (b - mode));
  }

  // --- Thresholds: economic consequence, not heuristic midpoints ---
  // T_BASE  1.60M: ≤ 300K net displaced. Historical precedent (Irish manufacturing
  //   1980s, UK coal relative scale) — manageable with intact social protection.
  // T_ACCEL 1.20M: > 700K net displaced. Crosses the threshold where peso
  //   stabilisation requires both remittance and BPO legs simultaneously, and
  //   both are under pressure. Consistent with IMF-adjacent fiscal stress onset.
  const T_BASE  = 1.60;
  const T_ACCEL = 1.20;

  const runs = [];
  let nb = 0, na = 0, nc = 0;

  for (let i = 0; i < N; i++) {

    // --- Parameter 1: gross BPO displacement fraction, 2025–2030 ---
    // Source: McKinsey Global Institute (2023) estimates 60–70% of customer-
    // service work activities are automatable with current AI. Enterprise
    // adoption lag at 5-year horizon: analyst consensus ~30–35% penetration
    // of automatable capacity (long contracts, procurement cycles, quality risk).
    // Combined with non-voice back-office (lower exposure), blended sector:
    //   min 0.08 — regulatory friction, long-term contract lock-in
    //   mode 0.22 — central analyst estimate (Forrester, IDC 2024 BPO outlook)
    //   max 0.55 — Klarna-pace adoption (85% CS headcount cut in 18 months)
    //             applied to aggressive-client cohort rotating on contract renewal
    const baseDisplace = tri(0.08, 0.22, 0.55);

    // --- Parameter 2: policy absorption fraction of displaced workers ---
    // Source: TESDA historical throughput ~200K workers/year into skills programs;
    // effective placement rate ~50% (PSA Labour Force Survey, 2022–2024).
    // Against a central-case displacement of ~420K workers, TESDA absorbs
    // ~100K → ~24% of displaced. Adjusted downward for IMF fiscal constraints
    // (narrative mechanism) and upward for GCC growth absorbing displaced workers.
    //   min 0.03 — IMF-constrained, programs defunded (as in crisis path)
    //   mode 0.12 — TESDA throughput at 50% effectiveness vs central displacement
    //   max 0.28 — well-funded TESDA + active GCC-partnership placements
    const policyAbsorb = tri(0.03, 0.12, 0.28);

    // --- Parameter 3: early AGI cascade ---
    // Source: Metaculus community aggregate (accessed Q1 2026). Conditional
    // probability of transformative AI capability arriving before 2029 — the
    // threshold relevant to non-linear deployment acceleration — is approximately
    // 20–25% (derived from the 40% by-2030 aggregate, adjusted for first-half
    // weighting via Epoch AI compute-trajectory doubling rates).
    // When cascade fires: additional 5–30% displacement above baseline, reflecting
    // enterprise adoption friction disappearing when capability crosses an obvious
    // threshold (voice AI indistinguishable from human across all CSAT metrics).
    const agiBoost = Math.random() < 0.22
                     ? tri(0.05, 0.15, 0.30) : 0;

    // Net displacement: policy absorbs a fraction of gross; AGI adds on top
    const netD  = Math.min(baseDisplace * (1 - policyAbsorb) + agiBoost, 0.82);
    const bpo30 = Math.max(1.90 * (1 - netD), 0.55);
    runs.push(bpo30);

    if (bpo30 >= T_BASE) nb++;
    else if (bpo30 >= T_ACCEL) na++;
    else nc++;
  }

  _mc = {
    runs,
    probs: {
      base:   Math.round(nb / N * 100),
      accel:  Math.round(na / N * 100),
      crisis: Math.round(nc / N * 100),
    },
    T_BASE, T_ACCEL,
  };
  return _mc;
}

function renderMCDistribution(container) {
  const mc = runMC();

  // Histogram
  const LO = 0.78, HI = 2.08, STEP = 0.05;
  const bins = [];
  for (let v = LO; v < HI; v += STEP) bins.push({ lo: v, hi: v + STEP, count: 0 });
  mc.runs.forEach(v => {
    const idx = Math.min(Math.floor((v - LO) / STEP), bins.length - 1);
    if (idx >= 0) bins[idx].count++;
  });
  const maxCount = Math.max(...bins.map(b => b.count));

  const W = 900, H = 360, M = { t: 72, r: 48, b: 68, l: 60 };
  const iw = W - M.l - M.r, ih = H - M.t - M.b;
  const xS = v => M.l + ((v - LO) / (HI - LO)) * iw;
  const yS = c => M.t + (1 - c / maxCount) * ih;
  const bw = iw / bins.length;

  const root = svg("svg", { viewBox: `0 0 ${W} ${H}` });

  // Bars colored by scenario zone
  bins.forEach((bin, i) => {
    if (bin.count === 0) return;
    const mid = (bin.lo + bin.hi) / 2;
    const col = mid >= mc.T_BASE  ? "var(--s-base)"
              : mid >= mc.T_ACCEL ? "var(--s-accel)"
              :                     "var(--s-crisis)";
    root.appendChild(svg("rect", {
      x: M.l + i * bw, y: yS(bin.count),
      width: Math.max(bw - 1, 1),
      height: Math.max(ih - (yS(bin.count) - M.t), 0),
      fill: col, opacity: 0.75,
    }));
  });

  // Threshold dashed lines
  [
    { v: mc.T_BASE,  label: mc.T_BASE.toFixed(2) + "M" },
    { v: mc.T_ACCEL, label: mc.T_ACCEL.toFixed(2) + "M" },
  ].forEach(({ v, label }) => {
    const x = xS(v);
    root.appendChild(svg("line", {
      x1: x, x2: x, y1: M.t, y2: H - M.b,
      stroke: "var(--ink-muted)", "stroke-width": 1.5, "stroke-dasharray": "3 3",
    }));
    const tl = text(x + 5, M.t + 14, label, "label");
    tl.setAttribute("fill", "var(--ink-faded)");
    root.appendChild(tl);
  });

  // Zone probability labels (above bars)
  [
    { key: "base",   cx: (xS(HI) + xS(mc.T_BASE)) / 2,        col: "var(--s-base)"   },
    { key: "accel",  cx: (xS(mc.T_BASE) + xS(mc.T_ACCEL)) / 2, col: "var(--s-accel)"  },
    { key: "crisis", cx: (xS(mc.T_ACCEL) + xS(LO)) / 2,        col: "var(--s-crisis)" },
  ].forEach(({ key, cx, col }) => {
    const big = text(cx, 28, mc.probs[key] + "%", "");
    big.setAttribute("text-anchor", "middle");
    big.setAttribute("fill", col);
    big.setAttribute("font-family", "var(--serif)");
    big.setAttribute("font-size", "30");
    big.setAttribute("font-weight", "500");
    root.appendChild(big);
    const nameMap = { base: "OPTIMISTIC", accel: "ACCELERATED", crisis: "CRISIS" };
    const lbl = text(cx, 50, nameMap[key] || key.toUpperCase(), "label");
    lbl.setAttribute("text-anchor", "middle");
    lbl.setAttribute("fill", col);
    root.appendChild(lbl);
  });

  // X axis
  const xAx = svg("g", { class: "axis" });
  xAx.appendChild(svg("line", { x1: M.l, x2: W - M.r, y1: H - M.b, y2: H - M.b }));
  [0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0].forEach(v => {
    const x = xS(v);
    xAx.appendChild(svg("line", { x1: x, x2: x, y1: H - M.b, y2: H - M.b + 5 }));
    const t = text(x, H - M.b + 18, v.toFixed(1) + "M", "");
    t.setAttribute("text-anchor", "middle");
    xAx.appendChild(t);
  });
  root.appendChild(xAx);

  const axLbl = text(W / 2, H - 10, "BPO direct employment in 2030 (millions)", "axis-title");
  axLbl.setAttribute("text-anchor", "middle");
  root.appendChild(axLbl);

  container.appendChild(root);

  // Patch scenario cards and sidebar buttons with MC-derived probabilities
  document.querySelectorAll(".scenario-btn .prob").forEach(el => {
    const s = el.closest("[data-scenario]").getAttribute("data-scenario");
    if (mc.probs[s] !== undefined) el.textContent = mc.probs[s] + "%";
  });
  document.querySelectorAll(".scenario-card").forEach(card => {
    const s = card.getAttribute("data-scenario");
    if (!mc.probs[s]) return;
    card.dataset.mcProb = mc.probs[s]; // IO reads this so it never reverts to hardcoded value
    const numEl = card.querySelector(".prob-num");
    if (numEl) numEl.textContent = mc.probs[s];
    const fill = card.querySelector(".prob-fill");
    if (fill) fill.style.width = mc.probs[s] + "%";
  });
}

// ---------- Export ----------
window.PhCharts = {
  setScenario, onScenario,
  renderBpoChart, renderRemitChart, renderAgiChart,
  renderSectorMultiples, renderEnergyMix, renderCrossover,
  renderExposureBars, renderScenarioBars, renderDisplacementWave,
  renderMCDistribution,
};
