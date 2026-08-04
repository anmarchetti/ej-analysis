import React from 'react';
import { mockAllIsIntersecting } from 'react-intersection-observer/test-utils';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useDesktopViewport } from 'frontend/hooks/useMediaQuery';
import {
    mockSitecoreCompositeField,
    mockSitecoreField,
    mockSitecoreImageField,
    mockSitecoreLinkField,
} from 'frontend/utils/tests.utils';
import * as utils from 'frontend/utils/url.utils';
import { IDestinationFields } from 'models/data/IDestinationFields';
import { MediaSize } from 'models/data/MediaSizeParams';
import { PartnershipComponentThemes } from 'models/enum/PartnershipComponentThemes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventTypes } from 'models/enum/tracking/EventTypes';

import { PartnershipComponent, TPartnershipComponentProps } from './PartnershipComponent';

jest.mock(
    './PartnershipComponentV1.module.scss',
    () => ({
        btn: 'btn',
        subtitle: 'subtitle',
        title: 'title',
        description: 'description',
        isBackground: 'isBackground',
    }),
    { virtual: true },
);
jest.mock(
    './PartnershipComponentV2.module.scss',
    () => ({
        btn: 'btn',
        subtitle: 'subtitle',
        title: 'title',
        description: 'description',
        isBackground: 'isBackground',
    }),
    { virtual: true },
);

const createProps = (): TPartnershipComponentProps => ({
    fields: {
        Title: mockSitecoreField('Title'),
        Subtitle: mockSitecoreField('Subtitle'),
        Description: mockSitecoreField('Description'),
        Image: mockSitecoreField(mockSitecoreImageField('Image')),
        Logo: mockSitecoreField(mockSitecoreImageField('Logo')),
        Link: mockSitecoreField(mockSitecoreLinkField('href', 'text')),
        IsLogoTransparent: mockSitecoreField<boolean>(false),
        LinkedDestination: [
            {
                id: 'b29e9681-a2e3-420e-aee0-3ae0af667f16',
                fields: {
                    Code: { value: 'LinkedDestinationCode' },
                    Name: { value: 'LinkedDestinationName' },
                    Image: { value: { src: 'LinkedDestinationImage' } },
                    PageCategory: { value: 'Hotel' },
                },
            },
        ],
        LivePriceNamedSearches: mockSitecoreCompositeField('1', { Name: { value: 'City' } }),
        EnableNumberOfNights: mockSitecoreField<boolean>(true),
    },
    params: {
        Theme: PartnershipComponentThemes.Standard,
        IsBackgroundImageWide: false,
    },
    rendering: null,
});

const createStores = () => ({
    appStore: { isScreenLessMedium: false },
    layoutStore: {
        getPhrase: jest.fn(p => p),
        isTradePortal: false,
        isEditMode: false,
        isLivePriceEnabled: false,
        sitePath: 'http://localhost:3000',
        isBookingsListPage: false,
        isNumberOfNightsLabelsEnabled: true,
        isTouristTaxEnabled: true,
        isLoginPage: false,
    },
    hotelsStore: {
        getLivePrice: jest.fn(() => [
            {
                pricePP: 100,
                touristTaxPP: 13,
                pricePPExcludingTouristTax: 87,
                searchCriteria: {
                    duration: 7,
                },
            },
        ]),
        getLivePriceCodesByCriteria: jest.fn(),
    },
    trackingStore: {
        trackEventWithParams: jest.fn(),
    },
    userStore: { isLoggedIn: false },
    marketStore: { formatMoney: jest.fn(a => `£${a}`) },
});

jest.spyOn(utils, 'buildSitecoreLinkFullUrl').mockReturnValue('url from utils');

let mockStores = createStores();
let mockProps = createProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockLogoImageComponent = jest.fn();
jest.mock('./components/LogoImage/LogoImage', () => ({
    __esModule: true,
    default: props => {
        mockLogoImageComponent(props);

        return <div data-tid='logo-image' />;
    },
}));

const mockJSSImageComponent = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    default: props => {
        mockJSSImageComponent(props);

        return <div data-tid='jss-image' />;
    },
}));

const mockRouterLinkComponent = jest.fn();
jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockRouterLinkComponent(props);

        return (
            <div data-tid='router-link' {...props}>
                {children}
            </div>
        );
    },
}));

const mockConditionalWrapperComponent = jest.fn();
jest.mock('frontend/components/common/ConditionalWrapper/ConditionalWrapper', () => ({
    __esModule: true,
    default: ({ children, wrapper, ...props }) => {
        mockConditionalWrapperComponent(props);

        return (
            <div data-tid='conditional-wrapper' {...props}>
                {children}

                {wrapper('conditional-wrapper-link')}
            </div>
        );
    },
}));

