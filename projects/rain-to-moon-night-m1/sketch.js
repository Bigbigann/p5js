const W = 900;
const H = 1120;
const GROUND_Y = 840;
const RAIN_GROUND_Y = 906;
const RAIN_TOP = 408;
const RAIN_BOTTOM = RAIN_GROUND_Y - 10;
const MOON_X = 450;
const MOON_Y = 430;
const NIGHT_TOP = [7, 10, 23];
const NIGHT_MIDDLE = [14, 22, 45];
const NIGHT_BOTTOM = [7, 13, 28];
const RAIN = [198, 218, 242];
const FRAME_MODE = window.RAIN_PRESENTATION_MODE === "frame";

let nightLayer;
let moonGlowLayer;
let moonShapeLayer;
let rainStreaks = [];
let roundDrops = [];
let grassBlades = [];
let fireflies = [];
let celestialDust = [];
let raining = true;
let rainPresence = 1;
let rippleStrength = 1;
let revealProgress = 0;
let cloudPresence = 1;
let clearSkyHold = 0;
let rainRestartPending = false;
let moonReturnProgress = 1;

function setup() {
  const canvas = createCanvas(W, H);
  canvas.parent("sketch-holder");
  canvas.attribute(
    "aria-label",
    "Silver rain falling from a blue night cloud. Click to reveal a glowing full moon, swaying grass, and drifting golden fireflies."
  );
  pixelDensity(2);
  frameRate(60);
  randomSeed(6844);
  noiseSeed(6844);
  strokeCap(ROUND);

  buildNightLayer();
  buildMoonLayers();
  randomSeed(6844);
  buildRain();
  randomSeed(4182);
  buildGrass();
  randomSeed(7719);
  buildFireflies();
  randomSeed(9271);
  buildCelestialDust();
}

function draw() {
  if (FRAME_MODE) {
    clear();
  } else {
    image(nightLayer, 0, 0, W, H);
    drawNightVeil();
  }

  updateReveal();
  updateMoonReturn();
  updateCloud();
  updateFireflies();
  updateCelestialDust();

  drawMoonlightVeil();
  drawMoon();
  drawCelestialDust();
  drawMoonReflection();
  drawGrass();
  drawFireflies();
  drawMovingRain();
  drawRainPool();
  drawCloud();
}

function buildNightLayer() {
  nightLayer = createGraphics(W, H);
  nightLayer.pixelDensity(1);
  const context = nightLayer.drawingContext;
  const gradient = context.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, `rgb(${NIGHT_TOP.join(",")})`);
  gradient.addColorStop(0.5, `rgb(${NIGHT_MIDDLE.join(",")})`);
  gradient.addColorStop(1, `rgb(${NIGHT_BOTTOM.join(",")})`);
  context.fillStyle = gradient;
  context.fillRect(0, 0, W, H);

  nightLayer.noStroke();
  for (let i = 0; i < 5200; i++) {
    const blue = random() > 0.45;
    nightLayer.fill(
      blue ? 99 : 54,
      blue ? 117 : 66,
      blue ? 153 : 102,
      random(1.2, 5.2)
    );
    nightLayer.circle(random(W), random(H), random(0.25, 1.2));
  }

  for (let i = 0; i < 76; i++) {
    const y = random(42, 780);
    const strength = map(y, 42, 780, 20, 5);
    nightLayer.fill(184, 201, 223, random(2, strength));
    nightLayer.circle(random(45, W - 45), y, random(0.4, 1.5));
  }
}

function drawNightVeil() {
  const context = drawingContext;
  const time = millis() * 0.00008;
  const drift = sin(time) * 60;
  const gradient = context.createRadialGradient(
    450 + drift,
    620,
    20,
    450 + drift,
    620,
    520
  );
  gradient.addColorStop(0, "rgba(36, 48, 82, 0.10)");
  gradient.addColorStop(0.55, "rgba(17, 27, 55, 0.035)");
  gradient.addColorStop(1, "rgba(2, 5, 15, 0)");
  context.save();
  context.fillStyle = gradient;
  context.fillRect(0, 0, W, H);
  context.restore();
}

