// Audio DSP Service: Vocal Mastering for Quran Reciters
// Features: 250Hz Resonance Notch Cut, 3500Hz Presence/Brilliance Boost, and Spiritual Sanctuary Reverb

export interface AudioDspConfig {
    enabled: boolean;
    cut250Gain: number;       // In dB (e.g. -6 dB to cut boxiness/resonance)
    boost3500Gain: number;    // In dB (e.g. +4.5 dB to boost brilliance/radiation)
    reverbLevel: number;      // 0.0 to 0.5 (e.g. 0.20 for subtle spiritual ambience)
    presetName: 'recommended' | 'haram' | 'studio' | 'custom';
}

export const DEFAULT_DSP_CONFIG: AudioDspConfig = {
    enabled: true,
    cut250Gain: -6,           // عزل رنين 250Hz بمقدار -6dB
    boost3500Gain: 4.5,       // إشعاع وبريق 3500Hz بمقدار +4.5dB
    reverbLevel: 0.20,        // صدى خفيف موزون (20%)
    presetName: 'recommended'
};

const STORAGE_KEY = 'qran_audio_dsp_settings_v1';

class AudioDspManager {
    private audioCtx: AudioContext | null = null;
    private sourceNode: MediaElementAudioSourceNode | null = null;
    private attachedAudioElement: HTMLAudioElement | null = null;
    
    // DSP Nodes
    private filter250Node: BiquadFilterNode | null = null;
    private filter3500Node: BiquadFilterNode | null = null;
    private convolverNode: ConvolverNode | null = null;
    private wetGainNode: GainNode | null = null;
    private dryGainNode: GainNode | null = null;
    private masterGainNode: GainNode | null = null;

    private config: AudioDspConfig;
    private listeners: Set<(config: AudioDspConfig) => void> = new Set();

    constructor() {
        this.config = this.loadConfig();
    }

