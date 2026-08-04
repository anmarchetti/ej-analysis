import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores, mockUnitRoom } from 'frontend/__mocks__';
import { usePagination } from 'frontend/hooks/usePagination/usePagination';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import RoomsCardListDrawer, { IRoomsCardListDrawerProps } from './RoomsCardListDrawer';

expect.extend(toHaveNoViolations);

const createProps = (): IRoomsCardListDrawerProps => ({
    onChangeRoom: jest.fn(),
    onCollapse: jest.fn(),
    rooms: [mockUnitRoom, mockUnitRoom],
    isLoading: false,
    isOpen: false,
    pricePostfix: SitecoreDictionary.GlobalsPriceLabelsTotal,
    showMoreLabel: 'showMoreLabel',
    showRoomsPart: 1,
    description: 'Description',
    title: 'Title',
    freeChildPlaceTooltip: 'freeChildPlaceTooltip',
    countryCode: 'ES',
    rendering: 'rendering',
});

let mockProps;
let mockStores;

jest.mock('frontend/hooks/usePagination/usePagination');

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockDrawerProps = jest.fn();
jest.mock('frontend/components/common/Drawer', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockDrawerProps(props);

        return <div data-tid='drawer'>{children}</div>;
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

const mockActionProps = jest.fn();
jest.mock(
    'frontend/components/common/Room/RoomCardsList/component/RoomCardListMobile/components/ShowMoreAction/ShowMoreAction',
    () => ({
        __esModule: true,
        default: props => {
            mockActionProps(props);

            return <div data-tid='action' />;
        },
    }),
);

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButtonProps(props);

        return <div data-tid='button' />;
    },
}));

const mockPlaceholderProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: props => {
        mockPlaceholderProps(props);

        return <div data-tid='placeholder' />;
    },
}));

describe('<RoomsCardListDrawer />', () => {
    const mockPagination = {
        itemsToShow: [mockUnitRoom],
        goToNext: jest.fn(),
        goToPage: jest.fn(),
        isLastPage: false,
        page: 0,
    };
    (usePagination as jest.MockedFn<any>).mockReturnValue(mockPagination);

    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createProps();
    });

    it('Should render children', () => {
        render(<RoomsCardListDrawer {...mockProps} />);

        expect(screen.queryByText('Description')).toBeInTheDocument();
        expect(screen.queryByText('Title')).toBeInTheDocument();
        expect(screen.queryByTestId('button')).toBeInTheDocument();
        expect(screen.queryByTestId('drawer')).toBeInTheDocument();
        expect(screen.queryByTestId('action')).toBeInTheDocument();
        expect(screen.queryAllByTestId('room').length).toBe(1);
        expect(mockDrawerProps).toHaveBeenCalledWith(
            expect.objectContaining({
                open: false,
                className: 'drawer--animation-bottom drawer',
                dataTid: 'drawer-room-select',
            }),
        );
        expect(mockRoomProps).toHaveBeenCalledWith(
            expect.objectContaining({
                room: mockUnitRoom,
                pricePostfix: SitecoreDictionary.GlobalsPriceLabelsTotal,
                onChange: mockProps.onChangeRoom,
                isLoading: false,
                freeChildPlaceTooltip: mockProps.freeChildPlaceTooltip,
                countryCode: mockProps.countryCode,
            }),
        );
        expect(mockActionProps).toHaveBeenCalledWith(
            expect.objectContaining({
                label: 'showMoreLabel',
                onClick: mockPagination.goToNext,
            }),
        );
        expect(mockButtonProps).toHaveBeenCalledWith(
            expect.objectContaining({
                className: 'drawer__actions cancelBtn',
                isText: true,
                isFullWidth: true,
                disabled: false,
                dataTid: 'cancel-btn',
                'aria-label': 'RoomTypes.Buttons.Cancel',
                children: 'RoomTypes.Buttons.Cancel',
                onClick: mockProps.onCollapse,
            }),
        );

        expect(screen.getByTestId('placeholder')).toBeInTheDocument();
        expect(mockPlaceholderProps).toHaveBeenCalledWith({
            name: PlaceholderNames.ChangeFeeInfo,
            rendering: mockProps.rendering,
        });
    });

    it('Should NOT render title', () => {
        mockProps.title = null;
        render(<RoomsCardListDrawer {...mockProps} />);

        expect(screen.queryByText('Title')).not.toBeInTheDocument();
    });

    it('Should NOT render description', () => {
        mockProps.description = null;
        render(<RoomsCardListDrawer {...mockProps} />);

        expect(screen.queryByText('Description')).not.toBeInTheDocument();
    });

    it('Should goToPage be called on close', () => {
        mockPagination.page = 1;
        render(<RoomsCardListDrawer {...mockProps} />);

        expect(mockPagination.goToPage).toHaveBeenCalledWith(1);
    });

    it('Should NOT render action when end of the list', () => {
        mockPagination.isLastPage = true;
        render(<RoomsCardListDrawer {...mockProps} />);

        expect(screen.queryByTestId('action')).not.toBeInTheDocument();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<RoomsCardListDrawer {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