function buildMoonLayers() {
  const cx = MOON_X;
  const cy = MOON_Y;
  const radius = 72;

  moonGlowLayer = createGraphics(W, H);
  moonGlowLayer.pixelDensity(1);
  let context = moonGlowLayer.drawingContext;
  const glow = context.createRadialGradient(cx - 12, cy, 4, cx, cy, 235);
  glow.addColorStop(0, "rgba(255, 249, 213, 0.54)");
  glow.addColorStop(0.14, "rgba(255, 238, 179, 0.34)");
  glow.addColorStop(0.36, "rgba(246, 221, 151, 0.17)");
  glow.addColorStop(0.68, "rgba(225, 199, 127, 0.055)");
  glow.addColorStop(1, "rgba(218, 185, 104, 0)");
  context.fillStyle = glow;
  context.fillRect(cx - 250, cy - 250, 500, 500);

  moonShapeLayer = createGraphics(W, H);
  moonShapeLayer.pixelDensity(1);
  context = moonShapeLayer.drawingContext;
  context.save();
  const surface = context.createRadialGradient(
    cx - 22,
    cy - 25,
    4,
    cx,
    cy,
    radius * 1.15
  );
  surface.addColorStop(0, "rgb(255, 249, 224)");
  surface.addColorStop(0.56, "rgb(248, 235, 188)");
  surface.addColorStop(1, "rgb(222, 198, 136)");
  context.fillStyle = surface;
  context.shadowColor = "rgba(255, 231, 150, 0.72)";
  context.shadowBlur = 18;
  context.beginPath();
  context.arc(cx, cy, radius, 0, TWO_PI);
  context.fill();
  context.restore();
}

function buildRain() {
  rainStreaks = Array.from({ length: 58 }, () => {
    const depth = random();
    return {
      depth,
      x: random(335, 565),
      y: random(RAIN_TOP, RAIN_BOTTOM),
      length: lerp(15, 98, pow(depth, 1.32)),
      alpha: lerp(50, 176, depth),
      weight: lerp(1.8, 4.1, depth),
      lean: lerp(-1.1, 0.2, depth),
      speed: lerp(1.4, 4.1, pow(depth, 1.2)),
      active: true
    };
  });

  roundDrops = Array.from({ length: 18 }, () => {
    const depth = random();
    return {
      depth,
      x: random(348, 552),
      y: random(470, RAIN_BOTTOM),
      size: lerp(2.2, 6.2, depth),
      alpha: lerp(62, 168, depth),
      speed: lerp(1.05, 3.2, depth),
      active: true
    };
  });
}

function buildGrass() {
  grassBlades = [];
  for (let layer = 0; layer < 3; layer++) {
    const count = [32, 40, 46][layer];
    for (let i = 0; i < count; i++) {
      const depth = map(layer, 0, 2, 0.25, 1);
      grassBlades.push({
        layer,
        depth,
        x: lerp(150, 750, i / (count - 1)) + random(-5.5, 5.5),
        y: GROUND_Y + lerp(-4, 15, layer) + random(-3, 3),
        height: random(26, 58) * lerp(0.75, 1.35, depth),
        lean: random(-8, 8),
        phase: random(TWO_PI),
        frequency: random(0.42, 1.08),
        amplitude: random(0.8, 3.3),
        windResponse: random(0.35, 1.15),
        stiffness: random(0.7, 1.28),
        weight: random(1.1, 2.55) * lerp(0.88, 1.18, depth)
      });
    }
  }
}

function buildFireflies() {
  fireflies = Array.from({ length: 31 }, () => {
    const depth = random();
    return {
      x: random(230, 670),
      y: random(GROUND_Y - 175, GROUND_Y - 30),
      vx: random(-0.12, 0.12),
      vy: random(-0.07, 0.07),
      depth,
      size: lerp(0.9, 3.2, pow(depth, 1.25)),
      glow: lerp(7, 18, depth),
      phase: random(TWO_PI),
      wander: random(0.0012, 0.0034),
      pulse: random(0.55, 1.15),
      trail: []
    };
  });
}

