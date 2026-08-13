const W = 900;
const H = 1120;
const PAPER = [224, 219, 208];
const RAIN = [139, 103, 76];
const GROUND_Y = 906;
const RAIN_TOP = 408;
const RAIN_BOTTOM = GROUND_Y - 10;
const FRAME_MODE = window.RAIN_PRESENTATION_MODE === "frame";
const RAINBOW_COLORS = [
  [181, 82, 62],
  [201, 139, 67],
  [154, 148, 83],
  [91, 133, 133],
  [127, 107, 138]
];

let paperLayer;
let rainStreaks = [];
let roundDrops = [];
let grassBlades = [];
let flowers = [];
let raining = true;
let rainPresence = 1;
let rippleStrength = 1;
let rainbowProgress = 0;
let cloudPresence = 1;
let clearSkyHold = 0;

function setup() {
  const canvas = createCanvas(W, H);
  canvas.parent("sketch-holder");
  canvas.attribute(
    "aria-label",
    "A borderless white cloud above a calm moving column of warm rain."
  );
  pixelDensity(2);
  frameRate(60);
  randomSeed(6839);
  noiseSeed(6839);
  strokeCap(ROUND);

  if (!FRAME_MODE) buildPaper();
  randomSeed(6839);
  buildRain();
  randomSeed(9051);
  buildGroundGrowth();
}

function draw() {
  if (FRAME_MODE) {
    clear();
  } else {
    image(paperLayer, 0, 0, W, H);
  }

  updateCloud();
  updateRainbow();
  drawRainbow();
  drawGroundGrowth();
  drawMovingRain();
  drawRainPool();
  if (!FRAME_MODE) drawCloud();
}

function buildPaper() {
  paperLayer = createGraphics(W, H);
  paperLayer.pixelDensity(1);
  paperLayer.background(...PAPER);
  paperLayer.noStroke();

  for (let i = 0; i < 12500; i++) {
    const warm = random() > 0.7;
    paperLayer.fill(
      warm ? 126 : 60,
      warm ? 103 : 59,
      warm ? 72 : 54,
      random(2, 8)
    );
    paperLayer.circle(random(W), random(H), random(0.28, 1.2));
  }

  paperLayer.stroke(78, 68, 53, 4);
  paperLayer.strokeWeight(0.55);
  for (let y = 11; y < H; y += 18) {
    paperLayer.line(0, y, W, y + 0.35);
  }
}

function buildGroundGrowth() {
  grassBlades = [];
  for (let i = 0; i < 58; i++) {
    grassBlades.push({
      x:
        lerp(245, 655, i / 57) +
        random(-3.5, 3.5),
      y: 800 + random(-2, 3),
      height: random(21, 49),
      lean: random(-5, 5),
      phase: random(TWO_PI),
      frequency: random(0.55, 1.12),
      amplitude: random(0.65, 2.35),
      windResponse: random(0.35, 1.05),
      stiffness: random(0.78, 1.24),
      weight: random(1.8, 2.8)
    });
  }

  flowers = [
    {
      x: 278, y: 800, height: 33, phase: 0.4,
      frequency: 0.68, amplitude: 1.7, windResponse: 0.55
    },
    {
      x: 326, y: 800, height: 25, phase: 2.1,
      frequency: 0.91, amplitude: 1.1, windResponse: 0.82
    },
    {
      x: 426, y: 800, height: 29, phase: 2.9,
      frequency: 0.76, amplitude: 1.55, windResponse: 0.64
    },
    {
      x: 474, y: 800, height: 24, phase: 3.6,
      frequency: 1.08, amplitude: 1.2, windResponse: 0.88
    },
    {
      x: 576, y: 800, height: 28, phase: 4.2,
      frequency: 0.59, amplitude: 2.1, windResponse: 0.46
    },
    {
      x: 626, y: 800, height: 35, phase: 5.4,
      frequency: 1.04, amplitude: 1.35, windResponse: 0.72
    }
  ];
}

