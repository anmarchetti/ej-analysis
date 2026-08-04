import React from 'react';
import { render } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import LateCheckoutComponent from './LateCheckoutComponent';

jest.mock('frontend/utils/date.utils', () => ({
    ...jest.requireActual('frontend/utils/date.utils'),
    formatDate: jest.fn(),
}));

const createProps = () => ({
    fields: {
        PopUpDescription: { value: 'popup desc' },
        PopUpTitle: { value: 'popup title' },
        PopUpIcon: { value: { src: 'icon' } },
        Title: { value: 'title' },
        Description: { value: 'desc' },
        BannerLabel: { value: 'banner label' },
        BannerTitle: { value: 'banner title' },
        BannerDescription: { value: 'banner desc' },
        Icon: { value: { src: 'icon' } },
        LinkText: { value: 'link' },
    },
    props: {},
    rendering: {},
});

const createStores = () => ({
    layoutStore: {
        getPhrase: jest.fn(p => p),
        isLateCheckoutEnabledBySitecore: true,
        isPricesHidden: false,
        isTradePortal: false,
    },
    bookingStore: {
        isLateRoomCheckoutAvailable: true,
        lateRoomCheckout: { id: 'id', price: 10 },
        setLateRoomCheckoutToBooking: jest.fn(),
        isLateCheckoutRoomSelected: false,
        selectedOffer: {
            transport: {
                routes: [{ depDate: { value: 'selected flight 1' } }, { depDate: { value: 'selected flight 2' } }],
            },
        },
        currency: CurrencyCode.GBP,
    },
    appStore: {},
    marketStore: { formatMoney: jest.fn(a => `£${a}`) },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<LateCheckoutComponent />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render if no fields', () => {
        mockProps.fields = null;
        const { container } = render(<LateCheckoutComponent {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render if late checkout disabled', () => {
        mockStores.layoutStore.isLateCheckoutEnabledBySitecore = false;
        const { container } = render(<LateCheckoutComponent {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render if late room checkout not available', () => {
        mockStores.bookingStore.isLateRoomCheckoutAvailable = false;
        const { container } = render(<LateCheckoutComponent {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render if no late room checkout data', () => {
        mockStores.bookingStore.lateRoomCheckout = null as any;
        const { container } = render(<LateCheckoutComponent {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render title, description, banner label, icon, banner title, banner description, link text, late checkout price, select button', () => {
        const { getByRole, getByText, getAllByRole } = render(<LateCheckoutComponent {...mockProps} />);

        expect(getByRole('heading', { name: 'title' })).toBeInTheDocument();
        expect(getByText('desc')).toBeInTheDocument();
        expect(getByText('banner label')).toBeInTheDocument();
        expect(getAllByRole('img').length).toBe(2);
        expect(getByRole('heading', { name: 'banner title' })).toBeInTheDocument();
        expect(getByRole('heading', { name: 'popup title' })).toBeInTheDocument();
        expect(getByText('banner desc')).toBeInTheDocument();
        expect(getByRole('button', { name: 'link' })).toBeInTheDocument();
        expect(getByRole('button', { name: SitecoreDictionary.GlobalsButtonsClose })).toBeInTheDocument();
    });

    it('should NOT render title, description, banner label, icon, banner title, banner description, link text, late checkout price, select button', () => {
        mockProps.fields.Title = null;
        mockProps.fields.Description = null;
        mockProps.fields.BannerLabel = null;
        mockProps.fields.Icon = null;
        mockProps.fields.BannerTitle = null;
        mockProps.fields.BannerDescription = null;
        mockProps.fields.LinkText = null;
        mockStores.bookingStore.isLateCheckoutRoomSelected = true;
        mockProps.fields.PopUpTitle = null;
        mockProps.fields.PopUpIcon = null;
        const { getByRole, queryByRole, queryByText, queryAllByRole } = render(
            <LateCheckoutComponent {...mockProps} />,
        );

        expect(queryByRole('heading', { name: 'title' })).not.toBeInTheDocument();
        expect(queryByText('desc')).not.toBeInTheDocument();
        expect(queryByText('banner label')).not.toBeInTheDocument();
        expect(queryAllByRole('img').length).toBe(0);
        expect(queryByRole('heading', { name: 'banner title' })).not.toBeInTheDocument();
        expect(queryByRole('heading', { name: 'popup title' })).not.toBeInTheDocument();
        expect(queryByText('banner desc')).not.toBeInTheDocument();
        expect(queryByRole('button', { name: 'link' })).not.toBeInTheDocument();
        expect(getByRole('button', { name: SitecoreDictionary.GlobalsButtonsClose })).toBeInTheDocument();
    });

    describe('Room Not Selected', () => {
        it('should render button with LateCheckoutButtonsSelect text', () => {
            const { getByRole } = render(<LateCheckoutComponent {...mockProps} />);

            expect(getByRole('button', { name: SitecoreDictionary.LateCheckoutButtonsSelect })).toBeInTheDocument();
        });

        describe('Prices', () => {
            it('should NOT render price when price is hidden on trade portal', () => {
                mockStores.layoutStore.isPricesHidden = true;
                mockStores.layoutStore.isTradePortal = true;
                const { queryByText } = render(<LateCheckoutComponent {...mockProps} />);

                expect(queryByText('£10')).not.toBeInTheDocument();
            });

            it('should render price when price is NOT hidden on trade portal', () => {
                mockStores.layoutStore.isTradePortal = true;
                const { getByText } = render(<LateCheckoutComponent {...mockProps} />);

                expect(getByText('£10')).toBeInTheDocument();
            });

            it('should render price on holidays page', () => {
                const { getByText } = render(<LateCheckoutComponent {...mockProps} />);

                expect(getByText('£10')).toBeInTheDocument();
            });
        });
    });

    describe('Room Selected', () => {
        beforeEach(() => {
            mockStores.bookingStore.isLateCheckoutRoomSelected = true;
        });

        it('should render button with GlobalsButtonsRemove text', () => {
            const { getByRole } = render(<LateCheckoutComponent {...mockProps} />);

            expect(getByRole('button', { name: SitecoreDictionary.GlobalsButtonsRemove })).toBeInTheDocument();
        });

        it('should NOT render price', () => {
            const { queryByText } = render(<LateCheckoutComponent {...mockProps} />);

            expect(queryByText('£10')).not.toBeInTheDocument();
        });
    });
});
