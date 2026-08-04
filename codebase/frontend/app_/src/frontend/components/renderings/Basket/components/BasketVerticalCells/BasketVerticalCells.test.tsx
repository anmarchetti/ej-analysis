import * as React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { BasketVerticalCells } from './BasketVerticalCells';

jest.mock('frontend/components/common/StartBookingButton', () => ({
    __esModule: true,
    default: props => <div data-tid='start-booking-button'>{props.render()}</div>,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => ({ layoutStore: { getPhrase: jest.fn(p => p) } }),
}));

jest.mock('frontend/components/renderings/Basket/components/BasketPriceCell', () => ({
    __esModule: true,
    default: () => <div>BasketPriceCell</div>,
}));

jest.mock('frontend/components/renderings/Basket/components/BasketFirstCell', () => ({
    __esModule: true,
    default: () => <div>BasketFirstCell</div>,
}));

jest.mock('frontend/components/renderings/Basket/components/BasketSecondCell', () => ({
    __esModule: true,
    BasketSecondCell: () => <div>BasketSecondCell</div>,
}));

jest.mock('frontend/components/renderings/Basket/components/BasketThirdCell', () => ({
    __esModule: true,
    default: () => <div>BasketThirdCell</div>,
}));

jest.mock('frontend/components/renderings/SummaryBar/SummaryDetails/SummaryDetails', () => ({
    __esModule: true,
    default: () => <div>SummaryDetails</div>,
}));

const mockPromocodeBanner = jest.fn();
jest.mock('frontend/components/renderings/Basket/components/PromocodeBanner/PromocodeBanner', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockPromocodeBanner(props);

        return <div data-tid='promocode-banner' />;
    },
}));

const mockBasketPriceCellPriceComponent = jest.fn();
jest.mock('../BasketPriceCellPrice/BasketPriceCellPrice', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockBasketPriceCellPriceComponent(props);

        return <div data-tid='basket-price-cell-price' />;
    },
}));

const mockBasketPriceCellOffersComponent = jest.fn();
jest.mock('../BasketPriceCellOffers/BasketPriceCellOffers', () => ({
    ...jest.requireActual(
        'frontend/components/renderings/Basket/components/BasketPriceCellOffers/BasketPriceCellOffers',
    ),
    __esModule: true,
    default: ({ ...props }) => {
        mockBasketPriceCellOffersComponent(props);

        return <div data-tid='basket-cell-offers' />;
    },
}));

const mockStore = {
    layoutStore: {
        getPhrase: (p: string) => p,
    },
};

let mockContainsLuxuryPromoCode = false;
jest.mock('frontend/utils/offer.utils', () => ({
    containsLuxuryPromoCode: jest.fn(() => mockContainsLuxuryPromoCode),
}));

jest.mock('../../../../../hooks/useStore', () => ({
    __esModule: true,
    default: (selector: any) => selector(mockStore as any),
}));

document.getElementById = jest.fn().mockReturnValue({
    scroll: jest.fn(),
});

