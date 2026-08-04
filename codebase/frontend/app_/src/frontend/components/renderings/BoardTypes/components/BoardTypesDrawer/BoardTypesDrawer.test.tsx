import * as React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { allBoards, bedBreakfastBoard } from 'frontend/__mocks__/boards';
import { IOffer } from 'models/data/IOffer';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { boardTypesFields } from 'frontend/components/renderings/BoardTypes/components/__mocks__/boardTypesFields';

import BoardTypesDrawer, { IBoardTypesDrawerProps } from './BoardTypesDrawer';

const createStores = () => ({
    appStore: { isScreenMedium: false },
    layoutStore: {
        isExtrasPage: false,
        isEditMode: false,
        isBodyScrollLocked: false,
        setIsBodyScrollLocked: jest.fn(),
        getPhrase: jest.fn(p => p),
    },
    bookingStore: { boardCodeError: null, isLoadingOffer: false },
});

const createProps: () => IBoardTypesDrawerProps = () => ({
    isOpen: false,
    offer: {
        accom: {
            unit: [{ code: '1' }, { code: '2' }],
        },
    } as IOffer,
    allBoardTypes: allBoards,
    selectedBoardTypeCode: bedBreakfastBoard.code,
    fields: boardTypesFields(),
    fallbackImage: 'image',
    closePopup: jest.fn(),
    onUpdateBoard: jest.fn(),
    onDeleteBoard: jest.fn(),
    freeChildPlaceTooltip: 'freeChildPlaceTooltip',
    countryCode: 'ES',
    rendering: 'rendering',
});

let mockStores = createStores();
let mockProps = createProps();

const mockBoardSection = jest.fn();
jest.mock('frontend/components/renderings/BoardTypes/components/BoardSection/BoardSection', () => ({
    __esModule: true,
    default: props => {
        const { selectedBoardTypeCode, drawerMode } = props;
        mockBoardSection(props);

        return (
            <div>
                BoardSection <span data-tid='selected-board'>{selectedBoardTypeCode}</span>
                {drawerMode && <span>drawerMode</span>}
            </div>
        );
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockPlaceholderProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: props => {
        mockPlaceholderProps(props);

        return <div data-tid='placeholder' />;
    },
}));

describe('<BoardTypesDrawer />', () => {
    beforeEach(() => {
        mockStores = createStores();
        mockProps = createProps();
    });

    it('should standard render', () => {
        render(<BoardTypesDrawer {...mockProps} />);

        const boardTypesMock = screen.getByText('BoardSection');

        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(mockProps.fields!.DrawerTitle!.value);
        expect(screen.getByText(mockProps.fields!.DrawerDescription!.value)).toBeInTheDocument();
        expect(screen.getByTestId('drawer-board-select')).toHaveClass('drawer--animation-bottom container');
        expect(within(boardTypesMock).getByTestId('selected-board')).toHaveTextContent(bedBreakfastBoard.code);
        expect(within(boardTypesMock).getByText('drawerMode')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: mockProps.fields!.DrawerCancel!.value })).toBeInTheDocument();
        expect(screen.getByTestId('drawer-board-select')).toBeInTheDocument();
        expect(mockBoardSection).toBeCalledWith(
            expect.objectContaining({
                freeChildPlaceTooltip: mockProps.freeChildPlaceTooltip,
                countryCode: mockProps.countryCode,
            }),
        );
        expect(screen.getByTestId('placeholder')).toBeInTheDocument();
        expect(mockPlaceholderProps).toHaveBeenCalledWith({
            name: PlaceholderNames.ChangeFeeInfo,
            rendering: mockProps.rendering,
        });
    });

    it('should skip render when no fields set', () => {
        mockProps.fields = undefined;
        const { container } = render(<BoardTypesDrawer {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render heading when DrawerTitle is empty', () => {
        mockProps.fields!.DrawerTitle!.value = '';
        render(<BoardTypesDrawer {...mockProps} />);

        expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
    });

    it('should NOT render description when DrawerDescription is empty', () => {
        mockProps.fields!.DrawerDescription!.value = '';

        render(<BoardTypesDrawer {...mockProps} />);

        expect(screen.queryByTestId('board-types-drawer-description')).not.toBeInTheDocument();
    });

    it('should NOT render cancel button when DrawerCancel is empty', () => {
        mockProps.fields!.DrawerCancel!.value = '';

        render(<BoardTypesDrawer {...mockProps} />);

        expect(screen.queryByRole('button', { name: mockProps.fields!.DrawerCancel!.value })).not.toBeInTheDocument();
    });

    it('should close drawer when cancel button is clicked', () => {
        render(<BoardTypesDrawer {...mockProps} />);

        const cancelBtn = screen.getByRole('button', { name: mockProps.fields!.DrawerCancel!.value });

        fireEvent.click(cancelBtn);

        expect(mockProps.closePopup).toBeCalled();
    });

    it("should pass isPostBooking prop to BoardSection when it's set", () => {
        mockProps.isPostBooking = true;
        render(<BoardTypesDrawer {...mockProps} />);

        expect(mockBoardSection).toBeCalledWith(expect.objectContaining({ isPostBooking: true }));
    });
});
