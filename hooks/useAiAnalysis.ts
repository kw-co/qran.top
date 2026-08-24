import { useState, useEffect } from 'react';

export const useAiAnalysis = (word: string) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [aiResult, setAiResult] = useState('');

    const triggerAnalysis = async (customPrompt: string, dataString: string) => {
        if (!word) return;
        setIsProcessing(true);
        setAiResult('');

        try {
            const response = await fetch('/api/ai/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    word,
                    customPrompt,
                    dataString,
                }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                if (errData.error && errData.error.includes('GEMINI_API_KEY')) {
                    setAiResult("لم يتم تكوين مفتاح GEMINI_API_KEY على الخادم.");
                } else {
                    setAiResult("حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.");
                }
                setIsProcessing(false);
                return;
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    setAiResult(prev => prev + decoder.decode(value, { stream: true }));
                }
            }
        } catch (error: any) {
            console.error("AI Error:", error);
            setAiResult("حدث خطأ أثناء الاتصال بالخادم.");
        } finally {
            setIsProcessing(false);
        }
    };
    
    // Clear result when word changes
    useEffect(() => {
        setAiResult('');
    }, [word]);

    return {
        isProcessing,
        aiResult,
        setAiResult,
        triggerAnalysis,
    };
};
