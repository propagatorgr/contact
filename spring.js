// ===== ΣΤΑΘΕΡΕΣ =====
let g = 10;
let scale = 100;
let naturalLength = 1.8;

// ===== ΜΕΤΑΒΛΗΤΕΣ =====
let floorY, naturalY, eqY, y;
let t = 0, dt = 0.02;
let running = true;

let m1 = 1, m2 = 0.5, k = 20, A = 0.2;
let mTot;
let T, omega;
let E, K, U, umax;

let mSlider, m2Slider, kSlider, ASlider, playButton;

// ===== SETUP =====
function setup() {
  const canvas = createCanvas(min(windowWidth * 0.95, 1100), 420);
  canvas.parent('sketch-holder');

  floorY = height - 30;
  createUI();
  updateSystem();
}

function windowResized() {
  resizeCanvas(min(windowWidth * 0.95, 1100), 420);
  floorY = height - 30;
}

// ===== UI =====
function createUI() {
  const controls = select('#controls');

  mSlider = createSlider(0.5, 5, 1, 0.1);
  addControl(controls, 'Μάζα κάτω σώματος m₁ (kg)', mSlider);

  m2Slider = createSlider(0.1, 5, 0.5, 0.1);
  addControl(controls, 'Μάζα άνω σώματος m₂ (kg)', m2Slider);

  kSlider = createSlider(5, 50, 20, 1);
  addControl(controls, 'Σταθερά ελατηρίου k (N/m)', kSlider);

  ASlider = createSlider(0.05, 0.5, 0.2, 0.01);
  addControl(controls, 'Πλάτος A (m)', ASlider);

  playButton = createButton('⏸ Pause');
  playButton.mousePressed(togglePlay);
  playButton.parent(controls);

  let readout = createDiv('');
  readout.id('readout');
  readout.parent(controls);
}

function addControl(parent, text, slider) {
  let box = createDiv().class('control');
  box.parent(parent);
  createElement('label', text).parent(box);
  slider.parent(box);
}

function togglePlay() {
  running = !running;
  playButton.html(running ? '⏸ Pause' : '▶ Play');
}

// ===== ΦΥΣΙΚΗ =====
function updateSystem() {
  m1 = mSlider.value();
  m2 = m2Slider.value();
  k = kSlider.value();
  A = ASlider.value();

  mTot = m1 + m2;

  omega = sqrt(k / mTot);
  T = TWO_PI / omega;

  E = 0.5 * k * A * A;
  umax = omega * A;

  naturalY = floorY - naturalLength * scale;
  let deltaL = mTot * g / k;
  eqY = naturalY + deltaL * scale;
}

// ===== DRAW =====
function draw() {
  background(0);
  updateSystem();

  if (running) t += dt;

  y = eqY + A * scale * sin(TWO_PI * t / T);

  let inContact = y > naturalY;

  let x = (y - eqY) / scale;
  U = 0.5 * k * x * x;
  K = E - U;

  drawReferenceLines();
  drawSpring();
  drawMasses(inContact);
  drawFloor();

  updateEnergyPanel();
  updateReadout(inContact);
}

// ===== ΣΧΕΔΙΑΣΗ =====
function drawReferenceLines() {
  drawingContext.setLineDash([6, 6]);

  stroke(200,0,0); line(0, naturalY, width, naturalY);
  stroke(0,200,0); line(0, eqY, width, eqY);

  stroke(150);
  line(0, eqY - A*scale, width, eqY - A*scale);
  line(0, eqY + A*scale, width, eqY + A*scale);

  drawingContext.setLineDash([]);
}

function drawSpring() {
  stroke(255); noFill();
  let cx = width / 2;
  let len = floorY - y;

  beginShape();
  vertex(cx, floorY);
  for (let i=1; i<=16; i++) {
    vertex(cx + (i%2 ? -14 : 14), floorY - (i/16)*len);
  }
  vertex(cx, y);
  endShape();
}

function drawMasses(inContact) {
  rectMode(CENTER);
  stroke(255);

  const h1 = 40;
  const h2 = 40;
  const cx = width/2;

  // Κάτω σώμα m1
  fill(100,150,255);
  rect(cx, y, 60, h1, 6);

  // Άνω σώμα m2
  if (inContact) {
    fill(240,200,120);
    rect(cx, y - (h1 + h2)/2, 60, h2, 6);
  }
}

function drawFloor() {
  strokeWeight(3); stroke(255);
  line(0, floorY, width, floorY);
  strokeWeight(1);
}

// ===== ENERGY PANEL =====
function updateEnergyPanel() {
  let maxH = 200;
  document.getElementById('Ubar').style.height = `${(U/E)*maxH}px`;
  document.getElementById('Kbar').style.height = `${(K/E)*maxH}px`;
  document.getElementById('Ebar').style.height = `${maxH}px`;

  document.getElementById('energy-values').innerHTML =
    `U = ${U.toFixed(2)} <span class="unit">J</span><br>
     K = ${K.toFixed(2)} <span class="unit">J</span><br>
     E = ${E.toFixed(2)} <span class="unit">J</span>`;
}

// ===== READOUT =====
function updateReadout(inContact) {
  document.getElementById('readout').innerHTML = `
    <div class="read-col">
      m₁ = ${m1.toFixed(2)} kg<br>
      m₂ = ${m2.toFixed(2)} kg<br>
      k = ${k.toFixed(1)} N/m<br>
      ${inContact ? 
        '<span style="color:#3f3">Επαφή σωμάτων</span>' :
        '<span style="color:#f55">Απώλεια επαφής</span>'}
    </div>
    <div class="read-col">
      T = ${T.toFixed(2)} s<br>
      ω = ${omega.toFixed(2)} rad/s<br>
      uₘₐₓ = ${umax.toFixed(2)} m/s<br>
      E = ${E.toFixed(2)} J
    </div>
  `;
}
