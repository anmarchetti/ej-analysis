import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { BasketVerticalCellsAB, IBasketVerticalCellsABProps } from './BasketVerticalCellsAB';

const notEmptyOffer: IOfferWithoutAltBoards = {
    accom: {
        unit: [
            {
                occupation: {
                    adults: 2,
                    children: 0,
                },
            },
        ],
    },
    transport: {
        routes: [
            {
                direction: 'outbound',
                arrDate: '2019-09-16T14:20:00+00:00',
                arrName: 'Palma Airport',
                arrPt: 'PMI',
                depDate: '2019-09-16T11:55:00+00:00',
                depName: 'London Gatwick Airport',
                depPt: 'LGW',
            },
            {
                direction: 'inbound',
                depDate: '2019-09-16T14:20:00+00:00',
                depName: 'Palma Airport',
                depPt: 'PMI',
                arrDate: '2019-09-16T11:55:00+00:00',
                arrName: 'London Gatwick Airport',
                arrPt: 'LGW',
            },
        ],
    },
} as IOfferWithoutAltBoards;

const createProps = (): IBasketVerticalCellsABProps => ({
    offer: notEmptyOffer,
    board: null,
    room: null,
    className: '',
    totalPricePP: 0,
    isNextButtonVisible: false,
    openBoxDetails: jest.fn(),
    isOpenSummaryBoxDetails: false,
    isPricePPShown: true,
    isPriceVisible: false,
    currency: CurrencyCode.GBP,
});

const createStores = () => ({ layoutStore: { getPhrase: jest.fn(p => p) } });

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockStartBookingButtonComponent = jest.fn();
jest.mock('frontend/components/common/StartBookingButton', () => ({
    __esModule: true,
    default: props => {
        mockStartBookingButtonComponent(props);

        return <div data-tid={'start-booking-btn'}>StartBookingButton</div>;
    },
}));

const mockButtonComponent = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ children, onClick, ...props }) => {
        mockButtonComponent(props);

        return <button onClick={onClick}>{children}</button>;
    },
}));

const mockBasketFirstCellABComponent = jest.fn();
jest.mock('frontend/components/cro/BasketVerticalCellsAB/BasketFirstCellAB', () => ({
    __esModule: true,
    default: props => {
        mockBasketFirstCellABComponent(props);

        return <div data-tid='basket-first-cell'>BasketFirstCellAB</div>;
    },
}));

const mockBasketSecondCellABComponent = jest.fn();
jest.mock('frontend/components/cro/BasketVerticalCellsAB/BasketSecondCellAB', () => ({
    __esModule: true,
    default: props => {
        mockBasketSecondCellABComponent(props);

        return <div data-tid='basket-second-cell'>BasketSecondCellAB</div>;
    },
}));

const mockBasketThirdCellABComponent = jest.fn();
jest.mock('frontend/components/cro/BasketVerticalCellsAB/BasketThirdCellAB', () => ({
    __esModule: true,
    default: props => {
        mockBasketThirdCellABComponent(props);

        return <div data-tid='basket-third-cell'>BasketThirdCellAB</div>;
    },
}));

const mockBasketPriceCellABComponent = jest.fn();
jest.mock('frontend/components/cro/BasketVerticalCellsAB/BasketPriceCellAB', () => ({
    __esModule: true,
    default: props => {
        mockBasketPriceCellABComponent(props);

        return <div data-tid='basket-price-cell'>BasketPriceCellAB</div>;
    },
}));

const mockBasketPriceCellOffersComponent = jest.fn();
jest.mock('frontend/components/renderings/Basket/components/BasketPriceCellOffers/BasketPriceCellOffers', () => ({
    __esModule: true,
    ...jest.requireActual(
        'frontend/components/renderings/Basket/components/BasketPriceCellOffers/BasketPriceCellOffers',
    ),
    default: ({ ...props }) => {
        mockBasketPriceCellOffersComponent(props);

        return <div data-tid='basket-cell-offers' />;
    },
}));

const mockHeightAnimatedContainerComponent = jest.fn();
jest.mock('frontend/components/common/HeightAnimatedContainer/HeightAnimatedContainer', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockHeightAnimatedContainerComponent(props);

        return (
            <div className='height-animation' data-tid='height-animated-container'>
                {children}
            </div>
        );
    },
}));

const mockReactSwipeableComponent = jest.fn();
jest.mock('react-swipeable', () => ({
    __esModule: true,
    Swipeable: ({ children, ...props }) => {
        mockReactSwipeableComponent(props);

        return <div data-tid='react-swipeable'>{children}</div>;
    },
}));

describe('<BasketVerticalCellsAB />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    describe('StartBookingButton', () => {
        it('should render with StartBookingButton when isNextButtonVisible is true', () => {
            mockProps.isNextButtonVisible = true;
            render(<BasketVerticalCellsAB {...mockProps} />);

            expect(screen.getByTestId('start-booking-btn')).toBeInTheDocument();
        });

        it('should render without StartBookingButton when isNextButtonVisible is false', () => {
            render(<BasketVerticalCellsAB {...mockProps} />);

            expect(screen.queryByTestId('start-booking-btn')).not.toBeInTheDocument();
        });
    });

    it('should call openBoxDetails from props when button click', () => {
        render(<BasketVerticalCellsAB {...mockProps} />);

        fireEvent.click(screen.getByText(SitecoreDictionary.BasketButtonsShowHolidayDetailsAB));
        expect(mockProps.openBoxDetails).toBeCalled();
    });

    it('should change button label when box details is opened', () => {
        mockProps.isOpenSummaryBoxDetails = true;
        render(<BasketVerticalCellsAB {...mockProps} />);

        expect(screen.getByText(SitecoreDictionary.BasketButtonsHideHolidayDetailsAB)).toBeInTheDocument();
    });

    it('should render HeightAnimatedContainer children component', () => {
        mockProps.isOpenSummaryBoxDetails = true;
        mockProps.isPriceVisible = true;
        mockProps.isNextButtonVisible = true;
        render(<BasketVerticalCellsAB {...mockProps} />);

        expect(screen.getByTestId('height-animated-container')).toBeInTheDocument();
        expect(screen.getByRole('heading')).toHaveTextContent(
            SitecoreDictionary.BasketSectionHeadersThisHolidaysIncludesAB,
        );

        expect(screen.getByTestId('basket-third-cell')).toBeInTheDocument();
        expect(screen.getByTestId('basket-second-cell')).toBeInTheDocument();
        expect(screen.getByTestId('basket-first-cell')).toBeInTheDocument();
        expect(screen.getByTestId('basket-cell-offers')).toBeInTheDocument();
    });

    it('should render Swipeable component', () => {
        mockProps.isOpenSummaryBoxDetails = true;
        render(<BasketVerticalCellsAB {...mockProps} />);

        expect(screen.getByTestId('react-swipeable')).toBeInTheDocument();
    });
});
