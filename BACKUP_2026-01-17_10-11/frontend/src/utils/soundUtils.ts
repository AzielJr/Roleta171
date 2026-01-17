// Utilitário para gerar sons usando Web Audio API
export class SoundGenerator {
  private audioContext: AudioContext | null = null;

  constructor() {
    // Inicializar AudioContext apenas quando necessário
    this.initAudioContext();
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API não suportada:', error);
    }
  }

  // Gerar som de sino curto
  public playBellSound() {
    if (!this.audioContext) {
      console.warn('AudioContext não disponível');
      return;
    }

    // Retomar contexto se estiver suspenso (necessário para alguns navegadores)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const now = this.audioContext.currentTime;
    const duration = 0.3; // 300ms - som curto

    // Criar oscilador para o tom principal do sino
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    // Conectar oscilador -> gain -> destino
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Configurar frequência do sino (tom agudo e claro)
    oscillator.frequency.setValueAtTime(800, now); // Frequência inicial
    oscillator.frequency.exponentialRampToValueAtTime(600, now + duration); // Decaimento

    // Configurar envelope de volume (ataque rápido, decaimento suave)
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01); // Ataque rápido
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration); // Decaimento suave

    // Usar onda senoidal para som mais suave
    oscillator.type = 'sine';

    // Iniciar e parar o som
    oscillator.start(now);
    oscillator.stop(now + duration);

    // Adicionar harmônico para enriquecer o som
    const harmonicOscillator = this.audioContext.createOscillator();
    const harmonicGain = this.audioContext.createGain();

    harmonicOscillator.connect(harmonicGain);
    harmonicGain.connect(this.audioContext.destination);

    harmonicOscillator.frequency.setValueAtTime(1600, now); // Oitava superior
    harmonicOscillator.frequency.exponentialRampToValueAtTime(1200, now + duration);

    harmonicGain.gain.setValueAtTime(0, now);
    harmonicGain.gain.linearRampToValueAtTime(0.1, now + 0.01); // Volume menor para harmônico
    harmonicGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    harmonicOscillator.type = 'sine';
    harmonicOscillator.start(now);
    harmonicOscillator.stop(now + duration);
  }

  // Limpar recursos
  public dispose() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Instância singleton para uso global
export const soundGenerator = new SoundGenerator();