function buildCelestialDust() {
  celestialDust = Array.from({ length: 38 }, () => {
    const depth = random();
    return {
      x: random(285, 615),
      y: random(MOON_Y + 78, GROUND_Y - 78),
      depth,
      size: lerp(0.45, 1.45, pow(depth, 1.5)),
      glow: lerp(3.5, 9.5, depth),
      speed: random(0.018, 0.055),
      phase: random(TWO_PI),
      drift: random(4, 14),
      alpha: random(0.18, 0.62)
    };
  });
}

function updateReveal() {
  const weatherHasCleared = !raining && rainPresence < 0.22;
  clearSkyHold = weatherHasCleared ? clearSkyHold + 1 : 0;
  const target = clearSkyHold > 4 ? 1 : 0;
  const easing = target > revealProgress ? 0.013 : 0.034;
  revealProgress = lerp(revealProgress, target, easing);
  if (abs(target - revealProgress) < 0.0005) revealProgress = target;
}

function updateCloud() {
  const moonIsNearlyGone = moonReturnProgress > 0.995;
  const target = raining && moonIsNearlyGone ? 1 : 0;
  const easing = target > cloudPresence ? 0.025 : 0.019;
  cloudPresence = lerp(cloudPresence, target, easing);
  if (abs(target - cloudPresence) < 0.0005) cloudPresence = target;

  if (raining && rainRestartPending && cloudPresence > 0.3) {
    restartRainDrops();
    rainRestartPending = false;
  }
}

function updateMoonReturn() {
  if (raining) {
    moonReturnProgress = min(1, moonReturnProgress + 0.014);
  } else {
    moonReturnProgress = 0;
  }
}

function getMoonMotion() {
  if (raining) {
    const retreat = constrain(moonReturnProgress, 0, 1);
    return {
      motion: 1 - retreat,
      offsetY: -260 * retreat,
      reveal: 1 - retreat
    };
  }

  const motion = constrain((revealProgress - 0.015) / 0.78, 0, 1);
  const landingPoint = 0.7;
  let offsetY;

  if (motion < landingPoint) {
    const fall = motion / landingPoint;
    offsetY = lerp(-250, 0, pow(fall, 2.35));
  } else {
    const settle = (motion - landingPoint) / (1 - landingPoint);
    offsetY =
      sin(settle * PI * 2.4) *
      16 *
      pow(1 - settle, 2.2);
  }

  return {
    motion,
    offsetY,
    reveal: smoothStep(constrain(motion / 0.38, 0, 1))
  };
}

function drawMoonlightVeil() {
  if (revealProgress < 0.035) return;
  const { offsetY, reveal } = getMoonMotion();
  const breath = 0.97 + sin(millis() * 0.00072) * 0.03;
  const context = drawingContext;

  context.save();
  context.globalCompositeOperation = "screen";
  context.globalAlpha = reveal * 0.16 * breath;
  context.translate(MOON_X, MOON_Y + offsetY + 115);
  context.scale(0.72, 1.62);
  const veil = context.createRadialGradient(0, 0, 12, 0, 0, 285);
  veil.addColorStop(0, "rgba(255, 237, 181, 0.44)");
  veil.addColorStop(0.22, "rgba(229, 218, 184, 0.19)");
  veil.addColorStop(0.58, "rgba(163, 186, 224, 0.055)");
  veil.addColorStop(1, "rgba(128, 154, 202, 0)");
  context.fillStyle = veil;
  context.fillRect(-300, -300, 600, 600);
  context.restore();
}

function drawMoon() {
  if (revealProgress < 0.002) return;
  const { offsetY, reveal } = getMoonMotion();
  if (reveal < 0.002) return;
  const breath = 0.97 + sin(millis() * 0.00072) * 0.03;
  const context = drawingContext;
  push();
  translate(0, offsetY);
  noTint();
  context.save();
  context.globalAlpha = reveal * breath;
  image(moonGlowLayer, 0, 0, W, H);
  context.globalAlpha = reveal;
  image(moonShapeLayer, 0, 0, W, H);
  context.restore();
  pop();
}