function buildRain() {
  rainStreaks = Array.from({ length: 58 }, () => {
    const depth = random();
    return {
      depth,
      x: random(335, 565),
      y: random(RAIN_TOP, RAIN_BOTTOM),
      length: lerp(14, 96, pow(depth, 1.35)),
      alpha: lerp(36, 132, depth),
      weight: lerp(2.3, 4.6, depth),
      lean: lerp(-1.4, 0.15, depth),
      speed: lerp(1.45, 4.15, pow(depth, 1.2)),
      active: true
    };
  });

  roundDrops = Array.from({ length: 19 }, () => {
    const depth = random();
    return {
      depth,
      x: random(348, 552),
      y: random(470, RAIN_BOTTOM),
      size: lerp(2.8, 7.5, depth),
      alpha: lerp(50, 115, depth),
      speed: lerp(1.1, 3.35, depth),
      active: true
    };
  });
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
      if (raining) {
        resetStreak(drop);
      } else {
        drop.active = false;
      }
    }
  }

  noStroke();
  for (const drop of roundDrops) {
    if (!drop.active) continue;

    if (drop.y >= RAIN_TOP) {
      visibleDrops++;
      fill(158, 120, 91, drop.alpha);
      circle(drop.x, drop.y, drop.size);
    }

    drop.y += drop.speed;
    if (drop.y > RAIN_BOTTOM) {
      if (raining) {
        resetRoundDrop(drop);
      } else {
        drop.active = false;
      }
    }
  }

  rainPresence = visibleDrops / (rainStreaks.length + roundDrops.length);
  const rippleTarget = raining
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
  const rippleTime = millis() / 3600;
  for (let i = 0; i < 3; i++) {
    const phase = (rippleTime + i / 3) % 1;
    const expansion = 1 - pow(1 - phase, 2);
    const rippleWidth = lerp(118, 350, expansion);
    const rippleHeight = lerp(8, 31, expansion);
    const rippleAlpha =
      78 * pow(1 - phase, 1.55) * rippleStrength;

    stroke(RAIN[0], RAIN[1], RAIN[2], rippleAlpha);
    strokeWeight(lerp(3.8, 1.6, phase));
    ellipse(450, GROUND_Y + 6, rippleWidth, rippleHeight);
  }

}

function updateRainbow() {
  const weatherHasCleared = !raining && rainPresence < 0.22;
  clearSkyHold = weatherHasCleared ? clearSkyHold + 1 : 0;
  const target = clearSkyHold > 4 ? 1 : 0;
  const easing = target > rainbowProgress ? 0.013 : 0.035;
  rainbowProgress = lerp(rainbowProgress, target, easing);

  if (abs(target - rainbowProgress) < 0.0005) {
    rainbowProgress = target;
  }
}

function updateCloud() {
  const target = raining ? 1 : 0;
  const easing = target > cloudPresence ? 0.025 : 0.015;
  cloudPresence = lerp(cloudPresence, target, easing);

  if (abs(target - cloudPresence) < 0.0005) {
    cloudPresence = target;
  }

  if (typeof window.rainCloudOpacityChanged === "function") {
    window.rainCloudOpacityChanged(cloudPresence);
  }
}

function drawGroundGrowth() {
  // The ground wakes more quickly than the rainbow: it reaches full height
  // while the arch is still calmly completing its reveal.
  const rawGrowth = constrain(rainbowProgress / 0.62, 0, 1);
  if (rawGrowth <= 0) return;

  const growth = rawGrowth * rawGrowth * (3 - 2 * rawGrowth);
  const time = millis() * 0.00135;
  const sharedWind =
    sin(time * 0.82) * 2.6 +
    sin(time * 0.31 + 0.8) * 1.1;

  push();
  noFill();
  strokeCap(ROUND);

  for (const blade of grassBlades) {
    const height = blade.height * growth;
    const sway =
      (
        sharedWind * blade.windResponse +
        sin(time * blade.frequency + blade.phase) * blade.amplitude +
        sin(time * 0.37 + blade.phase * 0.8) * 0.55
      ) *
      (blade.height / 49);
    const tipX = blade.x + blade.lean + sway;
    const tipY = blade.y - height;

    stroke(154, 148, 83, 152 * growth);
    strokeWeight(blade.weight);
    bezier(
      blade.x,
      blade.y,
      blade.x +
        blade.lean * 0.25 +
        sway * 0.12 * blade.stiffness,
      blade.y - height * 0.35,
      tipX - sway * 0.3 * blade.stiffness,
      blade.y - height * 0.78,
      tipX,
      tipY
    );
  }

  const flowerRaw = constrain(rainbowProgress / 0.68, 0, 1);
  const flowerGrowth =
    flowerRaw * flowerRaw * (3 - 2 * flowerRaw);

  for (const flower of flowers) {
    const height = flower.height * flowerGrowth;
    const sway =
      sharedWind * flower.windResponse +
      sin(time * flower.frequency + flower.phase) * flower.amplitude;
    const topX = flower.x + sway;
    const topY = flower.y - height;

    stroke(154, 148, 83, 160 * flowerGrowth);
    strokeWeight(2.4);
    noFill();
    bezier(
      flower.x,
      flower.y,
      flower.x - 2,
      flower.y - height * 0.35,
      topX + 2,
      flower.y - height * 0.75,
      topX,
      topY
    );

    noStroke();
    fill(181, 82, 62, 160 * flowerGrowth);
    circle(topX - 3.2, topY, 6.5);
    circle(topX + 3.2, topY, 6.5);
    circle(topX, topY - 3.2, 6.5);
    circle(topX, topY + 3.2, 6.5);
    fill(112, 88, 64, 180 * flowerGrowth);
    circle(topX, topY, 3.4);
  }

  pop();
}

