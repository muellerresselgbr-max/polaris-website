/* Polaris Concierge | hero-bg.js v3
   Premium dark world map — elevated continent visibility
   + Cinematic flight trail animation (point + fading line)
*/
(function(){
  'use strict';

  var LAND=[
    [[-168,72],[-140,75],[-115,78],[-90,72],[-65,72],[-55,62],[-60,46],
     [-75,45],[-80,30],[-85,25],[-95,18],[-105,22],[-120,32],[-125,45],[-140,55],[-160,60]],
    [[-68,82],[-30,82],[-20,75],[-25,70],[-45,65],[-55,68],[-65,72]],
    [[-80,12],[-68,12],[-60,8],[-50,0],[-40,-10],[-40,-22],
     [-50,-35],[-65,-55],[-70,-50],[-75,-35],[-80,-10]],
    [[-10,70],[-5,60],[0,50],[5,45],[15,45],[20,50],[30,60],[28,72],[15,78],[-5,78],[-15,75]],
    [[5,57],[8,58],[15,70],[28,72],[30,68],[25,65],[20,55],[15,58]],
    [[-6,50],[-3,54],[-5,58],[-3,60],[-1,58],[0,51]],
    [[-18,38],[-10,36],[10,38],[35,38],[42,12],[50,-12],[38,-30],
     [25,-35],[18,-28],[12,-18],[8,5],[0,5],[-18,15],[-18,32]],
    [[26,38],[28,42],[38,36],[42,30],[40,18],[55,22],[60,24],[55,30],[45,38],[35,38]],
    [[30,72],[60,72],[90,78],[120,72],[140,68],[145,55],[140,45],[130,40],
     [125,50],[120,58],[110,62],[100,65],[80,68],[60,68],[45,65],[35,68]],
    [[60,24],[68,24],[80,30],[88,22],[80,12],[75,8],[68,16]],
    [[95,22],[105,22],[110,18],[108,10],[105,5],[100,5],[95,10]],
    [[80,40],[90,42],[100,48],[110,55],[120,48],[135,50],[145,45],[140,42],
     [132,34],[122,25],[110,18],[100,20],[90,28],[80,30],[70,38],[65,35]],
    [[130,31],[132,34],[136,36],[140,42],[143,44],[141,40]],
    [[114,-22],[118,-18],[130,-14],[138,-14],[145,-18],[152,-25],
     [148,-38],[138,-38],[130,-32],[116,-34]]
  ];

  var CITIES=[
    {id:'NYC',lon:-74.0,lat:40.7},
    {id:'LON',lon:-0.1, lat:51.5},
    {id:'DXB',lon:55.3, lat:25.2},
    {id:'HKG',lon:114.1,lat:22.4}
  ];

  var ROUTES=[
    {a:0,b:1,arc:0.28},{a:1,b:2,arc:0.22},
    {a:2,b:3,arc:0.18},{a:1,b:3,arc:0.30},{a:0,b:2,arc:0.34}
  ];

  var cvs=document.getElementById('heroBg');
  if(!cvs)return;
  var ctx=cvs.getContext('2d');

  var W,H,projLand=[],landDots=[],cityPx=[],routeCtrl=[];
  var staticCvs=null,sweeps=[],nextRoute=0,lastLaunch=0;
  var mX=960,mY=450,pX=0,pY=0;
  var IVTL=5500;

  function proj(lon,lat){return[(lon+180)/360*W,(90-lat)/180*H];}

  function pip(px,py,poly){
    var inside=false,n=poly.length;
    for(var i=0,j=n-1;i<n;j=i++){
      var xi=poly[i][0],yi=poly[i][1],xj=poly[j][0],yj=poly[j][1];
      if((yi>py)!==(yj>py)&&px<(xj-xi)*(py-yi)/(yj-yi)+xi)inside=!inside;
    }
    return inside;
  }

  function bezAt(ax,ay,bx,by,cx,cy,t){
    var u=1-t;
    return[u*u*ax+2*u*t*cx+t*t*bx,u*u*ay+2*u*t*cy+t*t*by];
  }

  /* ── Setup ─────────────────────────────────────── */
  function setup(){
    W=window.innerWidth; H=window.innerHeight;
    mX=W/2; mY=H/2;
    cvs.width=W; cvs.height=H;

    cityPx=CITIES.map(function(c){return proj(c.lon,c.lat);});

    routeCtrl=ROUTES.map(function(r){
      var a=cityPx[r.a],b=cityPx[r.b];
      var mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;
      var dx=b[0]-a[0],dy=b[1]-a[1];
      var len=Math.sqrt(dx*dx+dy*dy)||1;
      var nx=-dy/len,ny=dx/len;
      return[mx+nx*len*r.arc*(ny>0?-1:1),my+ny*len*r.arc*(ny>0?-1:1)];
    });

    projLand=LAND.map(function(p){return p.map(function(q){return proj(q[0],q[1]);});});

    landDots=[];
    var S=7;
    for(var y=S/2;y<H;y+=S)
      for(var x=S/2;x<W;x+=S)
        for(var k=0;k<projLand.length;k++)
          if(pip(x,y,projLand[k])){landDots.push(x,y);break;}

    buildStatic();

    var hero=document.querySelector('.hero');
    if(hero)hero.classList.add('ready');
  }

  /* ── Build offscreen static layer ──────────────── */
  function buildStatic(){
    staticCvs=document.createElement('canvas');
    staticCvs.width=W; staticCvs.height=H;
    var sc=staticCvs.getContext('2d');

    /* ── Layer 1: Continental atmospheric haze ── */
    /* Draw filled continent shapes, then blur for depth/glow effect */
    var haze=document.createElement('canvas');
    haze.width=W; haze.height=H;
    var hc=haze.getContext('2d');
    hc.fillStyle='rgba(150,140,122,1)';
    for(var k=0;k<projLand.length;k++){
      var pl=projLand[k];
      hc.beginPath();
      hc.moveTo(pl[0][0],pl[0][1]);
      for(var pi=1;pi<pl.length;pi++)hc.lineTo(pl[pi][0],pl[pi][1]);
      hc.closePath();
      hc.fill();
    }
    /* Wide haze: very soft, wide atmospheric glow */
    sc.save();
    if('filter' in sc)sc.filter='blur(20px)';
    sc.globalAlpha=0.09;
    sc.drawImage(haze,0,0);
    /* Tight haze: slightly sharper, gives edge definition */
    if('filter' in sc)sc.filter='blur(6px)';
    sc.globalAlpha=0.05;
    sc.drawImage(haze,0,0);
    sc.restore();

    /* ── Layer 2: Land dot matrix ── */
    /* Clearly visible dots define the continent shapes */
    sc.fillStyle='rgba(168,158,140,0.21)';
    sc.beginPath();
    for(var d=0;d<landDots.length;d+=2){
      sc.moveTo(landDots[d]+1.3,landDots[d+1]);
      sc.arc(landDots[d],landDots[d+1],1.3,0,Math.PI*2);
    }
    sc.fill();

    /* ── Layer 3: Subtle atmospheric center light ── */
    /* Warm glow in center-upper area — "global aviation command" feel */
    var atm=sc.createRadialGradient(W*0.5,H*0.38,0,W*0.5,H*0.38,W*0.55);
    atm.addColorStop(0,'rgba(128,112,88,0.055)');
    atm.addColorStop(0.5,'rgba(80,70,54,0.025)');
    atm.addColorStop(1,'rgba(9,9,9,0)');
    sc.fillStyle=atm; sc.fillRect(0,0,W,H);

    /* ── Layer 4: Edge vignette ── */
    /* Only fades at outer edges, not in the center */
    var vg=sc.createRadialGradient(W/2,H/2,H*0.30,W/2,H/2,W*0.74);
    vg.addColorStop(0,'rgba(9,9,9,0)');
    vg.addColorStop(0.75,'rgba(9,9,9,0.04)');
    vg.addColorStop(1,'rgba(9,9,9,0.96)');
    sc.fillStyle=vg; sc.fillRect(0,0,W,H);

    /* Left/right hard fades */
    var lf=sc.createLinearGradient(0,0,W*0.09,0);
    lf.addColorStop(0,'rgba(9,9,9,0.96)');
    lf.addColorStop(1,'rgba(9,9,9,0)');
    sc.fillStyle=lf; sc.fillRect(0,0,W*0.09,H);
    var rf=sc.createLinearGradient(W*0.91,0,W,0);
    rf.addColorStop(0,'rgba(9,9,9,0)');
    rf.addColorStop(1,'rgba(9,9,9,0.96)');
    sc.fillStyle=rf; sc.fillRect(W*0.91,0,W*0.09,H);

    /* ── Layer 5: City nodes ── */
    for(var j=0;j<CITIES.length;j++){
      var cx=cityPx[j][0],cy=cityPx[j][1];

      /* Ambient glow */
      var g=sc.createRadialGradient(cx,cy,0,cx,cy,22);
      g.addColorStop(0,'rgba(205,192,170,0.16)');
      g.addColorStop(1,'rgba(205,192,170,0)');
      sc.fillStyle=g; sc.beginPath(); sc.arc(cx,cy,22,0,Math.PI*2); sc.fill();

      /* Node dot */
      sc.fillStyle='rgba(205,192,170,0.62)';
      sc.beginPath(); sc.arc(cx,cy,2.5,0,Math.PI*2); sc.fill();

      /* Label */
      sc.save();
      sc.font='600 9.5px Archivo,sans-serif';
      if('letterSpacing' in sc)sc.letterSpacing='0.14em';
      sc.fillStyle='rgba(195,182,160,0.4)';
      sc.textAlign='center';
      sc.fillText(CITIES[j].id,cx,cy-14);
      sc.restore();
    }
  }

  /* ── Flight trail animation ─────────────────────
     A small bright point leads, a thin elegant line
     fades behind it. Premium aviation tracking feel.
  ──────────────────────────────────────────────── */
  function launch(now){
    sweeps.push({ri:nextRoute++%ROUTES.length,born:now,dur:15000+Math.random()*8000});
    lastLaunch=now;
  }

  function drawTrail(s,now){
    var t=Math.min(1,(now-s.born)/s.dur);
    var r=ROUTES[s.ri];
    var ax=cityPx[r.a][0],ay=cityPx[r.a][1];
    var bx=cityPx[r.b][0],by=cityPx[r.b][1];
    var cx=routeCtrl[s.ri][0],cy=routeCtrl[s.ri][1];

    /* Fade envelope: ease in 8%, ease out 8% */
    var ft=t<0.08?t/0.08:(t>0.92?(1-t)/0.08:1);

    /* Trail length: 8% of route behind the leading point */
    var TRAIL=0.08;
    var tStart=Math.max(0,t-TRAIL);
    var N=24;

    /* Draw trail segments from tail (transparent) to head (bright) */
    ctx.save();
    ctx.lineWidth=0.72;
    for(var i=0;i<N;i++){
      var ta=tStart+(t-tStart)*i/N;
      var tb=tStart+(t-tStart)*(i+1)/N;
      var pa=bezAt(ax,ay,bx,by,cx,cy,ta);
      var pb=bezAt(ax,ay,bx,by,cx,cy,tb);
      /* Power curve: bright near head, nearly invisible at tail */
      var segA=Math.pow(i/N,0.65)*0.32*ft;
      ctx.strokeStyle='rgba(228,215,192,'+segA+')';
      ctx.beginPath();
      ctx.moveTo(pa[0]+pX,pa[1]+pY);
      ctx.lineTo(pb[0]+pX,pb[1]+pY);
      ctx.stroke();
    }
    ctx.restore();

    /* Leading point: soft glow + bright core */
    var lead=bezAt(ax,ay,bx,by,cx,cy,t);
    var lx=lead[0]+pX,ly=lead[1]+pY;

    /* Outer glow */
    var grd=ctx.createRadialGradient(lx,ly,0,lx,ly,10);
    grd.addColorStop(0,'rgba(242,230,208,'+(ft*0.52)+')');
    grd.addColorStop(0.45,'rgba(228,212,182,'+(ft*0.16)+')');
    grd.addColorStop(1,'rgba(228,212,182,0)');
    ctx.fillStyle=grd;
    ctx.beginPath(); ctx.arc(lx,ly,10,0,Math.PI*2); ctx.fill();

    /* Bright core dot */
    ctx.fillStyle='rgba(252,244,228,'+(ft*0.92)+')';
    ctx.beginPath(); ctx.arc(lx,ly,1.8,0,Math.PI*2); ctx.fill();

    return t>=1;
  }

  /* ── Main render loop ───────────────────────────── */
  var mxM=W/2,myM=H/2;
  function frame(now){
    requestAnimationFrame(frame);
    if(!staticCvs)return;

    /* Smooth parallax */
    pX+=((mxM-W/2)*0.0022-pX)*0.04;
    pY+=((myM-H/2)*0.0014-pY)*0.04;

    ctx.clearRect(0,0,W,H);
    ctx.drawImage(staticCvs,Math.round(pX),Math.round(pY));

    /* Launch new trail */
    if(now-lastLaunch>IVTL&&sweeps.length<2)launch(now);

    /* Draw all active trails */
    for(var i=sweeps.length-1;i>=0;i--)
      if(drawTrail(sweeps[i],now))sweeps.splice(i,1);
  }

  /* ── Handlers ───────────────────────────────────── */
  var rsz;
  window.addEventListener('resize',function(){
    clearTimeout(rsz);
    rsz=setTimeout(function(){sweeps=[];setup();},260);
  },{passive:true});

  window.addEventListener('mousemove',function(e){
    mxM=e.clientX; myM=e.clientY;
  },{passive:true});

  /* Wait for fonts to settle, then init */
  function init(){setTimeout(setup,60);}
  if(document.fonts&&document.fonts.ready){
    document.fonts.ready.then(init);
  } else {
    window.addEventListener('load',init);
  }

  requestAnimationFrame(frame);

})();
