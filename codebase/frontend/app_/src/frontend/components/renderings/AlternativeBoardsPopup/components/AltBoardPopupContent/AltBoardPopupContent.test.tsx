import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as offerUtils from 'frontend/utils/offer.utils';
import { getNewOfferUnitsByBoard } from 'frontend/utils/offer.utils';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IAltBoard, TAllBoards } from 'models/data/IOffer';
import { EventActions } from 'models/enum/tracking/GenericEventParams';

import { AltBoardPopupContent, IAltBoardPopupContentProps } from './AltBoardPopupContent';

const createStores = () => ({
    bookingStore: { alternativeRooms: [], isLoadingOffersAlterations: false, alternativeBoards: [] as IAltBoard[] },
    hotelsStore: {
        updateOffersWithSelectedBoard: jest.fn(),
        setActiveOfferId: jest.fn(),
    },
    trackingStore: { trackSelectAltBoard: jest.fn() },
});
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/offer.utils');
jest.mock('../AltBoardsPopupSkeleton/AltBoardsPopupSkeleton', () => ({
    __esModule: true,
    default: () => <div data-tid='alt-boards-popup-skeleton' />,
}));

const mockAltBoardsSectionComponent = jest.fn();
jest.mock('../AltBoardsSection/AltBoardsSection', () => ({
    __esModule: true,
    default: props => {
        mockAltBoardsSectionComponent(props);

        return <div />;
    },
}));

const mockOtherBoardsSplitComponent = jest.fn();
jest.mock('../OtherBoardsSplit/OtherBoardsSplit', () => ({
    __esModule: true,
    default: ({ onSelect, ...props }) => {
        mockOtherBoardsSplitComponent(props);

        return (
            <div data-tid='other-boards-split'>
                <button onClick={() => onSelect({})}>onSelect</button>
            </div>
        );
    },
}));

const mockInfoBlockComponent = jest.fn();
jest.mock('frontend/components/common/InfoBlock/InfoBlock', () => ({
    __esModule: true,
    default: props => {
        mockInfoBlockComponent(props);

        return <div data-tid='info-block' />;
    },
}));

