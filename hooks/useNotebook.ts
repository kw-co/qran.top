import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Collections, SavedItem, Collection } from '../types';
import { safeLocalStorage } from '../utils/storage';

const NOTEBOOK_UNIFIED_KEY = 'qran_app_notebook_unified_items';
const COLLECTIONS_LEGACY_KEY = 'qran_app_collections';

export const useNotebook = () => {
    const [items, setItems] = useState<SavedItem[]>(() => {
        try {
            // 1. Try to load from unified items key
            const storedUnified = safeLocalStorage.getItem(NOTEBOOK_UNIFIED_KEY);
            if (storedUnified) {
                const parsed = JSON.parse(storedUnified);
                if (Array.isArray(parsed)) return parsed;
            }

            // 2. Fallback: Migrate from legacy collections
            const storedLegacy = safeLocalStorage.getItem(COLLECTIONS_LEGACY_KEY);
            if (storedLegacy) {
                const parsedCols: Collections = JSON.parse(storedLegacy);
                const allItems: SavedItem[] = [];
                const seenIds = new Set<string>();

                Object.values(parsedCols).forEach((col: Collection) => {
                    if (Array.isArray(col.items)) {
                        col.items.forEach(item => {
                            if (!seenIds.has(item.id)) {
                                seenIds.add(item.id);
                                allItems.push(item);
                            }
                        });
                    }
                });

                // Sort by createdAt descending
                allItems.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                return allItems;
            }

            return [];
        } catch (e) {
            console.error("Failed to load notebook items from localStorage", e);
            return [];
        }
    });

    const [toastMessage, setToastMessage] = useState<{ text: string; id: number } | null>(null);

    // Save items to both new unified key and legacy collections format for 100% compatibility
    useEffect(() => {
        try {
            safeLocalStorage.setItem(NOTEBOOK_UNIFIED_KEY, JSON.stringify(items));
            const legacyCollections: Collections = {
                default: {
                    id: 'default',
                    name: 'الدفتر',
                    items: items,
                    createdAt: Date.now()
                }
            };
            safeLocalStorage.setItem(COLLECTIONS_LEGACY_KEY, JSON.stringify(legacyCollections));
        } catch (e) {
            console.error("Failed to persist notebook items", e);
        }
    }, [items]);

    // Backward-compatible collections object
    const collections: Collections = useMemo(() => ({
        default: {
            id: 'default',
            name: 'الدفتر',
            items: items,
            createdAt: Date.now()
        }
    }), [items]);

    // Instant 1-click Save Action
    const handleSaveItem = useCallback((item: SavedItem) => {
        setItems(prevItems => {
            const existsIndex = prevItems.findIndex(i => i.id === item.id);
            if (existsIndex > -1) {
                // If exists, update its timestamp and text, and move to top
                const updated = { ...prevItems[existsIndex], ...item, createdAt: Date.now() };
                const filtered = prevItems.filter(i => i.id !== item.id);
                return [updated, ...filtered];
            } else {
                return [item, ...prevItems];
            }
        });

        // Trigger toast notification
        const msg = item.type === 'ayah' 
            ? `تم حفظ الآية (${item.surah}:${item.ayah}) في الدفتر بنجاح` 
            : `تم حفظ البحث "${item.query}" في الدفتر بنجاح`;
        setToastMessage({ text: msg, id: Date.now() });

        // Dispatch window event for global notification toast
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('app-toast', { 
                detail: { 
                    message: msg, 
                    type: 'success',
                    link: '#/saved',
                    linkText: 'عرض الدفتر'
                } 
            }));
        }
    }, []);

    // Instant Delete Item
    const handleDeleteSavedItem = useCallback((_collectionId: string, itemId: string) => {
        setItems(prevItems => prevItems.filter(item => item.id !== itemId));
    }, []);

    // Direct Delete Item by Id
    const deleteItemById = useCallback((itemId: string) => {
        setItems(prevItems => prevItems.filter(item => item.id !== itemId));
    }, []);

    // Reorder whole list
    const handleReorderItems = useCallback((newItems: SavedItem[]) => {
        setItems(newItems);
    }, []);

    // Move single item up or down
    const handleMoveItem = useCallback((itemId: string, direction: 'up' | 'down') => {
        setItems(prev => {
            const index = prev.findIndex(item => item.id === itemId);
            if (index === -1) return prev;
            if (direction === 'up' && index === 0) return prev;
            if (direction === 'down' && index === prev.length - 1) return prev;

            const targetIndex = direction === 'up' ? index - 1 : index + 1;
            const newArr = [...prev];
            const [movedItem] = newArr.splice(index, 1);
            newArr.splice(targetIndex, 0, movedItem);
            return newArr;
        });
    }, []);

    // Update notes for a specific item
    const updateItemNotes = useCallback((_collectionId: string, itemId: string, notes: string) => {
        setItems(prevItems => {
            return prevItems.map(item => {
                if (item.id === itemId) {
                    const trimmed = notes.trim();
                    const updated = { ...item };
                    if (trimmed) {
                        updated.notes = trimmed;
                    } else {
                        delete (updated as any).notes;
                    }
                    return updated;
                }
                return item;
            });
        });
    }, []);

    // Smart update for SavedItem: only saves customText if modified from original, deleting it if null/empty
    const updateSavedItem = useCallback((itemId: string, updates: { notes?: string; customText?: string | null }) => {
        setItems(prevItems => {
            return prevItems.map(item => {
                if (item.id === itemId) {
                    const updated = { ...item };
                    if (updates.notes !== undefined) {
                        const trimmedNotes = updates.notes.trim();
                        if (trimmedNotes) {
                            updated.notes = trimmedNotes;
                        } else {
                            delete (updated as any).notes;
                        }
                    }
                    if (updates.customText !== undefined) {
                        const trimmedCustom = updates.customText ? updates.customText.trim() : null;
                        if (!trimmedCustom) {
                            delete (updated as any).customText;
                        } else {
                            (updated as any).customText = trimmedCustom;
                        }
                    }
                    return updated;
                }
                return item;
            });
        });
    }, []);

    // Clear all items
    const handleClearAll = useCallback(() => {
        if (window.confirm("هل أنت متأكد من مسح جميع الآيات والملاحظات من الدفتر؟")) {
            setItems([]);
        }
    }, []);

    // Export notebook
    const handleExportNotebook = useCallback(async (): Promise<string> => {
        const dataToExport = {
            version: '2.0',
            exportedAt: new Date().toISOString(),
            itemsCount: items.length,
            items: items,
            collections: {
                default: {
                    id: 'default',
                    name: 'الدفتر',
                    items: items,
                    createdAt: Date.now()
                }
            }
        };

        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `qran-notebook-${new Date().toISOString().slice(0, 10)}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        return "تم تصدير الدفتر كملف بنجاح";
    }, [items]);

    // Import notebook
    const handleImportNotebook = useCallback(async (fileContent: string): Promise<void> => {
        try {
            const parsed = JSON.parse(fileContent);
            let importedItems: SavedItem[] = [];

            if (Array.isArray(parsed)) {
                importedItems = parsed;
            } else if (Array.isArray(parsed.items)) {
                importedItems = parsed.items;
            } else if (parsed.collections && typeof parsed.collections === 'object') {
                const seen = new Set<string>();
                Object.values(parsed.collections).forEach((col: any) => {
                    if (Array.isArray(col.items)) {
                        col.items.forEach((it: SavedItem) => {
                            if (!seen.has(it.id)) {
                                seen.add(it.id);
                                importedItems.push(it);
                            }
                        });
                    }
                });
            } else if (typeof parsed === 'object' && parsed !== null) {
                const seen = new Set<string>();
                Object.values(parsed).forEach((col: any) => {
                    if (col && Array.isArray(col.items)) {
                        col.items.forEach((it: SavedItem) => {
                            if (!seen.has(it.id)) {
                                seen.add(it.id);
                                importedItems.push(it);
                            }
                        });
                    }
                });
            }

            if (importedItems.length > 0) {
                // Merge without duplicate IDs
                setItems(prev => {
                    const existingMap = new Map(prev.map(i => [i.id, i]));
                    importedItems.forEach(it => {
                        existingMap.set(it.id, it);
                    });
                    const merged = Array.from(existingMap.values());
                    merged.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                    return merged;
                });
            } else {
                throw new Error("لم يتم العثور على آيات في الملف المستورد.");
            }
        } catch (e: any) {
            throw new Error(e.message || "فشل في قراءة الملف. يرجى التأكد من اختيار ملف دفتر تدبر صحيح.");
        }
    }, []);

    return {
        items,
        collections,
        toastMessage,
        itemToSave: null, // No longer need modal popup
        setItemToSave: () => {},
        handleSaveItem,
        handleConfirmSave: () => {},
        handleDeleteCollection: () => {},
        handleDeleteSavedItem,
        deleteItemById,
        handleReorderItems,
        handleMoveItem,
        updateItemNotes,
        updateSavedItem,
        handleClearAll,
        handleExportNotebook,
        handleImportNotebook
    };
};
