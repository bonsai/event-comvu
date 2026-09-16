let events = [];
let loadError = '';
let selected = null;
let mode = 'topic';
let positions = [];

const modes = ['topic', 'community', 'format', 'place'];

function setup() {
  const canvas = createCanvas(windowWidth - 40, Math.max(560, Math.min(760, windowHeight - 145)));
  canvas.parent('canvas');
  textFont('system-ui');
  const select = document.getElementById('mode');
  select.addEventListener('change', e => { mode = e.target.value; selected = null; redraw(); });

  // p5.js loadJSON uses a callback API here; it does not return a Promise.
  loadJSON(
    './data/visualization.json',
    data => { events = Array.isArray(data) ? data : (data.events || []); redraw(); },
    err => { loadError = `failed to load visualization.json${err ? `: ${err}` : ''}`; redraw(); }
  );
}

function semanticKey(event) {
  if (mode === 'topic') return (event.technology || ['Community'])[0] || 'Community';
  if (mode === 'community') return (event.community || ['Unknown'])[0] || 'Unknown';
  if (mode === 'format') return event.format || 'Unknown';
  return event.place || 'Unknown';
}

function years() {
  const ys = events.map(e => e.started_at ? new Date(e.started_at).getFullYear() : null).filter(Boolean);
  return ys.length ? [Math.min(...ys), Math.max(...ys)] : [new Date().getFullYear(), new Date().getFullYear()];
}

function eventPosition(event, index) {
  const [minY, maxY] = years();
  const d = event.started_at ? new Date(event.started_at) : null;
  const t = d && !Number.isNaN(d.getTime()) ? (d.getFullYear() - minY) / Math.max(1, maxY - minY) : 0.5;
  const keys = [...new Set(events.map(semanticKey))].sort();
  const xi = Math.max(0, keys.indexOf(semanticKey(event)));
  const x = keys.length <= 1 ? width / 2 : 75 + (width - 150) * xi / (keys.length - 1);
  const y = 92 + (height - 145) * (1 - Math.max(0, Math.min(1, t)));
  const angle = index * 2.399963;
  const jitter = Math.min(22, width / Math.max(20, events.length * 0.8));
  return {x:x + Math.cos(angle) * jitter, y:y + Math.sin(angle) * jitter};
}

function shared(a, b) {
  const af = a.features || a.technology || [];
  const bf = b.features || b.technology || [];
  return af.some(x => bf.includes(x)) || (a.community && a.community === b.community);
}

function draw() {
  background(11);
  if (loadError) { fill(255); textSize(16); text(`JSON error: ${loadError}`, 20, 35); return; }
  positions = events.map(eventPosition);
  fill(255); textSize(16); text(`Semantic Event Space / ${events.length} events`, 20, 27);
  fill(130); textSize(11); text(`X = ${mode} · Y = time · edge = shared feature · node size = evidence completeness`, 20, 47);
  drawAxes(); drawEdges(); drawNodes();
  if (selected) drawDetail(selected);
}

function drawAxes() {
  const [minY, maxY] = years();
  stroke(55); line(60, 72, width - 30, 72); line(60, 72, 60, height - 35);
  noStroke(); fill(100); textSize(10); text(mode, width - 75, 62);
  for (let i = 0; i <= Math.min(6, maxY - minY); i++) {
    const year = minY + i;
    const y = 92 + (height - 145) * (1 - (year - minY) / Math.max(1, maxY - minY));
    fill(85); text(year, 20, y + 4); stroke(30); line(60, y, width - 30, y); noStroke();
  }
  const keys = [...new Set(events.map(semanticKey))].sort();
  keys.forEach((key, i) => {
    const x = keys.length <= 1 ? width / 2 : 75 + (width - 150) * i / (keys.length - 1);
    push(); translate(x, height - 18); rotate(-0.28); fill(125); text(key.slice(0, 26), 0, 0); pop();
  });
}

function drawEdges() {
  for (let i = 0; i < events.length; i++) for (let j = i + 1; j < events.length; j++) {
    if (shared(events[i], events[j])) { const a = positions[i], b = positions[j]; stroke(45); line(a.x, a.y, b.x, b.y); }
  }
}

function drawNodes() {
  events.forEach((event, i) => {
    const p = positions[i], active = selected === event;
    const r = 7 + (event.completeness || 0) * 13;
    noStroke(); fill(205); circle(p.x, p.y, active ? r + 9 : r);
    if (active) { noFill(); stroke(255); strokeWeight(2); circle(p.x, p.y, r + 10); }
    noStroke(); fill(225); textSize(10); text((event.title || event.event_id || 'Untitled').slice(0, 34), p.x + r / 2 + 5, p.y - 2);
  });
}

function drawDetail(event) {
  const w = Math.min(470, width - 32), h = 168, x = width - w - 16, y = height - h - 12;
  fill(24); stroke(130); rect(x, y, w, h, 8); noStroke(); fill(255); textSize(14);
  text(event.title || 'Untitled', x + 14, y + 23, w - 28, 34);
  fill(165); textSize(10); text(`${event.started_at || 'time unknown'} · ${event.format || 'format unknown'} · ${event.place || 'place unknown'}`, x + 14, y + 57);
  text(`community: ${(event.community || []).join(', ') || '—'} · technology: ${(event.technology || []).join(', ') || '—'}`, x + 14, y + 75, w - 28, 28);
  text(`evidence: ${Math.round((event.completeness || 0) * 100)}%`, x + 14, y + 105);
  fill(120); text(`source: ${event.source_url || 'none'}`, x + 14, y + 126, w - 28, 16);
  fill(150); text(event.image_url ? 'image: available' : 'image: —', x + 14, y + 145); text(event.flyer_url ? 'flyer: available' : 'flyer: —', x + 105, y + 145);
}

function mousePressed() {
  for (let i = 0; i < events.length; i++) {
    const p = positions[i];
    if (dist(mouseX, mouseY, p.x, p.y) < 24) {
      selected = events[i];
      const link = document.getElementById('source-link'); link.href = selected.source_url || '#'; link.textContent = selected.source_url ? 'Open source event ↗' : 'No source URL';
      redraw(); return;
    }
  }
}

function windowResized() { resizeCanvas(windowWidth - 40, Math.max(560, Math.min(760, windowHeight - 145))); redraw(); }
