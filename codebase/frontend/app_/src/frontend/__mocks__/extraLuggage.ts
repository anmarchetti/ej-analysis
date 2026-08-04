import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { IFlightExtras, ILuggageInfoItem } from 'models/data/IFlightExtras';
import { HoldLuggageCategory } from 'models/enum/HoldLuggage';
import { mockHoldLuggageFields } from 'frontend/components/renderings/HoldLuggage/__mocks__/mockHoldLuggageFields';
import { IHoldLuggageRowProps } from 'frontend/components/renderings/HoldLuggage/components/HoldLuggageRow/HoldLuggageRow';

export const generateLuggageInfoItemMock = (
    routeId: string,
    passengerId: string,
    itemCode: string,
    itemCategoryCode: string,
    quantity: number,
    price: number,
    isComplimentary?: boolean,
    name?: string,
    description?: string,
    icon?: string,
    uniqueId?: string,
): ILuggageInfoItem => ({
    routeId,
    passengerId,
    itemCode,
    itemCategoryCode,
    quantity,
    price,
    isComplimentary: !!isComplimentary,
    name: name || 'Bag',
    description: description || 'Description',
    icon: icon || 'src',
    uniqueId,
});

export const validatedLuggageInfoMock = {
    items: [
        generateLuggageInfoItemMock('1', '1', 'LUG', 'BAGE', 1, 25),
        generateLuggageInfoItemMock('1', '1', 'BIKE', 'SEO', 1, 40),
        generateLuggageInfoItemMock('2', '1', 'LUG', 'BAGE', 1, 15),
        generateLuggageInfoItemMock('2', '1', 'BIKE', 'SEO', 1, 50),
    ],
};

export const smallSportEquipmentMock = {
    items: [
        generateLuggageInfoItemMock('1', '1', 'GBAG', 'SEC', 1, 75, false, 'Golf Bag'),
        generateLuggageInfoItemMock('2', '1', 'GBAG', 'SEC', 1, 75, false, 'Golf Bag'),
        generateLuggageInfoItemMock('1', '2', 'GBAG', 'SEC', 1, 75, false, 'Golf Bag'),
        generateLuggageInfoItemMock('2', '2', 'GBAG', 'SEC', 1, 75, false, 'Golf Bag'),
    ],
};

export const luggageInfoMock = {
    items: [
        generateLuggageInfoItemMock('1', '1', 'LUG', 'BAGE', 1, 40, false, '23kg Extra Hold Bag'),
        generateLuggageInfoItemMock('1', '1', 'BIKE', 'SEO', 1, 90, false, 'Bike'),
        generateLuggageInfoItemMock('2', '1', 'LUG', 'BAGE', 1, 40, false, '23kg Extra Hold Bag'),
        generateLuggageInfoItemMock('2', '1', 'BIKE', 'SEO', 1, 90, false, 'Bike'),
    ],
};

export const cabinBagsMock = {
    items: [
        generateLuggageInfoItemMock('1', '1', 'SCB1', 'CABI', 1, 60),
        generateLuggageInfoItemMock('2', '1', 'SCB1', 'CABI', 1, 30),
    ],
};

export const extraLuggageInfoMock = {
    items: [...cabinBagsMock.items, ...luggageInfoMock.items],
};

export const luggageInfoMockAlt = {
    items: [
        generateLuggageInfoItemMock('1', '1', 'LUG', 'BAGE', 2, 50),
        generateLuggageInfoItemMock('1', '1', 'BIKE', 'SEO', 2, 100),
    ],
};

