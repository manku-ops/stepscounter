// ════════════════════════════════════════
//  VARIABLES
// ════════════════════════════════════════

let steps = 0;
let lastMovement = 0;
let threshold = 5;       // minimum change in movement to count as a step
let canStep = true;      // debounce flag — stops double counting

// AssumptionsS
let stepLength = 0.75;       // meters per step
let caloriesPerStep = 0.04;  // kcal per step

// Timer variables
let isRunning = false;
let startTime = null;
let timerInterval = null;

// Step goal
const GOAL = 10000;


// ════════════════════════════════════════
//  START — asks permission on iOS, then starts sensor
// ════════════════════════════════════════

function start() {
  if (isRunning) return;

  // iOS 13+ requires user permission to access motion sensor
  if (typeof DeviceMotionEvent !== 'undefined' &&
      typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission()
      .then(response => {
        if (response === 'granted') {
          initSensor();
        } else {
          alert('Permission denied. Allow motion access in Settings.');
        }
      })
      .catch(console.error);
  } else {
    // Android and desktop — no permission needed
    initSensor();
  }
}


// ════════════════════════════════════════
//  INIT SENSOR — starts listening to accelerometer
// ════════════════════════════════════════

function initSensor() {
  isRunning = true;

  // Start the timer
  startTime = Date.now();
  timerInterval = setInterval(updateTimer, 1000);

  // Update UI to show sensor is ON
  document.getElementById('dot').classList.add('on');
  document.getElementById('status-text').textContent = 'Sensor active — walk normally';
  document.getElementById('start-btn').disabled = true;

  // Listen to phone accelerometer
  window.addEventListener('devicemotion', function(event) {

    // Get acceleration values from phone sensor (X, Y, Z axes)
    let acc = event.accelerationIncludingGravity;
    if (!acc) return;

    let x = acc.x || 0;
    let y = acc.y || 0;
    let z = acc.z || 0;

    // Combine X, Y, Z into one magnitude value using 3D distance formula
    // This works regardless of how the phone is held
    let movement = Math.sqrt(x*x + y*y + z*z);

    // Calculate how much movement changed from last reading
    let diff = Math.abs(movement - lastMovement);

    // If change is big enough AND debounce allows → count as a step
    if (diff > threshold && canStep) {
      steps++;
      updateStats();

      // Debounce: block next 300ms of sensor readings
      // Prevents one physical step from firing multiple times
      canStep = false;
      setTimeout(function() {
        canStep = true;
      }, 300);
    }

    // Save current movement for next comparison
    lastMovement = movement;
  });
}


// ════════════════════════════════════════
//  UPDATE STATS — called every time a step is counted
// ════════════════════════════════════════

function updateStats() {
  // Bounce animation on step number
  let el = document.getElementById('step-display');
  el.textContent = steps.toLocaleString();
  el.classList.add('bump');
  setTimeout(function() { el.classList.remove('bump'); }, 120);

  // Distance in km
  let distance = (steps * stepLength / 1000).toFixed(2);
  document.getElementById('distance-display').textContent = distance;

  // Calories burned
  let calories = (steps * caloriesPerStep).toFixed(2);
  document.getElementById('calories-display').textContent = calories;

  // Progress bar — fills toward 10,000 step goal
  let pct = Math.min(100, (steps / GOAL) * 100);
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('pct-label').textContent =
    steps.toLocaleString() + ' / ' + GOAL.toLocaleString();
}


// ════════════════════════════════════════
//  UPDATE TIMER — called every second
// ════════════════════════════════════════

function updateTimer() {
  let totalSeconds = Math.floor((Date.now() - startTime) / 1000);
  let minutes = Math.floor(totalSeconds / 60);
  let seconds = totalSeconds % 60;

  // Format as m:ss (e.g. 2:05)
  document.getElementById('time-display').textContent =
    minutes + ':' + String(seconds).padStart(2, '0');
}


// ════════════════════════════════════════
//  RESET — clears everything back to zero
// ════════════════════════════════════════

function reset() {
  // Stop timer
  clearInterval(timerInterval);
  isRunning = false;

  // Reset all variables
  steps = 0;
  lastMovement = 0;

  // Reset UI
  document.getElementById('dot').classList.remove('on');
  document.getElementById('status-text').textContent = 'Tap Start to begin';
  document.getElementById('start-btn').disabled = false;
  document.getElementById('step-display').textContent = '0';
  document.getElementById('distance-display').textContent = '0.00';
  document.getElementById('calories-display').textContent = '0.00';
  document.getElementById('time-display').textContent = '0:00';
  document.getElementById('progress-fill').style.width = '0%';
  document.getElementById('pct-label').textContent = '0 / 10,000';
}
