import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores, mockUnitRoom } from 'frontend/__mocks__';
import { getRoomName } from 'frontend/utils/offer.utils';
import { roomTitleNormalize } from 'frontend/utils/string.utils';
import { MarketCode } from 'models/data/MarketSettings';

import RoomCardTitle, { IRoomCardTitleProps } from './RoomCardTitle';
import MockedFn = jest.MockedFn;

expect.extend(toHaveNoViolations);

const createProps = (): IRoomCardTitleProps => ({
    withIncludedSubtitle: false,
    room: mockUnitRoom,
    countryCode: 'ES',
    freeChildPlaceTooltip: 'freeChildPlaceTooltip',
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockUrgencyProps = jest.fn();
jest.mock('frontend/components/common/UrgencyMessage/UrgencyMessage', () => ({
    __esModule: true,
    default: props => {
        mockUrgencyProps(props);

        return <div data-tid='urgency-message' />;
    },
}));

const mockFreeChildPlaceProps = jest.fn();
jest.mock('frontend/components/common/Pills/FreeForKidsPill/FreeForKidsPill', () => ({
    __esModule: true,
    default: props => {
        mockFreeChildPlaceProps(props);

        return <div data-tid='free-child-place' />;
    },
}));

jest.mock('frontend/utils/offer.utils');
jest.mock('frontend/utils/string.utils');

describe('<RoomCardTitle />', () => {
    (getRoomName as MockedFn<any>).mockReturnValue('Room Name');
    (roomTitleNormalize as MockedFn<any>).mockReturnValue('Room Title');

    beforeEach(() => {
        mockStores = createMockStores({
            marketStore: {
                marketCode: MarketCode.UK,
            },
        });
        mockProps = createProps();
    });

    it('Should render children', () => {
        render(<RoomCardTitle {...mockProps} />);

        expect(screen.getByTestId('room-card-header')).toBeInTheDocument();
        expect(screen.getByTestId('room-title')).toBeInTheDocument();
        expect(screen.getByTestId('room-card-pills')).toBeInTheDocument();
        expect(screen.queryByTestId('free-child-place')).not.toBeInTheDocument();
        expect(screen.getByTestId('urgency-message')).toBeInTheDocument();
        expect(screen.getByText('Room Title')).toBeInTheDocument();
        expect(screen.queryByText('RoomTypes.Labels.IncludedInRoom')).not.toBeInTheDocument();
        expect(getRoomName).toHaveBeenCalledWith(mockProps.room.roomType);
        expect(roomTitleNormalize).toHaveBeenCalledWith('Room Name');
        expect(mockUrgencyProps).toHaveBeenCalledWith(
            expect.objectContaining({
                className: 'urgency',
                message: '',
                tooltip: 'SearchResults.Labels.HurryTooltip',
            }),
        );
    });

    it('Should render free child place pill', () => {
        mockProps.room.isFreeForKids = true;
        render(<RoomCardTitle {...mockProps} />);

        expect(screen.getByTestId('free-child-place')).toBeInTheDocument();
        expect(mockFreeChildPlaceProps).toHaveBeenCalledWith(
            expect.objectContaining({
                tooltipMessage: mockProps.freeChildPlaceTooltip,
                countryCode: mockProps.countryCode,
            }),
        );
    });

    it('Should render subtitle', () => {
        mockProps.withIncludedSubtitle = true;
        render(<RoomCardTitle {...mockProps} />);

        expect(screen.getByTestId('room-subtitle')).toHaveTextContent('RoomTypes.Labels.IncludedInRoom');
    });

    it('should NOT render urgencyMessage on EUX region', () => {
        mockStores.marketStore.marketCode = 'FR';
        render(<RoomCardTitle {...mockProps} />);
        expect(screen.queryByTestId('urgency-message')).not.toBeInTheDocument();
    });

    it('Should roomTitleNormalize be called with empty string', () => {
        (getRoomName as MockedFn<any>).mockReturnValue(undefined);
        render(<RoomCardTitle {...mockProps} />);

        expect(roomTitleNormalize).toHaveBeenCalledWith('');
    });

    it('Should UrgencyMessage be called with avail == 0', () => {
        mockProps.room.avail = undefined;
        render(<RoomCardTitle {...mockProps} />);

        expect(mockUrgencyProps).toHaveBeenCalledWith(
            expect.objectContaining({
                className: 'urgency',
                message: '',
                tooltip: 'SearchResults.Labels.HurryTooltip',
            }),
        );
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<RoomCardTitle {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });

        it('should render aria-label and tab index', () => {
            mockProps.withIncludedSubtitle = true;
            render(<RoomCardTitle {...mockProps} />);

            expect(screen.getByText('Room Title')).toHaveAttribute('aria-label', 'Room Title');
            expect(screen.getByText('RoomTypes.Labels.IncludedInRoom')).toHaveAttribute(
                'aria-label',
                'RoomTypes.Labels.IncludedInRoom',
            );
        });
    });
});
