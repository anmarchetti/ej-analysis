import React from 'react';
import { waitFor } from '@testing-library/dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, mockLivePrice } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import * as urlUtils from 'frontend/utils/url.utils';
import { TSubHeroBannerProps } from 'models/data/IHeroBanner';
import { DestinationType } from 'models/enum/DestinationType';
import PageHeroBannerHeightOptions from 'models/enum/PageHeroBannerHeightOptions';
import PageHeroBannerVariants from 'models/enum/PageHeroBannerVariants';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';
import { EventTypes } from 'models/enum/tracking/EventTypes';

import { StaticBanner } from './StaticBanner';

const mockCreditAnchorComponent = jest.fn();
jest.mock('frontend/components/common/CreditAnchor/CreditAnchor', () => ({
    __esModule: true,
    default: props => {
        mockCreditAnchorComponent(props);

        return <div data-tid='credit-anchor' />;
    },
}));

const mockJSSNextImageProps = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    default: props => {
        mockJSSNextImageProps(props);

        return <div data-tid='jss-next-image' />;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('./components/StaticBannerTitle/StaticBannerTitle', () => () => <div data-tid='static-banner-title' />);

const mockPlaceholderProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    ...jest.requireActual('@sitecore-jss/sitecore-jss-nextjs'),
    Placeholder: props => {
        mockPlaceholderProps(props);

        return <div data-tid='placeholder' />;
    },
    Image: () => <div data-tid='image' />,
}));

jest.mock('./StaticBanner.utils', () => ({
    getBannerClass: jest.fn().mockReturnValue('banner-classname'),
}));

const mockRichTextWithLinksProps = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => props => {
    mockRichTextWithLinksProps(props);

    return <div data-tid='rich-text-with-links' />;
});

const mockRouterLinkProps = jest.fn();
jest.mock('frontend/components/common/RouterLink', () => props => {
    mockRouterLinkProps(props);

    return <button onClick={props.onClick} data-tid='router-link' />;
});

jest.mock('./components/StaticUnavailableBanner/StaticUnavailableBanner', () => () => (
    <div data-tid='static-unavailable-banner' />
));

const mockJSSImage = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockJSSImage(props);

        return <div data-tid='jss-image' />;
    },
}));

const mockGetRelatedDestinationsCodes = jest.fn();
jest.mock('frontend/utils/search/search.utils', () => ({
    __esModule: true,
    getRelatedDestinationsCodes: (...params) => mockGetRelatedDestinationsCodes(...params),
}));

const resetMocks = (): TSubHeroBannerProps => ({
    params: {},
    fields: {
        Name: mockSitecoreField('Name'),
        Image: mockSitecoreField(mockSitecoreImageField('image-src')),
        Subtitle: mockSitecoreField('Subtitle'),
        PageDescription: mockSitecoreField('PageDescription'),
        PageCategory: mockSitecoreField('PageCategory'),
        Logo: mockSitecoreField(mockSitecoreImageField('logo-src')),
        CreditIcon: mockSitecoreField(mockSitecoreImageField('CreditIcon')),
        CreditLink: mockSitecoreField(mockSitecoreLinkField('link', 'link', SitecoreLinkType.Internal)),
        CreditText: mockSitecoreField('CreditText'),
        DisableCreditAnchor: mockSitecoreField(true),
        DealPageLink: mockSitecoreField(mockSitecoreLinkField('deal-page-link')),
    },
    rendering: {},
    cheapestLivePriceForDestinationPage: mockLivePrice,
});

let mockProps;
let mockStores;

