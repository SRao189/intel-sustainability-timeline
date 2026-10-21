// Draws a bar chart from the <table> inside each figure[data-chart].
// The table stays in the page for screen readers and no-JS readers; the chart is decoration over it.
const SVG_NS = "http://www.w3.org/2000/svg";
const LABEL_ROOM = 124, NARROW = 440;

function el(name, attrs, text) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text !== undefined) node.textContent = text;
  return node;
}

// Drawn at the figure's real pixel width, so 15px text stays 15px on a phone instead of shrinking with a fixed viewBox.
function drawChart(figure) {
  figure.querySelectorAll(".chart-svg, .chart-title").forEach((n) => n.remove());
  const W = Math.max(300, Math.round(figure.clientWidth));
  // Narrow charts give the bars the full width and move the goal label under the years.
  const narrow = W < NARROW;
  const H = narrow ? 292 : 270;
  const plot = { left: 4, right: narrow ? W - 4 : W - LABEL_ROOM, top: 34, bottom: 214 };
  const rows = [...figure.querySelectorAll("tbody tr")].map((tr) => ({
    year: tr.querySelector("th").textContent.trim(),
    value: Number(tr.querySelector("td").textContent.trim()),
  }));
  if (!rows.length || rows.some((r) => Number.isNaN(r.value))) return;

  const max = Number(figure.dataset.max);
  const goal = Number(figure.dataset.goal);
  const unit = figure.dataset.unit || "";
  const decimals = Number(figure.dataset.decimals || 0);
  const y = (v) => plot.bottom - (v / max) * (plot.bottom - plot.top);
  const slot = (plot.right - plot.left) / rows.length;
  const barW = Math.min(56, slot * 0.62);

  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "chart-svg", "aria-hidden": "true", focusable: "false" });
  const bars = el("g", {});
  const labels = el("g", {});

  rows.forEach((r, i) => {
    const cx = plot.left + slot * (i + 0.5);
    const top = y(r.value);
    const latest = i === rows.length - 1;
    bars.append(el("rect", {
      class: latest ? "bar bar-latest" : "bar",
      x: cx - barW / 2, y: top, width: barW, height: plot.bottom - top,
    }));
    labels.append(el("text", { class: "bar-value", x: cx, y: top - 8, "text-anchor": "middle" }, r.value.toFixed(decimals) + unit));
    labels.append(el("text", { class: "bar-year", x: cx, y: plot.bottom + 22, "text-anchor": "middle" }, r.year));
  });

  svg.append(bars, el("line", { class: "chart-base", x1: plot.left, x2: plot.right, y1: plot.bottom, y2: plot.bottom }), labels);

  const label = figure.dataset.goalLabel;
  if (goal > 0) {
    const gy = y(goal);
    // Under the value labels, so their halo keeps a passing goal line from striking through a number.
    svg.insertBefore(el("line", { class: "goal-line", x1: plot.left, x2: narrow ? plot.right : plot.right + 8, y1: gy, y2: gy }), labels);
  }
  // A goal of zero is the baseline itself, so it gets a label but no second line.
  if (label) {
    const at = narrow
      ? { x: plot.left, y: plot.bottom + 52 }
      : { x: plot.right + 16, y: goal > 0 ? y(goal) + 4 : plot.bottom + 4 };
    svg.append(el("text", { class: "goal-label", ...at }, (narrow && goal > 0 ? "- - " : "") + label));
  }

  const title = document.createElement("p");
  title.className = "chart-title";
  title.setAttribute("aria-hidden", "true");
  title.textContent = figure.querySelector("caption").textContent;

  figure.prepend(title, svg);
  figure.classList.add("is-drawn");
}

const charts = document.querySelectorAll("figure[data-chart]");
charts.forEach(drawChart);

let lastWidth = innerWidth;
addEventListener("resize", () => {
  if (innerWidth === lastWidth) return; // mobile URL-bar scrolls fire resize with no width change
  lastWidth = innerWidth;
  charts.forEach(drawChart);
});

// Bars are fully drawn by default; the rise only replays them once a chart is on screen.
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-growing");
      io.unobserve(entry.target);
    }
  }, { threshold: 0.35 });
  charts.forEach((c) => io.observe(c));
}