const mockUseInView = { inView: true };
jest.mock('react-intersection-observer', () => ({
    ...jest.requireActual('react-intersection-observer'),
    useInView: jest.fn(() => mockUseInView),
}));

const mockRichTextWithLinksComponent = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinksComponent(props);

        return <div data-tid='rich-text-with-links' />;
    },
}));

const mockPriceLabelComponent = jest.fn();
jest.mock('frontend/components/common/PriceLabel/PriceLabel', () => ({
    __esModule: true,
    default: ({ dataTid, price, onClick, wrapPrice, ...props }) => {
        mockPriceLabelComponent(props);

        return (
            <div data-tid={dataTid} onClick={onClick}>
                {price}

                {wrapPrice('price-block')}
            </div>
        );
    },
}));

jest.mock('frontend/hooks/useMediaQuery');

jest.mock('code/tokens', () => ({
    Tokens: {
        Destination: '[Destination]',
    },
}));

jest.mock('frontend/utils/tokenizer', () => ({
    Tokenizer: {
        replaceTokens: jest.fn((str, tokens) => str.replace(/\[Destination\]/g, tokens['[Destination]'])),
    },
}));

jest.mock('../../common/TouristTaxGenericTooltip/TouristTaxGenericTooltip', () => ({
    __esModule: true,
    TouristTaxGenericTooltip: ({ children }) => <div data-tid='tax-tooltip'>{children}</div>,
}));

const mockFormatMoneyWithTouristTax = jest.fn();
jest.mock('frontend/utils/touristTax.utils', () => ({
    __esModule: true,
    formatMoneyWithTouristTax: (...params) => mockFormatMoneyWithTouristTax(...params),
}));