function updateCelestialDust() {
  const time = millis() * 0.001;
  for (const mote of celestialDust) {
    mote.y -= mote.speed;
    if (mote.y < MOON_Y + 60) mote.y = GROUND_Y - random(55, 105);
    mote.renderX = mote.x + sin(time * 0.16 + mote.phase) * mote.drift;
  }
}

function drawCelestialDust() {
  const rawVisibility = constrain((revealProgress - 0.13) / 0.7, 0, 1);
  if (rawVisibility <= 0) return;
  const visibility = smoothStep(rawVisibility);
  const time = millis() * 0.001;
  const context = drawingContext;

  context.save();
  context.globalCompositeOperation = "screen";
  for (const mote of celestialDust) {
    const pulse = map(sin(time * 0.34 + mote.phase), -1, 1, 0.42, 1);
    const alpha = visibility * mote.alpha * pulse;
    const radius = mote.glow * (0.9 + pulse * 0.12);
    const x = mote.renderX ?? mote.x;
    const glow = context.createRadialGradient(x, mote.y, 0, x, mote.y, radius);
    glow.addColorStop(0, `rgba(255, 250, 225, ${alpha})`);
    glow.addColorStop(0.16, `rgba(236, 236, 229, ${alpha * 0.42})`);
    glow.addColorStop(0.52, `rgba(183, 202, 232, ${alpha * 0.09})`);
    glow.addColorStop(1, "rgba(164, 190, 228, 0)");
    context.fillStyle = glow;
    context.fillRect(x - radius, mote.y - radius, radius * 2, radius * 2);
  }
  context.restore();
}

function drawMoonReflection() {
  const rawVisibility = constrain((revealProgress - 0.31) / 0.55, 0, 1);
  if (rawVisibility <= 0) return;
  const visibility = smoothStep(rawVisibility) * (1 - rippleStrength * 0.72);
  const shimmer = millis() * 0.00034;
  const context = drawingContext;

  context.save();
  context.globalCompositeOperation = "screen";
  context.lineCap = "round";
  for (let i = 0; i < 8; i++) {
    const y = RAIN_GROUND_Y - 17 + i * 5.5;
    const width = 18 + sin(i * 1.87 + shimmer) * 7 + i * 2.2;
    const offset = sin(i * 2.41 + shimmer * 1.4) * 8;
    const alpha = visibility * (0.09 + (i % 3) * 0.035);
    const gradient = context.createLinearGradient(
      MOON_X - width,
      y,
      MOON_X + width,
      y
    );
    gradient.addColorStop(0, "rgba(247, 232, 184, 0)");
    gradient.addColorStop(0.32, `rgba(247, 232, 184, ${alpha})`);
    gradient.addColorStop(0.68, `rgba(231, 224, 196, ${alpha * 0.78})`);
    gradient.addColorStop(1, "rgba(231, 224, 196, 0)");
    context.strokeStyle = gradient;
    context.lineWidth = i % 3 === 0 ? 1.2 : 0.7;
    context.beginPath();
    context.moveTo(MOON_X + offset - width, y);
    context.lineTo(MOON_X + offset + width, y);
    context.stroke();
  }
  context.restore();
}

