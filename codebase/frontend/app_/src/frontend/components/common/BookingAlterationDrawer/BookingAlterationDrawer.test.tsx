import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { isTradeStore } from 'frontend/store/tradePortal';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IUnit } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { boardTypesFields } from 'frontend/components/renderings/BoardTypes/components/__mocks__/boardTypesFields';

import BookingAlterationDrawer, { IBookingAlterationDrawerProps } from './BookingAlterationDrawer';

const createStores = () => ({
    bookingStore: {
        selectedOffer: {
            price: 100,
            pricePP: 50,
        },
    },
    layoutStore: {
        getPhrase: jest.fn(e => e),
        isPricesHidden: false,
    },
    marketStore: { formatMoney: jest.fn(a => `+£${a}`) },
    trackingStore: {
        trackBookingAlterationDrawerPageLoad: jest.fn(),
    },
});

const createProps = (): IBookingAlterationDrawerProps => {
    const {
        AlterationSubtitle,
        AlterationRoomResultTitle,
        AlterationResultSubtitle,
        AlterationRoomResultTextSingular,
        FreeChildPlaceInfoTitle,
        FreeChildPlaceInfoText,
    } = boardTypesFields();

    return {
        hideInfoBlock: false,
        alterationResults: [
            {
                items: [
                    {
                        newItem: {
                            item: {} as IUnit,
                        },
                        oldItemName: 'replaceableItemName',
                    },
                ],
                isBoardAlteration: false,
                title: AlterationRoomResultTitle,
                subtitle: AlterationResultSubtitle,
                text: AlterationRoomResultTextSingular,
            },
        ],
        isOpen: true,
        price: 123,
        selectedItemElement: <div>SelectedItemElement</div>,
        fallbackImage: 'fallback-img',
        subtitle: AlterationSubtitle,
        freeChildPlaceInfoTitle: FreeChildPlaceInfoTitle,
        freeChildPlaceInfoText: FreeChildPlaceInfoText,
        onCancel: jest.fn(),
        onConfirm: jest.fn(),
    };
};

let mockStores = createStores();
let props = createProps();
let mockIsPricePPShown;
let mockIsRoomPricePPShown;

jest.mock('frontend/store/tradePortal', () => ({
    isTradeStore: jest.fn(() => true),
}));

jest.mock('frontend/utils/offer.utils', () => ({
    isPricePPShown: () => mockIsPricePPShown,
    isRoomPricePPShown: () => mockIsRoomPricePPShown,
}));

const mockDrawerComponent = jest.fn();
jest.mock('frontend/components/common/Drawer', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockDrawerComponent(props);

        return (
            <div>
                Drawer
                {children}
            </div>
        );
    },
}));

const mockInfoBlock = jest.fn();
jest.mock('frontend/components/common/InfoBlock/InfoBlock', () => ({
    __esModule: true,
    default: props => {
        mockInfoBlock(props);

        return <div>InfoBlock</div>;
    },
}));

const mockAlterationResultsProps = jest.fn();
jest.mock('./components/AlterationResults/AlterationResults', () => ({
    __esModule: true,
    default: props => {
        mockAlterationResultsProps(props);

        return <div>AlterationResults</div>;
    },
}));

const mockScrollTo = jest.fn();
const mockUseRef = jest.fn((): { current?: { scrollTo: jest.Mock } } => ({ current: { scrollTo: mockScrollTo } }));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
    useRef: () => mockUseRef(),
}));

