import { trace } from '@opentelemetry/api';

import { logger } from 'frontend/services/logging';
import isBackend from 'frontend/utils/isBackend';
import SitecoreTemplateId from 'models/enum/SitecoreTemplateId';
import TradePortalSitecoreTemplateId from 'models/enum/tradePortal/TradePortalSitecoreTemplateId';

const RUM_TRACER_NAME = 'ejh-page-view';
const RUM_PAGE_VIEW_WORKFLOW_NAME = 'pageView';
const RUM_TRACER_VERSION = '1.0';

const getWorkflowNameForTemplateId = (templateId: string | undefined): string | undefined => {
    if (!templateId) return undefined;

    switch (templateId) {
        case SitecoreTemplateId.HomePage:
        case TradePortalSitecoreTemplateId.HomePage:
            return 'home.view';
        case SitecoreTemplateId.SearchResultsPage:
        case TradePortalSitecoreTemplateId.SearchResultsPage:
            return 'searchResults.view';
        case SitecoreTemplateId.HotelDetailsBook:
        case SitecoreTemplateId.HotelDetailsBrowse:
        case TradePortalSitecoreTemplateId.HotelDetailsBook:
        case TradePortalSitecoreTemplateId.HotelDetailsBrowse:
            return 'hotelDetails.view';
        case SitecoreTemplateId.ExtrasPage:
        case TradePortalSitecoreTemplateId.ExtrasPage:
            return 'extras.view';
        case SitecoreTemplateId.GuestDetailsPage:
        case TradePortalSitecoreTemplateId.GuestDetailsPage:
            return 'guestDetails.view';
        case SitecoreTemplateId.BookingConfirmationPage:
        case TradePortalSitecoreTemplateId.BookingConfirmationPage:
            return 'bookingConfirmation.view';
        default:
            return undefined;
    }
};

/**
 * Records a page view as a Splunk RUM custom event (OpenTelemetry span with workflow.name) when the given
 * template ID maps to a workflow name.
 * No-op on server, when templateId is not mapped, or when RUM is unavailable.
 */
export const trackPageView = (templateId: string | undefined): void => {
    if (isBackend()) return;

    const workflowName = getWorkflowNameForTemplateId(templateId);

    if (!workflowName) return;

    try {
        const tracer = trace.getTracer(RUM_TRACER_NAME, RUM_TRACER_VERSION);
        const span = tracer.startSpan(RUM_PAGE_VIEW_WORKFLOW_NAME, {
            attributes: {
                'workflow.name': workflowName,
            },
        });
        span.end();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error({
            e: error instanceof Error ? error : new Error(String(error)),
            message: `Splunk RUM page view failed. workflowName=${workflowName}, error=${errorMessage}`,
        });
    }
};
