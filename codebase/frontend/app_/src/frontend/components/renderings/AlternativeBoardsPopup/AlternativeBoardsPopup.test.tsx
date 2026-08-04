import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventActions } from 'models/enum/tracking/GenericEventParams';

import { AlternativeBoardsPopup, TAltBoardsPopupProps } from './AlternativeBoardsPopup';

const mockInfoBlockComponent = jest.fn();
jest.mock('frontend/components/common/InfoBlock/InfoBlock', () => ({
    __esModule: true,
    default: props => {
        mockInfoBlockComponent(props);

        return <div data-tid='info-block' />;
    },
}));

const mockPopupComponent = jest.fn();
jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children, onClose, ...props }) => {
        mockPopupComponent(props);

        return (
            <div data-tid='popup'>
                {children}
                <button onClick={onClose} />
            </div>
        );
    },
}));

const mockDrawerComponent = jest.fn();
jest.mock('frontend/components/common/Drawer', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockDrawerComponent(props);

        return <div data-tid='drawer'>{children}</div>;
    },
}));

const mockAltBoardPopupContentComponent = jest.fn();
jest.mock('./components/AltBoardPopupContent/AltBoardPopupContent', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockAltBoardPopupContentComponent(props);

        return <div data-tid='alt-board-popup-content'>{children}</div>;
    },
}));

let mockIsPricePPShown;
jest.mock('frontend/utils/offer.utils', () => ({
    ...jest.requireActual('frontend/utils/offer.utils'),
    isPricePPShown: () => mockIsPricePPShown,
}));

const mockedConfirmedBoard = {
    code: 'boardType',
    price: 10,
    pricePP: 5,
    accommodationId: 'accommodationId',
    packageId: 'packageId',
    title: 'Half Board',
};

const createStores = () =>
    createMockStores({
        appStore: { isScreenMedium: false },
        hotelsStore: {
            activeOfferId: 'offerId',
            setActiveOfferId: jest.fn(),
            offers: [
                {
                    id: 'offerId',
                    accom: {
                        unit: [
                            {
                                boardType: mockedConfirmedBoard,
                                accommodationId: 'accommodationId',
                                packageId: 'packageId',
                            },
                        ],
                    },
                    pricePPExcludingTouristTax: 4,
                    priceExcludingTouristTax: 8,
                    price: 10,
                    pricePP: 5,
                },
            ],
        },
        trackingStore: { trackSelectAltBoard: jest.fn() },
        bookingStore: { alternativeBoards: [] },
    });

