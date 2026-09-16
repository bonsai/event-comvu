let events = [];
let loadError = '';
let selected = null;

const dimensions = [
  ['AI', 0.85, 0.18], ['LLM', 0.72, 0.28], ['Data', 0.70, 0.62],
  ['Web', 0.34, 0.72], ['Creative', 0.20, 0.25], ['Agent', 0.52, 0.16],
  ['Cloud', 0.86, 0.55], ['Architecture', 0.22, 0.70]
];

function setup() {
  const canvas = createCanvas(windowWidth - 48, Math.max(480, Math.min(720, windowHeight - 170)));
  canvas.parent('canvas');
  textFont('system-ui');
  loadJSONL('./data/connpass/sample.jsonl');
}

async function loadJSONL(path) {
  try {
    const text = await fetch(path).then(r => {
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      return r.text();
    });
    events = text.trim().split(/\r?\n/).filter(Boolean).map(JSON.parse).map(enrichEvent);
    redraw();
  } catch (err) {
    loadError = `JSONL load error: ${err.message}`;
    redraw();
  }
}

function enrichEvent(event) {
  const text = `${event.title} ${event.organizer || ''}`.toLowerCase();
  const rules = [
    ['AI', ['ai', '人工知能']], ['LLM', ['llm', 'gpt']],
    ['Data', ['data', 'bqml', 'machine learning', 'ml']], ['Web', ['web']],
    ['Creative', ['p5.js', 'creative coding', 'creative']],
    ['Agent', ['agent', 'workflow']], ['Cloud', ['cloud', 'gcp', 'aws']],
    ['Architecture', ['architecture', '建築']]
  ];
  const tags = rules.filter(([, words]) => words.some(w => text.includes(w))).map(([tag]) => tag);
  return {...event, tags: tags.length ? tags : ['Community']};
}

function eventPosition(event, index) {
  const base = dimensions.find(d => d[0] === event.tags[0]) || ['Community', 0.5, 0.82];
  const angle = index * 1.7;
  const jitter = Math.min(width, height) * 0.055;
  return { x: width * base[1] + Math.cos(angle) * jitter, y: 82 + (height - 130) * base[2] + Math.sin(angle) * jitter };
}

function draw() {
  background(17);
  if (loadError) { fill(255); textSize(16); text(loadError, 24, 40); return; }
  fill(255); textSize(20); text(`Semantic Event Map / ${events.length} events`, 24, 30);
  fill(150); textSize(11); text('topic × format/time · click a node for event detail', 24, 50);
  stroke(55); line(48, 72, width - 24, 72); line(48, 72, 48, height - 32);
  dimensions.forEach(([name, x, y]) => { noStroke(); fill(90); textSize(11); text(name, width * x - 18, 72 + (height - 130) * y - 14); });

  events.forEach((event, i) => {
    const p = eventPosition(event, i);
    const active = selected === event;
    stroke(active ? 255 : 120); strokeWeight(active ? 3 : 1); fill(active ? 255 : 210); circle(p.x, p.y, active ? 18 : 12);
    noStroke(); fill(235); textSize(12); text(event.title, p.x + 12, p.y - 3);
    fill(125); textSize(10); text(event.tags.join(' · '), p.x + 12, p.y + 11);
  });
  if (selected) drawDetail(selected);
}

function drawDetail(event) {
  const w = Math.min(430, width - 48), h = 132, x = width - w - 24, y = height - h - 18;
  fill(28); stroke(110); rect(x, y, w, h, 8); noStroke();
  fill(255); textSize(15); text(event.title, x + 14, y + 24, w - 28, 36);
  fill(170); textSize(11); text(`${event.started_at} · ${event.online ? 'ONLINE' : event.venue || 'venue unknown'}`, x + 14, y + 58);
  text(`organizer: ${event.organizer || 'unknown'}`, x + 14, y + 76);
  fill(210); text(`tags: ${event.tags.join(', ')}`, x + 14, y + 94);
  fill(120); text('source:', x + 14, y + 112); fill(180); text(event.source_url || 'none', x + 56, y + 112, w - 70, 18);
}

function mousePressed() {
  for (let i = 0; i < events.length; i++) {
    const p = eventPosition(events[i], i);
    if (dist(mouseX, mouseY, p.x, p.y) < 18) {
      selected = events[i];
      const link = document.getElementById('source-link');
      link.href = selected.source_url || '#';
      link.textContent = selected.source_url ? 'Open source event ↗' : 'No source URL';
      redraw();
      return;
    }
  }
}

function windowResized() { resizeCanvas(windowWidth - 48, Math.max(480, Math.min(720, windowHeight - 170))); redraw(); }