function drawRainbow() {
  if (rainbowProgress < 0.003) return;

  const reveal =
    rainbowProgress * rainbowProgress * (3 - 2 * rainbowProgress);
  const context = drawingContext;
  const centerX = 450;
  const shoulderY = 535;
  const footY = 595;
  const bandWeight = 18;
  const legEndY = footY;

  for (let i = 0; i < RAINBOW_COLORS.length; i++) {
    const delay = i * 0.035;
    const localProgress = constrain(
      (reveal - delay) / (1 - delay),
      0,
      1
    );
    if (localProgress <= 0) continue;

    const fan =
      localProgress *
      localProgress *
      (3 - 2 * localProgress);
    const radius = 185 - i * bandWeight;
    const halfPathLength =
      (PI * radius) / 2 + (legEndY - shoulderY);
    const [red, green, blue] = RAINBOW_COLORS[i];

    context.save();
    context.globalAlpha = (168 / 255) * localProgress;
    context.strokeStyle = `rgb(${red}, ${green}, ${blue})`;
    context.lineWidth = bandWeight;
    context.lineCap = "butt";
    context.lineJoin = "round";
    context.setLineDash([
      halfPathLength * fan,
      halfPathLength * 2
    ]);

    context.beginPath();
    context.moveTo(centerX, shoulderY - radius);
    context.arc(
      centerX,
      shoulderY,
      radius,
      -HALF_PI,
      -PI,
      true
    );
    context.lineTo(centerX - radius, legEndY);
    context.stroke();

    context.beginPath();
    context.moveTo(centerX, shoulderY - radius);
    context.arc(
      centerX,
      shoulderY,
      radius,
      -HALF_PI,
      0,
      false
    );
    context.lineTo(centerX + radius, legEndY);
    context.stroke();

    context.restore();
  }
}

function toggleRain() {
  raining = !raining;

  if (raining) {
    for (const drop of rainStreaks) {
      if (!drop.active) {
        drop.active = true;
        drop.x = random(335, 565);
        drop.y = RAIN_TOP - random(0, 270);
      }
    }

    for (const drop of roundDrops) {
      if (!drop.active) {
        drop.active = true;
        drop.x = random(348, 552);
        drop.y = RAIN_TOP - random(0, 230);
      }
    }
  }

  if (typeof window.rainInteractionChanged === "function") {
    window.rainInteractionChanged(raining);
  }
}

function resetRainScene() {
  raining = true;
  rainPresence = 1;
  rippleStrength = 1;
  rainbowProgress = 0;
  cloudPresence = 1;
  clearSkyHold = 0;
  for (const drop of rainStreaks) {
    drop.active = true;
    drop.x = random(335, 565);
    drop.y = random(RAIN_TOP, RAIN_BOTTOM);
  }
  for (const drop of roundDrops) {
    drop.active = true;
    drop.x = random(348, 552);
    drop.y = random(RAIN_TOP, RAIN_BOTTOM);
  }
  if (typeof window.rainCloudOpacityChanged === "function") {
    window.rainCloudOpacityChanged(1);
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

window.rainToggle = toggleRain;
window.rainIsActive = () => raining;
window.rainResetScene = resetRainScene;

function drawCloud() {
  if (cloudPresence < 0.003) return;

  const context = drawingContext;

  context.save();
  context.fillStyle =
    `rgba(248, 247, 241, ${cloudPresence})`;
  traceCloudPath(context);
  context.fill();
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