function drawGrass() {
  const rawGrowth = constrain(revealProgress / 0.58, 0, 1);
  if (rawGrowth <= 0) return;
  const growth = smoothStep(rawGrowth);
  const time = millis() * 0.00115;
  const sharedWind =
    sin(time * 0.72) * 3.4 +
    sin(time * 0.29 + 1.1) * 1.5;

  push();
  noFill();
  strokeCap(ROUND);
  for (const blade of grassBlades) {
    const height = blade.height * growth;
    const sway =
      (
        sharedWind * blade.windResponse +
        sin(time * blade.frequency + blade.phase) * blade.amplitude +
        sin(time * 0.31 + blade.phase * 0.7) * 0.8
      ) *
      (blade.height / 72);
    const tipX = blade.x + blade.lean + sway;
    const tipY = blade.y - height;
    const depthAlpha = [18, 35, 62][blade.layer];
    const moonDistance = dist(tipX, tipY, MOON_X, MOON_Y);
    const moonInfluence =
      1 - constrain((moonDistance - 330) / 180, 0, 1);
    const grassAlpha =
      depthAlpha *
      lerp(0.65, 1.15, moonInfluence) *
      growth;

    stroke(198, 218, 242, grassAlpha);
    strokeWeight(blade.weight);
    bezier(
      blade.x,
      blade.y,
      blade.x + blade.lean * 0.24 + sway * 0.1 * blade.stiffness,
      blade.y - height * 0.34,
      tipX - sway * 0.32 * blade.stiffness,
      blade.y - height * 0.78,
      tipX,
      tipY
    );
  }
  pop();
}

function updateFireflies() {
  const visible = revealProgress > 0.08;
  const time = millis() * 0.001;

  for (const fly of fireflies) {
    const angle = noise(fly.phase, time * fly.wander * 1150) * TWO_PI * 2;
    fly.vx = lerp(fly.vx, cos(angle) * 0.17, 0.018);
    fly.vy = lerp(fly.vy, sin(angle) * 0.11, 0.018);
    fly.x += fly.vx + sin(time * 0.21 + fly.phase) * 0.035;
    fly.y += fly.vy + cos(time * 0.17 + fly.phase) * 0.022;

    if (fly.x < 205 || fly.x > 695) fly.vx *= -1;
    if (fly.y < GROUND_Y - 190 || fly.y > GROUND_Y - 18) fly.vy *= -1;
    fly.x = constrain(fly.x, 203, 697);
    fly.y = constrain(fly.y, GROUND_Y - 192, GROUND_Y - 16);

    if (visible) {
      fly.trail.unshift({ x: fly.x, y: fly.y });
      if (fly.trail.length > 13) fly.trail.pop();
    } else if (fly.trail.length) {
      fly.trail.pop();
    }
  }
}

