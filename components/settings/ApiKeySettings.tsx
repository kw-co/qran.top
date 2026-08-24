import React from 'react';

const ApiKeySettings: React.FC = () => {
    return (
        <div className="animate-fade-in">
            <h2 className="text-2xl font-semibold mb-2 text-text-primary">الذكاء الاصطناعي</h2>
            <div className="p-5 bg-surface-subtle rounded-lg border border-border-default max-w-2xl">
                <p className="text-sm font-medium text-text-secondary mb-2">
                    يتم تزويد ميزات الذكاء الاصطناعي في هذا التطبيق تلقائياً من خلال الخادم. 
                    لا داعي لإدخال مفتاح API خاص بك.
                </p>
            </div>
        </div>
    );
};

export default ApiKeySettings;
