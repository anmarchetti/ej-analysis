import React from 'react';
import { waitFor } from '@testing-library/dom';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockCustomisableParams } from 'frontend/__mocks__/customisableParams';
import { mockSitecoreField, mockSitecoreImageField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';

import DealsDestinations, { TDealsDestinationsProps } from './DealsDestinations';

import styles from './DealsDestinations.module.scss';

const createProps = (): TDealsDestinationsProps => ({
    fields: {
        Title: mockSitecoreField('Test'),
        Description: mockSitecoreField('Desc'),
        Icon: mockSitecoreField(mockSitecoreImageField('icon')),
        Cards: [],
        CTAUrl: mockSitecoreField(mockSitecoreLinkField('url', '', SitecoreLinkType.Internal)),
        CTAText: mockSitecoreField('cta text'),
        RequestedSearch: {
            fields: {
                Enabled: mockSitecoreField(false),
                Name: mockSitecoreField('RequestedSearchName'),
            },
            id: 'requested-search-id',
        },
        IsPriceRounded: mockSitecoreField(true),
    },
    rendering: { dataSource: 'source' },
    params: mockCustomisableParams,
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            isEditMode: false,
            isHolidayTypePage: true,
            isDealsHubPage: true,
            sitePath: 'path',
            isTouristTaxEnabled: true,
        },
        trackingStore: { trackHolidayTypesHubEvents: jest.fn() },
        appStore: { isScreenLessMedium: false },
        routerStore: {},
        queryParamStore: {},
        userStore: {},
        marketStore: { formatMoney: jest.fn(a => `£${a}`) },
    });

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/RichTextWithLinks', () => () => <div data-tid='description' />);

const mockJSSImageProps = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: props => {
        mockJSSImageProps(props);

        return <div data-tid='jss-image' />;
    },
}));

const mockRouterLinkProps = jest.fn();
jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: props => {
        mockRouterLinkProps(props);

        return <div data-tid='router-link' />;
    },
}));

jest.mock('frontend/services/offers.service', () => ({
    getRequestedPrice: jest.fn().mockReturnValue([
        {
            searchCriteria: {
                url: 'https://ins.webdev.ejholidays.ejcloud.net/en/holidays/deals/all-inclusive-holiday-deals',
            },
        },
    ]),
}));

jest.mock('./utils', () => ({
    getCardsRequestedPriceCodes: jest.fn().mockReturnValue(['code1', 'code2']),
    collectCardsTrackingInfo: jest.fn().mockReturnValue([{ name: 'name1' }, { name: 'name2' }]),
}));

jest.mock('frontend/components/common/TouristTaxGenericTooltip/TouristTaxGenericTooltip', () => ({
    __esModule: true,
    TouristTaxGenericTooltip: ({ children }) => <div data-tid='tax-tooltip'>{children}</div>,
}));

jest.mock('./components/DealsDestinationsGroupCard/DealsDestinationsGroupCard', () => ({
    __esModule: true,
    default: ({ setIsTouristTaxTooltipDisplayed }) => {
        setIsTouristTaxTooltipDisplayed(true);

        return <div data-tid='deals-destinations-group-card' />;
    },
}));

describe('<DealsDestinations />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render', () => {
        mockProps.fields = null;
        const { container } = render(<DealsDestinations {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render: icon, title, description, router link', () => {
        mockProps.fields.Icon = null;
        mockProps.fields.Title = null;
        mockProps.fields.Description = null;
        mockProps.fields.CTAUrl = null;
        render(<DealsDestinations {...mockProps} />);

        expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
        expect(screen.queryByRole('heading')).not.toBeInTheDocument();
        expect(screen.queryByTestId('description')).not.toBeInTheDocument();
        expect(screen.queryByTestId('router-link')).not.toBeInTheDocument();
    });

    it('should render: icon, title, description, router link', () => {
        render(<DealsDestinations {...mockProps} />);

        expect(screen.getByTestId('jss-image')).toBeInTheDocument();
        expect(mockJSSImageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                field: mockProps.fields.Icon,
                className: styles.icon,
                alt: '',
                dynamicSize: {
                    desktop: {
                        width: 50,
                        height: 50,
                    },
                    mobile: {
                        width: 40,
                        height: 40,
                    },
                },
            }),
        );
        expect(screen.getByRole('heading')).toBeInTheDocument();
        expect(screen.getByTestId('description')).toBeInTheDocument();
        expect(screen.getByTestId('router-link')).toBeInTheDocument();
    });

    it('should render all customisable class names', () => {
        const { container } = render(<DealsDestinations {...mockProps} />);

        const text = screen.getByRole('heading', { level: 2 });

        expect(text).toHaveClass('mobile-f14-desktop-f16');
        expect(text).toHaveClass('font-rounded');
        expect(text).toHaveClass('position-center');
        expect(text).toHaveClass('weight-200');
        expect(container.querySelector('.padding-24')).toBeInTheDocument();
    });

    it('should load requested prices', async () => {
        mockProps.fields.CTAUrl = null;
        mockProps.fields.RequestedSearch.fields.Enabled = mockSitecoreField(true);

        render(<DealsDestinations {...mockProps} />);

        waitFor(() => {
            expect(mockRouterLinkProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    link: expect.objectContaining({
                        href: 'https://ins.webdev.ejholidays.ejcloud.net/en/holidays/deals/all-inclusive-holiday-deals',
                    }),
                }),
            );
        });
    });

    it('should render tax info when isTouristTaxEnabled and isRequestedSearchEnabled are true and setIsTouristTaxTooltipDisplayed was called', () => {
        mockProps.fields.RequestedSearch.fields.Enabled = mockSitecoreField(true);
        mockProps.fields.Cards = [
            {
                id: 'card-1',
                fields: {},
            },
        ];
        render(<DealsDestinations {...mockProps} />);

        expect(screen.getByTestId('tax-tooltip')).toBeInTheDocument();
    });

    it('should NOT render tax info when isTouristTaxEnabled is false', () => {
        mockProps.fields.RequestedSearch.fields.Enabled = mockSitecoreField(true);
        mockStores.layoutStore.isTouristTaxEnabled = false;
        render(<DealsDestinations {...mockProps} />);

        expect(screen.queryByTestId('tax-tooltip')).not.toBeInTheDocument();
    });

    it('should NOT render tax info when isRequestedSearchEnabled is false', () => {
        render(<DealsDestinations {...mockProps} />);

        expect(screen.queryByTestId('tax-tooltip')).not.toBeInTheDocument();
    });
});
