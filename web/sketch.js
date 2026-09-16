let events = [];
let selected = null;
let positions = [];
let activeTag = null;

function setup() {
  const canvas = createCanvas(Math.max(520, windowWidth - 360), Math.max(560, Math.min(760, windowHeight - 145)));
  canvas.parent('canvas'); textFont('system-ui');
  loadJSON('./data/visualization.json', data => {
    events = Array.isArray(data) ? data : (data.events || []);
    buildTagCloud(); redraw();
  }, err => { fill(255); textSize(16); text(`failed to load visualization.json`,20,35); });
}

function tagsOf(event) {
  const out=[];
  for (const key of ['technology','community','features']) {
    if (Array.isArray(event[key])) out.push(...event[key]);
  }
  if (event.format) out.push(event.format);
  return [...new Set(out.filter(Boolean).map(String))];
}

function shared(a,b) {
  const aa=tagsOf(a), bb=new Set(tagsOf(b));
  return aa.some(x=>bb.has(x));
}

function buildGraph() {
  const seen=new Array(events.length).fill(false), cluster=new Array(events.length).fill(-1); let c=0;
  for(let i=0;i<events.length;i++) if(!seen[i]) {
    const q=[i]; seen[i]=true; cluster[i]=c;
    while(q.length){const a=q.pop(); for(let j=0;j<events.length;j++) if(!seen[j]&&shared(events[a],events[j])){seen[j]=true;cluster[j]=c;q.push(j);}}
    c++;
  }
  return {cluster,count:c};
}

function buildTagCloud() {
  const counts=new Map(); events.forEach(e=>tagsOf(e).forEach(t=>counts.set(t,(counts.get(t)||0)+1)));
  const tags=[...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,36);
  const box=document.getElementById('tags'); if(!box)return;
  box.innerHTML=tags.map(([tag,n])=>`<span class="tag" data-tag="${escapeHtml(tag)}" style="font-size:${10+Math.min(12,n*1.5)}px;opacity:${activeTag===tag?1:.62+Math.min(.35,n/20)}">${escapeHtml(tag)} <small>${n}</small></span>`).join('');
  box.querySelectorAll('.tag').forEach(el=>el.addEventListener('click',()=>{activeTag=el.dataset.tag;selected=null;buildTagCloud();redraw();}));
}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function years(){const ys=events.map(e=>e.started_at?new Date(e.started_at).getFullYear():null).filter(Boolean);return ys.length?[Math.min(...ys),Math.max(...ys)]:[new Date().getFullYear(),new Date().getFullYear()];}
function eventPosition(event,index,graph){
  const [minY,maxY]=years(), d=event.started_at?new Date(event.started_at):null;
  const t=d&&!Number.isNaN(d.getTime())?(d.getFullYear()-minY)/Math.max(1,maxY-minY):.5;
  const c=graph.cluster[index], clusterMembers=graph.cluster.map((x,i)=>x===c?i:-1).filter(i=>i>=0), rank=clusterMembers.indexOf(index), n=clusterMembers.length;
  const cols=Math.max(1,Math.ceil(Math.sqrt(n))), col=rank%cols,row=Math.floor(rank/cols);
  const clusters=Math.max(1,graph.count), baseX=80+(width-140)*(c+.5)/clusters, baseY=95+(height-150)*(1-t);
  return {x:baseX+(col-(cols-1)/2)*22,y:baseY+(row-Math.floor((n-1)/cols)/2)*22};
}
function draw(){background(11);const graph=buildGraph();positions=events.map((e,i)=>eventPosition(e,i,graph));
  fill(255);noStroke();textSize(16);text(`Event Clusters / ${events.length} events`,20,27);fill(110);textSize(11);text(`${graph.count} semantic clusters · click a node for metadata`,20,47);
  drawAxes();drawEdges(graph);drawNodes();
}
function drawAxes(){const[minY,maxY]=years();stroke(35);line(60,72,60,height-35);for(let i=0;i<=Math.min(6,maxY-minY);i++){const y=92+(height-145)*(1-(minY+i-minY)/Math.max(1,maxY-minY));noStroke();fill(90);text(minY+i,20,y+4);stroke(28);line(60,y,width-30,y);}}
function drawEdges(graph){for(let i=0;i<events.length;i++)for(let j=i+1;j<events.length;j++)if(shared(events[i],events[j])){if(activeTag&&!tagsOf(events[i]).includes(activeTag)&&!tagsOf(events[j]).includes(activeTag))continue;const a=positions[i],b=positions[j];stroke(42);line(a.x,a.y,b.x,b.y);}}
function drawNodes(){events.forEach((event,i)=>{const p=positions[i],tags=tagsOf(event),match=!activeTag||tags.includes(activeTag),active=selected===event,r=7+(event.completeness||0)*12;noStroke();fill(match?210:55);circle(p.x,p.y,active?r+9:r);if(active){noFill();stroke(255);strokeWeight(2);circle(p.x,p.y,r+10);}if(match){noStroke();fill(225);textSize(9);text((event.title||event.event_id||'Untitled').slice(0,30),p.x+r/2+5,p.y-2);}});}
function showMetadata(event){const box=document.getElementById('metadata');if(!box)return;const tags=tagsOf(event);box.innerHTML=`<div class="meta-row"><span class="meta-key">title</span><br><span class="meta-value">${escapeHtml(event.title||'—')}</span></div><div class="meta-row"><span class="meta-key">date</span> ${escapeHtml(event.started_at||'—')}</div><div class="meta-row"><span class="meta-key">organizer</span> ${escapeHtml(event.organizer||'—')}</div><div class="meta-row"><span class="meta-key">venue</span> ${escapeHtml(event.venue||event.place||'—')}</div><div class="meta-row"><span class="meta-key">format</span> ${escapeHtml(event.format||'—')}</div><div class="meta-row"><span class="meta-key">tags</span> ${tags.map(escapeHtml).join(', ')||'—'}</div><div class="meta-row"><span class="meta-key">evidence</span> ${Math.round((event.completeness||0)*100)}%</div><div class="meta-row source"><span class="meta-key">source</span> ${event.source_url?`<a href="${escapeHtml(event.source_url)}" target="_blank" rel="noopener">open ↗</a>`:'—'}</div>`;}
function mousePressed(){for(let i=0;i<events.length;i++){const p=positions[i];if(dist(mouseX,mouseY,p.x,p.y)<24){selected=events[i];showMetadata(selected);redraw();return;}}}
function windowResized(){resizeCanvas(Math.max(520,windowWidth-360),Math.max(560,Math.min(760,windowHeight-145)));redraw();}