function drawFireflies() {
  const rawVisibility = constrain((revealProgress - 0.12) / 0.72, 0, 1);
  if (rawVisibility <= 0) return;
  const visibility = smoothStep(rawVisibility);
  const time = millis() * 0.001;
  const context = drawingContext;

  context.save();
  context.globalCompositeOperation = "screen";
  for (const fly of fireflies) {
    const pulse = map(
      sin(time * fly.pulse + fly.phase),
      -1,
      1,
      0.42,
      1
    );
    const moonDistance = dist(fly.x, fly.y, MOON_X, MOON_Y);
    const moonInfluence =
      1 - constrain((moonDistance - 210) / 250, 0, 1);
    const brightness = lerp(0.66, 1.34, moonInfluence);
    const alpha = min(
      1,
      visibility * pulse * lerp(0.42, 1, fly.depth) * brightness
    );
    const color = [
      lerp(232, 255, moonInfluence),
      lerp(240, 226, moonInfluence),
      lerp(250, 148, moonInfluence)
    ];

    if (fly.trail.length > 2) {
      context.beginPath();
      context.moveTo(fly.trail[0].x, fly.trail[0].y);
      for (let i = 1; i < fly.trail.length; i++) {
        context.lineTo(fly.trail[i].x, fly.trail[i].y);
      }
      context.strokeStyle =
        `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha * 0.12})`;
      context.lineWidth = max(0.35, fly.size * 0.22);
      context.stroke();
    }

    const glowRadius =
      fly.glow *
      (0.86 + pulse * 0.22) *
      lerp(0.88, 1.2, moonInfluence);
    const glow = context.createRadialGradient(
      fly.x,
      fly.y,
      0,
      fly.x,
      fly.y,
      glowRadius
    );
    glow.addColorStop(
      0,
      `rgba(255, 249, 210, ${min(1, alpha * 1.35)})`
    );
    glow.addColorStop(
      0.12,
      `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha * 0.72})`
    );
    glow.addColorStop(
      0.42,
      `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha * 0.18})`
    );
    glow.addColorStop(1, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0)`);
    context.fillStyle = glow;
    context.fillRect(
      fly.x - glowRadius,
      fly.y - glowRadius,
      glowRadius * 2,
      glowRadius * 2
    );
  }
  context.restore();
}

function drawMovingRain() {
  let visibleDrops = 0;
  for (const drop of rainStreaks) {
    if (!drop.active) continue;
    if (drop.y >= RAIN_TOP) {
      visibleDrops++;
      stroke(RAIN[0], RAIN[1], RAIN[2], drop.alpha);
      strokeWeight(drop.weight);
      line(
        drop.x,
        drop.y,
        drop.x + drop.lean,
        min(RAIN_BOTTOM, drop.y + drop.length)
      );
    }
    drop.y += drop.speed;
    drop.x += (drop.lean / drop.length) * drop.speed;
    if (drop.y > RAIN_BOTTOM) {
      if (raining) resetStreak(drop);
      else drop.active = false;
    }
  }

  noStroke();
  for (const drop of roundDrops) {
    if (!drop.active) continue;
    if (drop.y >= RAIN_TOP) {
      visibleDrops++;
      fill(218, 232, 248, drop.alpha);
      circle(drop.x, drop.y, drop.size);
    }
    drop.y += drop.speed;
    if (drop.y > RAIN_BOTTOM) {
      if (raining) resetRoundDrop(drop);
      else drop.active = false;
    }
  }

  rainPresence = visibleDrops / (rainStreaks.length + roundDrops.length);
  const rainIsFlowing = raining && !rainRestartPending;
  const rippleTarget = rainIsFlowing
    ? max(0.22, rainPresence)
    : rainPresence;
  rippleStrength = lerp(rippleStrength, rippleTarget, 0.045);
}

function resetStreak(drop) {
  drop.x = random(335, 565);
  drop.y = RAIN_TOP;
}

function resetRoundDrop(drop) {
  drop.x = random(348, 552);
  drop.y = RAIN_TOP;
}

function drawRainPool() {
  if (rippleStrength < 0.008) return;
  noFill();
  const rippleTime = millis() / 3900;
  for (let i = 0; i < 3; i++) {
    const phase = (rippleTime + i / 3) % 1;
    const expansion = 1 - pow(1 - phase, 2);
    const rippleWidth = lerp(108, 346, expansion);
    const rippleHeight = lerp(7, 29, expansion);
    const rippleAlpha = 82 * pow(1 - phase, 1.65) * rippleStrength;
    stroke(205, 222, 242, rippleAlpha);
    strokeWeight(lerp(3.1, 1.1, phase));
    ellipse(450, RAIN_GROUND_Y + 6, rippleWidth, rippleHeight);
  }
}

function drawCloud() {
  if (cloudPresence < 0.003) return;
  const context = drawingContext;
  context.save();
  context.globalAlpha = cloudPresence;
  context.fillStyle = "rgba(72, 86, 119, 0.92)";
  context.shadowColor = "rgba(91, 116, 158, 0.20)";
  context.shadowBlur = 20;
  traceCloudPath(context);
  context.fill();

  context.globalAlpha = cloudPresence * 0.34;
  context.fillStyle = "rgba(148, 162, 190, 0.32)";
  context.shadowBlur = 0;
  context.save();
  context.translate(0, -3);
  traceCloudPath(context);
  context.fill();
  context.restore();
  context.restore();
}

function traceCloudPath(context) {
  const x = 266;
  const y = 178;
  const scale = 2;
  const px = (value) => x + value * scale;
  const py = (value) => y + value * scale;

  context.beginPath();
  context.moveTo(px(91.5), py(0));
  context.bezierCurveTo(px(103.809), py(0), px(114.612), py(6.35351), px(120.718), py(15.9141));
  context.bezierCurveTo(px(121.862), py(17.7053), px(124.102), py(18.5324), px(126.153), py(17.9752));
  context.bezierCurveTo(px(128.492), py(17.3398), px(130.955), py(17), px(133.5), py(17));
  context.bezierCurveTo(px(146.906), py(17), px(158.07), py(26.418), px(160.506), py(38.8826));
  context.bezierCurveTo(px(160.797), py(40.3742), px(161.775), py(41.6593), px(163.157), py(42.2926));
  context.bezierCurveTo(px(175.465), py(47.9345), px(184), py(60.2336), px(184), py(74.5));
  context.bezierCurveTo(px(184), py(94.1061), px(167.882), py(110), px(148), py(110));
  context.bezierCurveTo(px(137.057), py(110), px(127.256), py(105.184), px(120.654), py(97.5858));
  context.bezierCurveTo(px(118.939), py(95.6127), px(115.826), py(95.3357), px(113.792), py(96.978));
  context.bezierCurveTo(px(107.585), py(101.991), px(99.6493), py(105), px(91), py(105));
  context.bezierCurveTo(px(82.8023), py(105), px(75.245), py(102.298), px(69.1933), py(97.7474));
  context.bezierCurveTo(px(67.2198), py(96.2636), px(64.3383), py(96.5286), px(62.6666), py(98.3457));
  context.bezierCurveTo(px(56.0808), py(105.504), px(46.5735), py(110), px(36), py(110));
  context.bezierCurveTo(px(16.1177), py(110), px(0), py(94.1061), px(0), py(74.5));
  context.bezierCurveTo(px(0), py(59.3651), px(9.60519), py(46.4439), px(23.1318), py(41.3369));
  context.bezierCurveTo(px(24.4941), py(27.6752), px(36.2274), py(17), px(50.5), py(17));
  context.bezierCurveTo(px(52.7882), py(17), px(55.0111), py(17.2743), px(57.1365), py(17.7914));
  context.bezierCurveTo(px(59.1363), py(18.2778), px(61.2812), py(17.46), px(62.4), py(15.7326));
  context.bezierCurveTo(px(68.5261), py(6.27339), px(79.2689), py(0), px(91.5), py(0));
  context.closePath();
}

function toggleRain() {
  raining = !raining;
  if (raining) {
    moonReturnProgress = 0;
    rainRestartPending = true;
    for (const drop of rainStreaks) drop.active = false;
    for (const drop of roundDrops) drop.active = false;
  } else {
    rainRestartPending = false;
  }
  if (typeof window.rainInteractionChanged === "function") {
    window.rainInteractionChanged(raining);
  }
}

function restartRainDrops() {
  for (const drop of rainStreaks) {
    drop.active = true;
    drop.x = random(335, 565);
    drop.y = RAIN_TOP - random(0, 270);
  }
  for (const drop of roundDrops) {
    drop.active = true;
    drop.x = random(348, 552);
    drop.y = RAIN_TOP - random(0, 230);
  }
}

function resetRainScene() {
  raining = true;
  rainPresence = 1;
  rippleStrength = 1;
  revealProgress = 0;
  cloudPresence = 1;
  clearSkyHold = 0;
  rainRestartPending = false;
  moonReturnProgress = 1;
  restartRainDrops();
  for (const drop of rainStreaks) {
    drop.y = random(RAIN_TOP, RAIN_BOTTOM);
  }
  for (const drop of roundDrops) {
    drop.y = random(RAIN_TOP, RAIN_BOTTOM);
  }
  if (typeof window.rainInteractionChanged === "function") {
    window.rainInteractionChanged(true);
  }
}

function mousePressed() {
  if (
    !FRAME_MODE &&
    mouseX >= 0 &&
    mouseX <= width &&
    mouseY >= 0 &&
    mouseY <= height
  ) {
    toggleRain();
    return false;
  }
}

function smoothStep(value) {
  return value * value * (3 - 2 * value);
}

window.rainToggle = toggleRain;
window.rainIsActive = () => raining;
window.rainResetScene = resetRainScene;
