// Beep sintetizado con Web Audio API — sin archivo de audio externo que licenciar
// ni descargar.
//
// Los navegadores bloquean AudioContext hasta que hay un gesto real del usuario
// en la página (política de autoplay); como las alertas se disparan solas desde
// una suscripción reactiva, un `new AudioContext()` recién creado en ese momento
// queda "suspended" y nunca suena. Por eso: un único context (singleton) que se
// intenta "desbloquear" en la primera interacción real (click/tecla/touch).
let ctx: AudioContext | null = null;
let unlocked = false;

function getContext(): AudioContext | null {
  if (ctx) return ctx;
  const Ctx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;
  ctx = new Ctx();
  return ctx;
}

// Llamar una vez al montar la app (ver AlertWatcher) para armar el desbloqueo.
export function initAlertSoundUnlock() {
  if (unlocked || typeof window === "undefined") return;
  const unlock = () => {
    unlocked = true;
    getContext()
      ?.resume()
      .catch(() => {});
  };
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
}

export function playAlertSound() {
  try {
    const audioCtx = getContext();
    if (!audioCtx) return;
    if (audioCtx.state === "suspended") {
      // best-effort: puede fallar si todavía no hubo ningún gesto del usuario
      void audioCtx.resume();
    }
    const now = audioCtx.currentTime;

    const beep = (start: number, freq: number, duration: number) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.15, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(now + start);
      osc.stop(now + start + duration);
    };

    beep(0, 880, 0.12);
    beep(0.15, 660, 0.16);
  } catch {
    // audio no disponible (bloqueado por el navegador, sin soporte, etc.) — no crítico
  }
}
