import isBackend from 'frontend/utils/isBackend';

const isUrlLocal = (url?: string): boolean =>
    !!(url?.startsWith('https://web.local.') || url?.startsWith('http://localhost/'));

export const isAnalyticsDisabled = (pageReferral?: string): boolean =>
    isBackend() || (typeof NO_ANALYTICS !== 'undefined' && NO_ANALYTICS === true) || isUrlLocal(pageReferral);
