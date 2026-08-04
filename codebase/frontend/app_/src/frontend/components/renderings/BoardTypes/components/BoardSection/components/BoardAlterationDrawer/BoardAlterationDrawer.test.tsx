import * as React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { bedBreakfastBoard } from 'frontend/__mocks__/boards';
import { boardTypesFields } from 'frontend/components/renderings/BoardTypes/components/__mocks__/boardTypesFields';

import BoardAlterationDrawer, { IBoardAlterationDrawerProps } from './BoardAlterationDrawer';

const mockBoardCardComponent = jest.fn();

jest.mock('frontend/components/renderings/BoardTypes/components/BoardCard/BoardCard', () => ({
    __esModule: true,
    default: ({ infoBlock, children, ...props }) => {
        mockBoardCardComponent(props);

        return (
            <div data-tid='board-card'>
                {infoBlock}
                {children}
            </div>
        );
    },
}));

const mockBookingAlterationDrawerComponent = jest.fn();

jest.mock('frontend/components/common/BookingAlterationDrawer/BookingAlterationDrawer', () => ({
    __esModule: true,
    default: ({ selectedItemElement, onCancel, ...props }) => {
        mockBookingAlterationDrawerComponent(props);

        return (
            <div data-tid='booking-alteration-drawer'>
                <button data-tid='set-alteration-modal-show' onClick={onCancel} />
                {selectedItemElement}
            </div>
        );
    },
}));

let mockNewAlternativeRooms;

jest.mock('frontend/components/renderings/BoardTypes/components/BoardSection/BoardSection.utils', () => ({
    ...jest.requireActual('frontend/components/renderings/BoardTypes/components/BoardSection/BoardSection.utils'),
    getNewAlternativeRooms: () => mockNewAlternativeRooms,
}));

let props;
const fields = boardTypesFields();

const createProps = (): IBoardAlterationDrawerProps => ({
    changedBoard: bedBreakfastBoard,
    fallbackImage: 'fallback-img',
    freeChildPlaceInfoTitle: fields.FreeChildPlaceInfoTitle,
    freeChildPlaceInfoText: fields.FreeChildPlaceInfoText,
    alterationChangingFromTitle: fields.AlterationChangingFromTitle,
    isAlterationModalShow: false,
    newAlternativeRooms: [],
    alterationResTextPlural: fields.AlterationRoomResultTextPlural,
    alterationResTextSingular: fields.AlterationRoomResultTextSingular,
    alterationResTitle: fields.AlterationBoardResultTitle,
    alterationResSubtitle: fields.AlterationResultSubtitle,
    priceChange: 3,
    alterationSubtitle: fields.AlterationSubtitle,
    handleCancelClick: jest.fn(),
    handleConfirmClick: jest.fn(),
    countryCode: 'ES',
    freeChildPlaceTooltip: 'freeChildPlaceTooltip',
});

describe('<BoardAlterationDrawer />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('should standard render', () => {
        render(<BoardAlterationDrawer {...props} newAlternativeRooms={[{}]} />);
        const drawer = screen.getByTestId('booking-alteration-drawer');

        expect(drawer).toBeInTheDocument();
        expect(within(drawer).getByTestId('board-card')).toBeInTheDocument();
        expect(mockBookingAlterationDrawerComponent).toBeCalledWith(
            expect.objectContaining({
                alterationChangingFromTitle: fields.AlterationChangingFromTitle,
                alterationResults: [
                    {
                        items: [{}],
                        subtitle: fields.AlterationResultSubtitle,
                        text: fields.AlterationRoomResultTextSingular,
                        title: fields.AlterationBoardResultTitle,
                    },
                ],
                fallbackImage: props.fallbackImage,
                freeChildPlaceInfoText: props.freeChildPlaceInfoText,
                freeChildPlaceInfoTitle: props.freeChildPlaceInfoTitle,
                hideInfoBlock: true,
                isOpen: props.isAlterationModalShow,
                price: props.priceChange,
                subtitle: fields.AlterationSubtitle,
            }),
        );
        expect(mockBoardCardComponent).toBeCalledWith({
            board: bedBreakfastBoard,
            isSpoiler: false,
            isSelected: true,
            countryCode: props.countryCode,
            freeChildPlaceTooltip: props.freeChildPlaceTooltip,
        });
    });

    it('should render correct labels for multi Room alteration', () => {
        render(<BoardAlterationDrawer {...props} newAlternativeRooms={[{}, {}]} />);

        expect(mockBookingAlterationDrawerComponent).toBeCalledWith(
            expect.objectContaining({
                alterationResults: [
                    {
                        items: [{}, {}],
                        subtitle: fields.AlterationResultSubtitle,
                        text: fields.AlterationRoomResultTextPlural,
                        title: fields.AlterationBoardResultTitle,
                    },
                ],
            }),
        );
    });

    it('should render isFreeChildPlaceInfoVisible', () => {
        render(<BoardAlterationDrawer {...props} newAlternativeRooms={[{ isKidsPlaceWilBeRemoved: true }]} />);

        expect(mockBookingAlterationDrawerComponent).toBeCalledWith(expect.objectContaining({ hideInfoBlock: false }));
    });

    it('should call handleCancelClick when onCancel is triggered', async () => {
        render(<BoardAlterationDrawer {...props} />);
        fireEvent.click(screen.getByTestId('set-alteration-modal-show'));

        await waitFor(() => expect(props.handleCancelClick).toBeCalled());
    });
});
