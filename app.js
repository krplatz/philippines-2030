/* ============================================================
   Philippines 2030 — App wiring: sidebar scroll-spy, progress,
   reveal-on-scroll, timeline, glossary, footnotes.
   ============================================================ */

(function () {
  // ---------- Progress bar ----------
  const progressFill = document.querySelector(".progress-bar .fill");
  function updateProgress() {
    const doc = document.documentElement;
    const scrolled = window.scrollY;
    const height = doc.scrollHeight - window.innerHeight;
    const pct = height > 0 ? (scrolled / height) * 100 : 0;
    if (progressFill) progressFill.style.width = pct + "%";
  }
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  // ---------- Scroll spy for sidebar ----------
  const navLinks = Array.from(document.querySelectorAll(".nav-list a[href^='#']"));
  const sections = navLinks.map(a => document.querySelector(a.getAttribute("href"))).filter(Boolean);

  function spy() {
    const y = window.scrollY + 140;
    let activeIdx = 0;
    sections.forEach((s, i) => { if (s.offsetTop <= y) activeIdx = i; });
    navLinks.forEach((a, i) => a.classList.toggle("active", i === activeIdx));
  }
  window.addEventListener("scroll", spy, { passive: true });
  spy();

  // ---------- Reveal on scroll ----------
  const reveals = document.querySelectorAll(".reveal-root");
  const isMobile = window.innerWidth <= 1024;
  const revealIO = new IntersectionObserver(es => {
    es.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("is-visible");
        revealIO.unobserve(e.target);
      }
    });
  }, {
    threshold: isMobile ? 0.01 : 0.12,
    rootMargin: isMobile ? "0px 0px 0px 0px" : "0px 0px -60px 0px"
  });
  reveals.forEach(r => revealIO.observe(r));

  // Safety fallback: if any reveal-root is still hidden after 3s, show it.
  // This catches edge cases where the IntersectionObserver fails on some mobile browsers.
  setTimeout(() => {
    reveals.forEach(r => {
      if (!r.classList.contains("is-visible")) {
        r.classList.add("is-visible");
      }
    });
  }, 3000);

  // ---------- Scenario buttons in sidebar ----------
  document.querySelectorAll(".scenario-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const s = btn.getAttribute("data-scenario");
      PhCharts.setScenario(s);
    });
  });
  PhCharts.onScenario(s => {
    document.querySelectorAll(".scenario-btn").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-scenario") === s);
    });
  });
  // set default from body attribute so each page can declare its own scenario
  PhCharts.setScenario(document.body.getAttribute("data-scenario") || "base");

  // ---------- Timeline builder ----------
  (function buildTimeline() {
    const host = document.getElementById("timeline-host");
    if (!host) return;
    // lane: vertical offset in px from the axis (negative = above, positive = below)
    const events = [
      { year: 2026, variant: "bpo",   title: "First-wave displacement",    body: "150–300K tier-1 voice and back-office roles automated.",             lane: -170 },
      { year: 2027, variant: "agi",   title: "Frontier voice parity",      body: "Multimodal models reach Taglish-native fluency in most cases.",      lane:  60 },
      { year: 2028, variant: "bpo",   title: "Political inflection",       body: "Displacement visible in the Philippine election cycle.",             lane: -40 },
      { year: 2029, variant: "remit", title: "Gulf humanoid crossover",    body: "Domestic-helper wage costs meet humanoid RaaS pricing.",             lane:  170 },
      { year: 2030, variant: "agi",   title: "AGI ≈ 40% probability",      body: "Aggregated forecasts place AGI-level capability inside the decade.", lane: -170 },
      { year: 2032, variant: "power", title: "BNPP target online",         body: "1,200 MW of nuclear capacity per Philippine Energy Plan.",           lane:  60 },
      { year: 2033, variant: "agi",   title: "AGI ≈ 65% probability",      body: "Middle of the adjustment phase across most scenario paths.",         lane: -40 },
      { year: 2035, variant: "remit", title: "Seafarer ratings shift",     body: "Autonomous deep-sea operations begin displacing rating roles.",      lane:  170 },
    ];

    const track = document.createElement("div");
    track.className = "timeline-track";

    const axis = document.createElement("div");
    axis.className = "timeline-axis";
    track.appendChild(axis);

    const yMin = 2026, yMax = 2035;
    // year ticks
    for (let y = yMin; y <= yMax; y++) {
      const pct = ((y - yMin) / (yMax - yMin)) * 100;
      const tick = document.createElement("div");
      tick.className = "timeline-tick";
      tick.style.left = pct + "%";
      axis.appendChild(tick);
      const lbl = document.createElement("div");
      lbl.className = "timeline-year";
      lbl.style.left = pct + "%";
      lbl.textContent = y;
      axis.appendChild(lbl);
    }

    events.forEach((ev, i) => {
      const pct = ((ev.year - yMin) / (yMax - yMin)) * 100;
      const el = document.createElement("div");
      el.className = "timeline-event";
      el.setAttribute("data-variant", ev.variant);
      el.style.left = `calc(${pct}% )`;
      // position relative to axis (axis is at top:50% of track)
      if (ev.lane < 0) {
        el.style.bottom = `calc(50% + ${-ev.lane}px)`;
      } else {
        el.style.top = `calc(50% + ${ev.lane}px)`;
      }
      el.innerHTML = `
        <span class="ev-year">${ev.year}</span>
        <strong style="font-size:13px;color:var(--ink);display:block;margin-bottom:4px;">${ev.title}</strong>
        <span>${ev.body}</span>
      `;
      // connector line
      const conn = document.createElement("span");
      conn.style.cssText = `position:absolute;left:50%;width:1px;background:var(--rule);transform:translateX(-50%);`;
      if (ev.lane < 0) {
        conn.style.top = "100%";
        conn.style.height = (-ev.lane) + "px";
      } else {
        conn.style.bottom = "100%";
        conn.style.height = ev.lane + "px";
      }
      el.appendChild(conn);
      track.appendChild(el);

      // reveal
      setTimeout(() => {
        const io = new IntersectionObserver(es => {
          es.forEach(e => {
            if (e.isIntersecting) {
              setTimeout(() => el.classList.add("reveal"), i * 100);
              io.unobserve(e.target);
            }
          });
        }, { threshold: 0.2 });
        io.observe(el);
      }, 0);
    });

    host.appendChild(track);
  })();

  // ---------- Glossary hover tips ----------
  const glossary = {
    "bpo": { term: "BPO", def: "Business process outsourcing — call centers, back-office, analytics. Employs ~1.9M Filipinos directly and anchors ~8% of GDP." },
    "ofw": { term: "OFW", def: "Overseas Filipino Worker. Roughly 1.8–2M Filipinos work abroad at any given time; their remittances equal ~7% of GDP." },
    "bliss": { term: "SSM", def: "State-space model — a neural architecture class well-suited to long-context streaming tasks like voice." },
    "agi": { term: "AGI", def: "Artificial general intelligence — AI that matches or exceeds human capability across most economically-valuable cognitive tasks." },
    "asi": { term: "ASI", def: "Artificial superintelligence — AI substantially more capable than humans on most tasks. Probability ~15–25% by 2030 on aggregated forecasts." },
    "remit": { term: "OFW remittances", def: "Cash sent home by overseas Filipino workers. Hit $39.6B in 2025 (7.3% of GDP) but the share is eroding structurally." },
    "carp": { term: "CARP", def: "Comprehensive Agrarian Reform Program — a 1988 land redistribution that fragmented farms to an average of ~1.3 ha, limiting mechanization." },
    "edca": { term: "EDCA", def: "Enhanced Defense Cooperation Agreement — US access to Philippine military bases; expanded from 5 to 9 sites in 2023." },
    "chips": { term: "CHIPS Act", def: "US semiconductor legislation. The Philippines is a designated ITSI partner country with a share of the $500M fund." },
    "raas": { term: "RaaS", def: "Robotics-as-a-Service — monthly subscription pricing for humanoid deployments, currently ~$1,000/month for factory-grade units." },
    "wps": { term: "WPS", def: "West Philippine Sea — the Philippine-claimed portion of the South China Sea, the site of continuing maritime confrontation." },
    "gcc": { term: "GCC", def: "Global Capability Centers — multinational-owned captive offices in-country; the empirically growing BPO segment." },
    "ibpap": { term: "IBPAP", def: "IT & Business Process Association of the Philippines — the industry body that represents the BPO sector." },
    "bsp": { term: "BSP", def: "Bangko Sentral ng Pilipinas — the Philippine central bank. Sets policy rate, manages the peso, and prints banknotes." },
    "neda": { term: "NEDA / DEPDev", def: "National Economic and Development Authority — the government's central economic planning body, reorganized in 2028 into the Department of Economy, Planning, and Development (DEPDev)." },
    "dof": { term: "DOF", def: "Department of Finance — manages the national treasury, tax policy, and sovereign borrowing." },
    "dbm": { term: "DBM", def: "Department of Budget and Management — prepares and executes the national budget." },
    "dole": { term: "DOLE", def: "Department of Labor and Employment — processes illegal-dismissal complaints, overseas worker documentation, and labor-standards enforcement." },
    "dmw": { term: "DMW", def: "Department of Migrant Workers — established by RA 11641 in 2022, absorbing POEA's overseas deployment, documentation, and repatriation functions." },
    "doh": { term: "DOH", def: "Department of Health — the national public-health agency." },
    "dpwh": { term: "DPWH", def: "Department of Public Works and Highways — builds and maintains roads, bridges, and flood control." },
    "tesda": { term: "TESDA", def: "Technical Education and Skills Development Authority — national agency for vocational training and trade-school programs." },
    "landbank": { term: "Landbank", def: "Land Bank of the Philippines — state-owned development bank, lends heavily to farmers and LGUs." },
    "bataan": { term: "Bataan NPP", def: "Mothballed 621 MW reactor completed in 1984 but never fueled. Rehabilitation target: 2032–2035." },
    "philatom": { term: "PhilATOM", def: "Philippine Atomic Regulatory Authority — nuclear safety regulator established under the 2025 Atomic Energy Regulatory Act." },
    "smr": { term: "SMR", def: "Small modular reactor — factory-built nuclear units in the 50–300 MW range. A candidate technology for Philippine grid expansion." },
    "sona": { term: "SONA", def: "State of the Nation Address — the President's annual speech to a joint session of Congress, in late July." },
    "comelec": { term: "COMELEC", def: "Commission on Elections — constitutional body that administers Philippine elections." },
    "dict": { term: "DICT", def: "Department of Information and Communications Technology — the ICT policy and digital-services agency." },
    "csat": { term: "CSAT", def: "Customer satisfaction score — a standard BPO performance metric, typically 1–5 after each call." },
    "aht": { term: "AHT", def: "Average handle time — the mean duration of a customer call, including after-call work. A core BPO KPI." },
    "4ps": { term: "4Ps", def: "Pantawid Pamilyang Pilipino Program — the Philippines' conditional cash-transfer program for poor households." },
    "philhealth": { term: "PhilHealth", def: "Philippine Health Insurance Corporation — the national health-insurance system." },
    "sss": { term: "SSS", def: "Social Security System — the state pension and benefits fund for private-sector workers." },
    "imf": { term: "IMF", def: "International Monetary Fund — lender of last resort for governments facing balance-of-payments crises; programs come with fiscal conditions." },
    "jica": { term: "JICA", def: "Japan International Cooperation Agency — Japan's bilateral aid and concessional-lending arm, a major PH infrastructure financier." },
    "adb": { term: "ADB", def: "Asian Development Bank — Manila-headquartered multilateral development bank." },
    "psei": { term: "PSEi", def: "Philippine Stock Exchange index — the benchmark equities index tracking the 30 largest listed Philippine companies." },
    "reit": { term: "REIT", def: "Real estate investment trust — a listed vehicle that pools income-producing property. Ayala REIT (AREIT) holds Makati and BGC office towers; BPO vacancy hits it directly." },
    "dst": { term: "DST", def: "Digital services tax — a levy on the gross revenues of foreign digital platforms operating in the country." },
    "qsr": { term: "QSR", def: "Quick-service restaurant — fast-food chains (Jollibee, McDonald's, KFC, etc.) that are heavy users of voice-AI back-ends." },
    "grab": { term: "Grab", def: "Southeast Asia's dominant ride-hailing and delivery super-app. Filipino drivers are independent contractors." },
    "nais": { term: "NAIS-PH", def: "National AI Strategy — Philippines. The sovereign-AI framework under which domestic AI firms are licensed and funded." },
  };

  document.querySelectorAll(".gloss").forEach(el => {
    const key = el.getAttribute("data-gloss");
    const g = glossary[key];
    if (!g) return;
    const tip = document.createElement("span");
    tip.className = "gloss-tip";
    tip.innerHTML = `<span class="term">${g.term}</span>${g.def}`;
    el.appendChild(tip);
  });

  // ---------- Footnote smooth-scroll ----------
  document.querySelectorAll("sup.fn").forEach(sup => {
    sup.addEventListener("click", (e) => {
      e.preventDefault();
      const n = sup.getAttribute("data-fn");
      const target = document.getElementById("fn-" + n);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });

  // ---------- Render all charts ----------
  const reg = [
    ["chart-bpo", PhCharts.renderBpoChart],
    ["chart-remit", PhCharts.renderRemitChart],
    ["chart-agi", PhCharts.renderAgiChart],
    ["chart-sectors", PhCharts.renderSectorMultiples],
    ["chart-energy", PhCharts.renderEnergyMix],
    ["chart-crossover", PhCharts.renderCrossover],
    ["chart-exposure", PhCharts.renderExposureBars],
    ["chart-scenarios", PhCharts.renderScenarioBars],
    ["chart-mc", PhCharts.renderMCDistribution],
    ["chart-displacement", PhCharts.renderDisplacementWave],
    ["chart-gdp-peers", PhCharts.renderGdpPeers],
  ];
  reg.forEach(([id, fn]) => {
    const el = document.getElementById(id);
    if (el) fn(el);
  });
})();
