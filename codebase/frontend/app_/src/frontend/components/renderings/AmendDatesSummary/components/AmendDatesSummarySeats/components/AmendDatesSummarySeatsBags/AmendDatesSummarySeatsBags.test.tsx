import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';

import AmendDatesSummarySeatsBags from './AmendDatesSummarySeatsBags';

const createProps = () => ({
    title: 'title',
    fields: 'fields',
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockLuggageInfoProps = jest.fn();
jest.mock('frontend/components/common/Booking/LuggageInfo/LuggageInfo', () => ({
    __esModule: true,
    default: props => {
        mockLuggageInfoProps(props);

        return <div data-tid='luggage-info' />;
    },
}));

jest.mock('frontend/utils/luggage.utils', () => ({
    __esModule: true,
    generateExtraLuggageFullInfo: jest.fn().mockReturnValue('extraLuggageFullInfo'),
    getDefaultBagsOneDirection: jest.fn().mockReturnValue('defaultBagsOneDirection'),
    getGuestAmount: jest.fn().mockReturnValue({
        infants: 1,
        adults: 2,
        children: 3,
    }),
}));

describe('<AmendDatesSummarySeatsBags />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createProps();
    });

    it('should render title and LuggageInfo', () => {
        render(<AmendDatesSummarySeatsBags {...mockProps} />);

        expect(screen.getByText('title')).toBeInTheDocument();
        expect(mockLuggageInfoProps).toHaveBeenCalledWith({
            fields: 'fields',
            defaultBagsOneDirection: 'defaultBagsOneDirection',
            extraLuggageFullInfo: 'extraLuggageFullInfo',
            hideTitle: true,
            infantsNumber: 1,
            titleClassName: 'title',
            guestWithHoldLuggage: 5,
        });
    });
});
