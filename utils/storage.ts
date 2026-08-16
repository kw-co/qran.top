export const safeLocalStorage = {
    getItem: (key: string): string | null => {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            return null;
        }
    },
    setItem: (key: string, value: string): void => {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            // Ignore write errors
        }
    },
    removeItem: (key: string): void => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            // Ignore write errors
        }
    }
};