export const bookingExtrasMock = [
    {
        routeId: '1',
        flightNumber: '8743',
        flightExtraCategories: [
            {
                categoryCode: 'BAGE',
                categoryName: 'Hold Baggage',
                categoryType: 'Bag',
                flightExtras: [
                    {
                        flightExtraCode: 'LUG',
                        name: 'Hold Baggage 23kg',
                        availableQuantity: 99,
                        adultPrice: 25,
                        childPrice: 20,
                        limitPerPax: 3,
                    },
                    {
                        flightExtraCode: 'LUS',
                        name: 'Hold Baggage 15kg',
                        availableQuantity: 99,
                        adultPrice: 41.99,
                        childPrice: 41.99,
                        limitPerPax: 2,
                    },
                ],
            },
            {
                categoryCode: 'SEC',
                categoryName: 'Small Sports Equipment',
                categoryType: 'Sports Equipment',
                flightExtras: [
                    {
                        flightExtraCode: 'GBAG',
                        name: 'Golf Bag',
                        availableQuantity: 99,
                        adultPrice: 37,
                        childPrice: 37,
                        limitPerPax: 1,
                    },
                    {
                        flightExtraCode: 'OSSE',
                        name: 'Other small sporting equipment',
                        availableQuantity: 99,
                        adultPrice: 37,
                        childPrice: 37,
                        limitPerPax: 1,
                    },
                    {
                        flightExtraCode: 'SKBT',
                        name: 'Skis and or Boots',
                        availableQuantity: 99,
                        adultPrice: 37,
                        childPrice: 37,
                        limitPerPax: 1,
                    },
                    {
                        flightExtraCode: 'SNBD',
                        name: 'Snowboard',
                        availableQuantity: 99,
                        adultPrice: 37,
                        childPrice: 37,
                        limitPerPax: 1,
                    },
                ],
            },
            {
                categoryCode: 'SEO',
                categoryName: 'Large Sports Equipment',
                categoryType: 'Sports Equipment',
                flightExtras: [
                    {
                        flightExtraCode: 'BIKE',
                        name: 'Bicycle',
                        availableQuantity: 99,
                        adultPrice: 40,
                        childPrice: 45,
                        limitPerPax: 1,
                    },
                    {
                        flightExtraCode: 'CANO',
                        name: 'Canoe/Kayak',
                        availableQuantity: 99,
                        adultPrice: 45,
                        childPrice: 45,
                        limitPerPax: 1,
                    },
                    {
                        flightExtraCode: 'HGLD',
                        name: 'Hang glider',
                        availableQuantity: 99,
                        adultPrice: 45,
                        childPrice: 45,
                        limitPerPax: 1,
                    },
                    {
                        flightExtraCode: 'WDSF',
                        name: 'Windsurfer',
                        availableQuantity: 99,
                        adultPrice: 45,
                        childPrice: 45,
                        limitPerPax: 1,
                    },
                ],
            },
            {
                categoryCode: 'CABI',
                categoryName: 'Cabin Bags',
                categoryType: 'Cabin Bags',
                flightExtras: [
                    {
                        flightExtraCode: 'SCB1',
                        availableQuantity: 84,
                        adultPrice: 15.99,
                        childPrice: 15.99,
                        limitPerPax: 3,
                        name: 'Large Cabin Bags',
                        description: 'LCB description',
                        icon: 'LCB icon',
                    },
                ],
            },
        ],
    },
    {
        routeId: '2',
        flightNumber: '8744',
        flightExtraCategories: [
            {
                categoryCode: 'BAGE',
                categoryName: 'Hold Baggage',
                categoryType: 'Bag',
                flightExtras: [
                    {
                        flightExtraCode: 'LUG',
                        name: 'Hold Baggage 23kg',
                        availableQuantity: 99,
                        adultPrice: 15,
                        childPrice: 20,
                        limitPerPax: 3,
                    },
                    {
                        flightExtraCode: 'LUS',
                        name: 'Hold Baggage 15kg',
                        availableQuantity: 99,
                        adultPrice: 41.99,
                        childPrice: 41.99,
                        limitPerPax: 2,
                    },
                ],
            },
            {
                categoryCode: 'SEC',
                categoryName: 'Small Sports Equipment',
                categoryType: 'Sports Equipment',
                flightExtras: [
                    {
                        flightExtraCode: 'GBAG',
                        name: 'Golf Bag',
                        availableQuantity: 99,
                        adultPrice: 37,
                        childPrice: 37,
                        limitPerPax: 1,
                    },
                    {
                        flightExtraCode: 'OSSE',
                        name: 'Other small sporting equipment',
                        availableQuantity: 99,
                        adultPrice: 37,
                        childPrice: 37,
                        limitPerPax: 1,
                    },
                    {
                        flightExtraCode: 'SKBT',
                        name: 'Skis and or Boots',
                        availableQuantity: 99,
                        adultPrice: 37,
                        childPrice: 37,
                        limitPerPax: 1,
                    },
                    {
                        flightExtraCode: 'SNBD',
                        name: 'Snowboard',
                        availableQuantity: 99,
                        adultPrice: 37,
                        childPrice: 37,
                        limitPerPax: 1,
                    },
                ],
            },
            {
                categoryCode: 'SEO',
                categoryName: 'Large Sports Equipment',
                categoryType: 'Sports Equipment',
                flightExtras: [
                    {
                        flightExtraCode: 'BIKE',
                        name: 'Bicycle',
                        availableQuantity: 99,
                        adultPrice: 50,
                        childPrice: 45,
                        limitPerPax: 1,
                    },
                    {
                        flightExtraCode: 'CANO',
                        name: 'Canoe/Kayak',
                        availableQuantity: 99,
                        adultPrice: 45,
                        childPrice: 45,
                        limitPerPax: 1,
                    },
                    {
                        flightExtraCode: 'HGLD',
                        name: 'Hang glider',
                        availableQuantity: 99,
                        adultPrice: 45,
                        childPrice: 45,
                        limitPerPax: 1,
                    },
                    {
                        flightExtraCode: 'WDSF',
                        name: 'Windsurfer',
                        availableQuantity: 99,
                        adultPrice: 45,
                        childPrice: 45,
                        limitPerPax: 1,
                    },
                ],
            },
            {
                categoryCode: 'CABI',
                categoryName: 'Cabin Bags',
                categoryType: 'Cabin Bags',
                flightExtras: [
                    {
                        flightExtraCode: 'SCB1',
                        availableQuantity: 84,
                        adultPrice: 15.99,
                        childPrice: 15.99,
                        limitPerPax: 3,
                        name: 'Large Cabin Bags',
                        description: 'LCB description',
                        icon: 'LCB icon',
                    },
                ],
            },
        ],
    },
] as IFlightExtras[];