    private loadConfig(): AudioDspConfig {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                return { ...DEFAULT_DSP_CONFIG, ...parsed };
            }
        } catch (e) {
            console.warn('[AudioDsp] Failed to load config from storage:', e);
        }
        return { ...DEFAULT_DSP_CONFIG };
    }

    public saveConfig(newConfig: Partial<AudioDspConfig>) {
        this.config = { ...this.config, ...newConfig };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
        } catch (e) {
            console.warn('[AudioDsp] Failed to save config to storage:', e);
        }
        this.applyParameters();
        this.notifyListeners();
    }

    public getConfig(): AudioDspConfig {
        return { ...this.config };
    }

    public subscribe(listener: (config: AudioDspConfig) => void) {
        this.listeners.add(listener);
        listener(this.getConfig());
        return () => {
            this.listeners.delete(listener);
        };
    }

    private notifyListeners() {
        const current = this.getConfig();
        this.listeners.forEach(l => l(current));
    }

    /**
     * Synthesizes an acoustic impulse response mimicking a large carpeted sanctuary / mosque
     * with high dome reflections and gentle high-frequency damping.
     */
    private createSanctuaryImpulse(ctx: AudioContext, duration = 1.9, decay = 2.4): AudioBuffer {
        const sampleRate = ctx.sampleRate;
        const length = Math.floor(sampleRate * duration);
        const impulse = ctx.createBuffer(2, length, sampleRate);
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);

        // Discrete early reflections in first 40ms
        const earlyReflections = [
            { time: 0.012, gain: 0.45 },
            { time: 0.021, gain: 0.35 },
            { time: 0.029, gain: 0.28 },
            { time: 0.038, gain: 0.22 },
        ];

        let prevL = 0;
        let prevR = 0;

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const progress = i / length;
            // Exponential volume envelope
            const envelope = Math.pow(1 - progress, decay);

            // Gaussian/uniform noise with soft lowpass filtering (damping highs over time)
            const rawL = (Math.random() * 2 - 1);
            const rawR = (Math.random() * 2 - 1);

            // Progressive LP filter: alpha decreases as time progresses
            const filterCoeff = Math.max(0.08, 0.45 - progress * 0.35);
            prevL = prevL + filterCoeff * (rawL - prevL);
            prevR = prevR + filterCoeff * (rawR - prevR);

            let sampleL = prevL * envelope;
            let sampleR = prevR * envelope;

            // Inject early reflection spikes
            for (const er of earlyReflections) {
                const sampleIdx = Math.floor(er.time * sampleRate);
                if (Math.abs(i - sampleIdx) < 2) {
                    sampleL += (er.gain * (Math.random() * 0.4 + 0.8)) * 0.5;
                    sampleR += (er.gain * (Math.random() * 0.4 + 0.8)) * 0.5;
                }
            }

            left[i] = sampleL;
            right[i] = sampleR;
        }

        return impulse;
    }

    /**
     * Initializes the Web Audio API graph and attaches to the HTMLAudioElement
     */
    public attachAudioElement(audioElement: HTMLAudioElement) {
        if (this.attachedAudioElement === audioElement && this.audioCtx) {
            return;
        }

        try {
            const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioCtxClass) {
                console.warn('[AudioDsp] Web Audio API is not supported in this browser.');
                return;
            }

            if (!this.audioCtx) {
                this.audioCtx = new AudioCtxClass();
            }

            const ctx = this.audioCtx;

            // Note: createMediaElementSource can ONLY be called once per audio element
            if (!this.sourceNode || this.attachedAudioElement !== audioElement) {
                try {
                    this.sourceNode = ctx.createMediaElementSource(audioElement);
                } catch (e: any) {
                    console.warn('[AudioDsp] MediaElementAudioSource already created or error:', e);
                }
            }
            this.attachedAudioElement = audioElement;

            if (!this.sourceNode) return;

            // 1. Filter 1: 250Hz Resonance Cut (Notch / Peaking)
            this.filter250Node = ctx.createBiquadFilter();
            this.filter250Node.type = 'peaking';
            this.filter250Node.frequency.value = 250;
            this.filter250Node.Q.value = 1.8;

            // 2. Filter 2: 3500Hz Presence & Brilliance Boost
            this.filter3500Node = ctx.createBiquadFilter();
            this.filter3500Node.type = 'peaking';
            this.filter3500Node.frequency.value = 3500;
            this.filter3500Node.Q.value = 1.2;

            // 3. Reverb Convolver Node
            this.convolverNode = ctx.createConvolver();
            this.convolverNode.buffer = this.createSanctuaryImpulse(ctx);

            // 4. Gains
            this.dryGainNode = ctx.createGain();
            this.wetGainNode = ctx.createGain();
            this.masterGainNode = ctx.createGain();

            // Connect DSP Graph:
            // source -> filter250 -> filter3500 -> dryGain -> masterGain -> destination
            //                                   \-> convolver -> wetGain -> masterGain
            this.sourceNode.disconnect();
            this.sourceNode.connect(this.filter250Node);
            this.filter250Node.connect(this.filter3500Node);

            // Dry path
            this.filter3500Node.connect(this.dryGainNode);
            this.dryGainNode.connect(this.masterGainNode);

            // Wet (Reverb) path
            this.filter3500Node.connect(this.convolverNode);
            this.convolverNode.connect(this.wetGainNode);
            this.wetGainNode.connect(this.masterGainNode);

            // Master out to hardware speakers
            this.masterGainNode.connect(ctx.destination);

            this.applyParameters();
        } catch (err) {
            console.error('[AudioDsp] Failed to initialize audio graph:', err);
        }
    }

    /**
     * Resumes AudioContext if suspended by browser autoplay policy
     */
    public ensureContextRunning() {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume().catch(e => console.warn('[AudioDsp] Error resuming context:', e));
        }
    }

    /**
     * Updates the DSP nodes with current configuration
     */
    private applyParameters() {
        if (!this.audioCtx) return;
        const now = this.audioCtx.currentTime;

        const isEnabled = this.config.enabled;

        // 250Hz Resonance Cut: 0dB if disabled, or configured cut (e.g. -6dB)
        if (this.filter250Node) {
            const target250 = isEnabled ? this.config.cut250Gain : 0;
            this.filter250Node.gain.cancelScheduledValues(now);
            this.filter250Node.gain.setTargetAtTime(target250, now, 0.05);
        }

        // 3500Hz Presence Boost: 0dB if disabled, or configured boost (e.g. +4.5dB)
        if (this.filter3500Node) {
            const target3500 = isEnabled ? this.config.boost3500Gain : 0;
            this.filter3500Node.gain.cancelScheduledValues(now);
            this.filter3500Node.gain.setTargetAtTime(target3500, now, 0.05);
        }

        // Dry & Wet Gains
        if (this.dryGainNode && this.wetGainNode) {
            const targetDry = 1.0;
            const targetWet = isEnabled ? this.config.reverbLevel : 0.0;

            this.dryGainNode.gain.cancelScheduledValues(now);
            this.dryGainNode.gain.setTargetAtTime(targetDry, now, 0.05);

            this.wetGainNode.gain.cancelScheduledValues(now);
            this.wetGainNode.gain.setTargetAtTime(targetWet, now, 0.05);
        }
    }

    public toggleEnabled(): boolean {
        this.ensureContextRunning();
        const next = !this.config.enabled;
        this.saveConfig({ enabled: next });
        return next;
    }

    public setPreset(preset: 'recommended' | 'haram' | 'studio' | 'custom') {
        this.ensureContextRunning();
        switch (preset) {
            case 'recommended':
                this.saveConfig({
                    enabled: true,
                    cut250Gain: -6,
                    boost3500Gain: 4.5,
                    reverbLevel: 0.20,
                    presetName: 'recommended'
                });
                break;
            case 'haram':
                this.saveConfig({
                    enabled: true,
                    cut250Gain: -4.5,
                    boost3500Gain: 5.5,
                    reverbLevel: 0.35,
                    presetName: 'haram'
                });
                break;
            case 'studio':
                this.saveConfig({
                    enabled: true,
                    cut250Gain: -7,
                    boost3500Gain: 5.0,
                    reverbLevel: 0.0,
                    presetName: 'studio'
                });
                break;
            default:
                break;
        }
    }
}

export const audioDspService = new AudioDspManager();
