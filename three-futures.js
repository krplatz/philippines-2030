/* Three Futures navigation. No analytics, backend, dependencies, or stored personal data. */
(() => {
  "use strict";
  const allowed = ["managed","accelerated","crisis"];
  const tabs = Array.from(document.querySelectorAll("[data-choose]"));
  const panels = Array.from(document.querySelectorAll("[data-panel]"));
  if (!tabs.length || !panels.length) return;
  function select(path, updateHash = true, focus = false) {
    if (!allowed.includes(path)) return;
    document.body.dataset.path = path;
    for (const tab of tabs) {
      const active = tab.dataset.choose === path;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focus) tab.focus();
    }
    for (const panel of panels) panel.hidden = panel.dataset.panel !== path;
    if (updateHash && window.history && window.history.replaceState) {
      const next = new URL(window.location.href);
      next.hash = "path-" + path;
      window.history.replaceState(null, "", next);
    }
  }
  function fromHash() {
    const match = window.location.hash.match(/^#path-(managed|accelerated|crisis)$/);
    if (match) select(match[1], false);
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(tab.dataset.choose));
    tab.addEventListener("keydown", event => {
      if (!["ArrowLeft","ArrowRight","Home","End"].includes(event.key)) return;
      event.preventDefault();
      const current = tabs.indexOf(tab);
      const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 :
        (current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      select(tabs[next].dataset.choose, true, true);
    });
  });
  document.querySelectorAll("[data-copy]").forEach(button => {
    button.addEventListener("click", async () => {
      const url = new URL(window.location.href);
      url.hash = "path-" + document.body.dataset.path;
      try {
        await navigator.clipboard.writeText(url.toString());
        button.textContent = "Link copied";
        window.setTimeout(() => { button.textContent = "Copy link to this future"; }, 2200);
      } catch {
        button.textContent = "Copy the address-bar URL";
        window.history.replaceState(null, "", url);
      }
    });
  });
  window.addEventListener("hashchange", fromHash);
  fromHash();
})();
