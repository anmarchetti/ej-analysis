import React from 'react';
import { render, screen } from '@testing-library/react';
import qs from 'qs';

import { mockFlightsRoutes } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import OtherRoutesItem from './OtherRoutesItem';

jest.mock('frontend/components/icons/ChevronRight', () => () => <div data-tid='icon-chevron-right' />);
jest.mock('frontend/components/icons-new/Tick', () => () => <div data-tid='icon-tick' />);

const createProps = () => ({
    offer: {
        date: '2023-07-02T00:00:00',
        stay: 7,
        transport: { routes: [...mockFlightsRoutes] },
        price: 200,
        pricePP: 100,
    },
});

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p), isPromoPage: false, currentPath: '', basePath: '' },
    queryParamStore: {
        buildHotelDetailsQuery: jest.fn((_, additionalParams, fallbackParams) =>
            qs.stringify({ ...additionalParams, ...fallbackParams }),
        ),
    },
    routerStore: { hotelDetailsUrl: jest.fn((_, query) => `hotel/&${query}`) },
    marketStore: {
        formatMoney: jest.fn(a => `£${a}`),
    },
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<OtherRoutesItem />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('Should not render item when route is not available', () => {
        mockProps.offer.transport.routes = [];
        const { container } = render(<OtherRoutesItem {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should render item on mobile', () => {
        mockProps.isMobile = true;

        render(<OtherRoutesItem {...mockProps} />);

        expect(screen.getByRole('link')).toHaveClass('table-row mobile');
        expect(screen.getByTestId('airport-name')).toHaveTextContent('London Gatwick (LGW)');
        expect(screen.getByTestId('other-routes-depart-time')).toHaveTextContent('12:10 - 16:25');
        expect(screen.getByTestId('other-routes-return-time')).toHaveTextContent('20:40 - 00:45');
    });

    it('Should render item on desktop', () => {
        mockProps.isMobile = false;
        render(<OtherRoutesItem {...mockProps} />);

        expect(screen.getByRole('link')).not.toHaveClass('mobile');
        expect(screen.getByTestId('airport-name')).toHaveTextContent('London Gatwick (LGW)');
        expect(screen.getByTestId('other-routes-depart-time')).toHaveTextContent('12:10 - 16:25');
        expect(screen.getByTestId('other-routes-return-time')).toHaveTextContent('20:40 - 00:45');
    });

    it('Should render item as selected', () => {
        mockProps.isSelected = true;
        render(<OtherRoutesItem {...mockProps} />);

        expect(screen.getByRole('link')).toHaveClass('selected');
        expect(screen.getByText(SitecoreDictionary.AlternativeFlightsButtonsSelected)).toBeInTheDocument();
        expect(screen.getByTestId('icon-tick')).toBeInTheDocument();
    });

    it('Should render item as not selected', () => {
        mockProps.isSelected = false;
        render(<OtherRoutesItem {...mockProps} />);

        expect(screen.getByRole('link')).not.toHaveClass('selected');
        expect(screen.getByText(SitecoreDictionary.AlternativeFlightsButtonsSelect)).toBeInTheDocument();
        expect(screen.getByTestId('icon-chevron-right')).toBeInTheDocument();
    });

    it('Should render item with custom class', () => {
        mockProps.className = 'custom';
        render(<OtherRoutesItem {...mockProps} />);

        expect(screen.getByRole('link')).toHaveClass('custom');
    });

    it('Should render item with open in new tab', () => {
        mockProps.openInNewTab = true;
        render(<OtherRoutesItem {...mockProps} />);

        expect(screen.getByRole('link')).toHaveAttribute('target', '_blank');
    });

    describe('Url', () => {
        it('Should render url with hotel details query', () => {
            render(<OtherRoutesItem {...mockProps} />);

            expect(screen.getByRole('link')).toHaveAttribute(
                'href',
                '/hotel/&transfer=&dtransfer=&otherRoutes=LGW&outId=170430%2F3978&inId=170430%2F2978&from=02-07-2023&to=09-07-2023',
            );
        });

        it('Should render url with transfer code', () => {
            mockProps.offer.transfers = [{ code: 'TRF' }];
            render(<OtherRoutesItem {...mockProps} />);

            expect(screen.getByRole('link').getAttribute('href')).toContain('&transfer=TRF');
            expect(screen.getByRole('link').getAttribute('href')).toContain('&dtransfer=TRF');
        });

        it('Should render url with promo page params', () => {
            mockStores.layoutStore.isPromoPage = true;
            mockStores.layoutStore.currentPath = 'promo-page';

            render(<OtherRoutesItem {...mockProps} />);

            expect(screen.getByRole('link').getAttribute('href')).toContain('&promo=promo-page');
            expect(screen.getByRole('link').getAttribute('href')).toContain('&org%5B0%5D=LGW');
        });
    });

    describe('Price', () => {
        it('Should render total and pp prices ', () => {
            render(<OtherRoutesItem {...mockProps} />);

            expect(screen.getByTestId('price-per-person')).toHaveTextContent('£100');
            expect(screen.getByTestId('price-per-person')).toHaveTextContent(
                SitecoreDictionary.GlobalsPriceLabelsPerPerson,
            );
            expect(screen.getByText('£200')).toBeInTheDocument();
        });

        it('Should render total price only', () => {
            mockProps.offer.pricePP = 200;
            mockProps.offer.price = 200;
            render(<OtherRoutesItem {...mockProps} />);

            expect(screen.getByText('£200')).toBeInTheDocument();
            expect(screen.queryByTestId('price-per-person')).not.toBeInTheDocument();
        });
    });
});
