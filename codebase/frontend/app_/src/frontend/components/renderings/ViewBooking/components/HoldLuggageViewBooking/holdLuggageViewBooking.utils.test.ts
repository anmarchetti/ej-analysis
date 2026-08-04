import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import { formatLuggageItems } from './holdLuggageViewBooking.utils';

const createProps = () => ({
    selectedItems: [
        {
            LUS: {
                name: 'Hold Baggage 15kg',
                description: 'Description2',
                icon: 'Icon2',
                quantity: 3,
                isComplimentary: false,
            },
        },
        {
            KAYAK: {
                name: 'Kayak',
                description: 'Description3',
                icon: 'Icon3',
                quantity: 2,
                isComplimentary: false,
            },
        },
    ],
    defaultBag: {
        name: 'Hold Baggage 23kg',
        description: 'Description1',
        icon: 'Icon1',
        quantity: 1,
        isComplimentary: true,
    },
    infantsNumber: 0,
    sportItemsTotalCount: 2,
    additionalFields: {
        Icon: { value: { src: 'pram icon' } },
        Storage: { value: 'storage' },
        Limit: { value: 'limit' },
        LuggageIcon: mockSitecoreField(mockSitecoreImageField('luggage icon')),
        Name: { value: 'pram' },
        SportsEquipmentIcon: { value: { src: 'sports icon' } },
        SportsEquipmentTitle: { value: 'sports title' },
    },
    shouldIncludeOnlyBasicLuggage: false,
    defaultBagsNumber: 1,
});

let mockProps;

describe('formatLuggageItems', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should return array with all selected luggage items', () => {
        const result = formatLuggageItems(
            mockProps.selectedItems,
            mockProps.defaultBag,
            mockProps.infantsNumber,
            mockProps.sportItemsTotalCount,
            mockProps.additionalFields,
            mockProps.shouldIncludeOnlyBasicLuggage,
            mockProps.defaultBagsNumber,
        );

        const { Limit, Storage, LuggageIcon, SportsEquipmentTitle, SportsEquipmentIcon } = mockProps.additionalFields;

        expect(result[0]).toStrictEqual({
            quantity: mockProps.defaultBag.quantity,
            name: mockProps.defaultBag.name,
            description: `${Limit?.value} ${Storage?.value}`,
            icon: LuggageIcon,
        });

        expect(result[1]).toStrictEqual({
            quantity: mockProps.selectedItems[0]['LUS'].quantity,
            name: mockProps.selectedItems[0]['LUS'].name,
            description: `${Limit?.value} ${Storage?.value}`,
            icon: LuggageIcon,
        });

        expect(result[2]).toStrictEqual({
            quantity: mockProps.sportItemsTotalCount,
            name: SportsEquipmentTitle.value,
            description: `${mockProps.selectedItems[1]['KAYAK'].name} x ${mockProps.selectedItems[1]['KAYAK'].quantity}. ${Storage?.value}`,
            icon: SportsEquipmentIcon,
        });
    });

    it('should correctly handle luggage items for infants', () => {
        mockProps.infantsNumber = 5;

        const result = formatLuggageItems(
            mockProps.selectedItems,
            mockProps.defaultBag,
            mockProps.infantsNumber,
            mockProps.sportItemsTotalCount,
            mockProps.additionalFields,
            mockProps.shouldIncludeOnlyBasicLuggage,
            mockProps.defaultBagsNumber,
        );

        expect(result[0]).toStrictEqual({
            quantity: mockProps.infantsNumber,
            name: 'pram',
            description: 'storage',
            icon: { value: { src: 'pram icon' } },
        });
    });

    it('should correctly handle selected sports equipment', () => {
        mockProps.sportItemsTotalCount = 3;
        mockProps.selectedItems = [
            {
                LUG: {
                    name: 'Hold Baggage 23kg',
                    description: 'Description1',
                    icon: 'Icon1',
                    quantity: 1,
                    isComplimentary: true,
                },
                LUS: {
                    name: 'Hold Baggage 15kg',
                    description: 'Description2',
                    icon: 'Icon2',
                    quantity: 3,
                    isComplimentary: false,
                },
            },
            {
                BIKE: {
                    name: 'Bike',
                    description: 'Bike description',
                    icon: 'BikeIcon',
                    quantity: 2,
                    isComplimentary: false,
                },
                CANO: {
                    name: 'Canoe',
                    description: 'Canoe description',
                    icon: 'CanoeIcon',
                    quantity: 1,
                    isComplimentary: false,
                },
            },
        ];

        const result = formatLuggageItems(
            mockProps.selectedItems,
            mockProps.defaultBag,
            mockProps.infantsNumber,
            mockProps.sportItemsTotalCount,
            mockProps.additionalFields,
            mockProps.shouldIncludeOnlyBasicLuggage,
            mockProps.defaultBagsNumber,
        );

        expect(result).toEqual(
            expect.arrayContaining([
                {
                    quantity: mockProps.sportItemsTotalCount,
                    name: 'sports title',
                    description: expect.stringContaining('. storage'),
                    icon: { value: { src: 'sports icon' } },
                },
            ]),
        );
    });

    it('should include only basic luggage when shouldIncludeOnlyBasicLuggage is true', () => {
        mockProps.shouldIncludeOnlyBasicLuggage = true;

        const result = formatLuggageItems(
            mockProps.selectedItems,
            mockProps.defaultBag,
            mockProps.infantsNumber,
            mockProps.sportItemsTotalCount,
            mockProps.additionalFields,
            mockProps.shouldIncludeOnlyBasicLuggage,
            mockProps.defaultBagsNumber,
        );

        const { Limit, Storage, LuggageIcon } = mockProps.additionalFields;

        expect(result[0]).toStrictEqual({
            quantity: mockProps.defaultBag.quantity,
            name: mockProps.defaultBag.name,
            description: `${Limit?.value} ${Storage?.value}`,
            icon: LuggageIcon,
        });

        expect(result).not.toContainEqual({
            quantity: mockProps.selectedItems[0]['LUS'].quantity,
            name: mockProps.selectedItems[0]['LUS'].name,
            description: `${Limit?.value} ${Storage?.value}`,
            icon: LuggageIcon,
        });
    });
});
