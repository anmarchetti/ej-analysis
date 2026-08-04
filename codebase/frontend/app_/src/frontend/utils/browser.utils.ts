import isBackend from './isBackend';

/**
 * Check if Browser is Internet Explorer
 */
export const isIE = (): boolean => {
    const ua = window.navigator.userAgent;
    const msie = ua.indexOf('MSIE ');

    if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) {
        return true;
    }

    return false;
};

/**
 * Check if device is on iOS
 */
export const isIOS = (): boolean => {
    if (isBackend()) {
        return false;
    }

    return (
        ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(
            navigator.platform,
        ) ||
        // iPad on iOS 13 detection
        (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
    );
};

export const isMobile = (): boolean => {
    if (isBackend()) {
        return false;
    }

    if (isIOS()) {
        return true;
    }

    const regex = /Android|BlackBerry|IEMobile|Opera Mini/i;

    return regex.exec(navigator.userAgent) !== null;
};