describe('StaticBanner', () => {
    beforeEach(() => {
        mockProps = resetMocks();
        mockStores = createMockStores({
            layoutStore: {
                isEditMode: false,
                isDestinationUnavailableBannerEnabled: false,
                isResortBrowsePage: false,
                isVirtualRegionBrowsePage: false,
                isVirtualResortBrowsePage: false,
                getDestinationParentBreadcrumb: jest.fn(),
                destinationParents: [],
                pageFields: {
                    Resorts: [{ name: 'Andalusia-Resort', code: 'SPANSR', type: DestinationType.VirtualResort }],
                    Regions: [{ name: 'Andalusia', code: 'SPAN', type: DestinationType.VirtualRegion }],
                },
            },
            hotelsStore: {
                getDestinationsAvailability: jest.fn(() => ['test']),
            },
            trackingStore: {
                trackHolidayTypesHubEvents: jest.fn(),
            },
        });

        mockGetRelatedDestinationsCodes.mockReturnValue(['MAA']);
    });

    it('Should standard render', () => {
        render(<StaticBanner {...mockProps} />);

        expect(screen.getByTestId('static-banner')).toHaveClass('banner-classname');
        expect(screen.queryByTestId('image')).not.toBeInTheDocument();
        expect(screen.getByTestId('jss-next-image')).toBeInTheDocument();
        expect(mockPlaceholderProps).toHaveBeenCalledWith(
            expect.objectContaining({
                name: PlaceholderNames.HeroBannerTopSection,
            }),
        );
        expect(mockJSSImage).toHaveBeenCalledWith({
            field: mockProps.fields.Logo,
        });
        expect(mockCreditAnchorComponent).toHaveBeenCalledWith({
            fields: {
                CreditIcon: mockProps.fields.CreditIcon,
                CreditText: mockProps.fields.CreditText,
                CreditLink: mockProps.fields.CreditLink,
                DisableCreditAnchor: mockProps.fields.DisableCreditAnchor,
            },
            isPillStyle: true,
            isHomepageBannerElement: false,
            className: 'creditAnchor',
        });
        expect(screen.getByTestId('static-banner-title')).toBeInTheDocument();
        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            className: 'description',
            field: mockProps.fields.PageDescription,
            tag: 'div',
            dataId: 'static-banner-description',
        });
        expect(mockPlaceholderProps).toHaveBeenCalledWith(
            expect.objectContaining({
                name: PlaceholderNames.LivePrice,
                hasGenericTaxTooltip: true,
            }),
        );
        expect(screen.queryByTestId('static-unavailable-banner')).not.toBeInTheDocument();
        expect(mockRouterLinkProps).toHaveBeenCalledWith(
            expect.objectContaining({
                link: mockProps.fields.DealPageLink,
            }),
        );
        expect(screen.getByTestId('static-banner-triangle')).toBeInTheDocument();

        expect(mockGetRelatedDestinationsCodes).toHaveBeenCalledWith(
            {
                Regions: [
                    {
                        code: 'SPAN',
                        name: 'Andalusia',
                        type: 'VirtualRegion',
                    },
                ],
                Resorts: [
                    {
                        code: 'SPANSR',
                        name: 'Andalusia-Resort',
                        type: 'VirtualResort',
                    },
                ],
            },
            false,
            false,
        );
    });

    it('Should empty render', () => {
        mockProps.fields = undefined;

        const { container } = render(<StaticBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should render jss image in edit mode', () => {
        mockStores.layoutStore.isEditMode = true;
        render(<StaticBanner {...mockProps} />);

        expect(screen.queryByTestId('jss-next-image')).not.toBeInTheDocument();
        expect(screen.getByTestId('image')).toBeInTheDocument();
    });

    it('Should render translucent bottom banner variant', () => {
        mockProps.params = { Variant: PageHeroBannerVariants.TranslucentBottomStripe };
        render(<StaticBanner {...mockProps} />);

        expect(screen.queryByTestId('static-banner-triangle')).not.toBeInTheDocument();
        expect(screen.getByTestId('static-banner-stripe')).toBeInTheDocument();
    });

    describe('live price', () => {
        beforeEach(() => {
            mockProps.fields.Code = { value: 'ES' };
            mockStores.layoutStore.isDestinationPage = true;
            mockStores.layoutStore.isDestinationHeroBannerLivePriceEnabled = true;
        });

        it('Should render live price', async () => {
            render(<StaticBanner {...mockProps} />);

            await waitFor(() => {
                expect(mockPlaceholderProps).toHaveBeenCalledWith(
                    expect.objectContaining({
                        livePrice: mockLivePrice,
                        name: PlaceholderNames.LivePrice,
                        destinationVirtualCode: undefined,
                        destinationRelatedCodes: ['MAA'],
                        isFlexibleSearch: mockStores.layoutStore.isSearchFlexibleOnDestinationGuide,
                        availableOriginsSearchEnabled: true,
                        isLink: true,
                        hasChevronIcon: true,
                    }),
                );
            });
        });

        it('Should render live price on virtual region or resort browse page', async () => {
            mockStores.layoutStore.isVirtualRegionBrowsePage = true;

            render(<StaticBanner {...mockProps} />);

            await waitFor(() => {
                expect(mockPlaceholderProps).toHaveBeenCalledWith(
                    expect.objectContaining({
                        destinationVirtualCode: mockProps.fields.Code.value,
                    }),
                );
            });
        });

        it('Should render live price with empty data when api does not return anything', async () => {
            mockProps.cheapestLivePriceForDestinationPage = null;

            render(<StaticBanner {...mockProps} />);

            await waitFor(() => {
                expect(mockPlaceholderProps).toHaveBeenCalledWith(
                    expect.objectContaining({
                        name: PlaceholderNames.LivePrice,
                        livePrice: null,
                    }),
                );
            });
        });
    });

    describe('render unavailable banner', () => {
        beforeEach(() => {
            mockProps.fields.Code = { value: 'test' };
            mockStores.layoutStore.isDestinationPage = true;
            mockStores.layoutStore.isResortBrowsePage = true;
            mockStores.layoutStore.isDestinationUnavailableBannerEnabled = true;
            mockStores.layoutStore.isLivePriceEnabledForDestination = jest.fn(() => true);
        });

        it('Should render static-unavailable-banner', async () => {
            mockStores.layoutStore.isDestinationHeroBannerLivePriceEnabled = true;
            mockProps.cheapestLivePriceForDestinationPage = null;
            render(<StaticBanner {...mockProps} />);

            await waitFor(() => {
                expect(screen.getByTestId('static-unavailable-banner')).toBeInTheDocument();
            });
        });

        it('Should NOT render static-unavailable-banner on not destination pages', async () => {
            mockStores.layoutStore.isDestinationPage = false;
            render(<StaticBanner {...mockProps} />);

            await waitFor(() => {
                expect(screen.queryByTestId('static-unavailable-banner')).not.toBeInTheDocument();
            });
        });

        it('Should NOT render static-unavailable-banner when isResortBrowsePage is false', async () => {
            mockStores.layoutStore.isResortBrowsePage = false;
            render(<StaticBanner {...mockProps} />);

            await waitFor(() => {
                expect(screen.queryByTestId('static-unavailable-banner')).not.toBeInTheDocument();
            });
        });

        it('Should NOT render static-unavailable-banner when isDestinationUnavailableBannerEnabled is false', async () => {
            mockStores.layoutStore.isDestinationUnavailableBannerEnabled = false;
            render(<StaticBanner {...mockProps} />);

            await waitFor(() => {
                expect(screen.queryByTestId('static-unavailable-banner')).not.toBeInTheDocument();
            });
        });

        it('Should NOT render static-unavailable-banner when code is NOT provided', async () => {
            mockProps.fields.Code = null;
            render(<StaticBanner {...mockProps} />);

            await waitFor(() => {
                expect(screen.queryByTestId('static-unavailable-banner')).not.toBeInTheDocument();
            });
        });

        it('Should NOT render static-unavailable-banner when live price is provided', async () => {
            mockStores.layoutStore.isDestinationHeroBannerLivePriceEnabled = true;
            render(<StaticBanner {...mockProps} />);

            await waitFor(() => {
                expect(screen.queryByTestId('static-unavailable-banner')).not.toBeInTheDocument();
            });
        });
    });

    it('should send trackHolidayTypesHubEvents', async () => {
        jest.spyOn(urlUtils, 'buildSitecoreLinkFullUrl').mockReturnValue('sitecore-link-full-url');
        render(<StaticBanner {...mockProps} />);

        await userEvent.click(screen.getByTestId('router-link'));

        expect(mockStores.trackingStore.trackHolidayTypesHubEvents).toHaveBeenCalledWith(EventTypes.CTAClick, {
            position: 'Top',
            name: mockProps.fields.DealPageLink?.value?.text,
            destination: 'sitecore-link-full-url',
        });
    });

    it('should set class according to params', () => {
        mockProps.params = {
            Height: PageHeroBannerHeightOptions.Height400,
        };
        render(<StaticBanner {...mockProps} />);

        expect(screen.getByTestId('static-banner-inner')).toHaveClass('h400');
    });

    it('should add greyTriangle class when IsTriangleGrey', () => {
        mockProps.params = {
            IsTriangleGrey: '1',
        };
        render(<StaticBanner {...mockProps} />);

        expect(screen.getByTestId('static-banner-triangle')).toHaveClass('greyTriangle');
    });

    it('should add start class when IsTriangleStart', () => {
        mockProps.params = {
            IsTriangleStart: '1',
        };
        render(<StaticBanner {...mockProps} />);

        expect(screen.getByTestId('static-banner-triangle')).toHaveClass('start');
    });

    it('should add end class when IsTriangleStart', () => {
        mockProps.params = {
            IsTriangleStart: '',
        };
        render(<StaticBanner {...mockProps} />);

        expect(screen.getByTestId('static-banner-triangle')).toHaveClass('end');
    });

    it('should render LivePrice with related region when isVirtualRegionBrowsePage is true', () => {
        mockStores.layoutStore.isVirtualRegionBrowsePage = true;

        render(<StaticBanner {...mockProps} />);

        expect(mockPlaceholderProps).toHaveBeenCalledWith(
            expect.objectContaining({
                destinationRelatedCodes: ['MAA'],
            }),
        );
    });
});
