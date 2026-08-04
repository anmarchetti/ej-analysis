import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockedOffer } from 'frontend/__mocks__/offer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import FeesPopup from './FeesPopup';

const mockRichTextDictionaryComponent = jest.fn();
jest.mock('frontend/components/common/RichTextDictionary', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockRichTextDictionaryComponent(props);

        return <div data-tid='rich-text-dictionary' />;
    },
}));

const createProps = () => ({
    onClose: jest.fn(),
    paymentInfo: {
        depositPrice: 10,
        pricePP: 1,
        totalPrice: 10,
        paymentHistory: [],
        balanceDueDate: 'balance',
        allowPayBalanceDueDate: 'allow',
        depositDueDate: 'deposite',
        balanceDueAmount: 1,
        agentComission: 1,
        commissionIncludingVat: 1,
    },
    fields: {
        PopupTitle: { value: 'title' },
        AccommodationLabel: { value: 'accomodation' },
        CommissionLabel: { value: 'commission' },
        BalanceLabel: { value: 'balance' },
        VATOnCommissionLabel: { value: 'vat' },
        DepositLabel: { value: 'deposition' },
        TotalPriceLabel: { value: 'total' },
        FeesAndTaxesLabel: { value: 'fees' },
    },
    totalAccomodationDiscount: 1,
    tradeAgentPriceBreakdown: [
        { code: 'Package Price', name: 'name1', amount: 'amount1', quantity: 1 },
        { code: 'Flight Tax', name: 'name3', amount: 'amount2', quantity: 2 },
    ],
    priceBreakdown: [{ code: 'Promotions', name: 'name2', amount: 'amount2', quantity: 1 }],
    extras: { code: 'EXTR', name: 'Extras', amount: 100, quantity: 1 },
});

const createStores = () => ({
    layoutStore: {
        getPhrase: jest.fn(),
        isTouristTaxEnabled: true,
        isPostBookingPages: false,
    },
    marketStore: {
        formatMoney: jest.fn(a => `£${a}`),
    },
    bookingStore: {
        selectedOffer: mockedOffer,
        totalPriceWithTouristTax: 567,
    },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<FeesPopup />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render', async () => {
        mockProps.fields = null;
        mockProps.paymentInfo = null;
        const { container } = render(<FeesPopup {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render popup with all items', () => {
        const { container } = render(<FeesPopup {...mockProps} />);

        const items = container.getElementsByClassName('item');

        expect(items[0]).toHaveTextContent('name1');
        expect(items[1]).toHaveTextContent('Extras');
        expect(items[2]).toHaveTextContent('accomodation');
        expect(items[3]).toHaveTextContent('name2');
        expect(items[4]).toHaveTextContent('name3');
        expect(items[5]).toHaveTextContent('£7');
        expect(items[6]).toHaveTextContent('commission');
        expect(items[7]).toHaveTextContent('vat');
        expect(items[8]).toHaveTextContent('deposition');
        expect(items[9]).toHaveTextContent('balance');
        expect(items[10]).toHaveTextContent('total');

        expect(mockRichTextDictionaryComponent).toHaveBeenCalledWith({
            className: 'touristTaxLabel',
            dictionaryKey: SitecoreDictionary.TouristTaxLabelsLocalTaxes,
            tag: 'p',
        });
    });

    it('should render popup when isPostBooking is true', () => {
        mockStores.layoutStore.isPostBookingPages = true;
        mockProps.paymentInfo.totalPrice = 123;

        const { container } = render(<FeesPopup {...mockProps} />);

        const items = container.getElementsByClassName('item');

        expect(items[0]).toHaveTextContent('name1');
        expect(items[1]).toHaveTextContent('Extras');
        expect(items[2]).toHaveTextContent('accomodation');
        expect(items[3]).toHaveTextContent('name2');
        expect(items[4]).toHaveTextContent('name3');
        expect(items[5]).toHaveTextContent('commission');
        expect(items[6]).toHaveTextContent('vat');
        expect(items[7]).toHaveTextContent('deposition');
        expect(items[8]).toHaveTextContent('balance');
        expect(items[9]).toHaveTextContent('total');
    });

    it('should render popup without items when no labels', () => {
        mockProps.tradeAgentPriceBreakdown = null;
        mockProps.fields.AccommodationLabel = '';
        mockProps.priceBreakdown = null;
        mockProps.extras = null;
        mockProps.fields.CommissionLabel = '';
        mockProps.fields.VATOnCommissionLabel = '';
        mockProps.fields.DepositLabel = '';
        mockProps.fields.BalanceLabel = '';
        mockProps.fields.TotalPriceLabel = '';
        mockStores.layoutStore.isTouristTaxEnabled = false;

        const { container } = render(<FeesPopup {...mockProps} />);

        expect(container.getElementsByClassName('item').length).toBe(0);
    });

    it('should render popup without items when no values', () => {
        mockProps.tradeAgentPriceBreakdown = null;
        mockProps.totalAccomodationDiscount = null;
        mockProps.priceBreakdown = null;
        mockProps.extras = null;
        mockProps.paymentInfo.agentComission = null;
        mockProps.paymentInfo.commissionIncludingVat = null;
        mockProps.paymentInfo.depositDueDate = null;
        mockProps.paymentInfo.balanceDueDate = null;
        mockProps.paymentInfo.totalPrice = null;
        mockStores.layoutStore.isTouristTaxEnabled = false;
        mockStores.bookingStore.totalPriceWithTouristTax = 0;

        const { container } = render(<FeesPopup {...mockProps} />);

        expect(container.getElementsByClassName('item').length).toBe(0);
    });

    it('should always render Flight Tax without quantity', () => {
        render(<FeesPopup {...mockProps} />);

        expect(screen.getByTestId('flight-tax')).toHaveTextContent('amount2');
    });

    describe('Extras rendering', () => {
        it('should render extras when extras prop is provided', () => {
            render(<FeesPopup {...mockProps} />);

            const extrasItem = screen.getByTestId('extras-item');

            expect(extrasItem).toHaveTextContent('Extras');
            expect(extrasItem).toHaveTextContent('£100');
        });

        it('should NOT render extras when extras has no name', () => {
            mockProps.extras = { code: 'EXTR', name: '', amount: 100, quantity: 1 };

            render(<FeesPopup {...mockProps} />);

            expect(screen.queryByTestId('extras-item')).not.toBeInTheDocument();
        });

        it('should NOT render extras when extras has no amount', () => {
            mockProps.extras = { code: 'EXTR', name: 'Extras', amount: 0, quantity: 1 };

            render(<FeesPopup {...mockProps} />);

            expect(screen.queryByTestId('extras-item')).not.toBeInTheDocument();
        });
    });
});
