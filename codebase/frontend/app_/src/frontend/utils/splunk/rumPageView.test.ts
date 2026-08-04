import { trace } from '@opentelemetry/api';

import { logger } from 'frontend/services/logging';
import isBackend from 'frontend/utils/isBackend';
import SitecoreTemplateId from 'models/enum/SitecoreTemplateId';

import { trackPageView } from './rumPageView';

jest.mock('frontend/services/logging', () => ({
    logger: {
        error: jest.fn(),
    },
}));

jest.mock('@opentelemetry/api', () => ({
    trace: {
        getTracer: jest.fn(() => ({
            startSpan: jest.fn(() => ({
                end: jest.fn(),
            })),
        })),
    },
}));

jest.mock('../isBackend', () => ({
    __esModule: true,
    default: jest.fn(() => false),
}));

describe('rumPageView', () => {
    beforeEach(() => {
        jest.mocked(isBackend).mockReturnValue(false);
    });

    describe('trackPageView', () => {
        it.each<[string, (typeof SitecoreTemplateId)[keyof typeof SitecoreTemplateId]]>([
            ['home.view', SitecoreTemplateId.HomePage],
            ['searchResults.view', SitecoreTemplateId.SearchResultsPage],
            ['hotelDetails.view', SitecoreTemplateId.HotelDetailsBook],
            ['extras.view', SitecoreTemplateId.ExtrasPage],
            ['guestDetails.view', SitecoreTemplateId.GuestDetailsPage],
            ['bookingConfirmation.view', SitecoreTemplateId.BookingConfirmationPage],
        ])('should start span with workflow.name %s', (workflowName, templateId) => {
            const mockEnd = jest.fn();
            const mockStartSpan = jest.fn(() => ({ end: mockEnd }));
            const mockGetTracer = jest.fn(() => ({ startSpan: mockStartSpan }));
            (trace as unknown as { getTracer: jest.Mock }).getTracer = mockGetTracer;

            trackPageView(templateId);

            expect(mockGetTracer).toHaveBeenCalledWith('ejh-page-view', '1.0');
            expect(mockStartSpan).toHaveBeenCalledWith('pageView', {
                attributes: { 'workflow.name': workflowName },
            });
            expect(mockEnd).toHaveBeenCalled();
        });

        it.each<[string, string | undefined]>([
            ['undefined', undefined],
            ['non-MVP template', SitecoreTemplateId.NotFoundPage],
        ])('should not start a span when %s', (_label, templateId) => {
            const mockStartSpan = jest.fn(() => ({ end: jest.fn() }));
            (trace as unknown as { getTracer: jest.Mock }).getTracer = jest.fn(() => ({
                startSpan: mockStartSpan,
            }));

            trackPageView(templateId);

            expect(mockStartSpan).not.toHaveBeenCalled();
        });

        it('should not start a span when isBackend returns true', () => {
            jest.mocked(isBackend).mockReturnValue(true);
            const mockStartSpan = jest.fn(() => ({ end: jest.fn() }));
            (trace as unknown as { getTracer: jest.Mock }).getTracer = jest.fn(() => ({
                startSpan: mockStartSpan,
            }));

            trackPageView(SitecoreTemplateId.HomePage);

            expect(mockStartSpan).not.toHaveBeenCalled();
        });

        it('should log error and not throw when startSpan throws', () => {
            const tracerError = new Error('Tracer failed');
            const mockGetTracer = jest.fn(() => ({
                startSpan: jest.fn(() => {
                    throw tracerError;
                }),
            }));
            (trace as unknown as { getTracer: jest.Mock }).getTracer = mockGetTracer;
            jest.mocked(logger.error).mockClear();

            trackPageView(SitecoreTemplateId.HomePage);

            expect(logger.error).toHaveBeenCalledTimes(1);
            expect(logger.error).toHaveBeenCalledWith({
                e: tracerError,
                message: 'Splunk RUM page view failed. workflowName=home.view, error=Tracer failed',
            });
        });

        it('should log error with stringified message when thrown value is not an Error', () => {
            const nonErrorThrow = { reason: 'string error' };
            const mockGetTracer = jest.fn(() => ({
                startSpan: jest.fn(() => {
                    throw nonErrorThrow;
                }),
            }));
            (trace as unknown as { getTracer: jest.Mock }).getTracer = mockGetTracer;
            jest.mocked(logger.error).mockClear();

            trackPageView(SitecoreTemplateId.HomePage);

            expect(logger.error).toHaveBeenCalledTimes(1);
            expect(logger.error).toHaveBeenCalledWith({
                e: expect.any(Error),
                message: expect.stringMatching(
                    /Splunk RUM page view failed\. workflowName=home\.view, error=\[object Object\]/,
                ),
            });
        });
    });
});
