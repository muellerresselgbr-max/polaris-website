/* Polaris Concierge | hero-bg.js
   Cinematic dark world map: dotted continents + city nodes + ambient sweep
   No route lines drawn. Only a soft moving glow orb travels silently between cities.
*/
(function(){
  'use strict';

  var cvs = document.getElementById('heroBg');
  if (!cvs) return;
  var ctx = cvs.getContext('2d');

  /* ── Continent polygons [lon, lat] – simplified land outlines ── */
  var LAND = [
    /* North America */
    [[-168,72],[-140,75],[-115,78],[-90,72],[-65,72],[-55,62],[-60,46],
     [-75,45],[-80,30],[-85,25],[-95,18],[-105,22],[-120,32],[-125,45],[-140,55],[-160,60]],
    /* Greenland */
    [[-68,82],[-30,82],[-20,75],[-25,70],[-45,65],[-55,68],[-65,72]],
    /* South America */
    [[-80,12],[-68,12],[-60,8],[-50,0],[-40,-10],[-40,-22],
     [-50,-35],[-65,-55],[-70,-50],[-75,-35],[-80,-10]],
    /* Western Europe */
    [[-10,70],[-5,60],[0,50],[5,45],[15,45],[20,50],[30,60],[28,72],[15,78],[-5,78],[-15,75]],
    /* Scandinavia */
    [[5,57],[8,58],[15,70],[28,72],[30,68],[25,65],[20,55],[15,58]],
    /* British Isles */
    [[-6,50],[-3,54],[-5,58],[-3,60],[-1,58],[0,51]],
    /* Africa */
    [[-18,38],[-10,36],[10,38],[35,38],[42,12],[50,-12],[38,-30],
     [25,-35],[18,-28],[12,-18],[8,5],[0,5],[-18,15],[-18,32]],
    /* Middle East */
    [[26,38],[28,42],[38,36],[42,30],[40,18],[55,22],[60,24],[55,30],[45,38],[35,38]],
    /* Russia & North Asia */
    [[30,72],[60,72],[90,78],[120,72],[140,68],[145,55],[140,45],[130,40],
     [125,50],[120,58],[110,62],[100,65],[80,68],[60,68],[45,65],[35,68]],
    /* India */
    [[60,24],[68,24],[80,30],[88,22],[80,12],[75,8],[68,16]],
    /* SE Asia peninsula */
    [[95,22],[105,22],[110,18],[108,10],[105,5],[100,5],[95,10]],
    /* East Asia / China */
    [[80,40],[90,42],[100,48],[110,55],[120,48],[135,50],[145,45],[140,42],
     [132,34],[122,25],[110,18],[100,20],[90,28],[80,30],[70,38],[65,35]],
    /* Japan */
    [[130,31],[132,34],[136,36],[140,42],[143,44],[141,40]],
    /* Australia */
    [[114,-22],[118,-18],[130,-14],[138,-14],[145,-18],[152,-25],
     [148,-38],[138,-38],[130,-32],[116,-34]]
  ];

  /* ── Cities ── */
  var CITIES = [
    { id:'NYC', lon:-74.0, lat:40.7 },
    { id:'LON', lon:-0.1,  lat:51.5 },
    { id:'DXB', lon:55.3,  lat:25.2 },
    { id:'HKG', lon:114.1, lat:22.4 }
  ];

  /* ── Routes (city index a→b, arc curvature) ── */
  var ROUTES = [
    { a:0, b:1, arc:0.28 },   /* NYC → LON */
    { a:1, b:2, arc:0.22 },   /* LON → DXB */
    { a:2, b:3, arc:0.18 },   /* DXB → HKG */
    { a:1, b:3, arc:0.30 },   /* LON → HKG */
    { a:0, b:2, arc:0.34 }    /* NYC → DXB */
  ];

  var W = 1, H = 1;
  var projLand = [], landDots = [], cityPx = [], routeCtrl = [];
  var staticCvs = null;

  function proj(lon, lat) {
    return [ (lon + 180) / 360 * W, (90 - lat) / 180 * H ];
  }

  /* Point-in-polygon: ray casting */
  function pip(px, py, poly) {
    var inside = false, n = poly.length;
    for (var i = 0, j = n - 1; i < n; j = i++) {
      var xi = poly[i][0], yi = poly[i][1];
      var xj = poly[j][0], yj = poly[j][1];
      if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi)
        inside = !inside;
    }
    return inside;
  }

  /* Quadratic bezier at t */
  function bez(ax, ay, bx, by, cx, cy, t) {
    var u = 1 - t;
    return [ u*u*ax + 2*u*t*cx + t*t*bx,
             u*u*ay + 2*u*t*cy + t*t*by ];
  }

  /* ── Setup (called on load + resize) ── */
  function setup() {
    var hero = document.querySelector('.hero');
    W = cvs.width  = window.innerWidth;
    H = cvs.height = hero ? hero.offsetHeight : window.innerHeight;

    /* Project cities */
    cityPx = CITIES.map(function(c) { return proj(c.lon, c.lat); });

    /* Compute route bezier control points (arcing northward = great-circle approx) */
    routeCtrl = ROUTES.map(function(r) {
      var a = cityPx[r.a], b = cityPx[r.b];
      var mx = (a[0]+b[0])/2, my = (a[1]+b[1])/2;
      var dx = b[0]-a[0], dy = b[1]-a[1];
      var len = Math.sqrt(dx*dx + dy*dy) || 1;
      var nx = -dy/len, ny = dx/len;
      var sign = ny > 0 ? -1 : 1;
      var off = len * r.arc;
      return [ mx + nx*off*sign, my + ny*off*sign ];
    });

    /* Pre-project continent polygons */
    projLand = LAND.map(function(poly) {
      return poly.map(function(p) { return proj(p[0], p[1]); });
    });

    /* Build dot mask */
    landDots = [];
    var S = 7;
    for (var y = S/2; y < H; y += S) {
      for (var x = S/2; x < W; x += S) {
        for (var k = 0; k < projLand.length; k++) {
          if (pip(x, y, projLand[k])) { landDots.push(x, y); break; }
        }
      }
    }

    buildStatic();
  }

  /* ── Build offscreen static layer ── */
  function buildStatic() {
    staticCvs = document.createElement('canvas');
    staticCvs.width = W; staticCvs.height = H;
    var sc = staticCvs.getContext('2d');

    /* Land dots – batched into single path for performance */
    sc.fillStyle = 'rgba(145,135,120,0.082)';
    sc.beginPath();
    for (var i = 0; i < landDots.length; i += 2) {
      var dx = landDots[i], dy = landDots[i+1];
      sc.moveTo(dx + 1, dy);
      sc.arc(dx, dy, 1, 0, Math.PI*2);
    }
    sc.fill();

    /* Radial edge vignette – fades map into dark background at edges */
    var vg = sc.createRadialGradient(W/2, H*0.45, H*0.1, W/2, H*0.45, W*0.62);
    vg.addColorStop(0,    'rgba(9,9,9,0)');
    vg.addColorStop(0.6,  'rgba(9,9,9,0.05)');
    vg.addColorStop(1,    'rgba(9,9,9,0.97)');
    sc.fillStyle = vg; sc.fillRect(0, 0, W, H);

    /* Top linear fade */
    var tf = sc.createLinearGradient(0, 0, 0, H*0.16);
    tf.addColorStop(0, 'rgba(9,9,9,0.96)');
    tf.addColorStop(1, 'rgba(9,9,9,0)');
    sc.fillStyle = tf; sc.fillRect(0, 0, W, H*0.16);

    /* Bottom linear fade */
    var bf = sc.createLinearGradient(0, H*0.84, 0, H);
    bf.addColorStop(0, 'rgba(9,9,9,0)');
    bf.addColorStop(1, 'rgba(9,9,9,0.96)');
    sc.fillStyle = bf; sc.fillRect(0, H*0.84, W, H*0.16);

    /* City nodes */
    for (var j = 0; j < CITIES.length; j++) {
      var cx = cityPx[j][0], cy = cityPx[j][1];

      /* Soft ambient glow */
      var g = sc.createRadialGradient(cx, cy, 0, cx, cy, 18);
      g.addColorStop(0, 'rgba(185,172,155,0.1)');
      g.addColorStop(1, 'rgba(185,172,155,0)');
      sc.fillStyle = g;
      sc.beginPath(); sc.arc(cx, cy, 18, 0, Math.PI*2); sc.fill();

      /* Node dot */
      sc.fillStyle = 'rgba(185,172,155,0.44)';
      sc.beginPath(); sc.arc(cx, cy, 2.2, 0, Math.PI*2); sc.fill();

      /* Label */
      sc.save();
      sc.font = '600 9px Archivo, sans-serif';
      if ('letterSpacing' in sc) sc.letterSpacing = '0.14em';
      sc.fillStyle = 'rgba(175,162,144,0.26)';
      sc.textAlign = 'center';
      sc.fillText(CITIES[j].id, cx, cy - 12);
      sc.restore();
    }
  }

  /* ── Animation state ── */
  var sweeps = [], nextRoute = 0, lastLaunch = 0;
  var LAUNCH_INTERVAL = 4800; /* ms between new sweep launches */

  function launchSweep(now) {
    sweeps.push({
      ri:   nextRoute++ % ROUTES.length,
      born: now,
      dur:  13000 + Math.random() * 6000  /* 13–19 s per route */
    });
    lastLaunch = now;
  }

  /* Smooth parallax state */
  var mX = 0, mY = 0, pX = 0, pY = 0;

  /* ── Main animation frame ── */
  function frame(now) {
    requestAnimationFrame(frame);
    if (!staticCvs) return;

    /* Smooth parallax */
    pX += ((mX - W/2) * 0.0028 - pX) * 0.04;
    pY += ((mY - H/2) * 0.0018 - pY) * 0.04;

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(staticCvs, Math.round(pX), Math.round(pY));

    /* Launch new sweep if interval has passed and limit not reached */
    if (now - lastLaunch > LAUNCH_INTERVAL && sweeps.length < 2) launchSweep(now);

    /* Draw active sweeps */
    for (var i = sweeps.length - 1; i >= 0; i--) {
      var s = sweeps[i];
      var t = Math.min(1, (now - s.born) / s.dur);
      var r = ROUTES[s.ri];

      /* Position on bezier */
      var pt = bez(
        cityPx[r.a][0], cityPx[r.a][1],
        cityPx[r.b][0], cityPx[r.b][1],
        routeCtrl[s.ri][0], routeCtrl[s.ri][1],
        t
      );
      var sx = pt[0] + pX, sy = pt[1] + pY;

      /* Opacity envelope: ease in for first 7%, ease out for last 7% */
      var ft = t < 0.07 ? t / 0.07 : (t > 0.93 ? (1 - t) / 0.07 : 1);
      var alpha = ft * 0.11;

      /* Soft ambient glow – no hard edges, fades to transparent */
      var rad = 48;
      var grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, rad);
      grd.addColorStop(0,    'rgba(208,196,176,' + alpha + ')');
      grd.addColorStop(0.35, 'rgba(185,172,152,' + (alpha * 0.28) + ')');
      grd.addColorStop(1,    'rgba(9,9,9,0)');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(sx, sy, rad, 0, Math.PI*2); ctx.fill();

      if (t >= 1) sweeps.splice(i, 1);
    }
  }

  /* ── Resize handler ── */
  var rsz;
  window.addEventListener('resize', function() {
    clearTimeout(rsz);
    rsz = setTimeout(function() { sweeps = []; setup(); }, 250);
  }, { passive: true });

  /* ── Mouse parallax ── */
  window.addEventListener('mousemove', function(e) {
    mX = e.clientX; mY = e.clientY;
  }, { passive: true });

  /* ── Init ── */
  window.addEventListener('load', function() {
    setup();
    lastLaunch = -LAUNCH_INTERVAL;   /* trigger first sweep immediately */
    requestAnimationFrame(frame);
  });

})();
