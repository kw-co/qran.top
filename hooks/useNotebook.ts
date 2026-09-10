import { useState, useEffect, useCallback } from 'react';
import type { Collections, SavedItem } from '../types';
import { safeLocalStorage } from '../utils/storage';

const COLLECTIONS_KEY = 'qran_app_collections';

export const useNotebook = () => {
    const [collections, setCollections] = useState<Collections>(() => {
        try {
            const stored = safeLocalStorage.getItem(COLLECTIONS_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            console.error("Failed to parse collections from localStorage", e);
            return {};
        }
    });
    const [itemToSave, setItemToSave] = useState<SavedItem | null>(null);

    useEffect(() => {
        safeLocalStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
    }, [collections]);

    const handleSaveItem = useCallback((item: SavedItem) => {
        setItemToSave(item);
    }, []);

    const handleConfirmSave = useCallback((collectionId: string, newCollectionName?: string) => {
        if (!itemToSave) return;

        setCollections(prevCollections => {
            const newCollections = { ...prevCollections };
            let targetCollectionId = collectionId;

            if (newCollectionName) {
                targetCollectionId = `coll_${Date.now()}`;
                newCollections[targetCollectionId] = {
                    id: targetCollectionId,
                    name: newCollectionName,
                    items: [],
                    createdAt: Date.now()
                };
            }

            const collection = newCollections[targetCollectionId];
            if (collection && !collection.items.some(i => i.id === itemToSave.id)) {
                collection.items.unshift(itemToSave);
            }
            
            return newCollections;
        });

        setItemToSave(null);
    }, [itemToSave]);

    const handleDeleteCollection = useCallback((collectionId: string) => {
        if (window.confirm("هل أنت متأكد من حذف هذه المجموعة وكل محتوياتها؟")) {
            setCollections(prev => {
                const newCollections = { ...prev };
                delete newCollections[collectionId];
                return newCollections;
            });
            if(window.location.hash.includes(`/saved/${collectionId}`)) {
                window.location.hash = '#/saved';
            }
        }
    }, []);

    const handleDeleteSavedItem = useCallback((collectionId: string, itemId: string) => {
         setCollections(prev => {
            const newCollections = { ...prev };
            const collection = newCollections[collectionId];
            if (collection) {
                collection.items = collection.items.filter(item => item.id !== itemId);
            }
            return newCollections;
        });
    }, []);
    
    const updateItemNotes = useCallback((collectionId: string, itemId: string, notes: string) => {
        setCollections(prev => {
            const newCollections = { ...prev };
            const collection = newCollections[collectionId];
            if (collection) {
                const itemIndex = collection.items.findIndex(item => item.id === itemId);
                if (itemIndex > -1) {
                    // Create a new item object to ensure reactivity
                    const updatedItem = { ...collection.items[itemIndex], notes };
                    // Create a new items array
                    const updatedItems = [...collection.items];
                    updatedItems[itemIndex] = updatedItem;
                    // Create a new collection object
                    newCollections[collectionId] = { ...collection, items: updatedItems };
                }
            }
            return newCollections;
        });
    }, []);

    const handleExportNotebook = useCallback(async (): Promise<string> => {
        const dataStr = JSON.stringify(collections, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = 'qran-top-notebook.json';

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        return "تم تصدير الدفتر كملف بنجاح";
    }, [collections]);

    const handleImportNotebook = useCallback(async (fileContent: string): Promise<void> => {
        try {
            const parsed = JSON.parse(fileContent);
            if (typeof parsed === 'object' && parsed !== null) {
                setCollections(parsed);
                safeLocalStorage.setItem(COLLECTIONS_KEY, JSON.stringify(parsed));
            } else {
                throw new Error("تنسيق الملف غير صحيح.");
            }
        } catch (e) {
            throw new Error("فشل في قراءة الملف. يرجى التأكد من اختيار ملف دفتر صحيح.");
        }
    }, []);

    return {
        collections,
        itemToSave,
        setItemToSave,
        handleSaveItem,
        handleConfirmSave,
        handleDeleteCollection,
        handleDeleteSavedItem,
        updateItemNotes,
        handleExportNotebook,
        handleImportNotebook
    };
};