describe('<BasketVerticalCells />', () => {
    const resetMocks = () => ({
        offer: notEmptyOffer,
        board: null,
        room: null,
        transfers: [],
        className: '',
        totalPricePP: 0,
        isNewSummaryBar: false,
        isNextButtonVisible: true,
        getPhrase: jest.fn(),
        toggleIsExpanded: jest.fn(),
        isExpanded: false,
        isScreenExtraSmall: false,
        isPricePPShown: true,
        isPriceVisible: false,
        currency: CurrencyCode.GBP,
        fields: {} as any,
    });

    const notEmptyOffer = {
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
                    depDate: '',
                },
                {
                    arrDate: '',
                },
            ],
        },
    } as any;

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    describe('StartBookingButton', () => {
        it('should render with StartBookingButton when isNextButtonVisible is true', () => {
            const { container } = render(<BasketVerticalCells {...mocks} />);

            expect(container.querySelector('.basket-cells.vertical-cells')).toBeInTheDocument();
            expect(container.querySelectorAll('.vertical-cell--btn')).toHaveLength(2);
            expect(within(screen.getByTestId('start-booking-button')).getByRole('button')).not.toHaveClass(
                'btn--black',
            );
        });

        it('should render without StartBookingButton when isNextButtonVisible is false', () => {
            mocks.isNextButtonVisible = false;
            const { container, queryByText } = render(<BasketVerticalCells {...mocks} />);

            expect(container.querySelector('.basket-cells.vertical-cells')).toBeInTheDocument();
            expect(container.querySelectorAll('.vertical-cell--btn')).toHaveLength(1);
            expect(screen.queryByTestId('start-booking-button')).not.toBeInTheDocument();
            expect(queryByText(SitecoreDictionary.BasketButtonsHolidayDetails)).toBeInTheDocument();
        });

        it('should render book btn with correct className when it is luxury package', () => {
            mockContainsLuxuryPromoCode = true;

            const { getByTestId } = render(<BasketVerticalCells {...mocks} />);

            expect(within(getByTestId('start-booking-button')).getByRole('button')).toHaveClass('btn--black');
        });
    });

    [false, true].forEach(value => {
        it('should call openBoxDetails from props when button click', () => {
            mocks.isExpanded = value;
            const { getByText } = render(<BasketVerticalCells {...mocks} />);

            fireEvent.click(getByText(SitecoreDictionary.BasketButtonsHolidayDetails));

            expect(mocks.toggleIsExpanded).toBeCalled();
        });
    });

    it('should call openBoxDetails from props when button click and summary bar is enabled and the basket is open', () => {
        mocks.isExpanded = true;
        mocks.isNewSummaryBar = true;
        mocks.fields = {
            SummaryBarTitle: { value: 'Custom Summary Title' },
            SummaryBarExpanderTitle: { value: 'Custom Expander Title' },
        } as any;

        const { getByText } = render(<BasketVerticalCells {...mocks} />);

        fireEvent.click(getByText(mocks.fields.SummaryBarExpanderTitle.value));

        expect(mocks.toggleIsExpanded).toBeCalled();
    });

    it('should call openBoxDetails from props when button click and summary bar is enabled and the basket is closed', () => {
        mocks.isExpanded = false;
        mocks.isNewSummaryBar = true;
        mocks.fields = {
            SummaryBarTitle: { value: 'Custom Summary Title' },
            SummaryBarExpanderTitle: { value: 'Custom Expander Title' },
        } as any;

        const { getAllByText } = render(<BasketVerticalCells {...mocks} />);

        fireEvent.click(getAllByText(mocks.fields.SummaryBarExpanderTitle.value)[0]);

        expect(mocks.toggleIsExpanded).toBeCalled();
    });

    it('should render HeightAnimatedContainer children component', () => {
        mocks.isExpanded = true;
        const { queryByText, container } = render(<BasketVerticalCells {...mocks} />);

        expect(screen.getByRole('heading')).toHaveTextContent(SitecoreDictionary.BasketSectionHeadersThisPriceIncludes);
        expect(queryByText(SitecoreDictionary.BasketSectionHeadersThisPriceIncludes)).toHaveClass(
            'basket-summary-box--details__title',
        );
        expect(queryByText('BasketFirstCell')).toBeInTheDocument();
        expect(queryByText('BasketSecondCell')).toBeInTheDocument();
        expect(queryByText('BasketThirdCell')).toBeInTheDocument();
        expect(container.querySelector('.btn.btn--txt.btn--close')).toBeInTheDocument();
    });

    it('should render BasketPriceCellOffers when isPriceVisible is true', () => {
        mocks.isExpanded = true;
        mocks.isPriceVisible = true;
        render(<BasketVerticalCells {...mocks} />);

        expect(screen.getByTestId('basket-cell-offers')).toBeInTheDocument();
    });

    it('should render without BasketPriceCellOffers when isPriceVisible is false', () => {
        mocks.isExpanded = true;
        render(<BasketVerticalCells {...mocks} />);

        expect(screen.queryByTestId('basket-cell-offers')).not.toBeInTheDocument();
    });

    describe('vertical-cell--btn getButtonTitle (summary on/off)', () => {
        it('should show SummaryBarExpanderTitle from fields when summary bar is enabled', () => {
            mocks.isNewSummaryBar = true;
            mocks.fields = {
                SummaryBarTitle: { value: 'Custom Summary Title' },
                SummaryBarExpanderTitle: { value: 'Custom Expander Title' },
            } as any;

            const { container } = render(<BasketVerticalCells {...mocks} />);

            const firstVerticalBtn = container.querySelector('.vertical-cell--btn');
            expect(firstVerticalBtn).toBeInTheDocument();
            expect(firstVerticalBtn).toHaveTextContent('Custom Expander Title');
        });

        it('should falls back to dictionary phrase when summary bar is disabled', () => {
            mocks.isNewSummaryBar = false;
            mocks.fields = {
                SummaryBarTitle: { value: 'Custom Summary Title' },
                SummaryBarExpanderTitle: { value: 'Custom Expander Title' },
            } as any;

            const { container } = render(<BasketVerticalCells {...mocks} />);

            const firstVerticalBtn = container.querySelector('.vertical-cell--btn');
            expect(firstVerticalBtn).toBeInTheDocument();
            expect(firstVerticalBtn).toHaveTextContent(SitecoreDictionary.BasketButtonsHolidayDetails);
        });
    });
});