describe('<AltBoardPopupContent />', () => {
    const mockedAltBoards = [
        {
            accommodationId: 'accommodationId',
            price: 6,
            pricePP: 2,
            priceExcludingTouristTax: 2,
            pricePPExcludingTouristTax: 1,
            isExt: false,
            roomAlterations: {},
            code: '',
            title: '',
            content: '',
            description: '',
            iconUrl: '',
        },
    ];
    const mockedConfirmedBoard = {
        code: 'code',
        content: 'content',
        description: 'description',
        iconUrl: 'iconUrl',
        title: 'title',
    };
    const resetMocks = (): IAltBoardPopupContentProps => ({
        allBoards: [{ code: 'code' }, { code: 'code2' }] as TAllBoards,
        fields: {
            MainTitle: mockSitecoreField('MainTitle'),
            CurrentChoiceTitle: mockSitecoreField('CurrentChoiceTitle'),
            OtherOptionTitle: mockSitecoreField('OtherOptionTitle'),
            WithFreeChildPlaceTitle: mockSitecoreField('WithFreeChildPlaceTitle'),
            WithoutFreeChildPlaceTitle: mockSitecoreField('WithoutFreeChildPlaceTitle'),
            RoomChangeInfoTitle: mockSitecoreField('RoomChangeInfoTitle'),
            RoomChangeInfoMessage: mockSitecoreField('RoomChangeInfoMessage'),
        },
        confirmedBoard: mockedConfirmedBoard,
        offer: undefined,
    });
    let mockProps = resetMocks();

    beforeEach(() => {
        mockProps = resetMocks();
        mockStores = createStores();
        jest.resetAllMocks();
    });

    it('should render altBoardsPopupSkeleton component', () => {
        mockStores.bookingStore.isLoadingOffersAlterations = true;

        render(<AltBoardPopupContent {...mockProps} />);

        expect(screen.getByTestId('alt-boards-popup-skeleton')).toBeInTheDocument();
    });

    it('should render content', () => {
        mockStores.bookingStore.isLoadingOffersAlterations = false;

        render(<AltBoardPopupContent {...mockProps} />);

        expect(screen.queryByTestId('alt-boards-popup-skeleton')).not.toBeInTheDocument();

        expect(within(screen.getByRole('banner')).getByRole('heading', { level: 2 })).toHaveTextContent(
            mockProps.fields.MainTitle.value,
        );

        expect(mockAltBoardsSectionComponent).toHaveBeenCalledWith({
            confirmedBoard: mockedConfirmedBoard,
            items: [mockedConfirmedBoard],
            label: 'CurrentChoiceTitle',
            selectedOffer: undefined,
            isSelectedSection: true,
        });
    });

    it('should render info block', () => {
        render(<AltBoardPopupContent {...mockProps} />);

        expect(screen.getByTestId('info-block')).toBeInTheDocument();
        expect(mockInfoBlockComponent).toHaveBeenCalledWith({
            title: mockProps.fields.RoomChangeInfoTitle,
            text: mockProps.fields.RoomChangeInfoMessage,
            dataTid: 'room-change-info',
        });
    });

    it('should render alt boards with free child', () => {
        mockStores.bookingStore.alternativeBoards = mockedAltBoards;
        const spy = jest.spyOn(offerUtils, 'checkRoomsOnFreeForKids');
        spy.mockReturnValueOnce(true);

        render(<AltBoardPopupContent {...mockProps} />);

        expect(screen.getByTestId('other-boards-split')).toBeInTheDocument();
        expect(screen.queryByTestId('additional-board-items-block')).not.toBeInTheDocument();
        expect(mockOtherBoardsSplitComponent).toHaveBeenCalledWith({
            altBoards: mockedAltBoards,
            altRooms: [],
            confirmedBoard: mockedConfirmedBoard,
            selectedOffer: undefined,
            withFreeChildLabel: 'WithFreeChildPlaceTitle',
            withoutFreeChildLabel: 'WithoutFreeChildPlaceTitle',
        });
    });

    it('should render alt boards without free child', () => {
        mockStores.bookingStore.alternativeBoards = mockedAltBoards;
        const spy = jest.spyOn(offerUtils, 'checkRoomsOnFreeForKids');
        spy.mockReturnValueOnce(false);

        render(<AltBoardPopupContent {...mockProps} />);

        expect(screen.queryByTestId('other-boards-split')).not.toBeInTheDocument();
        expect(screen.getByTestId('additional-board-items-block')).toBeInTheDocument();
        expect(mockAltBoardsSectionComponent).toHaveBeenCalledWith({
            confirmedBoard: mockedConfirmedBoard,
            items: mockedAltBoards,
            label: 'OtherOptionTitle',
            onSelect: expect.any(Function),
            selectedOffer: undefined,
        });
    });

    describe('onSelect', () => {
        it('should call expected funcs when click on select button', async () => {
            mockStores.bookingStore.alternativeBoards = mockedAltBoards;
            const spy = jest.spyOn(offerUtils, 'checkRoomsOnFreeForKids');
            spy.mockReturnValueOnce(true);

            render(<AltBoardPopupContent {...mockProps} offer={{ accom: { unit: [] } } as any} />);

            await userEvent.click(
                within(screen.getByTestId('other-boards-split')).getByRole('button', {
                    name: 'onSelect',
                }),
            );

            expect(getNewOfferUnitsByBoard).toHaveBeenCalledWith([], {}, undefined);
            expect(mockStores.hotelsStore.setActiveOfferId).toHaveBeenCalledWith(null);
            expect(mockStores.hotelsStore.updateOffersWithSelectedBoard).toHaveBeenCalledWith(
                { accom: { unit: [] } },
                {},
                [{ code: 'code' }, { code: 'code2' }],
                undefined,
            );
            expect(mockStores.trackingStore.trackSelectAltBoard).toHaveBeenCalledWith(
                undefined,
                EventActions.Select,
                {
                    destinationUrl: 'MainTitle',
                    genericValue1: undefined,
                    genericValue2: '2',
                    genericValue3: null,
                    genericValue4: null,
                },
                undefined,
            );
        });

        it('should not call any funcs when click on select button but no offer is selected', async () => {
            mockStores.bookingStore.alternativeBoards = mockedAltBoards;
            const spy = jest.spyOn(offerUtils, 'checkRoomsOnFreeForKids');
            spy.mockReturnValueOnce(true);

            render(<AltBoardPopupContent {...mockProps} offer={null} />);

            await userEvent.click(
                within(screen.getByTestId('other-boards-split')).getByRole('button', {
                    name: 'onSelect',
                }),
            );

            expect(getNewOfferUnitsByBoard).not.toHaveBeenCalled();
            expect(mockStores.hotelsStore.setActiveOfferId).not.toHaveBeenCalled();
            expect(mockStores.hotelsStore.updateOffersWithSelectedBoard).not.toHaveBeenCalled();
            expect(mockStores.trackingStore.trackSelectAltBoard).not.toHaveBeenCalled();
        });
    });
});
