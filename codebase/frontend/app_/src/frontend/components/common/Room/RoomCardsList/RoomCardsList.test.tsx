import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores, mockUnitRoom } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import RoomCardsList, { IRoomCardsListProps } from './RoomCardsList';

expect.extend(toHaveNoViolations);

const createProps = (): IRoomCardsListProps => ({
    rooms: [mockUnitRoom],
    pricePostfix: SitecoreDictionary.GlobalsPriceLabelsTotal,
    hideMoreCollapsedTitle: 'hideMoreCollapsedTitle',
    showMoreExpandedTitle: 'showMoreExpandedTitle',
    mobileListMeta: {
        description: 'description',
        showMoreLabel: 'showMoreMobileLabel',
        title: 'title',
    },
    showRoomsPart: 3,
    title: 'title',
    onChangeRoom: jest.fn(),
    isLoading: false,
    freeChildPlaceTooltip: 'freeChildPlaceTooltip',
    countryCode: 'ES',
    rendering: 'rendering',
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockDesktopListProps = jest.fn();
jest.mock('./component/RoomCardListDesktop/RoomCardListDesktop', () => ({
    __esModule: true,
    default: props => {
        mockDesktopListProps(props);

        return <div data-tid='desktop-list' />;
    },
}));

const mockMobileListProps = jest.fn();
jest.mock('./component/RoomCardListMobile/RoomCardListMobile', () => ({
    __esModule: true,
    default: props => {
        mockMobileListProps(props);

        return <div data-tid='mobile-list' />;
    },
}));

describe('<RoomCardsList />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createProps();
    });

    it('Should render children', () => {
        render(<RoomCardsList {...mockProps} />);

        expect(screen.getByTestId('room-list-title')).toHaveTextContent(mockProps.title);
        expect(screen.getByTestId('desktop-list')).toBeInTheDocument();
        expect(mockDesktopListProps).toHaveBeenCalledWith(
            expect.objectContaining({
                rooms: mockProps.rooms,
                pricePostfix: mockProps.pricePostfix,
                hideMoreCollapsedTitle: mockProps.hideMoreCollapsedTitle,
                showMoreExpandedTitle: mockProps.showMoreExpandedTitle,
                showRoomsPart: 3,
                isLoading: false,
                onChangeRoom: expect.any(Function),
                freeChildPlaceTooltip: mockProps.freeChildPlaceTooltip,
                countryCode: mockProps.countryCode,
            }),
        );
    });

    it('Should render children on mobile', () => {
        mockStores.appStore.isScreenLessMedium = true;
        mockProps.mobileListMeta = undefined;
        render(<RoomCardsList {...mockProps} />);

        expect(screen.getByTestId('mobile-list')).toBeInTheDocument();
        expect(mockMobileListProps).toHaveBeenCalledWith(
            expect.objectContaining({
                rooms: mockProps.rooms,
                pricePostfix: mockProps.pricePostfix,
                showRoomsPart: 3,
                onChangeRoom: expect.any(Function),
                isLoading: false,
                freeChildPlaceTooltip: mockProps.freeChildPlaceTooltip,
                countryCode: mockProps.countryCode,
                rendering: mockProps.rendering,
            }),
        );
    });

    it('Should be rendered with an empty mobileListMeta props', () => {
        mockStores.appStore.isScreenLessMedium = true;
        render(<RoomCardsList {...mockProps} />);

        expect(mockMobileListProps).toHaveBeenCalledWith(
            expect.objectContaining({
                showMoreLabel: mockProps.mobileListMeta.showMoreLabel,
                title: mockProps.mobileListMeta.title,
                description: mockProps.mobileListMeta.description,
            }),
        );
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<RoomCardsList {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });

        it('should render aria-label', () => {
            const { container } = render(<RoomCardsList {...mockProps} />);

            expect(container.querySelector('.container')).toHaveAttribute('aria-label', 'title');
        });
    });
});
