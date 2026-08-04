import { renderHook } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { generateLuggageInfoItemMock, mockSportLuggageItem } from 'frontend/__mocks__/extraLuggage';
import { mockHoldLuggageFields } from 'frontend/components/renderings/HoldLuggage/__mocks__/mockHoldLuggageFields';

import useLuggageItems, { IUseLuggageItemsProps } from './useLuggageItems';

jest.mock('code/endpoints', () => ({ cmsUrls: { media: jest.fn(() => 'media') } }));

const createProps = (): IUseLuggageItemsProps => ({
    additionalFields: mockHoldLuggageFields,
    selectedSportEquipmentPrice: 39,
});

const selectedLuggageMock = {
    LUS: generateLuggageInfoItemMock(
        '1',
        '1',
        'LUS',
        'BAGE',
        1,
        25,
        false,
        '15kg name',
        '15kg description',
        '15kg icon',
        'LUS',
    ),
};
const selectedSportEquipmentMock = {
    BIKE: generateLuggageInfoItemMock(
        '1',
        '1',
        'BIKE',
        'SEO',
        2,
        25,
        false,
        'Bike name',
        'Bike description',
        'Bike icon',
        'BIKE',
    ),
};

const createStores = () => ({
    layoutStore: {
        isHoldLuggageEnabled: true,
        isSportsEquipmentEnabled: true,
        isExtrasPage: true,
    },
    marketStore: { formatMoney: jest.fn(a => `£${a}`) },
    bookingStore: {
        currency: CurrencyCode.GBP,
        extraLuggage: {
            extraLuggageFullInfo: [selectedLuggageMock, selectedSportEquipmentMock],
            sportEquipmentNumber: 2,
        },
    },
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('useLuggageItems', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should return [] when no additionalFields', () => {
        mockProps.additionalFields = undefined;

        const { result } = renderHook(() => useLuggageItems(mockProps));

        expect(result.current).toEqual([]);
    });

    it('should NOT return hold luggage items when isHoldLuggageEnabled == false', () => {
        mockStores.layoutStore.isHoldLuggageEnabled = false;

        const { result } = renderHook(() => useLuggageItems(mockProps));

        expect(result.current).toEqual([mockSportLuggageItem]);
    });

    it('should NOT return hold luggage items when selectedLuggage is empty', () => {
        mockStores.bookingStore.extraLuggage.extraLuggageFullInfo = [{}, selectedSportEquipmentMock];

        const { result } = renderHook(() => useLuggageItems(mockProps));

        expect(result.current).toEqual([mockSportLuggageItem]);
    });

    it('should NOT return sport equipment items when isSportsEquipmentEnabled == false', () => {
        mockStores.layoutStore.isSportsEquipmentEnabled = false;

        const { result } = renderHook(() => useLuggageItems(mockProps));

        const { EditLabel } = mockProps.additionalFields;

        expect(result.current).toEqual([
            {
                description: selectedLuggageMock.LUS.description,
                editLabel: EditLabel.value,
                icon: selectedLuggageMock.LUS.icon,
                price: '£25',
                title: `1 x ${selectedLuggageMock.LUS.name}`,
                subtitle: undefined,
                uniqueId: selectedLuggageMock.LUS.uniqueId,
            },
        ]);
    });

    it('should return luggage items', () => {
        const { result } = renderHook(() => useLuggageItems(mockProps));

        expect(result.current).toEqual([
            {
                description: selectedLuggageMock.LUS.description,
                editLabel: mockHoldLuggageFields.EditLabel.value,
                icon: selectedLuggageMock.LUS.icon,
                price: '£25',
                title: `1 x ${selectedLuggageMock.LUS.name}`,
                uniqueId: selectedLuggageMock.LUS.uniqueId,
            },
            mockSportLuggageItem,
        ]);
    });
});