const createProps = (): TAltBoardsPopupProps => ({
    fields: {
        MainTitle: mockSitecoreField('MainTitle'),
        CurrentChoiceTitle: mockSitecoreField('CurrentChoiceTitle'),
        OtherOptionTitle: mockSitecoreField('OtherOptionTitle'),
        WithFreeChildPlaceTitle: mockSitecoreField('WithFreeChildPlaceTitle'),
        WithoutFreeChildPlaceTitle: mockSitecoreField('WithoutFreeChildPlaceTitle'),
        RoomChangeInfoTitle: mockSitecoreField('RoomChangeInfoTitle'),
        RoomChangeInfoMessage: mockSitecoreField('RoomChangeInfoMessage'),
    },
    params: {},
    rendering: {},
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<AlternativeBoardsPopup />', () => {
    beforeEach(() => {
        mockStores = createStores();
        mockProps = createProps();
        mockIsPricePPShown = true;
    });

    describe('should NOT render', () => {
        it('when no fields', () => {
            mockProps.fields = undefined;

            const { container } = render(<AlternativeBoardsPopup {...mockProps} />);

            expect(container).toBeEmptyDOMElement();
        });

        it('when isScreenMedium is true and activeOfferId is not defined', () => {
            mockStores.appStore.isScreenMedium = true;
            mockStores.hotelsStore.activeOfferId = null;

            const { container } = render(<AlternativeBoardsPopup {...mockProps} />);

            expect(container).toBeEmptyDOMElement();
        });
    });

    it('should render Popup component when isScreenMedium is true', () => {
        mockStores.appStore.isScreenMedium = true;

        render(<AlternativeBoardsPopup {...mockProps} />);

        expect(screen.getByTestId('popup')).toBeInTheDocument();
        expect(mockPopupComponent).toHaveBeenCalledWith({
            containerClass: 'popup',
            id: 'alt-boards-popup',
            showCloseButton: true,
        });
    });

    it('should render Drawer component when isScreenMedium is false', () => {
        mockStores.appStore.isScreenMedium = false;

        render(<AlternativeBoardsPopup {...mockProps} />);

        expect(screen.getByTestId('drawer')).toBeInTheDocument();
        expect(mockDrawerComponent).toHaveBeenCalledWith({
            open: true,
            dataTid: 'alt-boards-drawer',
            className: 'drawer',
        });
    });

    it('should render button when isScreenMedium is false', () => {
        mockStores.appStore.isScreenMedium = false;

        render(<AlternativeBoardsPopup {...mockProps} />);

        const actionsBlock = screen.getByTestId('drawer-actions');

        expect(actionsBlock.classList.contains('drawer__actions')).toBeTruthy();

        const button = within(actionsBlock).getByRole('button', { name: SitecoreDictionary.GlobalsButtonsClose });

        expect(button).toHaveTextContent(SitecoreDictionary.GlobalsButtonsClose);
        expect(button.classList.contains('btn--transparent')).toBeTruthy();
        expect(button.classList.contains('btn--medium')).toBeTruthy();
    });

    it('should render altBoardPopupContent', () => {
        mockStores.appStore.isScreenMedium = false;

        render(<AlternativeBoardsPopup {...mockProps} />);

        expect(screen.getByTestId('alt-board-popup-content')).toBeInTheDocument();
        expect(mockAltBoardPopupContentComponent).toHaveBeenCalledWith({
            allBoards: [{ ...mockedConfirmedBoard, pricePPExcludingTouristTax: 4, priceExcludingTouristTax: 8 }],
            confirmedBoard: { ...mockedConfirmedBoard, pricePPExcludingTouristTax: 4, priceExcludingTouristTax: 8 },
            fields: mockProps.fields,
            offer: {
                id: 'offerId',
                pricePPExcludingTouristTax: 4,
                priceExcludingTouristTax: 8,
                price: 10,
                pricePP: 5,
                accom: {
                    unit: [
                        {
                            accommodationId: 'accommodationId',
                            packageId: 'packageId',
                            boardType: mockedConfirmedBoard,
                        },
                    ],
                },
            },
        });
    });

    it('should call expected funcs when click on close button', async () => {
        mockStores.appStore.isScreenMedium = false;

        render(<AlternativeBoardsPopup {...mockProps} />);

        await userEvent.click(screen.getByRole('button', { name: SitecoreDictionary.GlobalsButtonsClose }));

        expect(mockStores.hotelsStore.setActiveOfferId).toHaveBeenCalledWith(null);
        expect(mockStores.trackingStore.trackSelectAltBoard).toHaveBeenCalledWith(
            mockedConfirmedBoard.title,
            EventActions.Close,
            {
                destinationUrl: 'MainTitle',
                genericValue1: undefined,
                genericValue2: '1',
                genericValue3: null,
                genericValue4: null,
            },
        );
    });

    describe('originalBoard price construction', () => {
        const makeOffer = (boardTypeOverrides = {}) => ({
            id: 'offerId',
            price: 200,
            pricePP: 100,
            priceExcludingTouristTax: 190,
            pricePPExcludingTouristTax: 95,
            accom: {
                unit: [
                    {
                        boardType: { ...mockedConfirmedBoard, ...boardTypeOverrides },
                        accommodationId: 'accommodationId',
                        packageId: 'packageId',
                    },
                ],
            },
        });

        const getAllBoards = () => mockAltBoardPopupContentComponent.mock.calls[0][0].allBoards;

        beforeEach(() => {
            mockAltBoardPopupContentComponent.mockClear();
        });

        it('should use boardType.price and boardType.pricePP when they are defined', () => {
            mockStores.hotelsStore.offers = [makeOffer({ price: 10, pricePP: 5 })];

            render(<AlternativeBoardsPopup {...mockProps} />);

            expect(getAllBoards()[0].price).toBe(10);
            expect(getAllBoards()[0].pricePP).toBe(5);
        });

        it('should fall back to offer.price when boardType.price is undefined', () => {
            mockStores.hotelsStore.offers = [makeOffer({ price: undefined })];

            render(<AlternativeBoardsPopup {...mockProps} />);

            expect(getAllBoards()[0].price).toBe(200);
        });

        it('should fall back to offer.pricePP when boardType.pricePP is undefined', () => {
            mockStores.hotelsStore.offers = [makeOffer({ pricePP: undefined })];

            render(<AlternativeBoardsPopup {...mockProps} />);

            expect(getAllBoards()[0].pricePP).toBe(100);
        });

        it('should NOT fall back when boardType.price is 0', () => {
            mockStores.hotelsStore.offers = [makeOffer({ price: 0 })];

            render(<AlternativeBoardsPopup {...mockProps} />);

            expect(getAllBoards()[0].price).toBe(0);
        });

        it('should always take priceExcludingTouristTax from offer', () => {
            mockStores.hotelsStore.offers = [makeOffer()];

            render(<AlternativeBoardsPopup {...mockProps} />);

            expect(getAllBoards()[0].priceExcludingTouristTax).toBe(190);
        });

        it('should always take pricePPExcludingTouristTax from offer', () => {
            mockStores.hotelsStore.offers = [makeOffer()];

            render(<AlternativeBoardsPopup {...mockProps} />);

            expect(getAllBoards()[0].pricePPExcludingTouristTax).toBe(95);
        });

        it('should fall back to 0 when both boardType.price and offer.price are undefined', () => {
            mockStores.hotelsStore.offers = [makeOffer({ price: undefined })];
            mockStores.hotelsStore.offers[0].price = undefined;

            render(<AlternativeBoardsPopup {...mockProps} />);

            expect(getAllBoards()[0].price).toBe(0);
        });

        it('should fall back to 0 when both boardType.pricePP and offer.pricePP are undefined', () => {
            mockStores.hotelsStore.offers = [makeOffer({ pricePP: undefined })];
            mockStores.hotelsStore.offers[0].pricePP = undefined;

            render(<AlternativeBoardsPopup {...mockProps} />);

            expect(getAllBoards()[0].pricePP).toBe(0);
        });

        it('should fall back to 0 when offer.priceExcludingTouristTax is undefined', () => {
            mockStores.hotelsStore.offers = [makeOffer()];
            mockStores.hotelsStore.offers[0].priceExcludingTouristTax = undefined;

            render(<AlternativeBoardsPopup {...mockProps} />);

            expect(getAllBoards()[0].priceExcludingTouristTax).toBe(0);
        });

        it('should fall back to 0 when offer.pricePPExcludingTouristTax is undefined', () => {
            mockStores.hotelsStore.offers = [makeOffer()];
            mockStores.hotelsStore.offers[0].pricePPExcludingTouristTax = undefined;

            render(<AlternativeBoardsPopup {...mockProps} />);

            expect(getAllBoards()[0].pricePPExcludingTouristTax).toBe(0);
        });
    });
});
