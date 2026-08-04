import * as React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import { mockAmendRoomAndBoardLocalStore } from 'frontend/__mocks__';
import { bedBreakfastBoard } from 'frontend/__mocks__/boards';
import { mockPendingObservablePromise } from 'frontend/utils/observerablePromise/mockedObservableFromPromise';
import { IAmendHotelRoomAndBoardInfoResponse } from 'models/data/bookingAmendment/AmendRoomAndBoard';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import * as roomAndBoardLocalStore from 'frontend/components/renderings/AmendRoomAndBoardPopup/store/createRoomAndBoardLocalStore/createRoomAndBoardLocalStore';

import BoardCard, { IBoardCardProps } from './BoardCard';

expect.extend(toHaveNoViolations);

const createStores = () => ({
    appStore: { isScreenMedium: false },
    layoutStore: { isEditMode: false, getPhrase: jest.fn(k => k), getSetting: jest.fn(() => true) },
    bookingStore: { isLoadingOffer: false },
});

const createProps: () => IBoardCardProps = () => ({
    board: bedBreakfastBoard,
    isSelected: false,
    isSpoiler: false,
    selectedLabel: 'Included in your holiday:',
    countryCode: 'ES',
    freeChildPlaceTooltip: 'freeChildPlaceTooltip',
});

const mockLocalStore = mockAmendRoomAndBoardLocalStore();

let mockStores = createStores();
let mockProps = createProps();

jest.mock('frontend/components/common/BoardCardSkeleton/BoardCardSkeleton', () => ({
    __esModule: true,
    default: ({ isSelected, isSpoiler }) => (
        <div>
            BoardCardSkeleton
            {isSelected && <span>isSelected</span>}
            {isSpoiler && <span>isSpoiler</span>}
        </div>
    ),
}));

jest.mock(
    'frontend/components/renderings/AmendRoomAndBoardPopup/components/AmendBoardSkeleton/AmendBoardSkeleton',
    () => ({
        __esModule: true,
        default: () => <div data-tid='amend-board-skeleton' />,
    }),
);
const mockFreeBoardUpgradePill = jest.fn();
jest.mock('frontend/components/common/Pills/FreeBoardUpgradePill/FreeBoardUpgradePill', () => ({
    __esModule: true,
    default: props => {
        mockFreeBoardUpgradePill(props);

        return <div data-tid='free-board-upgrade-pill' />;
    },
}));

const mockFreeChildPlacePillProps = jest.fn();
jest.mock('frontend/components/common/Pills/FreeForKidsPill/FreeForKidsPill', () => ({
    __esModule: true,
    default: props => {
        mockFreeChildPlacePillProps(props);

        return <div data-tid='free-child-place-pill' />;
    },
}));

