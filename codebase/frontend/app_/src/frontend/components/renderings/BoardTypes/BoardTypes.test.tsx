import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores, mockBoardType } from 'frontend/__mocks__';

import * as useBoardStore from './components/hooks/useBoardStore';
import BoardTypes from './BoardTypes';

const createProps = () => ({
    fields: {
        Title: { value: 'test' },
    },
    params: {
        Anchor: 'anchor',
        IsExpanded: false,
        FallbackImage: 'image',
    },
    freeChildPlaceTooltip: 'freeChildPlaceTooltip',
    countryCode: 'ES',
    rendering: 'rendering',
});

let props;
let mockStores;
let mockGuid;

jest.mock('guid-typescript', () => ({ Guid: { create: jest.fn(() => mockGuid) } }));

const mockBoardTypesWrapperProps = jest.fn();
jest.mock('frontend/components/renderings/BoardTypes/components/BoardTypesWrapper/BoardTypesWrapper', () => ({
    __esModule: true,
    default: props => {
        mockBoardTypesWrapperProps(props);

        return <div data-tid='board-types-wrapper' />;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));
jest.spyOn(useBoardStore, 'default');

describe('<BoardTypes />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores({
            amendRoomAndBoardStore: {
                altBoards: [mockBoardType],
            },
            bookingStore: {
                selectedOffer: {},
                failedToLoadData: false,
                boardType: null,
                allBoardTypes: [mockBoardType],
                changeBoardCodeError: jest.fn(),
            },
            layoutStore: { isTradePortal: false },
        });
        mockGuid = 'guid-123';
    });

    it('Should standard render', () => {
        render(<BoardTypes {...props} />);

        expect(mockStores.bookingStore.changeBoardCodeError).toHaveBeenCalled();
        expect(screen.getByTestId('board-types-wrapper')).toBeInTheDocument();
        expect(useBoardStore.default).toHaveBeenCalledWith(false);
        expect(mockBoardTypesWrapperProps).toHaveBeenCalledWith(
            expect.objectContaining({
                anchor: 'anchor',
                fields: props.fields,
                offer: mockStores.bookingStore.selectedOffer,
                allBoardTypes: mockStores.bookingStore.allBoardTypes,
                selectedBoardType: null,
                fallbackImage: 'image',
                isPostBooking: false,
                freeChildPlaceTooltip: 'freeChildPlaceTooltip',
                countryCode: 'ES',
                rendering: props.rendering,
            }),
        );
    });

    it('Should take props from postBookingProps when isPostBooking is true', () => {
        props.params.isPostBooking = true;

        render(<BoardTypes {...props} />);
        expect(useBoardStore.default).toHaveBeenCalledWith(true);
        expect(mockBoardTypesWrapperProps).toHaveBeenCalledWith(
            expect.objectContaining({
                anchor: 'anchor',
                fields: props.fields,
                offer: mockStores.viewBookingStore.booking,
                allBoardTypes: mockStores.amendRoomAndBoardStore.altBoards,
                selectedBoardType: mockStores.amendRoomAndBoardStore.chosenRoom?.boardType,
                fallbackImage: 'image',
                isPostBooking: true,
                freeChildPlaceTooltip: 'freeChildPlaceTooltip',
                countryCode: 'ES',
            }),
        );
    });

    it('Should pass generated guid to the wrapper component when sitecore params are undefined', () => {
        props.params = undefined;

        render(<BoardTypes {...props} />);

        expect(mockBoardTypesWrapperProps).toHaveBeenCalledWith(
            expect.objectContaining({
                anchor: mockGuid,
            }),
        );
    });

    it('Should render null when failed to load data', () => {
        mockStores.bookingStore.failedToLoadData = true;

        const { container } = render(<BoardTypes {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should render null when selected offer is null', () => {
        mockStores.bookingStore.selectedOffer = null;

        const { container } = render(<BoardTypes {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should render null when sitecore fields are undefined', () => {
        mockStores.layoutStore.isTradePortal = true;
        props.fields = null;

        const { container } = render(<BoardTypes {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should render null when allBoardTypes is empty', () => {
        mockStores.bookingStore.allBoardTypes = [];

        const { container } = render(<BoardTypes {...props} />);

        expect(container).toBeEmptyDOMElement();
    });
});
