import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockHoldLuggageFields } from 'frontend/components/renderings/HoldLuggage/__mocks__/mockHoldLuggageFields';
import useLuggageItems from 'frontend/components/renderings/HoldLuggage/hooks/useLuggageItems';

import HoldLuggageSelected, { IHoldLuggageSelectedProps } from './HoldLuggageSelected';

jest.mock('frontend/components/renderings/HoldLuggage/hooks/useLuggageItems', () => ({
    __esModule: true,
    default: jest.fn().mockReturnValue([1, 2, 3, 4]),
}));

const createProps = (): IHoldLuggageSelectedProps => ({
    additionalFields: mockHoldLuggageFields,
    infantsNumber: 1,
});

const createStores = () => ({
    bookingStore: {
        holdLuggage: {
            setHoldLuggagePopupOpened: jest.fn(),
            selectedSportEquipmentPrice: 39,
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

const mockComplementaryBags = jest.fn();
jest.mock('frontend/components/renderings/HoldLuggage/components/ComplementaryBags/ComplementaryBags', () => ({
    __esModule: true,
    default: props => {
        mockComplementaryBags(props);

        return <div data-tid='complementary-bags' />;
    },
}));

describe('HoldLuggageSelected', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render HoldLuggageSelected', () => {
        render(<HoldLuggageSelected {...mockProps} />);

        expect(mockComplementaryBags).toHaveBeenCalledWith({
            infantsNumber: mockProps.infantsNumber,
            additionalFields: mockProps.additionalFields,
        });
        expect(screen.getByTestId('complementary-bags')).toBeInTheDocument();

        expect(mockHoldLuggageRow).toHaveBeenCalledTimes(4);
        expect(screen.queryAllByTestId('hold-luggage-row')).toHaveLength(4);

        expect(useLuggageItems).toHaveBeenCalledWith({
            additionalFields: mockProps.additionalFields,
            selectedSportEquipmentPrice: mockStores.bookingStore.holdLuggage.selectedSportEquipmentPrice,
        });
    });
});
