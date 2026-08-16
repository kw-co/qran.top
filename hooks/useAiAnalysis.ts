import { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { safeLocalStorage } from '../utils/storage';

export const useAiAnalysis = (word: string) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [aiResult, setAiResult] = useState('');

    const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

    const handleApiKeySave = (key: string) => {
        safeLocalStorage.setItem('qran_user_api_key', key);
        setIsApiKeyModalOpen(false);
    };

    const triggerAnalysis = async (customPrompt: string, dataString: string) => {
        if (!word) return;
        setIsProcessing(true);
        setAiResult('');

        try {
            // الحصول على مفتاح API من localStorage
            let apiKey = safeLocalStorage.getItem('qran_user_api_key');
            
            if (!apiKey) {
                setIsApiKeyModalOpen(true);
                setIsProcessing(false);
                return;
            }
            const ai = new GoogleGenAI({ apiKey });
            const fullContent = `
الكلمة المراد تحليلها: "${word}"

تعليمات التحليل:
${customPrompt}

البيانات الإحصائية المستخرجة من القرآن (المثاني):
${dataString}
            `;

            const response = await ai.models.generateContentStream({
                model: 'gemini-3.1-pro-preview',
                contents: fullContent,
            });

            for await (const chunk of response) {
                if (chunk.text) {
                    setAiResult(prev => prev + chunk.text);
                }
            }

        } catch (error: any) {
            console.error("AI Error:", error);
            setAiResult("حدث خطأ أثناء الاتصال بالذكاء الاصطناعي. يرجى التأكد من صحة مفتاح API والمحاولة مرة أخرى.");
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
        isApiKeyModalOpen,
        setIsApiKeyModalOpen,
        handleApiKeySave
    };
};
