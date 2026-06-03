/* Polaris Concierge | hero-bg.js v4
   ULTRA PREMIUM world map background
   — Dramatically more visible continents
   — Layered atmospheric depth
   — Cinematic warm-gold lighting
   — Elegant animated flight trails (bezier, slow, refined)
   — Soft parallax on mouse move
*/
(function(){
  'use strict';

  /* ── World map polygons (lon/lat) ──────────────────────────────────
     More detailed outlines for sharper continent recognition
  ───────────────────────────────────────────────────────────────── */
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
    /* Britain & Ireland */
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
    [[60,24],[68,25],[72,22],[76,20],[80,16],[80,10],[78,8],[75,8],[72,12],
     [68,18],[64,22],[60,24]],
    /* Indochina / SE Asia */
    [[95,22],[100,18],[105,10],[108,2],[105,-2],[102,2],[100,6],[98,10],
     [96,14],[94,18],[95,22]],
    /* East Asia / China / Japan */
    [[80,42],[85,40],[90,42],[95,40],[100,48],[108,55],[115,55],[120,50],
     [125,46],[132,38],[136,34],[130,31],[128,34],[132,34],[128,40],[122,30],
     [118,25],[115,22],[110,18],[105,22],[100,24],[96,28],[90,32],[84,34],
     [80,38]],
    /* Japan */
    [[130,31],[132,34],[134,34],[136,36],[138,38],[141,42],[143,44],[141,40],[138,36]],
    /* Australia */
    [[114,-22],[118,-20],[124,-18],[130,-14],[136,-12],[138,-14],[142,-12],
     [145,-16],[148,-20],[152,-25],[152,-30],[148,-38],[142,-38],[138,-36],
     [132,-34],[128,-34],[116,-34],[113,-26],[114,-22]],
    /* New Zealand (simplified) */
    [[172,-40],[174,-38],[176,-36],[174,-34],[170,-42],[168,-46],[170,-48],[172,-46]]
  ];

  /* ── Key aviation hubs ── */
  var CITIES=[
    {id:'NYC', lon:-74.0, lat:40.7},
    {id:'LON', lon:-0.1,  lat:51.5},
    {id:'DXB', lon:55.3,  lat:25.2},
    {id:'HKG', lon:114.1, lat:22.4},
    {id:'SIN', lon:103.8, lat:1.35},
    {id:'GVA', lon:6.15,  lat:46.2},
    {id:'MIA', lon:-80.2, lat:25.8},
    {id:'TOK', lon:139.7, lat:35.7}
  ];

  /* ── Routes — only the most luxurious, intercontinental ── */
  var ROUTES=[
    {a:0, b:1, arc:0.30},  /* NYC → LON */
    {a:1, b:2, arc:0.22},  /* LON → DXB */
    {a:2, b:3, arc:0.18},  /* DXB → HKG */
    {a:1, b:3, arc:0.28},  /* LON → HKG */
    {a:0, b:2, arc:0.32},  /* NYC → DXB */
    {a:5, b:2, arc:0.20},  /* GVA → DXB */
    {a:1, b:4, arc:0.24},  /* LON → SIN */
    {a:6, b:1, arc:0.28},  /* MIA → LON */
    {a:2, b:7, arc:0.20},  /* DXB → TOK */
  ];

  var cvs=document.getElementById('heroBg');
  if(!cvs)return;
  var ctx=cvs.getContext('2d');

  var W,H,projLand=[],landDots=[],cityPx=[],routeCtrl=[];
  var staticCvs=null,sweeps=[],nextRoute=0,lastLaunch=0;
  var mxM,myM,pX=0,pY=0;

  /* Slower, more cinematic intervals */
  var IVTL=8000;   /* ms between new trail launches */
  var MAX_SWEEPS=2; /* max simultaneous trails */

  /* ── Projection: equirectangular ─────────────────── */
  function proj(lon,lat){return[(lon+180)/360*W,(90-lat)/180*H];}

  /* ── Point-in-polygon test ───────────────────────── */
  function pip(px,py,poly){
    var inside=false,n=poly.length;
    for(var i=0,j=n-1;i<n;j=i++){
      var xi=poly[i][0],yi=poly[i][1],xj=poly[j][0],yj=poly[j][1];
      if((yi>py)!==(yj>py)&&px<(xj-xi)*(py-yi)/(yj-yi)+xi)inside=!inside;
    }
    return inside;
  }

  /* ── Quadratic bezier point ──────────────────────── */
  function bezAt(ax,ay,bx,by,cx,cy,t){
    var u=1-t;
    return[u*u*ax+2*u*t*cx+t*t*bx,u*u*ay+2*u*t*cy+t*t*by];
  }

  /* ── Easing: smooth ease-in-out ──────────────────── */
  function ease(t){return t<0.5?2*t*t:1-Math.pow(-2*t+2,2)/2;}

  /* ═══════════════════════════════════════════════════
     SETUP
  ═══════════════════════════════════════════════════ */
  function setup(){
    W=window.innerWidth;
    H=window.innerHeight;
    mxM=W/2; myM=H/2;
    cvs.width=W; cvs.height=H;

    cityPx=CITIES.map(function(c){return proj(c.lon,c.lat);});

    /* Control points: arc upward (away from equator) */
    routeCtrl=ROUTES.map(function(r){
      var a=cityPx[r.a],b=cityPx[r.b];
      var mx=(a[0]+b[0])/2, my=(a[1]+b[1])/2;
      var dx=b[0]-a[0],    dy=b[1]-a[1];
      var len=Math.sqrt(dx*dx+dy*dy)||1;
      var nx=-dy/len,       ny=dx/len;
      var dir=(ny>0)?-1:1;
      return[mx+nx*len*r.arc*dir, my+ny*len*r.arc*dir];
    });

    projLand=LAND.map(function(p){return p.map(function(q){return proj(q[0],q[1]);});});

    /* Dot grid — tighter spacing for more definition */
    landDots=[];
    var S=5.5;
    for(var y=S/2;y<H;y+=S)
      for(var x=S/2;x<W;x+=S)
        for(var k=0;k<projLand.length;k++)
          if(pip(x,y,projLand[k])){landDots.push(x,y);break;}

    buildStatic();

    var hero=document.querySelector('.hero');
    if(hero)hero.classList.add('ready');
  }

  /* ═══════════════════════════════════════════════════
     BUILD STATIC LAYER (offscreen canvas, drawn once)
  ═══════════════════════════════════════════════════ */
  function buildStatic(){
    staticCvs=document.createElement('canvas');
    staticCvs.width=W; staticCvs.height=H;
    var sc=staticCvs.getContext('2d');

    /* ─────────────────────────────────────────────────
       LAYER 0: Background — deep warm-black gradient
    ───────────────────────────────────────────────── */
    var bgGrad=sc.createRadialGradient(W*0.5,H*0.35,0,W*0.5,H*0.5,W*0.75);
    bgGrad.addColorStop(0,'rgba(18,16,14,1)');
    bgGrad.addColorStop(0.5,'rgba(11,10,9,1)');
    bgGrad.addColorStop(1,'rgba(7,6,5,1)');
    sc.fillStyle=bgGrad;
    sc.fillRect(0,0,W,H);

    /* ─────────────────────────────────────────────────
       LAYER 1a: Filled continent shapes — warm fill
       This is the most important change: solid base
       so continents register immediately at full opacity
    ───────────────────────────────────────────────── */
    sc.save();
    sc.globalCompositeOperation='source-over';
    sc.fillStyle='rgba(58,52,42,0.72)';
    for(var k=0;k<projLand.length;k++){
      var pl=projLand[k];
      sc.beginPath();
      sc.moveTo(pl[0][0],pl[0][1]);
      for(var pi=1;pi<pl.length;pi++)sc.lineTo(pl[pi][0],pl[pi][1]);
      sc.closePath();
      sc.fill();
    }
    sc.restore();

    /* ─────────────────────────────────────────────────
       LAYER 1b: Very wide atmospheric haze of continents
       Gives the "glow from within" effect over the fill
    ───────────────────────────────────────────────── */
    var hazeC=document.createElement('canvas');
    hazeC.width=W; hazeC.height=H;
    var hc=hazeC.getContext('2d');
    hc.fillStyle='rgba(180,162,128,1)';
    for(var k=0;k<projLand.length;k++){
      var pl=projLand[k];
      hc.beginPath();
      hc.moveTo(pl[0][0],pl[0][1]);
      for(var pi=1;pi<pl.length;pi++)hc.lineTo(pl[pi][0],pl[pi][1]);
      hc.closePath();
      hc.fill();
    }

    sc.save();
    if('filter' in sc)sc.filter='blur(28px)';
    sc.globalAlpha=0.18;
    sc.drawImage(hazeC,0,0);
    sc.restore();

    sc.save();
    if('filter' in sc)sc.filter='blur(10px)';
    sc.globalAlpha=0.12;
    sc.drawImage(hazeC,0,0);
    sc.restore();

    sc.save();
    if('filter' in sc)sc.filter='blur(3px)';
    sc.globalAlpha=0.07;
    sc.drawImage(hazeC,0,0);
    sc.restore();

    /* ─────────────────────────────────────────────────
       LAYER 2: Dot matrix — primary visible structure
       Much higher opacity + slightly varied sizing
    ───────────────────────────────────────────────── */
    /* Base dot pass — warm cream, clearly visible */
    sc.save();
    sc.fillStyle='rgba(192,178,152,0.52)';
    sc.beginPath();
    for(var d=0;d<landDots.length;d+=2){
      sc.moveTo(landDots[d]+1.6,landDots[d+1]);
      sc.arc(landDots[d],landDots[d+1],1.6,0,Math.PI*2);
    }
    sc.fill();
    sc.restore();

    /* Second pass — even brighter center dots for depth variation */
    sc.save();
    sc.fillStyle='rgba(220,208,184,0.20)';
    sc.beginPath();
    for(var d=0;d<landDots.length;d+=4){
      /* Every other dot slightly larger and brighter */
      sc.moveTo(landDots[d]+2.0,landDots[d+1]);
      sc.arc(landDots[d],landDots[d+1],2.0,0,Math.PI*2);
    }
    sc.fill();
    sc.restore();

    /* ─────────────────────────────────────────────────
       LAYER 3: Continent edge definition
       Stroke outline along continent shapes for crispness
    ───────────────────────────────────────────────── */
    sc.save();
    sc.strokeStyle='rgba(200,185,158,0.14)';
    sc.lineWidth=0.8;
    for(var k=0;k<projLand.length;k++){
      var pl=projLand[k];
      sc.beginPath();
      sc.moveTo(pl[0][0],pl[0][1]);
      for(var pi=1;pi<pl.length;pi++)sc.lineTo(pl[pi][0],pl[pi][1]);
      sc.closePath();
      sc.stroke();
    }
    sc.restore();

    /* ─────────────────────────────────────────────────
       LAYER 4: Cinematic warm overhead lighting
       Centered top — like a stage light from above
    ───────────────────────────────────────────────── */
    var spotlight=sc.createRadialGradient(W*0.5,H*0.1,0,W*0.5,H*0.5,W*0.62);
    spotlight.addColorStop(0,'rgba(155,135,100,0.10)');
    spotlight.addColorStop(0.35,'rgba(110,95,70,0.055)');
    spotlight.addColorStop(0.70,'rgba(60,50,35,0.022)');
    spotlight.addColorStop(1,'rgba(0,0,0,0)');
    sc.fillStyle=spotlight;
    sc.fillRect(0,0,W,H);

    /* Secondary warm center glow — map center brightening */
    var centerGlow=sc.createRadialGradient(W*0.50,H*0.46,0,W*0.50,H*0.46,W*0.40);
    centerGlow.addColorStop(0,'rgba(140,120,88,0.07)');
    centerGlow.addColorStop(0.5,'rgba(80,68,50,0.03)');
    centerGlow.addColorStop(1,'rgba(0,0,0,0)');
    sc.fillStyle=centerGlow;
    sc.fillRect(0,0,W,H);

    /* ─────────────────────────────────────────────────
       LAYER 5: Vignette — edges only, generous center
       Critical: keep center very open so map reads
    ───────────────────────────────────────────────── */
    /* Radial vignette: inner radius large so map is fully visible */
    var vg=sc.createRadialGradient(W/2,H/2,H*0.38,W/2,H/2,W*0.72);
    vg.addColorStop(0,'rgba(9,9,9,0)');
    vg.addColorStop(0.65,'rgba(9,9,9,0.03)');
    vg.addColorStop(0.85,'rgba(9,9,9,0.28)');
    vg.addColorStop(1,'rgba(9,9,9,0.88)');
    sc.fillStyle=vg;
    sc.fillRect(0,0,W,H);

    /* Left edge fade */
    var lf=sc.createLinearGradient(0,0,W*0.07,0);
    lf.addColorStop(0,'rgba(9,9,9,0.94)');
    lf.addColorStop(1,'rgba(9,9,9,0)');
    sc.fillStyle=lf; sc.fillRect(0,0,W*0.07,H);

    /* Right edge fade */
    var rf=sc.createLinearGradient(W*0.93,0,W,0);
    rf.addColorStop(0,'rgba(9,9,9,0)');
    rf.addColorStop(1,'rgba(9,9,9,0.94)');
    sc.fillStyle=rf; sc.fillRect(W*0.93,0,W*0.07,H);

    /* Bottom fade — text readability */
    var bf=sc.createLinearGradient(0,H*0.78,0,H);
    bf.addColorStop(0,'rgba(9,9,9,0)');
    bf.addColorStop(1,'rgba(9,9,9,0.90)');
    sc.fillStyle=bf; sc.fillRect(0,H*0.78,W,H*0.22);

    /* Top subtle darkening behind nav */
    var tf=sc.createLinearGradient(0,0,0,H*0.16);
    tf.addColorStop(0,'rgba(9,9,9,0.60)');
    tf.addColorStop(1,'rgba(9,9,9,0)');
    sc.fillStyle=tf; sc.fillRect(0,0,W,H*0.16);

    /* ─────────────────────────────────────────────────
       LAYER 6: City nodes — aviation hub markers
    ───────────────────────────────────────────────── */
    for(var j=0;j<CITIES.length;j++){
      var cx=cityPx[j][0], cy=cityPx[j][1];

      /* Wide ambient glow ring */
      var g1=sc.createRadialGradient(cx,cy,0,cx,cy,28);
      g1.addColorStop(0,'rgba(220,200,165,0.20)');
      g1.addColorStop(0.4,'rgba(190,172,140,0.08)');
      g1.addColorStop(1,'rgba(190,172,140,0)');
      sc.fillStyle=g1;
      sc.beginPath(); sc.arc(cx,cy,28,0,Math.PI*2); sc.fill();

      /* Inner tight glow */
      var g2=sc.createRadialGradient(cx,cy,0,cx,cy,10);
      g2.addColorStop(0,'rgba(240,224,192,0.40)');
      g2.addColorStop(1,'rgba(240,224,192,0)');
      sc.fillStyle=g2;
      sc.beginPath(); sc.arc(cx,cy,10,0,Math.PI*2); sc.fill();

      /* Pulse ring */
      sc.save();
      sc.strokeStyle='rgba(210,192,158,0.18)';
      sc.lineWidth=0.7;
      sc.beginPath(); sc.arc(cx,cy,7,0,Math.PI*2); sc.stroke();
      sc.restore();

      /* Core dot */
      sc.fillStyle='rgba(235,220,190,0.85)';
      sc.beginPath(); sc.arc(cx,cy,2.2,0,Math.PI*2); sc.fill();

      /* City label */
      sc.save();
      sc.font='600 9px Archivo,sans-serif';
      if('letterSpacing' in sc)sc.letterSpacing='0.16em';
      sc.fillStyle='rgba(205,188,158,0.55)';
      sc.textAlign='center';
      sc.fillText(CITIES[j].id,cx,cy-16);
      sc.restore();
    }

    /* ─────────────────────────────────────────────────
       LAYER 7: Subtle flight route ghost lines
       Barely visible base paths between city pairs
    ───────────────────────────────────────────────── */
    sc.save();
    sc.strokeStyle='rgba(180,165,135,0.06)';
    sc.lineWidth=0.5;
    sc.setLineDash([3,14]);
    for(var r=0;r<ROUTES.length;r++){
      var rt=ROUTES[r];
      var ax=cityPx[rt.a][0],ay=cityPx[rt.a][1];
      var bx=cityPx[rt.b][0],by=cityPx[rt.b][1];
      var qx=routeCtrl[r][0],qy=routeCtrl[r][1];
      sc.beginPath();
      sc.moveTo(ax,ay);
      sc.quadraticCurveTo(qx,qy,bx,by);
      sc.stroke();
    }
    sc.setLineDash([]);
    sc.restore();

    /* ─────────────────────────────────────────────────
       LAYER 8: Ultra-fine film grain overlay
       Gives depth and prevents flat digital look
    ───────────────────────────────────────────────── */
    var imgData=sc.createImageData(W,H);
    var data=imgData.data;
    for(var i=0;i<data.length;i+=4){
      var noise=(Math.random()-0.5)*14;
      data[i]=data[i+1]=data[i+2]=128+noise;
      data[i+3]=12; /* very subtle — just texture */
    }
    sc.putImageData(imgData,0,0);
  }

  /* ═══════════════════════════════════════════════════
     FLIGHT TRAIL ANIMATION
     A single glowing point leads; an elegant fading
     bezier trail dissolves behind it. Slow, luxurious.
  ═══════════════════════════════════════════════════ */
  function launch(now){
    /* Shuffle route order but stay sequential for variety */
    sweeps.push({
      ri: nextRoute++ % ROUTES.length,
      born: now,
      dur: 20000 + Math.random()*12000  /* 20–32 seconds per trail */
    });
    lastLaunch=now;
  }

  function drawTrail(s,now){
    var t=Math.min(1,(now-s.born)/s.dur);
    var r=ROUTES[s.ri];
    var ax=cityPx[r.a][0], ay=cityPx[r.a][1];
    var bx=cityPx[r.b][0], by=cityPx[r.b][1];
    var qx=routeCtrl[s.ri][0], qy=routeCtrl[s.ri][1];

    /* Smooth ease-in / ease-out envelope */
    var FADE_IN=0.06, FADE_OUT=0.08;
    var ft = t < FADE_IN  ? t/FADE_IN :
             t > 1-FADE_OUT ? (1-t)/FADE_OUT : 1;
    ft=Math.max(0,Math.min(1,ft));

    /* Trail: 6% of arc behind the lead point */
    var TRAIL_LEN=0.06;
    var tHead=t;
    var tTail=Math.max(0,t-TRAIL_LEN);
    var N=32; /* segments for smooth gradient */

    ctx.save();
    ctx.lineWidth=0.65;
    ctx.lineCap='round';

    for(var i=0;i<N;i++){
      var ta=tTail+(tHead-tTail)*i/N;
      var tb=tTail+(tHead-tTail)*(i+1)/N;
      var pa=bezAt(ax,ay,bx,by,qx,qy,ta);
      var pb=bezAt(ax,ay,bx,by,qx,qy,tb);

      /* Intensity: cubic falloff from head to tail */
      var intensity=Math.pow(i/N,0.55)*0.30*ft;
      ctx.strokeStyle='rgba(225,210,182,'+intensity.toFixed(3)+')';
      ctx.beginPath();
      ctx.moveTo(pa[0]+pX, pa[1]+pY);
      ctx.lineTo(pb[0]+pX, pb[1]+pY);
      ctx.stroke();
    }
    ctx.restore();

    /* ── Leading point ── */
    var lead=bezAt(ax,ay,bx,by,qx,qy,t);
    var lx=lead[0]+pX, ly=lead[1]+pY;

    /* Outer soft glow */
    var g=ctx.createRadialGradient(lx,ly,0,lx,ly,12);
    g.addColorStop(0,'rgba(245,232,208,'+(ft*0.48)+')');
    g.addColorStop(0.4,'rgba(230,215,185,'+(ft*0.15)+')');
    g.addColorStop(1,'rgba(230,215,185,0)');
    ctx.fillStyle=g;
    ctx.beginPath(); ctx.arc(lx,ly,12,0,Math.PI*2); ctx.fill();

    /* Mid glow */
    var g2=ctx.createRadialGradient(lx,ly,0,lx,ly,5);
    g2.addColorStop(0,'rgba(255,248,232,'+(ft*0.72)+')');
    g2.addColorStop(1,'rgba(255,248,232,0)');
    ctx.fillStyle=g2;
    ctx.beginPath(); ctx.arc(lx,ly,5,0,Math.PI*2); ctx.fill();

    /* Bright core */
    ctx.fillStyle='rgba(255,252,242,'+(ft*0.95)+')';
    ctx.beginPath(); ctx.arc(lx,ly,1.5,0,Math.PI*2); ctx.fill();

    return t>=1;
  }

  /* ═══════════════════════════════════════════════════
     MAIN RENDER LOOP
  ═══════════════════════════════════════════════════ */
  function frame(now){
    requestAnimationFrame(frame);
    if(!staticCvs)return;

    /* Smooth parallax — very gentle */
    pX+=((mxM-W/2)*0.0018-pX)*0.035;
    pY+=((myM-H/2)*0.0011-pY)*0.035;

    ctx.clearRect(0,0,W,H);
    ctx.drawImage(staticCvs, Math.round(pX), Math.round(pY));

    /* Launch new trail when ready */
    if(now-lastLaunch > IVTL && sweeps.length < MAX_SWEEPS) launch(now);

    /* Draw active trails */
    for(var i=sweeps.length-1;i>=0;i--)
      if(drawTrail(sweeps[i],now)) sweeps.splice(i,1);
  }

  /* ═══════════════════════════════════════════════════
     EVENT HANDLERS
  ═══════════════════════════════════════════════════ */
  var rsz;
  window.addEventListener('resize',function(){
    clearTimeout(rsz);
    rsz=setTimeout(function(){sweeps=[];setup();},280);
  },{passive:true});

  window.addEventListener('mousemove',function(e){
    mxM=e.clientX; myM=e.clientY;
  },{passive:true});

  /* ── Init after fonts settle ── */
  function init(){setTimeout(setup,80);}
  if(document.fonts&&document.fonts.ready){
    document.fonts.ready.then(init);
  } else {
    window.addEventListener('load',init);
  }

  requestAnimationFrame(frame);

})();
