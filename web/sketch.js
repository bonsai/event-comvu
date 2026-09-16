let events = [];
let loadError = '';
let selected = null;
let mode = 'topic';
let positions = [];

const topicRules = [
  ['AI', ['ai', '人工知能']], ['LLM', ['llm', 'gpt', '生成ai', '生成Ａｉ']],
  ['Data', ['data', 'bqml', 'machine learning', 'ml', 'データ']],
  ['Web', ['web', 'frontend', 'react', 'javascript']],
  ['Creative', ['p5.js', 'creative coding', 'creative', 'art', 'media']],
  ['Agent', ['agent', 'workflow', 'langgraph', 'automation']],
  ['Cloud', ['cloud', 'gcp', 'aws', 'azure']],
  ['Architecture', ['architecture', '建築', 'bim', 'cad']]
];

function setup() {
  const canvas = createCanvas(windowWidth - 40, Math.max(560, Math.min(760, windowHeight - 145)));
  canvas.parent('canvas');
  textFont('system-ui');
  const select = document.getElementById('mode');
  select.addEventListener('change', e => { mode = e.target.value; selected = null; redraw(); });
  loadJSONL('./data/connpass/events.jsonl');
}

async function loadJSONL(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const text = await response.text();
    events = text.trim().split(/\r?\n/).filter(Boolean).map(JSON.parse).map(enrichEvent);
    redraw();
  } catch (err) {
    loadError = `JSONL load error: ${err.message}`;
    redraw();
  }
}

function enrichEvent(event) {
  const text = `${event.title || ''} ${event.organizer || ''}`.toLowerCase();
  const tags = topicRules.filter(([, words]) => words.some(w => text.includes(w))).map(([tag]) => tag);
  const started = event.started_at ? new Date(event.started_at) : null;
  const fields = ['title','started_at','source_url','organizer','venue','image_url','flyer_url'];
  const completeness = fields.filter(k => event[k] !== null && event[k] !== undefined && event[k] !== '').length / fields.length;
  return {
    ...event,
    tags: tags.length ? tags : ['Community'],
    year: started && !isNaN(started) ? started.getFullYear() : null,
    month: started && !isNaN(started) ? started.getMonth() : null,
    format: event.online === true ? 'Online' : event.online === false ? 'Offline' : 'Unknown',
    community: event.organizer || 'Unknown',
    place: event.venue || (event.online === true ? 'Online' : 'Unknown'),
    completeness
  };
}

function years() {
  const ys = events.map(e => e.year).filter(Boolean);
  if (!ys.length) return [new Date().getFullYear()];
  return [Math.min(...ys), Math.max(...ys)];
}

function axisLabel() {
  return {topic:'Topic', community:'Community', format:'Format', place:'Place'}[mode];
}

function semanticKey(event) {
  if (mode === 'topic') return event.tags[0] || 'Community';
  if (mode === 'community') return event.community;
  if (mode === 'format') return event.format;
  return event.place;
}

function paletteValue(key) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h % 360;
}

function eventPosition(event, index) {
  const [minY, maxY] = years();
  const t = event.year ? (event.year - minY) / Math.max(1, maxY - minY) : 0.5;
  const key = semanticKey(event);
  const keys = [...new Set(events.map(semanticKey))].sort();
  const xi = Math.max(0, keys.indexOf(key));
  const x = keys.length <= 1 ? width / 2 : 75 + (width - 150) * xi / (keys.length - 1);
  const y = 92 + (height - 145) * (1 - t);
  const angle = index * 2.399963;
  const jitter = Math.min(22, width / Math.max(20, events.length * 0.8));
  return {x:x + Math.cos(angle) * jitter, y:y + Math.sin(angle) * jitter};
}

function shared(a, b) {
  const tags = a.tags.filter(t => b.tags.includes(t));
  return tags.length > 0 || (a.community !== 'Unknown' && a.community === b.community);
}

function draw() {
  background(11);
  if (loadError) { fill(255); textSize(16); text(loadError, 20, 35); return; }
  positions = events.map(eventPosition);

  fill(255); textSize(16); text(`Semantic Event Space / ${events.length} events`, 20, 27);
  fill(130); textSize(11); text(`${axisLabel()} × Time · node size = evidence completeness · edge = shared semantic feature`, 20, 47);

  drawAxes();
  drawEdges();
  drawNodes();
  if (selected) drawDetail(selected);
}

function drawAxes() {
  const [minY, maxY] = years();
  stroke(55); strokeWeight(1);
  line(60, 72, width - 30, 72);
  line(60, 72, 60, height - 35);
  noStroke(); fill(100); textSize(10);
  text(axisLabel(), width - 75, 62);
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
    if (!shared(events[i], events[j])) continue;
    const a = positions[i], b = positions[j];
    stroke(45); strokeWeight(1); line(a.x, a.y, b.x, b.y);
  }
}

function drawNodes() {
  events.forEach((event, i) => {
    const p = positions[i];
    const active = selected === event;
    const r = 7 + event.completeness * 13;
    noStroke();
    fill(paletteValue(semanticKey(event)), 70, 82);
    circle(p.x, p.y, active ? r + 9 : r);
    if (active) { noFill(); stroke(255); strokeWeight(2); circle(p.x, p.y, r + 10); }
    noStroke(); fill(225); textSize(10);
    const label = (event.title || 'Untitled').slice(0, 34);
    text(label, p.x + r / 2 + 5, p.y - 2);
  });
}

function drawDetail(event) {
  const w = Math.min(470, width - 32), h = 168, x = width - w - 16, y = height - h - 12;
  fill(24); stroke(130); strokeWeight(1); rect(x, y, w, h, 8); noStroke();
  fill(255); textSize(14); text(event.title || 'Untitled', x + 14, y + 23, w - 28, 34);
  fill(165); textSize(10);
  text(`${event.started_at || 'time unknown'} · ${event.format} · ${event.place}`, x + 14, y + 57);
  text(`community: ${event.community} · topic: ${event.tags.join(', ')}`, x + 14, y + 75, w - 28, 28);
  text(`evidence: ${Math.round(event.completeness * 100)}%`, x + 14, y + 105);
  fill(120); text(`source: ${event.source_url || 'none'}`, x + 14, y + 126, w - 28, 16);
  fill(150); text(event.image_url ? 'image: available' : 'image: —', x + 14, y + 145);
  text(event.flyer_url ? 'flyer: available' : 'flyer: —', x + 105, y + 145);
}

function mousePressed() {
  for (let i = 0; i < events.length; i++) {
    const p = positions[i] || eventPosition(events[i], i);
    if (dist(mouseX, mouseY, p.x, p.y) < 24) {
      selected = events[i];
      const link = document.getElementById('source-link');
      link.href = selected.source_url || '#';
      link.textContent = selected.source_url ? 'Open source event ↗' : 'No source URL';
      redraw();
      return;
    }
  }
}

function windowResized() { resizeCanvas(windowWidth - 40, Math.max(560, Math.min(760, windowHeight - 145))); redraw(); }
