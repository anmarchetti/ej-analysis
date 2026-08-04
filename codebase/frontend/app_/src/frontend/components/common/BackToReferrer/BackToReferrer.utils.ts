// If referrer is empty the user landed directly in this page so there is
// no reason to follow the returnPath param. We can keep the default behavior
export const buildBackLinkUrl = (referrer: Nullable<string>, returnPath: string): string | null => {
    let backToFlightsUrl: string | null = null;

    if (referrer && returnPath) {
        try {
            backToFlightsUrl = new URL(returnPath, referrer).toString();
        } catch {}
    }

    return backToFlightsUrl;
};
