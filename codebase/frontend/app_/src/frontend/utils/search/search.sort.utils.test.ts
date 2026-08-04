import { destinationMock } from 'frontend/__mocks__';
import { DestinationType } from 'models/enum/DestinationType';

import { sortAnywhereFirst, sortDestinationsByRelevance } from './search.sort.utils';

describe('search.sort.utils', () => {
    describe('sortDestinationsByRelevance', () => {
        it('sortDestinationsByRelevance -> Anywhere destination ', () => {
            const result = sortDestinationsByRelevance(
                { ...destinationMock, type: DestinationType.Anywhere },
                { ...destinationMock, type: DestinationType.Anywhere },
            );
            expect(result).toBe(-1);

            const result2 = sortDestinationsByRelevance(
                { ...destinationMock, type: DestinationType.Airport },
                { ...destinationMock, type: DestinationType.Anywhere },
            );
            expect(result2).toBe(1);
        });

        it('sortDestinationsByRelevance -> Country destination ', () => {
            const result = sortDestinationsByRelevance(
                { ...destinationMock, type: DestinationType.Country },
                { ...destinationMock, type: DestinationType.Airport },
            );
            expect(result).toBe(-1);

            const result2 = sortDestinationsByRelevance(
                { ...destinationMock, type: DestinationType.Airport },
                { ...destinationMock, type: DestinationType.Country },
            );
            expect(result2).toBe(1);
        });

        it('sortDestinationsByRelevance -> VirtualRegion destination ', () => {
            const result = sortDestinationsByRelevance(
                { ...destinationMock, type: DestinationType.VirtualRegion },
                { ...destinationMock, type: DestinationType.Airport },
            );
            expect(result).toBe(-1);

            const result2 = sortDestinationsByRelevance(
                { ...destinationMock, type: DestinationType.Airport },
                { ...destinationMock, type: DestinationType.VirtualRegion },
            );
            expect(result2).toBe(1);
        });

        it('sortDestinationsByRelevance -> any other destination ', () => {
            const result = sortDestinationsByRelevance(
                { ...destinationMock, type: DestinationType.Resort },
                { ...destinationMock, type: DestinationType.Airport },
            );
            expect(result).toBe(0);
        });
    });

    describe('sortAnywhereFirst', () => {
        it('should return -1', () => {
            const result = sortAnywhereFirst({ ...destinationMock, type: DestinationType.Anywhere }, destinationMock);
            expect(result).toBe(-1);
        });

        it('should return 1', () => {
            const result = sortAnywhereFirst(destinationMock, { ...destinationMock, type: DestinationType.Anywhere });
            expect(result).toBe(1);
        });

        it('should return 0', () => {
            const result = sortAnywhereFirst(destinationMock, destinationMock);
            expect(result).toBe(0);
        });
    });
});