export const luggagePricesMock = {
    BIKE: 90,
    CANO: 90,
    GBAG: 74,
    HGLD: 90,
    LUG: 40,
    LUS: 83.98,
    OSSE: 74,
    SKBT: 74,
    SNBD: 74,
    WDSF: 90,
};

export const luggageTypesMock = {
    BIKE: {
        categoryCode: 'SEO',
        categoryType: HoldLuggageCategory.SportBag,
        name: 'Bicycle',
    },
    CANO: {
        categoryCode: 'SEO',
        categoryType: HoldLuggageCategory.SportBag,
        name: 'Canoe/Kayak',
    },
    GBAG: {
        categoryCode: 'SEC',
        categoryType: HoldLuggageCategory.SportBag,
        name: 'Golf Bag',
    },
    HGLD: {
        categoryCode: 'SEO',
        categoryType: HoldLuggageCategory.SportBag,
        name: 'Hang glider',
    },
    LUG: {
        categoryCode: 'BAGE',
        categoryType: HoldLuggageCategory.Bag,
        name: 'Hold Baggage 23kg',
    },
    LUS: {
        categoryCode: 'BAGE',
        categoryType: HoldLuggageCategory.Bag,
        name: 'Hold Baggage 15kg',
    },
    OSSE: {
        categoryCode: 'SEC',
        categoryType: HoldLuggageCategory.SportBag,
        name: 'Other small sporting equipment',
    },
    SKBT: {
        categoryCode: 'SEC',
        categoryType: HoldLuggageCategory.SportBag,
        name: 'Skis and or Boots',
    },
    SNBD: {
        categoryCode: 'SEC',
        categoryType: HoldLuggageCategory.SportBag,
        name: 'Snowboard',
    },
    WDSF: {
        categoryCode: 'SEO',
        categoryType: HoldLuggageCategory.SportBag,
        name: 'Windsurfer',
    },
    SCB1: {
        categoryCode: 'CABI',
        categoryType: HoldLuggageCategory.CabinBags,
        name: 'Large Cabin Bags',
    },
};

export const luggageSettingsMock = {
    largeSportEquipmentCategoryCode: 'SEO',
    maxNumberOfLargeSportsEquipment: 6,
    maxNumberOfAdditionalLuggage: 2,
    maxNumberOfSportEquipments: 1,
};

export const holdLuggageItemsMock = [
    {
        id: '342ef02f-5bbe-4410-a1d0-032241676ea7',
        fields: {
            Description: mockSitecoreField('Description1'),
            Name: mockSitecoreField('Name1'),
            Code: mockSitecoreField('LUS'),
            Icon: mockSitecoreField(mockSitecoreImageField('LusIcon')),
        },
    },
    {
        id: 'd26e768e-1ef1-45f8-be51-1380752bccff',
        fields: {
            Description: mockSitecoreField('Description2'),
            Name: mockSitecoreField('Name2'),
            Code: mockSitecoreField('LUG'),
            Icon: mockSitecoreField(mockSitecoreImageField('LugIcon')),
        },
    },
];

export const mockDefaultBags = [
    generateLuggageInfoItemMock('1', '1', 'COMPLEMENTARY', 'BAGE', 1, 0, true, '15 kg'),
    generateLuggageInfoItemMock('1', '1', 'COMPLEMENTARY', 'BAGE', 1, 0, true, '15 kg'),
    generateLuggageInfoItemMock('2', '1', 'COMPLEMENTARY', 'BAGE', 1, 0, true, '15 kg'),
    generateLuggageInfoItemMock('2', '1', 'COMPLEMENTARY', 'BAGE', 1, 0, true, '15 kg'),
];

export const mockSportLuggageItem: IHoldLuggageRowProps = {
    description: mockHoldLuggageFields.SportDescription.value,
    editLabel: mockHoldLuggageFields.EditLabel.value,
    icon: mockHoldLuggageFields.SportEquipmentIcon.value.src,
    price: '£39',
    subtitle: '(2 x Bike name)',
    title: '2 x SportTitle',
    feesWarning: '(excl. transfer costs)',
    uniqueId: 'sport-equipment',
};