describe('<BookingAlterationDrawer />', () => {
    beforeEach(() => {
        mockStores = createStores();
        props = createProps();
        mockIsPricePPShown = true;
        mockIsRoomPricePPShown = true;
    });

    it('Should standard render', () => {
        render(<BookingAlterationDrawer {...props} />);

        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
            SitecoreDictionary.BookingAlterationsLabelsTitle,
        );
        expect(screen.getByText(props.subtitle!.value)).toBeInTheDocument();
        expect(screen.getByText('SelectedItemElement')).toBeInTheDocument();
        expect(screen.getByTestId('alteration-footer-title')).toHaveTextContent(
            SitecoreDictionary.BookingAlterationsLabelsUpdateTo,
        );
        expect(screen.getByTestId('alteration-price')).toHaveTextContent(
            `${SitecoreDictionary.GlobalsPriceLabelsPerPerson}+£${props.price}`,
        );
        expect(screen.getByText('InfoBlock')).toBeInTheDocument();

        screen.getByRole('button', { name: SitecoreDictionary.GlobalsButtonsCancel });
        screen.getByRole('button', { name: SitecoreDictionary.GlobalsButtonsConfirmChanges });

        expect(mockInfoBlock).toHaveBeenCalledWith({
            title: props.freeChildPlaceInfoTitle,
            text: props.freeChildPlaceInfoText,
            className: 'freeChildBlock',
            textClass: 'freeChildDescription',
            renderIcon: expect.any(Function),
        });
        expect(mockDrawerComponent).toHaveBeenCalledWith({
            'aria-label': SitecoreDictionary.AccessibilityAriaLabelsReviewChanges,
            className: 'drawer--animation-bottom drawer',
            containerRef: {
                current: {
                    scrollTo: expect.any(Function),
                },
            },
            dataTid: 'booking-alteration-drawer',
            isInDrawer: false,
            open: true,
        });
    });

    it('should render button with text from props', () => {
        props.backButtonText = 'test back text';

        render(<BookingAlterationDrawer {...props} />);

        screen.getByRole('button', { name: props.backButtonText });
    });

    it('should render footer with PriceSummaryLabelsTotalPrice instead of BookingAlterationsLabelsUpdateTo when total price is true', () => {
        props.isTotalPrice = true;

        render(<BookingAlterationDrawer {...props} />);

        expect(screen.queryByText(SitecoreDictionary.BookingAlterationsLabelsUpdateTo)).not.toBeInTheDocument();
        expect(screen.getByTestId('alteration-footer-title')).toHaveTextContent(
            SitecoreDictionary.PriceSummaryLabelsTotalPrice,
        );
    });

    it('should render title from props instead of BookingAlterationsLabelsTitle when title is provided', () => {
        props.title = 'test title';

        render(<BookingAlterationDrawer {...props} />);

        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(props.title);
    });

    it('should render AlterationResults with alterationChangingFromTitle when alterationChangingFromBoardTitle is NOT provided', () => {
        props.alterationChangingFromRoomTitle = mockSitecoreField('test room title');
        props.alterationChangingFromTitle = mockSitecoreField('test from title');

        render(<BookingAlterationDrawer {...props} />);

        expect(screen.getByText('AlterationResults')).toBeInTheDocument();
        expect(mockAlterationResultsProps).toHaveBeenCalledWith({
            fallbackImage: props.fallbackImage,
            alterationResult: props.alterationResults[0],
            alterationChangingFromTitle: props.alterationChangingFromTitle,
        });
    });

    it('should render AlterationResults with alterationChangingFromTitle when alterationChangingFromRoomTitle is NOT provided', () => {
        props.alterationChangingFromBoardTitle = mockSitecoreField('test board title');
        props.alterationChangingFromTitle = mockSitecoreField('test from title');
        props.fallbackImage = undefined;

        render(<BookingAlterationDrawer {...props} />);

        expect(screen.getByText('AlterationResults')).toBeInTheDocument();
        expect(mockAlterationResultsProps).toHaveBeenCalledWith({
            fallbackImage: '',
            alterationResult: props.alterationResults[0],
            alterationChangingFromTitle: props.alterationChangingFromTitle,
        });
    });

    it('should render AlterationResults with alterationChangingFromRoomTitle when isBoardAlteration is false', () => {
        props.alterationChangingFromRoomTitle = mockSitecoreField('test room title');
        props.alterationChangingFromBoardTitle = mockSitecoreField('test board title');

        render(<BookingAlterationDrawer {...props} />);

        expect(screen.getByText('AlterationResults')).toBeInTheDocument();
        expect(mockAlterationResultsProps).toHaveBeenCalledWith({
            fallbackImage: props.fallbackImage,
            alterationResult: props.alterationResults[0],
            alterationChangingFromTitle: props.alterationChangingFromRoomTitle,
        });
    });

    it('should render AlterationResults with alterationChangingFromBoardTitle when isBoardAlteration is true', () => {
        props.alterationChangingFromRoomTitle = mockSitecoreField('test room title');
        props.alterationChangingFromBoardTitle = mockSitecoreField('test board title');
        props.alterationResults[0].isBoardAlteration = true;

        render(<BookingAlterationDrawer {...props} />);

        expect(screen.getByText('AlterationResults')).toBeInTheDocument();
        expect(mockAlterationResultsProps).toHaveBeenCalledWith({
            fallbackImage: props.fallbackImage,
            alterationResult: props.alterationResults[0],
            alterationChangingFromTitle: props.alterationChangingFromBoardTitle,
        });
    });

    describe('should Show Pp', () => {
        it('should not show PP when isRoomSelection is true and isRoomPricePPShown is false', () => {
            mockIsRoomPricePPShown = false;
            render(<BookingAlterationDrawer {...props} isRoomSelection />);

            expect(screen.getByTestId('alteration-price')).toHaveTextContent(`+£${props.price}`);
        });

        it('should show PP when isRoomSelection is true and isRoomPricePPShown is true', () => {
            render(<BookingAlterationDrawer {...props} isRoomSelection />);

            expect(screen.getByTestId('alteration-price')).toHaveTextContent(
                `${SitecoreDictionary.GlobalsPriceLabelsPerPerson}+£${props.price}`,
            );
        });

        it('should show PP when isRoomSelection is false and isPricePPShown is true ', () => {
            render(<BookingAlterationDrawer {...props} />);

            expect(screen.getByTestId('alteration-price')).toHaveTextContent(
                `${SitecoreDictionary.GlobalsPriceLabelsPerPerson}+£${props.price}`,
            );
        });

        it('should not show PP when isRoomSelection is false and isPricePPShown is false ', () => {
            mockIsPricePPShown = false;
            render(<BookingAlterationDrawer {...props} />);

            expect(screen.getByTestId('alteration-price')).toHaveTextContent(`+£${props.price}`);
        });

        it('should not show PP and "+" symbol when isTotalPrice is true', () => {
            props.isTotalPrice = true;

            render(<BookingAlterationDrawer {...props} />);

            expect(screen.getByTestId('alteration-price')).toHaveTextContent(`${props.price}`);
        });
    });

    it('Should NOT display the infoBlock when displaying is disabled', () => {
        props.hideInfoBlock = true;
        render(<BookingAlterationDrawer {...props} />);

        expect(screen.queryByText('InfoBlock')).not.toBeInTheDocument();
    });

    it('Should display price block without pp part when displaying is disabled', () => {
        mockIsPricePPShown = false;
        render(<BookingAlterationDrawer {...props} />);

        expect(screen.getByText(`+£${props.price}`)).toBeInTheDocument();
    });

    it('Should call onCancel on click cancel CTA', async () => {
        render(<BookingAlterationDrawer {...props} />);

        await userEvent.click(screen.getByRole('button', { name: SitecoreDictionary.GlobalsButtonsCancel }));

        expect(props.onCancel).toHaveBeenCalled();
    });

    it('Should call onConfirm on click confirm CTA', async () => {
        render(<BookingAlterationDrawer {...props} />);

        await userEvent.click(screen.getByRole('button', { name: SitecoreDictionary.GlobalsButtonsConfirmChanges }));

        expect(props.onConfirm).toHaveBeenCalled();
    });

    it('should not display price when prices are hidden on trade', () => {
        (isTradeStore as any).mockReturnValue(true);
        mockStores.layoutStore.isPricesHidden = true;
        render(<BookingAlterationDrawer {...props} />);

        expect(screen.queryByTestId('alteration-price')).not.toBeInTheDocument();
    });

    it('should display price when not trade store', () => {
        (isTradeStore as any).mockReturnValue(false);
        mockStores.layoutStore.isPricesHidden = true;
        render(<BookingAlterationDrawer {...props} />);

        expect(screen.queryByTestId('alteration-price')).toBeInTheDocument();
    });

    it('should display price when prices are not hidden on trade', () => {
        (isTradeStore as any).mockReturnValue(true);
        mockStores.layoutStore.isPricesHidden = false;
        render(<BookingAlterationDrawer {...props} />);

        expect(screen.queryByTestId('alteration-price')).toBeInTheDocument();
    });

    it('should call trackBookingAlterationDrawerPageLoad one time', () => {
        const { rerender } = render(<BookingAlterationDrawer {...props} isOpen={false} />);

        expect(mockStores.trackingStore.trackBookingAlterationDrawerPageLoad).toBeCalledWith(false);

        rerender(<BookingAlterationDrawer {...props} isOpen />);

        expect(mockStores.trackingStore.trackBookingAlterationDrawerPageLoad).toBeCalledWith(true);
    });

    it('should NOT call trackBookingAlterationDrawerPageLoad when shouldTrack is false', () => {
        props.shouldTrack = false;

        render(<BookingAlterationDrawer {...props} isOpen={false} />);

        expect(mockStores.trackingStore.trackBookingAlterationDrawerPageLoad).not.toHaveBeenCalled();
    });

    it('should call scrollTo when isOpen is true and scrollTo is in ref.current', () => {
        render(<BookingAlterationDrawer {...props} />);

        expect(mockScrollTo).toHaveBeenCalledWith(0, 0);
    });

    it('should NOT call scrollTo when isOpen is false', () => {
        render(<BookingAlterationDrawer {...props} isOpen={false} />);

        expect(mockScrollTo).not.toHaveBeenCalled();
    });

    it('should NOT call scrollTo when ref.current is undefined', () => {
        mockUseRef.mockImplementation(jest.fn(() => ({ current: undefined })));

        render(<BookingAlterationDrawer {...props} />);

        expect(mockScrollTo).not.toHaveBeenCalled();
    });
});
