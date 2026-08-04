import { generateLuggageInfoItemMock, luggageInfoMock, mockDefaultBags } from 'frontend/__mocks__/extraLuggage';

import { getLuggageInfoItems, IGetLuggageInfoItemsProps } from './LuggageInfo.utils';

const createProps = (): IGetLuggageInfoItemsProps => ({
    infantsNumber: 3,
    extraLuggageFullInfo: [
        {
            LUG: { ...luggageInfoMock.items[0], quantity: 1 },
            LUS: generateLuggageInfoItemMock('1', '1', 'LUS', 'BAGE', 3, 40, false, '15kg Extra Hold Bag'),
        },
        { BIKE: { ...luggageInfoMock.items[1], quantity: 2 } },
    ],
    defaultBagsOneDirection: mockDefaultBags,
    pramLabel: 'Pram or Pushchair',
    sportEquipmentsLabel: 'Sports equipment',
    luxuryInternalFlightBagsLabel: undefined,
});

let mockProps;

describe('LuggageInfo.utils', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should return all luggage', () => {
        expect(getLuggageInfoItems(mockProps)).toEqual([
            {
                dataTid: 'default-pram',
                text: '3 x Pram or Pushchair',
            },
            {
                dataTid: 'default-bag',
                text: '4 x 15 kg',
            },
            {
                dataTid: 'hold-luggage-23',
                text: '1 x 23kg Extra Hold Bag',
            },
            {
                dataTid: 'hold-luggage-15',
                text: '3 x 15kg Extra Hold Bag',
            },
            {
                dataTid: 'sport-equipment',
                text: '2 x Sports equipment (2 x Bike)',
            },
        ]);
    });

    it('should return luggage with luxury internal flight bags', () => {
        expect(
            getLuggageInfoItems({
                ...mockProps,
                luxuryInternalFlightBagsLabel: 'LuxuryInternalFlightDefaultBagsLabel',
            }),
        ).toEqual([
            {
                dataTid: 'default-pram',
                text: '3 x Pram or Pushchair',
            },
            {
                dataTid: 'luxury-internal-flight-default-bags',
                text: 'LuxuryInternalFlightDefaultBagsLabel',
            },
        ]);
    });

    it('should return empty array when there is no any bags', () => {
        expect(
            getLuggageInfoItems({
                ...mockProps,
                defaultBagsOneDirection: [],
                extraLuggageFullInfo: [{}, {}],
                infantsNumber: 0,
            }),
        ).toEqual([]);
    });
});
