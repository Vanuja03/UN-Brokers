let context: AudioContext | null = null;

function audioContext() {
  if (typeof window.AudioContext === 'undefined') return null;
  if (!context) context = new window.AudioContext();
  return context;
}

export function unlockNotificationSound() {
  const current = audioContext();
  if (current?.state === 'suspended') void current.resume();
}

export function playNotificationSound() {
  const current = audioContext();
  if (!current) return;
  if (current.state === 'suspended') void current.resume();
  const start = current.currentTime;
  [523.25, 659.25, 783.99].forEach((frequency, index) => {
    const tone = current.createOscillator();
    const level = current.createGain();
    const at = start + index * 0.09;
    tone.type = 'sine';
    tone.frequency.setValueAtTime(frequency, at);
    level.gain.setValueAtTime(0.0001, at);
    level.gain.exponentialRampToValueAtTime(0.07, at + 0.02);
    level.gain.exponentialRampToValueAtTime(0.0001, at + 0.22);
    tone.connect(level);
    level.connect(current.destination);
    tone.start(at);
    tone.stop(at + 0.24);
  });
}
