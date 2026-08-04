import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores, mockUnitRoom } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import RoomsSection, { IRoomsSectionProps } from './RoomsSection';

expect.extend(toHaveNoViolations);

const createProps = (): IRoomsSectionProps => ({
    hideMoreCollapsedTitle: 'hideMoreCollapsedTitle',
    onChangeRoom: jest.fn(),
    rooms: [mockUnitRoom, mockUnitRoom],
    showMoreExpandedTitle: 'showMoreExpandedTitle',
    altRoomsTitle: 'altRoomsTitle',
    chosenRoom: mockUnitRoom,
    isLoading: false,
    originalRoomTitle: 'originalRoomTitle',
    pricePostfix: SitecoreDictionary.GlobalsPriceLabelsTotal,
    mobileListMeta: {
        showMoreLabel: 'showMoreLabel',
        title: 'title',
        description: 'description',
    },
    showRoomsPart: 1,
    freeChildPlaceTooltip: 'freeChildPlaceTooltip',
    countryCode: 'ES',
    rendering: 'rendering',
    loadingSkeleton: <div data-tid='loading-skeleton' />,
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/static/ComponentWrapper', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='wrapper'>{children}</div>,
}));

const mockRoomsListProps = jest.fn();
jest.mock('frontend/components/common/Room/RoomCardsList/RoomCardsList', () => ({
    __esModule: true,
    default: props => {
        mockRoomsListProps(props);

        return <div data-tid='rooms-list' />;
    },
}));

const mockRoomProps = jest.fn();
jest.mock('frontend/components/common/Room/RoomCard/RoomCard', () => ({
    __esModule: true,
    default: props => {
        mockRoomProps(props);

        return <div data-tid='room' />;
    },
}));

describe('<RoomsSection />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createProps();
    });

    it('Should render children', () => {
        render(<RoomsSection {...mockProps} />);

        expect(screen.queryByTestId('rbc-section')).toBeInTheDocument();
        expect(screen.queryByText('originalRoomTitle')).toBeInTheDocument();
        expect(screen.queryByTestId('your-room')).toBeInTheDocument();
        expect(screen.queryByTestId('rooms-list')).toBeInTheDocument();
        expect(mockRoomProps).toHaveBeenCalledWith(
            expect.objectContaining({
                room: mockUnitRoom,
                pricePostfix: mockProps.pricePostfix,
                isSelected: true,
                isLoading: false,
                freeChildPlaceTooltip: mockProps.freeChildPlaceTooltip,
                countryCode: mockProps.countryCode,
                loadingSkeleton: mockProps.loadingSkeleton,
            }),
        );
        expect(mockRoomsListProps).toHaveBeenCalledWith(
            expect.objectContaining({
                rooms: mockProps.rooms,
                pricePostfix: mockProps.pricePostfix,
                hideMoreCollapsedTitle: 'hideMoreCollapsedTitle',
                showMoreExpandedTitle: 'showMoreExpandedTitle',
                showRoomsPart: 1,
                title: 'altRoomsTitle',
                onChangeRoom: mockProps.onChangeRoom,
                isLoading: false,
                mobileListMeta: mockProps.mobileListMeta,
                freeChildPlaceTooltip: mockProps.freeChildPlaceTooltip,
                countryCode: mockProps.countryCode,
                rendering: mockProps.rendering,
            }),
        );
    });

    it('Should NOT render list when no rooms were provided', () => {
        mockProps.rooms = [];
        render(<RoomsSection {...mockProps} />);

        expect(screen.queryByTestId('rooms-list')).not.toBeInTheDocument();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<RoomsSection {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });

        it('should render aria-label', () => {
            render(<RoomsSection {...mockProps} />);

            expect(screen.getByTestId('your-room')).toHaveAttribute('aria-label', 'originalRoomTitle');
        });
    });
});
