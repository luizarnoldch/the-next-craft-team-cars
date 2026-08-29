// Beep sintetizado con Web Audio API — sin archivo de audio externo que licenciar
// ni descargar. Los navegadores bloquean audio sin gesto previo del usuario; como
// esto se dispara desde una suscripción reactiva (no un click), puede fallar
// silenciosamente en algunos casos — el toast visual no depende de esto.
export function playAlertSound() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const now = ctx.currentTime;

    const beep = (start: number, freq: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.15, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + duration);
    };

    beep(0, 880, 0.12);
    beep(0.15, 660, 0.16);

    setTimeout(() => ctx.close(), 500);
  } catch {
    // audio no disponible (bloqueado por el navegador, sin soporte, etc.) — no crítico
  }
}
