import { createMockStores, mockChangeFeeFields } from 'frontend/__mocks__';

import { useChangeFeeInfo } from './useChangeFeeInfo';

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('useChangeFeeInfo', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            amendFlightsStore: {
                feePP: 0,
            },
            amendDatesStore: {
                feePP: 0,
            },
            amendRoomAndBoardStore: {
                feePP: 0,
            },
            layoutStore: {
                isAmendHotelPage: false,
            },
            amendHotelStore: {
                alternativeHotels: [],
                feePP: 0,
            },
        });
    });

    it('return result when no any feePP exists and no isAmendHotelPage', () => {
        const result = useChangeFeeInfo(mockChangeFeeFields);

        expect(result.isShown).toBe(false);
        expect(result.feePP).toBe(0);
    });

    it('return result when amend flight feePP exists', () => {
        mockStores.amendFlightsStore.feePP = 20;
        const result = useChangeFeeInfo(mockChangeFeeFields);

        expect(result.isShown).toBe(true);
        expect(result.feePP).toBe(20);
    });

    it('return result when amend dates feePP exists', () => {
        mockStores.amendDatesStore.feePP = 21;
        const result = useChangeFeeInfo(mockChangeFeeFields);

        expect(result.isShown).toBe(true);
        expect(result.feePP).toBe(21);
    });

    it('return result when amend room and board feePP exists', () => {
        mockStores.amendRoomAndBoardStore.feePP = 23;
        const result = useChangeFeeInfo(mockChangeFeeFields);

        expect(result.isShown).toBe(true);
        expect(result.feePP).toBe(23);
    });

    it('return result when amend hotel feePP exists', () => {
        mockStores.amendHotelStore.feePP = 50;
        const result = useChangeFeeInfo(mockChangeFeeFields);

        expect(result.isShown).toBe(true);
        expect(result.feePP).toBe(50);
    });

    it('return result when isAmendHotelPage is true and alternativeHotels is NOT empty', () => {
        mockStores.layoutStore.isAmendHotelPage = true;
        const result = useChangeFeeInfo(mockChangeFeeFields);

        expect(result.isShown).toBe(true);
        expect(result.feePP).toBe(20);
    });
});
