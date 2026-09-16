let events = [];
let loadError = '';

function setup() {
  const canvas = createCanvas(windowWidth - 48, Math.max(420, Math.min(720, windowHeight - 140)));
  canvas.parent('canvas');
  textFont('system-ui');
  loadJSONL('../data/connpass/sample.jsonl');
}

async function loadJSONL(path) {
  try {
    const text = await fetch(path).then(r => {
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      return r.text();
    });
    events = text.trim().split(/\r?\n/).filter(Boolean).map(JSON.parse)
      .sort((a, b) => new Date(a.started_at) - new Date(b.started_at));
    redraw();
  } catch (err) {
    loadError = `JSONL load error: ${err.message}`;
    redraw();
  }
}

function draw() {
  background(17);
  if (loadError) { fill(255); textSize(16); text(loadError, 24, 40); return; }
  fill(255); textSize(20); text(`Timeline / ${events.length} events`, 24, 34);
  if (!events.length) { textSize(16); text('Loading…', 24, 70); return; }

  const left = 48, top = 82, bottom = height - 32;
  stroke(130); line(left, top, left, bottom);
  const minT = new Date(events[0].started_at).getTime();
  const maxT = new Date(events[events.length - 1].started_at).getTime();
  const span = Math.max(1, maxT - minT);

  events.forEach(event => {
    const t = new Date(event.started_at).getTime();
    const y = top + (t - minT) / span * (bottom - top);
    noStroke(); fill(255); circle(left, y, 10);
    fill(235); textSize(14); text(event.title, left + 18, y - 5);
    fill(150); textSize(11); text(`${event.started_at}  ${event.online ? 'ONLINE' : event.venue || 'venue unknown'}`, left + 18, y + 12);
  });
}

function windowResized() {
  resizeCanvas(windowWidth - 48, Math.max(420, Math.min(720, windowHeight - 140)));
  redraw();
}
