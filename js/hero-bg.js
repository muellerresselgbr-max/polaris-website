/* Polaris Concierge | hero-bg.js v6 — FINAL
   Dark dotted world map + elegant flight trail animation
*/
(function(){
'use strict';

var LAND=[
  /* North America */
  [[-168,72],[-155,75],[-140,76],[-120,80],[-100,74],[-85,72],[-75,72],
   [-65,72],[-60,65],[-55,58],[-60,46],[-70,44],[-75,43],[-80,30],
   [-85,25],[-90,20],[-95,18],[-100,20],[-105,22],[-110,28],[-120,32],
   [-125,38],[-125,45],[-130,50],[-140,55],[-150,60],[-160,60],[-168,58]],
  /* Greenland */
  [[-68,82],[-50,84],[-30,83],[-20,76],[-22,70],[-30,68],[-45,65],[-55,68],[-65,72]],
  /* South America */
  [[-80,12],[-75,12],[-68,12],[-62,8],[-58,6],[-52,4],[-50,0],[-48,-5],
   [-42,-10],[-40,-15],[-40,-22],[-42,-28],[-48,-35],[-55,-38],[-65,-42],
   [-65,-55],[-68,-52],[-72,-50],[-70,-45],[-72,-38],[-70,-30],[-75,-22],
   [-80,-10],[-80,-2],[-78,5]],
  /* Europe */
  [[-10,70],[-8,65],[-5,60],[0,52],[2,50],[5,47],[8,45],[12,44],[15,45],
   [18,47],[20,50],[22,55],[24,60],[26,65],[28,72],[20,78],[15,78],[5,78],
   [-5,78],[-15,75]],
  /* Scandinavia */
  [[5,57],[8,58],[10,62],[15,70],[20,72],[25,70],[28,72],[26,68],[22,65],
   [20,58],[18,56],[14,56],[10,58],[8,58]],
  /* UK */
  [[-6,50],[-3,54],[-5,58],[-4,60],[-2,58],[0,53],[1,51],[-1,50]],
  /* Africa */
  [[-18,38],[-14,36],[-10,36],[0,37],[10,38],[20,38],[30,36],[35,38],
   [42,18],[44,12],[50,-12],[44,-20],[38,-30],[32,-28],[28,-32],[25,-35],
   [18,-34],[15,-28],[12,-18],[10,-10],[8,5],[2,8],[0,5],[-4,8],[-12,12],
   [-18,18],[-18,28],[-14,32],[-18,36]],
  /* Arabian Peninsula */
  [[36,28],[38,22],[42,18],[45,12],[50,12],[55,18],[58,24],[56,28],[50,30],[45,32],[38,32]],
  /* Russia / North Asia */
  [[30,72],[50,72],[60,72],[80,74],[100,78],[120,76],[140,72],[155,68],
   [165,60],[170,55],[155,50],[145,45],[140,42],[135,44],[130,42],[125,50],
   [120,55],[115,58],[108,62],[100,65],[85,68],[70,68],[55,68],[45,65],[35,68]],
  /* Indian subcontinent */
  [[60,24],[68,25],[72,22],[76,20],[80,16],[80,10],[78,8],[75,8],[72,12],[68,18],[64,22],[60,24]],
  /* SE Asia */
  [[95,22],[100,18],[105,10],[108,2],[105,-2],[102,2],[100,6],[98,10],[96,14],[94,18],[95,22]],
  /* East Asia */
  [[80,42],[85,40],[90,42],[95,40],[100,48],[108,55],[115,55],[120,50],
   [125,46],[130,40],[122,30],[118,25],[115,22],[110,18],[105,22],[100,24],
   [96,28],[90,32],[84,34],[80,38]],
  /* Japan */
  [[130,31],[132,34],[134,34],[136,36],[138,38],[141,42],[143,44],[141,40],[138,36]],
  /* Australia */
  [[114,-22],[118,-20],[124,-18],[130,-14],[136,-12],[138,-14],[142,-12],
   [145,-16],[148,-20],[152,-25],[152,-30],[148,-38],[142,-38],[138,-36],
   [132,-34],[128,-34],[116,-34],[113,-26],[114,-22]]
];

var CITIES=[
  {id:'NYC',lon:-74.0,lat:40.7},
  {id:'LON',lon:-0.1, lat:51.5},
  {id:'DXB',lon:55.3, lat:25.2},
  {id:'HKG',lon:114.1,lat:22.4},
  {id:'GVA',lon:6.15, lat:46.2},
  {id:'MIA',lon:-80.2,lat:25.8},
  {id:'SIN',lon:103.8,lat:1.35},
  {id:'TYO',lon:139.7,lat:35.7}
];

var ROUTES=[
  {a:0,b:1,arc:0.28},
  {a:1,b:2,arc:0.22},
  {a:2,b:3,arc:0.18},
  {a:4,b:2,arc:0.20},
  {a:5,b:1,arc:0.26},
  {a:1,b:6,arc:0.24},
  {a:0,b:2,arc:0.30},
  {a:2,b:7,arc:0.18}
];

var cvs=document.getElementById('heroBg');
if(!cvs)return;
var ctx=cvs.getContext('2d');

var W,H,projLand=[],dots=[],cityPx=[],ctrl=[];
var mapCvs=null; /* pre-rendered map, redrawn on resize only */
var trails=[],nextRoute=0,lastLaunch=0;
var mxM,myM,pX=0,pY=0;

function proj(lon,lat){return[(lon+180)/360*W,(90-lat)/180*H];}

function pip(px,py,poly){
  var inside=false,n=poly.length;
  for(var i=0,j=n-1;i<n;j=i++){
    var xi=poly[i][0],yi=poly[i][1],xj=poly[j][0],yj=poly[j][1];
    if((yi>py)!==(yj>py)&&px<(xj-xi)*(py-yi)/(yj-yi)+xi)inside=!inside;
  }
  return inside;
}

function bez(ax,ay,bx,by,cx,cy,t){
  var u=1-t;
  return[u*u*ax+2*u*t*cx+t*t*bx,u*u*ay+2*u*t*cy+t*t*by];
}

/* ══════════════════════════════════════
   SETUP
══════════════════════════════════════ */
function setup(){
  W=window.innerWidth; H=window.innerHeight;
  mxM=W/2; myM=H/2;
  cvs.width=W; cvs.height=H;

  cityPx=CITIES.map(function(c){return proj(c.lon,c.lat);});

  ctrl=ROUTES.map(function(r){
    var a=cityPx[r.a],b=cityPx[r.b];
    var mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;
    var dx=b[0]-a[0],dy=b[1]-a[1];
    var len=Math.sqrt(dx*dx+dy*dy)||1;
    var nx=-dy/len,ny=dx/len;
    return[mx+nx*len*r.arc*(ny>0?-1:1),my+ny*len*r.arc*(ny>0?-1:1)];
  });

  projLand=LAND.map(function(p){return p.map(function(q){return proj(q[0],q[1]);});});

  dots=[];
  var S=6;
  for(var y=S/2;y<H;y+=S)
    for(var x=S/2;x<W;x+=S)
      for(var k=0;k<projLand.length;k++)
        if(pip(x,y,projLand[k])){dots.push(x,y);break;}

  buildMap();

  var hero=document.querySelector('.hero');
  if(hero)hero.classList.add('ready');
}

/* ══════════════════════════════════════
   BUILD MAP (offscreen, no parallax offset here)
══════════════════════════════════════ */
function buildMap(){
  mapCvs=document.createElement('canvas');
  mapCvs.width=W; mapCvs.height=H;
  var mc=mapCvs.getContext('2d');

  /* 1. Black background */
  mc.fillStyle='#090908';
  mc.fillRect(0,0,W,H);

  /* 2. DOTS — warm gray, high opacity, clearly visible */
  mc.fillStyle='rgba(160,150,132,0.80)';
  mc.beginPath();
  for(var d=0;d<dots.length;d+=2){
    var x=dots[d],y=dots[d+1];
    mc.moveTo(x+1.8,y);
    mc.arc(x,y,1.8,0,Math.PI*2);
  }
  mc.fill();

  /* 3. Vignette — ONLY at outer 25% edges, center stays fully open */
  /* left */
  var lf=mc.createLinearGradient(0,0,W*0.12,0);
  lf.addColorStop(0,'rgba(9,9,8,0.96)');
  lf.addColorStop(1,'rgba(9,9,8,0)');
  mc.fillStyle=lf; mc.fillRect(0,0,W*0.12,H);
  /* right */
  var rf=mc.createLinearGradient(W*0.88,0,W,0);
  rf.addColorStop(0,'rgba(9,9,8,0)');
  rf.addColorStop(1,'rgba(9,9,8,0.96)');
  mc.fillStyle=rf; mc.fillRect(W*0.88,0,W*0.12,H);
  /* bottom */
  var bf=mc.createLinearGradient(0,H*0.68,0,H);
  bf.addColorStop(0,'rgba(9,9,8,0)');
  bf.addColorStop(1,'rgba(9,9,8,0.96)');
  mc.fillStyle=bf; mc.fillRect(0,H*0.68,W,H*0.32);
  /* top (behind nav) */
  var tf=mc.createLinearGradient(0,0,0,H*0.14);
  tf.addColorStop(0,'rgba(9,9,8,0.80)');
  tf.addColorStop(1,'rgba(9,9,8,0)');
  mc.fillStyle=tf; mc.fillRect(0,0,W,H*0.14);

  /* 4. City dots */
  for(var j=0;j<CITIES.length;j++){
    var cx=cityPx[j][0],cy=cityPx[j][1];
    /* glow */
    var g=mc.createRadialGradient(cx,cy,0,cx,cy,16);
    g.addColorStop(0,'rgba(210,195,165,0.22)');
    g.addColorStop(1,'rgba(210,195,165,0)');
    mc.fillStyle=g; mc.beginPath(); mc.arc(cx,cy,16,0,Math.PI*2); mc.fill();
    /* dot */
    mc.fillStyle='rgba(220,208,182,0.92)';
    mc.beginPath(); mc.arc(cx,cy,2.4,0,Math.PI*2); mc.fill();
    /* label */
    mc.save();
    mc.font='600 9px Archivo,sans-serif';
    if('letterSpacing' in mc)mc.letterSpacing='0.15em';
    mc.fillStyle='rgba(190,175,148,0.60)';
    mc.textAlign='center';
    mc.fillText(CITIES[j].id,cx,cy-13);
    mc.restore();
  }
}

/* ══════════════════════════════════════
   FLIGHT TRAIL
══════════════════════════════════════ */
function launch(now){
  trails.push({ri:nextRoute++%ROUTES.length,born:now,dur:18000+Math.random()*10000});
  lastLaunch=now;
}

function drawTrail(tr,now){
  var t=Math.min(1,(now-tr.born)/tr.dur);
  var r=ROUTES[tr.ri];
  var ax=cityPx[r.a][0],ay=cityPx[r.a][1];
  var bx=cityPx[r.b][0],by=cityPx[r.b][1];
  var qx=ctrl[tr.ri][0],qy=ctrl[tr.ri][1];

  /* fade envelope */
  var ft=t<0.05?t/0.05:(t>0.94?(1-t)/0.06:1);
  ft=Math.max(0,Math.min(1,ft));

  var TRAIL=0.07;
  var tTail=Math.max(0,t-TRAIL);
  var N=36;

  ctx.save();
  ctx.lineCap='round';
  for(var i=0;i<N;i++){
    var ta=tTail+(t-tTail)*(i/N);
    var tb=tTail+(t-tTail)*((i+1)/N);
    var pa=bez(ax,ay,bx,by,qx,qy,ta);
    var pb=bez(ax,ay,bx,by,qx,qy,tb);
    var alpha=Math.pow(i/N,0.60)*0.55*ft;
    ctx.strokeStyle='rgba(215,200,170,'+alpha.toFixed(3)+')';
    ctx.lineWidth=0.80;
    ctx.beginPath();
    ctx.moveTo(pa[0]+pX,pa[1]+pY);
    ctx.lineTo(pb[0]+pX,pb[1]+pY);
    ctx.stroke();
  }
  ctx.restore();

  /* leading point */
  var lead=bez(ax,ay,bx,by,qx,qy,t);
  var lx=lead[0]+pX,ly=lead[1]+pY;

  var g1=ctx.createRadialGradient(lx,ly,0,lx,ly,9);
  g1.addColorStop(0,'rgba(235,222,195,'+(ft*0.55)+')');
  g1.addColorStop(0.5,'rgba(215,200,170,'+(ft*0.18)+')');
  g1.addColorStop(1,'rgba(215,200,170,0)');
  ctx.fillStyle=g1;
  ctx.beginPath(); ctx.arc(lx,ly,9,0,Math.PI*2); ctx.fill();

  ctx.fillStyle='rgba(245,235,215,'+(ft*0.95)+')';
  ctx.beginPath(); ctx.arc(lx,ly,1.6,0,Math.PI*2); ctx.fill();

  return t>=1;
}

/* ══════════════════════════════════════
   RENDER LOOP
══════════════════════════════════════ */
function frame(now){
  requestAnimationFrame(frame);
  if(!mapCvs)return;

  /* gentle parallax */
  pX+=((mxM-W/2)*0.0016-pX)*0.032;
  pY+=((myM-H/2)*0.0010-pY)*0.032;

  /* draw map */
  ctx.clearRect(0,0,W,H);
  ctx.drawImage(mapCvs,Math.round(pX),Math.round(pY));

  /* trails */
  if(now-lastLaunch>7000&&trails.length<2)launch(now);
  for(var i=trails.length-1;i>=0;i--)
    if(drawTrail(trails[i],now))trails.splice(i,1);
}

/* ══════════════════════════════════════
   HANDLERS
══════════════════════════════════════ */
var rsz;
window.addEventListener('resize',function(){
  clearTimeout(rsz);
  rsz=setTimeout(function(){trails=[];setup();},280);
},{passive:true});

window.addEventListener('mousemove',function(e){mxM=e.clientX;myM=e.clientY;},{passive:true});

function init(){setTimeout(setup,80);}
if(document.fonts&&document.fonts.ready){document.fonts.ready.then(init);}
else{window.addEventListener('load',init);}

requestAnimationFrame(frame);
})();
