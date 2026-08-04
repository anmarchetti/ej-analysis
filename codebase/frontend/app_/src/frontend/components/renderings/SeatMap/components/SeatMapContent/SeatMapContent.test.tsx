import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import SeatMapContent, { ISeatMapHeadContentFields } from './SeatMapContent';

const createProps = (): ISeatMapHeadContentFields => ({
    SeatsMapTitle: mockSitecoreField('SeatsMapTitle'),
    SeatsMapTitleLuxury: mockSitecoreField('SeatsMapTitleLuxury'),
    SeatsMapTitleMobile: mockSitecoreField('SeatsMapTitleMobile'),
    SeatsSubtitle: mockSitecoreField('SeatsSubtitle'),
    SeatsSubtitleLuxury: mockSitecoreField('SeatsSubtitleLuxury'),
});

const createStores = () =>
    createMockStores({
        appStore: {
            isScreenLarge: true,
        },
    });

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('SeatMapContent', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render SeatMapContent', () => {
        render(<SeatMapContent {...mockProps} />);

        expect(screen.queryByTestId('seat-map-content')).toBeInTheDocument();
        expect(screen.queryByText('SeatsMapTitle')).toHaveClass('title');
        expect(screen.queryByText('SeatsMapTitleMobile')).not.toBeInTheDocument();
        expect(screen.queryByText('SeatsSubtitle')).toBeInTheDocument();
        expect(screen.queryByTestId('seat-map')).toBeInTheDocument();
    });

    it('should render different content for mobile', () => {
        mockStores.appStore.isScreenLarge = false;

        render(<SeatMapContent {...mockProps} />);

        expect(screen.queryByText('SeatsMapTitle')).not.toBeInTheDocument();
        expect(screen.queryByText('SeatsMapTitleMobile')).toBeInTheDocument();
        expect(screen.queryByText('SeatsSubtitle')).toBeInTheDocument();
    });

    it('should render luxury content when isLuxuryPackage is true', () => {
        mockStores.bookingStore.isLuxuryPackage = true;

        render(<SeatMapContent {...mockProps} />);

        expect(screen.getByText('SeatsMapTitleLuxury')).toBeInTheDocument();
        expect(screen.getByText('SeatsSubtitleLuxury')).toBeInTheDocument();
    });

    it('should render luxury content when isLuxuryPackage is true', () => {
        mockStores.viewBookingStore.isLuxuryPackage = true;

        render(<SeatMapContent {...mockProps} />);

        expect(screen.getByText('SeatsMapTitleLuxury')).toBeInTheDocument();
        expect(screen.getByText('SeatsSubtitleLuxury')).toBeInTheDocument();
    });
});