describe('<PartnershipComponent />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        mockAllIsIntersecting(true);
        mockUseInView.inView = true;
        jest.mocked(useDesktopViewport).mockReturnValue(true);
        mockFormatMoneyWithTouristTax.mockReturnValue('£100');
    });

    describe('logo transparency', () => {
        it('should set IsLogoTransparent as a prop for the standard theme', async () => {
            mockProps.params.Theme = PartnershipComponentThemes.Standard;

            await act(async () => {
                render(<PartnershipComponent {...mockProps} />);
            });

            expect(mockLogoImageComponent).toHaveBeenCalledWith({
                image: { value: { src: 'Logo' } },
                isBgTransparent: false,
                isStandardTheme: true,
                shouldWrap: false,
            });
        });
    });

    describe('should NOT render when ', () => {
        it('should not render when no fields', () => {
            mockProps.fields = undefined;
            const { container } = render(<PartnershipComponent {...mockProps} />);

            expect(container).toBeEmptyDOMElement();
        });

        it('should not render when isBookingsListPage and user NOT logged in', () => {
            mockStores.userStore.isLoggedIn = false;
            mockStores.layoutStore.isBookingsListPage = true;
            const { container } = render(<PartnershipComponent {...mockProps} />);

            expect(container).toBeEmptyDOMElement();
        });
    });

    it('should render default', async () => {
        await act(async () => {
            render(<PartnershipComponent {...mockProps} />);
        });

        await waitFor(() => {
            expect(screen.getByTestId('partnership-component')).toBeInTheDocument();
        });

        expect(screen.getByTestId('jss-image')).toBeInTheDocument();
        expect(mockJSSImageComponent).toHaveBeenCalledWith({
            field: mockProps.fields!.Image,
            fill: true,
            mediaSize: {
                desktop: MediaSize.Medium,
            },
            sizes: '(max-width: 768px) 100vw, 50vw',
        });

        expect(screen.getByTestId('partnership')).not.toHaveClass('isBackground');
        expect(screen.getAllByTestId('router-link')[0]).toHaveClass('btn--outlined');
        expect(screen.getAllByTestId('router-link')).toHaveLength(2);
        expect(screen.getByTestId('logo-image')).toBeInTheDocument();
        expect(screen.getByText(mockProps.fields!.Subtitle.value)).toHaveClass('subtitle');
        expect(screen.getByText(mockProps.fields!.Title.value)).toHaveClass('title');
        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();
        expect(mockRichTextWithLinksComponent).toHaveBeenCalledWith({
            className: 'description',
            field: mockProps.fields!.Description,
        });
        expect(screen.queryByTestId('conditional-wrapper')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.queryByTestId('item-price')).not.toBeInTheDocument();
            expect(screen.queryByText('£100')).not.toBeInTheDocument();
        });
    });

    it('should render login page styles correctly', async () => {
        mockStores.layoutStore.isTradePortal = true;
        mockStores.layoutStore.isLoginPage = true;

        await act(async () => {
            render(<PartnershipComponent {...mockProps} />);
        });

        expect(screen.getByTestId('partnership')).toHaveClass('isBackground');
    });

    describe('formatted title', () => {
        beforeEach(() => {
            mockProps.fields!.Title.value = 'Welcome to [Destination]!';
            mockProps.fields!.LinkedDestination = [
                {
                    id: 'id',
                    fields: {
                        Name: { value: 'Paris' },
                    } as IDestinationFields,
                },
            ];
        });

        it('should render and track with tokens replaced when LinkedDestination is provided', async () => {
            await act(async () => {
                render(<PartnershipComponent {...mockProps} />);
            });

            expect(screen.getByTestId('title')).toHaveTextContent('Welcome to Paris!');

            expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenNthCalledWith(
                1,
                'partnership_banner_impression',
                {
                    country: 'Paris',
                    location: 'Subtitle',
                    name: 'Welcome to Paris!',
                    price: '0',
                    url: 'url from utils',
                },
            );
        });

        it('should NOT break when array body is undefined', async () => {
            mockProps.fields!.LinkedDestination![0] = undefined as any;

            await act(async () => {
                render(<PartnershipComponent {...mockProps} />);
            });

            expect(screen.getByTestId('title')).toHaveTextContent('Welcome to [Destination]!');
        });

        it('should render default Title when LinkedDestination is NOT provided', async () => {
            mockProps.fields!.Title.value = 'Welcome to Neverland';
            mockProps.fields!.LinkedDestination = undefined;

            await act(async () => {
                render(<PartnershipComponent {...mockProps} />);
            });

            expect(screen.getByTestId('title')).toHaveTextContent('Welcome to Neverland');
        });
    });

    describe('should render live price label ', () => {
        beforeEach(() => {
            mockStores.layoutStore.isLivePriceEnabled = true;
        });

        it('should render live price label and conditional wrapper when live price is enabled', async () => {
            mockStores.layoutStore.isLivePriceEnabled = true;
            await act(async () => {
                render(<PartnershipComponent {...mockProps} />);
            });

            await waitFor(() => {
                expect(screen.getByTestId('tax-tooltip')).toHaveTextContent('price-block');
                expect(screen.getByTestId('conditional-wrapper')).toBeInTheDocument();
                expect(screen.getByTestId('item-price')).toBeInTheDocument();
                expect(screen.getByText('£100')).toBeInTheDocument();
                expect(mockConditionalWrapperComponent).toHaveBeenCalledWith({
                    condition: true,
                });
                expect(screen.getAllByTestId('router-link')).toHaveLength(2);
                expect(mockPriceLabelComponent).toHaveBeenCalledWith({
                    className: 'promo-slide__item__price responsive',
                    priceDictionary: SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom,
                    tag: 'div',
                    wrapLabelAfterPrice: expect.any(Function),
                    wrapLabelBeforePrice: expect.any(Function),
                    numberOfNights: 7,
                });

                expect(mockFormatMoneyWithTouristTax).toHaveBeenCalledWith(
                    100,
                    87,
                    true,
                    mockStores.marketStore.formatMoney,
                    {
                        currency: undefined,
                        maximumFractionDigits: 0,
                    },
                );
            });
        });

        it('should render live price label with 0 number of nights when isNumberOfNightsLabelsEnabled is false', async () => {
            mockStores.layoutStore.isNumberOfNightsLabelsEnabled = false;

            await act(async () => {
                render(<PartnershipComponent {...mockProps} />);
            });

            await waitFor(() => {
                expect(mockPriceLabelComponent).toHaveBeenCalledWith({
                    className: 'promo-slide__item__price responsive',
                    priceDictionary: SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom,
                    tag: 'div',
                    wrapLabelAfterPrice: expect.any(Function),
                    wrapLabelBeforePrice: expect.any(Function),
                    numberOfNights: 0,
                });
            });
        });

        it('should render live price with 0 number of nights when EnableNumberOfNights is false', async () => {
            mockProps.fields!.EnableNumberOfNights.value = false;

            await act(async () => {
                render(<PartnershipComponent {...mockProps} />);
            });

            await waitFor(() => {
                expect(mockPriceLabelComponent).toHaveBeenCalledWith({
                    className: 'promo-slide__item__price responsive',
                    priceDictionary: SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom,
                    tag: 'div',
                    wrapLabelAfterPrice: expect.any(Function),
                    wrapLabelBeforePrice: expect.any(Function),
                    numberOfNights: 0,
                });
            });
        });
    });

    it('should NOT render price label when pricePP is NOT provided', async () => {
        mockStores.hotelsStore.getLivePrice = jest.fn();
        mockStores.layoutStore.isLivePriceEnabled = true;
        await act(async () => {
            render(<PartnershipComponent {...mockProps} />);
        });

        await waitFor(() => {
            expect(screen.queryByTestId('item-price')).not.toBeInTheDocument();
            expect(screen.queryByText('£100')).not.toBeInTheDocument();
        });
    });

    it('should NOT render following fields when they are not defined', async () => {
        mockProps.fields!.Title.value = '';
        mockProps.fields!.Subtitle.value = '';
        mockProps.fields!.Description.value = '';
        mockProps.fields!.Link.value.href = '';

        await act(async () => {
            render(<PartnershipComponent {...mockProps} />);
        });

        expect(screen.queryByTestId('title')).not.toBeInTheDocument();
    });

    describe('tracking', () => {
        it('should NOT call trackEventWithParams when component is NOT in view', async () => {
            mockUseInView.inView = false;

            await act(async () => {
                render(<PartnershipComponent {...mockProps} />);
            });

            await waitFor(() => {
                expect(mockStores.trackingStore.trackEventWithParams).not.toHaveBeenCalled();
            });
        });

        it('should track impression and click events', async () => {
            await act(async () => {
                render(<PartnershipComponent {...mockProps} />);
            });

            expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenNthCalledWith(
                1,
                'partnership_banner_impression',
                {
                    country: 'LinkedDestinationName',
                    location: 'Subtitle',
                    name: 'Title',
                    price: '0',
                    url: 'url from utils',
                },
            );

            const button = screen.getAllByTestId('router-link')[0];
            expect(button).toHaveClass('btn');

            button.click();

            expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenNthCalledWith(2, 'partnership_banner_cta', {
                country: 'LinkedDestinationName',
                cta: 'text',
                location: 'Subtitle',
                name: 'Title',
                price: '0',
                url: 'url from utils',
            });
        });

        it('should track impression with empty fields when they are NOT defined', async () => {
            mockProps.fields = {} as any;

            await act(async () => {
                render(<PartnershipComponent {...mockProps} />);
            });

            expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenNthCalledWith(
                1,
                'partnership_banner_impression',
                {
                    country: '',
                    location: '',
                    name: '',
                    price: '0',
                    url: 'url from utils',
                },
            );
        });

        it('should track button click when Theme is Standard', async () => {
            await act(async () => {
                render(<PartnershipComponent {...mockProps} />);
            });

            screen.getAllByTestId('router-link')[0].click();
            expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenNthCalledWith(
                2,
                EventTypes.PartnershipComponentBtnClick,
                {
                    country: 'LinkedDestinationName',
                    cta: 'text',
                    location: mockProps.fields!.Subtitle.value,
                    name: mockProps.fields!.Title.value,
                    price: '0',
                    url: 'url from utils',
                },
            );
        });

        it('should conditionally render mediaSize based on IsBackgroundImageWide parameter', async () => {
            await act(async () => {
                render(
                    <PartnershipComponent
                        {...mockProps}
                        params={{ ...mockProps.params, IsBackgroundImageWide: true }}
                    />,
                );
            });

            expect(mockJSSImageComponent).toHaveBeenCalledWith(
                expect.not.objectContaining({
                    mediaSize: {
                        desktop: MediaSize.Medium,
                    },
                }),
            );
        });

        it('should respect the IsBackgroundImageWide parameter from Sitecore', async () => {
            await act(async () => {
                render(<PartnershipComponent {...mockProps} />);
            });

            expect(mockJSSImageComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    mediaSize: {
                        desktop: MediaSize.Medium,
                    },
                }),
            );
        });

        it('should NOT track button click when Theme is WithoutLivePrice', async () => {
            mockProps.params.Theme = PartnershipComponentThemes.WithoutLivePrice;
            await act(async () => {
                render(<PartnershipComponent {...mockProps} />);
            });

            screen.getAllByTestId('router-link')[0].click();

            expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalled();
        });

        it('should call trackEventWithParams on image link click', async () => {
            mockStores.layoutStore.isLivePriceEnabled = true;

            await act(async () => {
                render(<PartnershipComponent {...mockProps} />);
            });

            await waitFor(() => {
                const link = screen.getAllByTestId('router-link')[1];
                userEvent.click(link);
                expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenNthCalledWith(
                    2,
                    EventTypes.PartnershipComponentBtnClick,
                    {
                        country: 'LinkedDestinationName',
                        cta: 'Live Price',
                        location: mockProps.fields!.Subtitle.value,
                        name: mockProps.fields!.Title.value,
                        price: '100',
                        url: 'url from utils',
                    },
                );
            });
        });
    });
});
