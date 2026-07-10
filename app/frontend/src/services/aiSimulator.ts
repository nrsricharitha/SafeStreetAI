"// Simulated AI Threat Detector. Replaceable by real ML.
export type SensorSnapshot = {
  noise: number; // 0-100
  motion: number; // 0-100
  running: number; // km/h
  heartRate: number; // bpm
  voiceConfidence: number; // 0-100
  stress: number; // 0-100
  fallProbability: number; // 0-1
  threat: number; // 0-1
  confidence: number; // 0-100
  timestamp: number;
};

let bias = 0;

// Increase bias to escalate threat over time — used by demo mode.
export function escalate(delta = 0.1) {
  bias = Math.min(1, bias + delta);
}
export function calm() {
  bias = 0;
}
export function currentBias() {
  return bias;
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function sample(): SensorSnapshot {
  const noise = Math.min(100, rand(20, 55) + bias * 60);
  const motion = Math.min(100, rand(15, 45) + bias * 65);
  const running = Math.max(0, rand(0, 3) + bias * 12);
  const heartRate = 70 + rand(-8, 20) + bias * 55;
  const voiceConfidence = Math.min(100, rand(40, 70) + bias * 30);
  const stress = Math.min(100, rand(10, 35) + bias * 70);
  const fallProbability = Math.min(1, rand(0, 0.15) + bias * 0.6);
  const threat = Math.min(
    1,
    (noise / 100) * 0.3 +
      (motion / 100) * 0.2 +
      (stress / 100) * 0.25 +
      fallProbability * 0.15 +
      (running / 20) * 0.1
  );
  const confidence = 60 + rand(0, 15) + bias * 20;
  return {
    noise,
    motion,
    running,
    heartRate,
    voiceConfidence,
    stress,
    fallProbability,
    threat,
    confidence: Math.min(99, confidence),
    timestamp: Date.now(),
  };
}
"
