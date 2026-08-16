import React, { useState } from 'react';
import { ClearIcon, CheckIcon } from '../icons';

interface ApiKeyModalProps {
    onClose: () => void;
    onSave: (apiKey: string) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onClose, onSave }) => {
    const [apiKey, setApiKey] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (apiKey.trim()) {
            onSave(apiKey.trim());
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface w-full max-w-lg rounded-xl shadow-2xl relative border border-border-default translate-y-0 scale-100 transition-all">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-text-muted hover:bg-surface-hover rounded-full transition-colors"
                >
                    <ClearIcon className="w-5 h-5" />
                </button>
                <div className="p-6 sm:p-8">
                    <h3 className="text-2xl font-bold text-text-primary mb-2">مفتاح API للذكاء الاصطناعي</h3>
                    <p className="text-text-secondary mb-6 text-sm">
                        هذه الميزة تتطلب مفتاح API الخاص بك من Google. يتم تخزين المفتاح محلياً في متصفحك فقط ولا يتم إرساله إلى خوادمنا.
                    </p>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label htmlFor="apiKey" className="block text-sm font-semibold text-text-primary mb-2">
                                أدخل مفتاح Gemini API الخاص بك
                            </label>
                            <input
                                id="apiKey"
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="w-full p-3 border border-border-default rounded-lg bg-surface-subtle focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                                placeholder="مثال: AIzaSy..."
                                dir="ltr"
                                autoFocus
                            />
                            <p className="text-xs text-text-muted mt-2">
                                يمكنك الحصول على مفتاح مجاني من <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a>.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={!apiKey.trim()}
                                className="flex-1 flex justify-center items-center gap-2 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
                            >
                                <CheckIcon className="w-5 h-5" />
                                حفظ المفتاح والمتابعة
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 bg-surface-hover text-text-primary font-semibold rounded-lg hover:bg-surface-active border border-border-default transition-colors"
                            >
                                إلغاء
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ApiKeyModal;
