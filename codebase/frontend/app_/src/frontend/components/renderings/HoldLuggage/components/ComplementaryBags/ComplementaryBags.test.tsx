import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockDefaultBags } from 'frontend/__mocks__/extraLuggage';
import { mockHoldLuggageFields } from 'frontend/components/renderings/HoldLuggage/__mocks__/mockHoldLuggageFields';

import ComplementaryBags from './ComplementaryBags';

const createProps = () => ({
    additionalFields: mockHoldLuggageFields,
    infantsNumber: 2,
});

const createStores = () => ({
    bookingStore: {
        extraLuggage: {
            defaultBag: mockDefaultBags[0],
            defaultBagsNumber: 4,
        },
    },
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockHoldLuggageRow = jest.fn();
jest.mock('frontend/components/renderings/HoldLuggage/components/HoldLuggageRow/HoldLuggageRow', () => ({
    __esModule: true,
    default: props => {
        mockHoldLuggageRow(props);

        return <div data-tid='hold-luggage-row' />;
    },
}));

describe('ComplementaryBags', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render nothing when no infants and default bag', () => {
        mockProps.infantsNumber = 0;
        mockStores.bookingStore.extraLuggage.defaultBag = undefined;

        const { container } = render(<ComplementaryBags {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render complementary bags', () => {
        render(<ComplementaryBags {...mockProps} />);

        expect(mockHoldLuggageRow).toHaveBeenNthCalledWith(1, {
            title: '2 x PramHeading',
            description: mockHoldLuggageFields.PramDescription.value,
            icon: mockHoldLuggageFields.PramIcon.value.src,
            includedForFreeText: mockHoldLuggageFields.IncludedForFreeText,
            uniqueId: 'pram',
        });

        expect(mockHoldLuggageRow).toHaveBeenNthCalledWith(2, {
            title: '4 x 15 kg',
            description: 'Description',
            icon: 'src',
            includedForFreeText: mockHoldLuggageFields.IncludedForFreeText,
            uniqueId: mockStores.bookingStore.extraLuggage.defaultBag.itemCode,
        });
        expect(screen.queryAllByTestId('hold-luggage-row').length).toBe(2);
    });

    it('use falback strings for description and icon when they are abcent', () => {
        mockStores.bookingStore.extraLuggage.defaultBag.icon = undefined;
        mockStores.bookingStore.extraLuggage.defaultBag.description = undefined;

        render(<ComplementaryBags {...mockProps} />);

        expect(mockHoldLuggageRow).toHaveBeenCalledWith(
            expect.objectContaining({
                description: '',
                icon: '',
            }),
        );
    });
});
