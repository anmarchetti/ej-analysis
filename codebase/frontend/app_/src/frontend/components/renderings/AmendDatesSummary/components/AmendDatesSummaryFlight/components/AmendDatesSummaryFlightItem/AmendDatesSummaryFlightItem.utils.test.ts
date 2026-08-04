import { mockOutboundFlight } from 'frontend/__mocks__';

import { getFormattedDate } from './AmendDatesSummaryFlightItem.utils';

describe('AmendDatesSummaryFlightItem.utils', () => {
    describe('getFormattedDate', () => {
        it('Return a full object', () => {
            const result = getFormattedDate(mockOutboundFlight);

            expect(result.date).toBe('Thursday 11 May 2023');
            expect(result.arrivalTime).toBe('16:25');
            expect(result.departureTime).toBe('12:10');
        });

        it('Should return departure date, not arrival dates', () => {
            mockOutboundFlight.depDate = '2023-05-11T23:15:00';
            mockOutboundFlight.arrDate = '2023-05-12T00:00:00';
            const result = getFormattedDate(mockOutboundFlight);

            expect(result.date).toBe('Thursday 11 May 2023');
        });
    });
});
