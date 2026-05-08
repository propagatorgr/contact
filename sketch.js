const g = 10;
const scale = 100;
const dt = 0.02;

const m1 = 1.0;
const m2 = 0.5;

const naturalLength = 1.8;

const H1 = 40;
const H2 = 32;

let omega, k, A;
let t = 0;
let phase = 1;      // 1: μαζί, 2: μετά αποκόλληση
let paused = false;

let floorY;
let naturalY, eqY12, eqY1;
let y1, y2, yPrev;

let tDetach, yDetach, vDetach;
let canDetach = false;

let ASlider, omegaSlider;
let resetButton, continueButton;

function setup() {
  createCanvas(900, 600);
  floorY = height - 40;

  ASlider = createSlider(0.05, 0.8, 0.25, 0.01);
  ASlider.position(20, 50);
  ASlider.style("width", "220px");

  omegaSlider = createSlider(1, 6, 3, 0.1);
  omegaSlider.position(20, 100);
  omegaSlider.style("width", "220px");

  resetButton = createButton("Reset");
  resetButton.position(20, 140);
  resetButton.mousePressed(resetSimulation);

  continueButton = createButton("Συνέχεια");
  continueButton.position(20, 180);
  continueButton.mousePressed(continueMotion);
  continueButton.hide();

  resetSimulation();
}

function resetSimulation() {
  let w = omegaSlider.value();
  let Amax = 0.8 * g / (w * w);
  Amax = constrain(Amax, 0.05, 0.8);
  ASlider.value(Amax);

  t = 0;
  phase = 1;
  paused = false;
  yPrev = null;
  continueButton.hide();
}

function computePhysics() {
  omega = omegaSlider.value();
  A = ASlider.value() * scale;

  k = omega * omega * (m1 + m2);

  naturalY = floorY - naturalLength * scale;
  const dL12 = (m1 + m2) * g / k;
  eqY12 = naturalY + dL12 * scale;
  const dL1 = m1 * g / k;
  eqY1 = naturalY + dL1 * scale;

  canDetach = omega * omega * (A / scale) > g;
}

function draw() {
  background(15);
  computePhysics();

  drawStatusMessages();
  drawReferenceLines();

  if (!paused) {
    if (phase === 1) motionTogether();
    else motionSeparated();
  }

  drawSpring();
  drawMasses();
}

function motionTogether() {
  t += dt;

  y1 = eqY12 + A * cos(omega * t);
  y2 = y1 - (H1 + H2) / 2;

  if (
    canDetach &&
    !paused &&
    yPrev !== null &&
    yPrev > naturalY &&
    y1 <= naturalY
  ) {
    paused = true;
    continueButton.show();

    tDetach = t;
    yDetach = y1;
    vDetach = -A * omega * sin(omega * t);
  }

  yPrev = y1;
}

function continueMotion() {
  paused = false;
  phase = 2;          // ⬅ περνάμε ΟΡΙΣΤΙΚΑ μετά την απώλεια επαφής
  continueButton.hide();
}

function motionSeparated() {
  t += dt;
  const tau = t - tDetach;

  const omega1 = sqrt(k / m1);
  const yRel = yDetach - eqY1;

  y1 =
    eqY1 +
    yRel * cos(omega1 * tau) +
    (vDetach / omega1) * sin(omega1 * tau);

  y2 =
    yDetach -
    (H1 + H2) / 2 +
    vDetach * tau -
    0.5 * g * scale * tau * tau;
}

function drawSpring() {
  stroke(220);
  noFill();
  beginShape();
  vertex(width * 0.75, floorY);
  for (let i = 1; i <= 14; i++) {
    const y = lerp(floorY, y1, i / 14);
    vertex(width * 0.75 + (i % 2 ? 14 : -14), y);
  }
  vertex(width * 0.75, y1);
  endShape();
}

function drawMasses() {
  rectMode(CENTER);
  fill(120, 160, 255);
  rect(width * 0.75, y1, 70, H1, 6);

  fill(240, 200, 120);
  rect(width * 0.75, y2, 60, H2, 6);
}

function drawReferenceLines() {
  drawingContext.setLineDash([6, 6]);

  stroke(200, 80, 80);
  line(0, naturalY, width, naturalY);
  noStroke();
  fill(200, 80, 80);
  text("Φυσικό μήκος", width * 0.55, naturalY - 6);

  stroke(0, 200, 0);
  line(0, eqY12, width, eqY12);
  noStroke();
  fill(0, 200, 0);
  text("Θ.Ι. (Σ₁ + Σ₂)", width * 0.55, eqY12 - 6);

  drawingContext.setLineDash([]);
}

/* =========================
   ΜΗΝΥΜΑΤΑ ΚΑΤΑΣΤΑΣΗΣ
   ========================= */
function drawStatusMessages() {
  textAlign(LEFT, TOP);
  fill(255);
  textSize(16);

  text("Κατάσταση συστήματος:", 20, 230);

  if (paused) {
    fill(255, 80, 80);
    text("N = 0", 20, 260);
    text("Απώλεια επαφής", 20, 285);
    text("(κάθετη αντίδραση στήριξης)", 20, 310);

  } else if (phase === 1 && !canDetach) {
    fill(255);
    text("Δεν χάνεται η επαφή", 20, 260);
    text("γιατί ω²A ≤ g", 20, 285);
  }

  // ⬆️ ΔΕΝ ΥΠΑΡΧΕΙ ΠΙΑ το μήνυμα
  // «Η επαφή μπορεί να χαθεί»

  fill(200);
  textSize(15);
  text("ω = √(k / (m₁ + m₂))", 20, height - 90);
  text("ω²A = " + (omega * omega * (A / scale)).toFixed(2), 20, height - 65);
  text("g = " + g, 20, height - 40);
}