const mockDiscountedBoardPercentagePillComponent = jest.fn();
jest.mock('frontend/components/common/Pills/DiscountedBoardPill/DiscountedBoardPercentagePill', () => ({
    __esModule: true,
    default: props => {
        mockDiscountedBoardPercentagePillComponent(props);

        return <div data-tid='discounted-board-percentage-pill' />;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockUseRoomAndBoardLocalStore = jest.spyOn(roomAndBoardLocalStore, 'useRoomAndBoardLocalStore');

describe('<BoardCard />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should standard render', () => {
        render(<BoardCard {...mockProps} />);

        const boardCard = screen.getByTestId('board-card');

        expect(boardCard.getAttribute('data-item-accomcode')).toBe(mockProps.board.code);
        expect(boardCard.getAttribute('data-item-selection')).not.toBeInTheDocument();
        expect(screen.getByText(mockProps.board.title)).toBeInTheDocument();
        expect(screen.getByText('Breakfast')).toBeInTheDocument();
        expect(screen.getByTestId('board-card-title-meta')).toBeInTheDocument();
        expect(screen.queryByTestId('board-type-item-edit-actions')).not.toBeInTheDocument();
        expect(screen.queryByText('BoardCardSkeleton')).not.toBeInTheDocument();
        expect(screen.queryByTestId('free-child-place-pil')).not.toBeInTheDocument();
        expect(screen.queryByText(SitecoreDictionary.BoardTypesLabelsIncludedInHoliday)).not.toBeInTheDocument();
    });

    it('Should render free child place pill', () => {
        mockProps.board.isFreeForKids = true;
        mockProps.isPostBooking = true;
        render(<BoardCard {...mockProps} />);

        expect(screen.getByTestId('free-child-place-pill')).toBeInTheDocument();
        expect(mockFreeChildPlacePillProps).toHaveBeenCalledWith(
            expect.objectContaining({
                tooltipMessage: mockProps.freeChildPlaceTooltip,
                countryCode: mockProps.countryCode,
            }),
        );
    });

    it('should render selected board type when isSelected is true', () => {
        mockProps.isSelected = true;

        render(<BoardCard {...mockProps} />);

        const boardCard = screen.getByTestId('board-card');

        expect(boardCard.getAttribute('data-item-selection')).toBe('selected');
        expect(screen.getByText(SitecoreDictionary.BoardTypesLabelsIncludedInHoliday)).toBeInTheDocument();
    });

    it('should render edit board actions when isEditMode is true', () => {
        mockStores.layoutStore.isEditMode = true;

        render(<BoardCard {...mockProps} />);

        expect(screen.getByTestId('board-type-item-edit-actions')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
    });

    it('should contain spoiler className when isSpoiler is true', () => {
        mockProps.isSpoiler = true;

        render(<BoardCard {...mockProps} />);

        const boardCard = screen.getByTestId('board-card');

        expect(boardCard.getAttribute('data-item-spoiler')).toBe('spoiler');
    });

    it('should contain alteration className when isAlteration is true', () => {
        mockProps.isAlteration = true;

        render(<BoardCard {...mockProps} />);

        expect(screen.getByTestId('board-card')).toHaveClass('alteration');
    });

    it('Should show a board code in the title block when the board has no title value', () => {
        mockProps.board.title = '';

        render(<BoardCard {...mockProps} />);

        expect(screen.getByTestId('board-card-title')).toHaveTextContent(bedBreakfastBoard.code);
    });

    it('Should render the info block if it is defined in the props', () => {
        mockProps.infoBlock = <div>InfoBlockElement</div>;
        render(<BoardCard {...mockProps} />);

        expect(screen.getByText('InfoBlockElement')).toBeInTheDocument();
    });

    it('Should render the children block if it is defined in the props', () => {
        mockProps.children = <div>ChildrenElement</div>;

        render(<BoardCard {...mockProps} />);

        expect(screen.getByText('ChildrenElement')).toBeInTheDocument();
    });

    it('should call onUpdateBoard when Update button clicked', async () => {
        mockStores.layoutStore.isEditMode = true;
        mockProps.itemId = 'testBoard';
        mockProps.onUpdateBoard = jest.fn();

        render(<BoardCard {...mockProps} />);

        const button = screen.getByRole('button', { name: 'Update' });

        await userEvent.click(button);

        expect(mockProps.onUpdateBoard).toBeCalledWith(mockProps.itemId);
    });

    it('should call onDeleteBoard when Remove button clicked and confirm returns true', async () => {
        mockStores.layoutStore.isEditMode = true;
        mockProps.itemId = 'testBoard';
        mockProps.onDeleteBoard = jest.fn();
        window.confirm = jest.fn(() => true);

        render(<BoardCard {...mockProps} />);

        const button = screen.getByRole('button', { name: 'Remove' });

        await userEvent.click(button);

        expect(mockProps.onDeleteBoard).toHaveBeenCalledWith(mockProps.itemId);
    });

    it('should NOT call onDeleteBoard when Remove button clicked and confirm returns false', async () => {
        mockStores.layoutStore.isEditMode = true;
        mockProps.itemId = 'testBoard';
        mockProps.onDeleteBoard = jest.fn();
        window.confirm = jest.fn(() => false);

        render(<BoardCard {...mockProps} />);

        const button = screen.getByRole('button', { name: 'Remove' });

        await userEvent.click(button);

        expect(mockProps.onDeleteBoard).not.toHaveBeenCalled();
    });

    describe('Skeleton', () => {
        it('should show skeleton when offer loading on desktop with properly props', () => {
            mockStores.bookingStore.isLoadingOffer = true;
            mockStores.appStore.isScreenMedium = true;
            mockProps.isSpoiler = true;
            mockProps.isSelected = true;

            render(<BoardCard {...mockProps} />);

            const skeleton = screen.getByText('BoardCardSkeleton');

            expect(skeleton).toBeInTheDocument();
            expect(within(skeleton).getByText('isSpoiler')).toBeInTheDocument();
            expect(within(skeleton).getByText('isSelected')).toBeInTheDocument();
        });

        it('shows skeleton when offer loading options from local store', () => {
            mockStores.bookingStore.isLoadingOffer = false;
            jest.mocked(mockUseRoomAndBoardLocalStore).mockReturnValue({
                ...mockLocalStore,
                offersRequest: mockPendingObservablePromise<IAmendHotelRoomAndBoardInfoResponse>(),
            });
            mockStores.appStore.isScreenMedium = true;
            mockProps.isSpoiler = true;
            mockProps.isSelected = true;

            render(<BoardCard {...mockProps} />);

            const skeleton = screen.getByText('BoardCardSkeleton');

            expect(skeleton).toBeInTheDocument();
            expect(within(skeleton).getByText('isSpoiler')).toBeInTheDocument();
            expect(within(skeleton).getByText('isSelected')).toBeInTheDocument();
        });

        it('handles absence of the local store', () => {
            mockUseRoomAndBoardLocalStore.mockReturnValue(null);

            expect(screen.queryByText('BoardCardSkeleton')).not.toBeInTheDocument();
        });

        it('should show skeleton on mobile when isPostBooking is true', () => {
            mockStores.bookingStore.isLoadingOffer = true;
            mockStores.appStore.isScreenMedium = false;
            mockProps.isPostBooking = true;

            render(<BoardCard {...mockProps} />);

            const skeleton = screen.getByTestId('amend-board-skeleton');

            expect(skeleton).toBeInTheDocument();
        });
    });

    it('should NOT display board content block for selected board without any content', () => {
        mockProps.board.content = '';
        mockProps.isSelected = true;

        render(<BoardCard {...mockProps} />);

        expect(screen.queryByText(SitecoreDictionary.BoardTypesLabelsIncludedInHoliday)).not.toBeInTheDocument();
    });

    describe('Title class names', () => {
        it('should render title without lineSeparator class when content is NOT provided and board is selected', () => {
            mockProps.isSelected = true;
            mockProps.board.content = '';
            render(<BoardCard {...mockProps} />);

            expect(screen.getByTestId('board-card-title')).not.toHaveClass('lineSeparator');
        });

        it('should render title with lineSeparator class when content is provided and board is selected', () => {
            mockProps.board.content = 'test';
            mockProps.isSelected = true;
            render(<BoardCard {...mockProps} />);

            expect(screen.getByTestId('board-card-title')).toHaveClass('lineSeparator');
        });

        it('should render title with lineSeparator class when content is NOT provided and board is NOT selected', () => {
            mockProps.isSelected = false;
            mockProps.board.content = '';
            render(<BoardCard {...mockProps} />);

            expect(screen.getByTestId('board-card-title')).toHaveClass('lineSeparator');
        });
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<BoardCard {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });

        it('should not render tab indexes if board is spoiler', () => {
            mockProps.isSpoiler = true;
            mockProps.board.content = 'test';
            mockProps.isSelected = true;
            const { container } = render(<BoardCard {...mockProps} />);

            expect(screen.getByTestId('board-card')).not.toHaveAttribute('tabIndex');
            expect(screen.getByTestId('board-card-title')).not.toHaveAttribute('tabIndex');
            expect(screen.getByTestId('board-card-content-subtitle')).not.toHaveAttribute('tabIndex');
            expect(container.querySelector('.content')).not.toHaveAttribute('tabIndex');
        });
    });

    describe('FreeBoardUpgradePill', () => {
        it('should render FreeBoardUpgradePill with isFreeBoardUpgrade set to true when isPostBooking is false and isFreeBoardUpgrade is true', () => {
            mockProps.board.isFreeBoardUpgrade = true;

            render(<BoardCard {...mockProps} />);

            expect(screen.getByTestId('free-board-upgrade-pill')).toBeInTheDocument();
            expect(mockFreeBoardUpgradePill).toHaveBeenCalledWith({
                isFreeBoardUpgrade: true,
            });
        });

        it('should render FreeBoardUpgradePill with isFreeBoardUpgrade set to false when isFreeBoardUpgrade is false', () => {
            mockProps.board.isFreeBoardUpgrade = false;

            render(<BoardCard {...mockProps} />);

            expect(screen.getByTestId('free-board-upgrade-pill')).toBeInTheDocument();
            expect(mockFreeBoardUpgradePill).toHaveBeenCalledWith({
                isFreeBoardUpgrade: false,
            });
        });

        it('should render FreeBoardUpgradePill with isFreeBoardUpgrade set to false when isPostBooking is true', () => {
            mockProps.board.isFreeBoardUpgrade = true;
            mockProps.isPostBooking = true;

            render(<BoardCard {...mockProps} />);

            expect(screen.getByTestId('free-board-upgrade-pill')).toBeInTheDocument();
            expect(mockFreeBoardUpgradePill).toHaveBeenCalledWith({
                isFreeBoardUpgrade: false,
            });
        });
    });
});
