import { trackPageView as innerTrackPageView } from './rumPageView';

/**
 * Facade for Splunk RUM (Real User Monitoring) functionality.
 */
export const rum = {
    trackPageView: innerTrackPageView,
};
