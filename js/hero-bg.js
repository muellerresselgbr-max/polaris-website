/* Polaris Concierge | hero-bg.js
   Clean, robust canvas world map background.
   - Uses window.innerHeight (stable, not hero.offsetHeight)
   - Canvas z-index:-1, inside hero with isolation:isolate
   - Text always visible regardless of canvas state
   - JS adds .ready class to trigger entrance animation
*/
(function(){
  'use strict';

  /* ── Continent polygons [lon, lat] ── */
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

  /* CRITICAL: use window.innerHeight — stable, not affected by font loading */
  var W=window.innerWidth, H=window.innerHeight;
  var projLand=[], landDots=[], cityPx=[], routeCtrl=[];
  var staticCvs=null, sweeps=[], nextRoute=0, lastLaunch=0;
  var mX=W/2, mY=H/2, pX=0, pY=0;
  var IVTL=5000;

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

  function setup(){
    /* Size canvas to VIEWPORT dimensions — critical for correct map positioning */
    W=window.innerWidth; H=window.innerHeight;
    cvs.width=W; cvs.height=H;

    cityPx=CITIES.map(function(c){return proj(c.lon,c.lat);});

    routeCtrl=ROUTES.map(function(r){
      var a=cityPx[r.a],b=cityPx[r.b];
      var mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;
      var dx=b[0]-a[0],dy=b[1]-a[1];
      var len=Math.sqrt(dx*dx+dy*dy)||1;
      var nx=-dy/len,ny=dx/len;
      var sign=ny>0?-1:1;
      return[mx+nx*len*r.arc*sign,my+ny*len*r.arc*sign];
    });

    projLand=LAND.map(function(p){return p.map(function(q){return proj(q[0],q[1]);});});

    landDots=[];
    var S=8;
    for(var y=S/2;y<H;y+=S)
      for(var x=S/2;x<W;x+=S)
        for(var k=0;k<projLand.length;k++)
          if(pip(x,y,projLand[k])){landDots.push(x,y);break;}

    buildStatic();

    /* Trigger hero text entrance animation */
    var hero=document.querySelector('.hero');
    if(hero) hero.classList.add('ready');
  }

  function buildStatic(){
    staticCvs=document.createElement('canvas');
    staticCvs.width=W; staticCvs.height=H;
    var sc=staticCvs.getContext('2d');

    /* Land dots — single batched path */
    sc.fillStyle='rgba(160,150,136,0.07)';
    sc.beginPath();
    for(var i=0;i<landDots.length;i+=2){
      sc.moveTo(landDots[i]+1,landDots[i+1]);
      sc.arc(landDots[i],landDots[i+1],1,0,Math.PI*2);
    }
    sc.fill();

    /* Subtle radial vignette at edges only — NOT in the center/text area */
    var vg=sc.createRadialGradient(W/2,H/2,H*0.22,W/2,H/2,W*0.7);
    vg.addColorStop(0,'rgba(9,9,9,0)');
    vg.addColorStop(0.75,'rgba(9,9,9,0.05)');
    vg.addColorStop(1,'rgba(9,9,9,0.92)');
    sc.fillStyle=vg;sc.fillRect(0,0,W,H);

    /* Left/right fade */
    var lf=sc.createLinearGradient(0,0,W*0.12,0);
    lf.addColorStop(0,'rgba(9,9,9,0.9)');lf.addColorStop(1,'rgba(9,9,9,0)');
    sc.fillStyle=lf;sc.fillRect(0,0,W*0.12,H);
    var rf=sc.createLinearGradient(W*0.88,0,W,0);
    rf.addColorStop(0,'rgba(9,9,9,0)');rf.addColorStop(1,'rgba(9,9,9,0.9)');
    sc.fillStyle=rf;sc.fillRect(W*0.88,0,W*0.12,H);

    /* City nodes */
    for(var j=0;j<CITIES.length;j++){
      var cx=cityPx[j][0],cy=cityPx[j][1];
      var g=sc.createRadialGradient(cx,cy,0,cx,cy,16);
      g.addColorStop(0,'rgba(195,182,162,0.13)');
      g.addColorStop(1,'rgba(195,182,162,0)');
      sc.fillStyle=g;sc.beginPath();sc.arc(cx,cy,16,0,Math.PI*2);sc.fill();
      sc.fillStyle='rgba(195,182,162,0.52)';
      sc.beginPath();sc.arc(cx,cy,2,0,Math.PI*2);sc.fill();
      sc.save();
      sc.font='600 9px Archivo,sans-serif';
      if('letterSpacing' in sc)sc.letterSpacing='0.14em';
      sc.fillStyle='rgba(185,172,152,0.3)';
      sc.textAlign='center';
      sc.fillText(CITIES[j].id,cx,cy-11);
      sc.restore();
    }
  }

  function launch(now){
    sweeps.push({ri:nextRoute++%ROUTES.length,born:now,dur:14000+Math.random()*7000});
    lastLaunch=now;
  }

  function frame(now){
    requestAnimationFrame(frame);
    if(!staticCvs)return;
    pX+=((mX-W/2)*0.0025-pX)*0.04;
    pY+=((mY-H/2)*0.0015-pY)*0.04;
    ctx.clearRect(0,0,W,H);
    ctx.drawImage(staticCvs,Math.round(pX),Math.round(pY));
    if(now-lastLaunch>IVTL&&sweeps.length<2)launch(now);
    for(var i=sweeps.length-1;i>=0;i--){
      var s=sweeps[i];
      var t=Math.min(1,(now-s.born)/s.dur);
      var r=ROUTES[s.ri];
      var pt=bez(cityPx[r.a][0],cityPx[r.a][1],
                 cityPx[r.b][0],cityPx[r.b][1],
                 routeCtrl[s.ri][0],routeCtrl[s.ri][1],t);
      var sx=pt[0]+pX,sy=pt[1]+pY;
      var ft=t<0.07?t/0.07:t>0.93?(1-t)/0.07:1;
      var al=ft*0.10;
      var grd=ctx.createRadialGradient(sx,sy,0,sx,sy,44);
      grd.addColorStop(0,'rgba(215,200,178,'+al+')');
      grd.addColorStop(0.4,'rgba(190,175,155,'+(al*0.3)+')');
      grd.addColorStop(1,'rgba(9,9,9,0)');
      ctx.fillStyle=grd;ctx.beginPath();ctx.arc(sx,sy,44,0,Math.PI*2);ctx.fill();
      if(t>=1)sweeps.splice(i,1);
    }
  }

  var rsz;
  window.addEventListener('resize',function(){
    clearTimeout(rsz);rsz=setTimeout(function(){sweeps=[];setup();},250);
  },{passive:true});
  window.addEventListener('mousemove',function(e){mX=e.clientX;mY=e.clientY;},{passive:true});

  /* Wait for fonts + layout to settle, THEN init */
  if(document.fonts&&document.fonts.ready){
    document.fonts.ready.then(function(){setTimeout(setup,50);});
  } else {
    window.addEventListener('load',function(){setTimeout(setup,100);});
  }

  /* Start render loop immediately (shows nothing until setup completes) */
  requestAnimationFrame(frame);

})();
