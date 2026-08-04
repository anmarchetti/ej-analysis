import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores, mockAmendDatesStore } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import AmendDatesDetails from './AmendDatesDetails';

const mockHolidaySummaryProps = jest.fn();
jest.mock('frontend/components/common/HolidaySummary/HolidaySummary', () => ({
    __esModule: true,
    default: props => {
        mockHolidaySummaryProps(props);

        return <div data-tid='holiday-summary' />;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const createMockProps = () => ({
    fields: {
        HoldLuggageItems: mockSitecoreField('Hold luggage'),
    },
});

let mockStores;
let mockProps;

describe('AmendDatesDetails', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createMockProps();
    });

    it('should render', () => {
        render(<AmendDatesDetails {...mockProps} />);

        expect(screen.getByTestId('holiday-summary')).toBeInTheDocument();
        expect(mockHolidaySummaryProps).toHaveBeenCalledWith({
            booking: mockAmendDatesStore.booking,
            flights: mockAmendDatesStore.offer!.transport,
            transfer: mockAmendDatesStore.offer!.transfers[0],
            accom: mockAmendDatesStore.offer!.accom,
            selectedSeats: mockAmendDatesStore.offer!.seatSelection,
            luggageInfo: mockAmendDatesStore.offerWithPrices?.offer.extraLuggageInfo,
            dataTidPrefix: 'amend-payment',
            luggageInfoFields: mockProps.fields,
            cabinBagsInfoFields: mockProps.fields,
        });
    });

    it('should not render if no booking', () => {
        mockStores.amendDatesStore.booking = null;

        render(<AmendDatesDetails {...mockProps} />);

        expect(screen.queryByTestId('holiday-summary')).not.toBeInTheDocument();
    });

    it('should not render if no offer', () => {
        mockStores.amendDatesStore.offer = null;

        render(<AmendDatesDetails {...mockProps} />);

        expect(screen.queryByTestId('holiday-summary')).not.toBeInTheDocument();
    });
});
