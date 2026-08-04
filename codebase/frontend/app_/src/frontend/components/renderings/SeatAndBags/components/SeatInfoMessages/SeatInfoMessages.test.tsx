import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__';
import { mockSeatsAndBagsFields } from 'frontend/components/renderings/SeatAndBags/__mocks__/mockSeatAndBagsFields';

import SeatInfoMessages, { ISeatInfoMessagesProps } from './SeatInfoMessages';

expect.extend(toHaveNoViolations);

let mockProps: ISeatInfoMessagesProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockInfoBlockProps = jest.fn();
jest.mock('frontend/components/common/InfoBlock/InfoBlock', () => ({
    __esModule: true,
    default: props => {
        mockInfoBlockProps(props);

        return <div data-tid='info-block' />;
    },
}));

describe('<SeatInfoMessages />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = {
            fields: mockSeatsAndBagsFields,
            shouldShowInfoMessage: false,
            shouldShowNotAvailableMessage: false,
            shouldShowOutOfSyncMessage: false,
            shouldShowWarning: false,
        };
    });

    it('Should render nothing when no any type were provided', () => {
        const { container } = render(<SeatInfoMessages {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should render info message when shouldShowInfoMessage was provided', () => {
        mockProps.shouldShowInfoMessage = true;
        render(<SeatInfoMessages {...mockProps} />);

        expect(screen.getByTestId('info-block')).toBeInTheDocument();
        expect(mockInfoBlockProps).toHaveBeenCalledWith(
            expect.objectContaining({
                title: { value: 'SeriesSeatFlightsTitle' },
                className: 'failureBanner infoMessage',
                text: { value: 'SeriesSeatFlights' },
                dataTid: 'seats-unavailable-30-days-before-departure',
            }),
        );
    });

    it('Should render info message when shouldShowNotAvailableMessage was provided', () => {
        mockProps.shouldShowNotAvailableMessage = true;
        render(<SeatInfoMessages {...mockProps} />);

        expect(screen.getByTestId('info-block')).toBeInTheDocument();
        expect(mockInfoBlockProps).toHaveBeenCalledWith(
            expect.objectContaining({
                title: { value: 'SeatsSwitchedOffTitle' },
                text: { value: 'SeatsSwitchedOff' },
                className: 'failureBanner',
                dataTid: 'seats-switched-off',
            }),
        );
    });

    it('Should render info message when shouldShowOutOfSyncMessage was provided', () => {
        mockProps.shouldShowOutOfSyncMessage = true;
        render(<SeatInfoMessages {...mockProps} />);

        expect(screen.getByTestId('info-block')).toBeInTheDocument();
        expect(mockInfoBlockProps).toHaveBeenCalledWith(
            expect.objectContaining({
                title: { value: 'BookingOutOfSyncTitle' },
                className: 'failureBanner',
                text: { value: 'BookingOutOfSync' },
                dataTid: 'view-selected-seats',
            }),
        );
    });

    it('Should render info message when shouldShowWarning was provided', () => {
        mockProps.shouldShowWarning = true;
        render(<SeatInfoMessages {...mockProps} />);

        expect(screen.getByTestId('info-block')).toBeInTheDocument();
        expect(mockInfoBlockProps).toHaveBeenCalledWith(
            expect.objectContaining({
                title: { value: 'ErrorDepartureMessageTitle' },
                text: { value: 'ErrorDepartureMessage' },
                className: 'failureBanner',
                withWarningIcon: true,
                dataTid: 'seats-unavailable',
            }),
        );
    });

    describe('isPostBookingPages', () => {
        it('Should apply withoutShadow class when isPostBookingPages is true', () => {
            mockStores = createMockStores({
                layoutStore: {
                    isPostBookingPages: true,
                },
            });
            mockProps.shouldShowNotAvailableMessage = true;
            render(<SeatInfoMessages {...mockProps} />);

            expect(mockInfoBlockProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    className: 'failureBanner withoutShadow',
                }),
            );
        });

        it('Should NOT apply withoutShadow class when isPostBookingPages is false', () => {
            mockProps.shouldShowNotAvailableMessage = true;
            render(<SeatInfoMessages {...mockProps} />);

            expect(mockInfoBlockProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    className: 'failureBanner',
                }),
            );
        });
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<SeatInfoMessages {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
