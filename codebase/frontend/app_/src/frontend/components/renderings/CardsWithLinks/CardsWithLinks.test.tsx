import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockCustomisableParams } from 'frontend/__mocks__/customisableParams';
import { EventTypes } from 'models/enum/tracking/EventTypes';

import { CardsWithLinks } from './CardsWithLinks';

const createProps = () => ({
    fields: {
        Title: { value: 'title' },
        Link: { value: { href: 'href', text: 'link' } },
        Children: [
            {
                fields: {
                    Title: { value: 'title' },
                    Description: { value: 'description' },
                    Image: { value: { src: 'test' } },
                    Link: { value: { href: 'test' } },
                },
            },
        ],
    },
    params: mockCustomisableParams,
});

const createStores = () => ({
    layoutStore: {
        isHolidayTypePage: false,
        domain: 'web.ci.subdomain.domain.com',
        protocol: 'https',
        basePath: 'path',
        sitePath: '/site-path',
        getPhrase: jest.fn(key => `ph:${key}`),
    },
    trackingStore: {
        trackHolidayTypesHubEvents: jest.fn(p => p),
    },
    appStore: { isScreenExtraSmall: false },
    hotelsStore: { getLivePrice: jest.fn() },
    routerStore: { redirectTo: jest.fn() },
    queryParamStore: { buildRedirectUrlQuery: jest.fn() },
    userStore: { onLogout: jest.fn() },
});

const mockStores = createStores();
let props;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockSitecoreText = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => {
    const originalModule = jest.requireActual('@sitecore-jss/sitecore-jss-nextjs');

    return {
        ...originalModule,
        Text: jest.fn(({ field, tag: Tag = 'h2', className, ...rest }) => {
            mockSitecoreText({ field, tag: Tag, className, ...rest });

            return (
                <Tag className={className} {...rest}>
                    {field?.value || ''}
                </Tag>
            );
        }),
    };
});

const mockPromoBlocks = jest.fn();
jest.mock('frontend/components/renderings/PromoBlocks/PromoBlocks', () =>
    jest.fn(props => {
        mockPromoBlocks(props);

        return <div data-tid='promo-blocks'>PromoBlocks Mock</div>;
    }),
);

const mockRouterLink = jest.fn();
jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: jest.fn(({ children, link, className, onClick, ...rest }) => {
        mockRouterLink({ children, link, className, onClick, ...rest });

        return (
            <a href={link?.value?.href || '#'} className={className} onClick={onClick} data-tid='router-link' {...rest}>
                {children || link?.value?.text}
            </a>
        );
    }),
}));

const mockBuildSitecoreLinkFullUrl = jest.fn();
jest.mock('frontend/utils/url.utils', () => ({
    buildSitecoreLinkFullUrl: (...args) => mockBuildSitecoreLinkFullUrl(...args),
}));

describe('<CardsWithLinks />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('should render null if fields prop is null', () => {
        const { container } = render(
            <CardsWithLinks {...props} fields={null as any} params={mockCustomisableParams} />,
        );
        expect(container.firstChild).toBeNull();
    });

    it('should render the main title, promo blocks, and CTA link when all fields are present', () => {
        render(<CardsWithLinks {...props} />);

        expect(screen.getByRole('heading', { name: props.fields.Title.value, level: 2 })).toBeInTheDocument();
        expect(screen.getByTestId('promo-blocks')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: props.fields.Link.value.text })).toBeInTheDocument();
    });

    it('should not render PromoBlocks if fields.Children is empty or not present', () => {
        props.fields.Children = [];
        render(<CardsWithLinks {...props} />);
        expect(screen.queryByTestId('promo-blocks')).not.toBeInTheDocument();

        props.fields.Children = null;
        render(<CardsWithLinks {...props} />);
        expect(screen.queryByTestId('promo-blocks')).not.toBeInTheDocument();
    });

    it('should not render the CTA link if fields.Link is null or has no href', () => {
        props.fields.Link = null;
        const { rerender } = render(<CardsWithLinks {...props} />);
        expect(screen.queryByTestId('router-link')).not.toBeInTheDocument();

        props.fields.Link = { value: { href: '' } };
        rerender(<CardsWithLinks {...props} />);
        expect(screen.queryByTestId('router-link')).not.toBeInTheDocument();
    });

    it('should not render the main Title if fields.Title is null', () => {
        props.fields.Title = null;
        render(<CardsWithLinks {...props} />);
        expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
    });

    it('Should not render PromoBlocks if no children', () => {
        props.fields.Children = [];
        render(<CardsWithLinks {...props} />);

        expect(screen.queryByTestId('promo-blocks')).not.toBeInTheDocument();
    });

    it('should render all customisable class names', () => {
        const { container } = render(<CardsWithLinks {...props} />);

        const text = screen.getByRole('heading', { level: 2 });

        // expect(text).toHaveClass('mobile-f14-desktop-f16');
        expect(text).toHaveClass('font-rounded');
        expect(text).toHaveClass('position-center');
        expect(text).toHaveClass('weight-200');
        expect(container.querySelector('.padding-24')).toBeInTheDocument();
    });

    it('should call trackHolidayTypesHubEvents on mount if conditions are met', () => {
        mockStores.layoutStore.isHolidayTypePage = true;
        props.fields.Children = [
            { id: 'c1', fields: { Title: { value: 'Child One' } } },
            { id: 'c2', fields: { Title: { value: 'Child Two' } } },
        ];

        render(<CardsWithLinks {...props} />);

        expect(mockStores.trackingStore.trackHolidayTypesHubEvents).toHaveBeenCalledTimes(1);
        expect(mockStores.trackingStore.trackHolidayTypesHubEvents).toHaveBeenCalledWith(EventTypes.ShowSimilarDeals, {
            name: 'Child One|Child Two',
        });
    });

    it('should NOT call trackHolidayTypesHubEvents if not on holiday type page', () => {
        mockStores.layoutStore.isHolidayTypePage = false;
        props.fields.Children = [{ id: 'c1', fields: { Title: { value: 'Child One' } } }];

        render(<CardsWithLinks {...props} />);

        expect(mockStores.trackingStore.trackHolidayTypesHubEvents).not.toHaveBeenCalled();
    });

    it('should NOT call trackHolidayTypesHubEvents if no children fields', () => {
        mockStores.layoutStore.isHolidayTypePage = true;
        props.fields.Children = [];

        render(<CardsWithLinks {...props} />);

        expect(mockStores.trackingStore.trackHolidayTypesHubEvents).not.toHaveBeenCalled();
    });
});
