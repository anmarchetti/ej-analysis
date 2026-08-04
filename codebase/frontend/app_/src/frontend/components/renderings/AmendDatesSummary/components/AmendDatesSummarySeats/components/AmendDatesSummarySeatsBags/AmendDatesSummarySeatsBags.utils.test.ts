import { mockLuggageInfo } from 'frontend/__mocks__';

import { getLuggageMetaData } from './AmendDatesSummarySeatsBags.utils';

describe('AmendDatesSummarySeatsBags.utils', () => {
    describe('getLuggageMetaData', () => {
        it('Return multiple luggage', () => {
            const result = getLuggageMetaData(mockLuggageInfo);

            expect(result.length).toBe(2);
            expect(result[0].name).toBe('Luggage.Labels.HoldBagSingular');
            expect(result[1].name).toBe('Luggage.Labels.HoldBagSingular');
        });

        it('Return single luggage', () => {
            const result = getLuggageMetaData({
                ...mockLuggageInfo,
                items: [
                    mockLuggageInfo.items[0],
                    { ...mockLuggageInfo.items[1], itemCode: mockLuggageInfo.items[0].itemCode },
                ],
            });

            expect(result.length).toBe(1);
            expect(result[0].name).toBe('Luggage.Labels.HoldBagsPlural');
        });
    });
});
