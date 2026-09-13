import React from 'react';
import { useSettingsContext } from '../../contexts/SettingsContext';
import { ALL_AUDIO_EDITIONS } from '../../data/audioEditions';
import { CheckIcon } from '../icons';

const AudioSettings: React.FC = () => {
    const { selectedAudioEdition, setSelectedAudioEdition } = useSettingsContext();

    return (
        <div className="animate-fade-in space-y-6">
            <div>
                <h2 className="text-xl font-bold text-text-primary">الصوت والتلاوة</h2>
                <p className="text-xs text-text-muted mt-0.5">اختر القارئ المفضل للاستماع للتلاوة أثناء القراءة والتصفح.</p>
            </div>

            {/* Reciter Selector */}
            <div className="space-y-2.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">
                    القارئ الافتراضي
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {ALL_AUDIO_EDITIONS.map((reciter) => {
                        const isSelected = selectedAudioEdition === reciter.identifier;
                        return (
                            <button
                                key={reciter.identifier}
                                type="button"
                                onClick={() => setSelectedAudioEdition(reciter.identifier)}
                                className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                                    isSelected
                                        ? 'bg-surface border-primary ring-1 ring-primary/20 shadow-xs'
                                        : 'bg-surface border-border-default hover:border-border-default/80 hover:bg-surface-hover/50'
                                }`}
                            >
                                <div className="min-w-0">
                                    <div className="font-bold text-sm text-text-primary truncate">{reciter.name}</div>
                                    <div className="text-[11px] text-text-muted mt-0.5 truncate" dir="ltr">{reciter.englishName}</div>
                                </div>
                                {isSelected && (
                                    <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                                        <CheckIcon className="w-3 h-3" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default AudioSettings;
