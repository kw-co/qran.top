/**
 * Helper to handle external links on mobile devices and hybrid environments (like Android WebViews/PWAs).
 * Prevents external links from loading inside the app's WebView (which traps the user)
 * and instead forces them to open in the native system browser or corresponding native app.
 */
export const openExternalLink = (e: React.MouseEvent<HTMLAnchorElement> | null, url: string) => {
    if (e) {
        e.preventDefault();
    }

    // Instead of forcing intent/market schemes directly (which crash naive WebViews with ERR_UNKNOWN_URL_SCHEME),
    // we always dispatch a custom event to show our custom ExternalLinkModal.
    // This modal offers a safe 'Copy Link' option (100% reliable) as well as a direct 'Open' option.
    const event = new CustomEvent('show-external-link-modal', { detail: { url } });
    window.dispatchEvent(event);
};
