import React from 'react';
import { waitFor } from '@testing-library/dom';
import { render, screen } from '@testing-library/react';

import { createMockStores, mockLivePrice } from 'frontend/__mocks__';
import * as customisationUtils from 'frontend/utils/componentStylesCustomisation.utils';
import { mockSitecoreField, mockSitecoreImageField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import { IHeroBannerParameters, THeroBannerProps } from 'models/data/IHeroBanner';
import { MediaSize } from 'models/data/MediaSizeParams';
import { TitleFontStyle } from 'models/enum/CustomisableComponentsParameters';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';

import FloatingBanner from './FloatingBanner';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockCreditAnchorComponent = jest.fn();
jest.mock('frontend/components/common/CreditAnchor/CreditAnchor', () => ({
    __esModule: true,
    default: props => {
        mockCreditAnchorComponent(props);

        return <div data-tid='credit-anchor' />;
    },
}));

const mockJSSImageProps = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => props => {
    mockJSSImageProps(props);

    return <div data-tid='jss-image'>{props.field.value.src}</div>;
});

const mockJSSNextImageProps = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: props => {
        mockJSSNextImageProps(props);

        return <div data-tid={props['data-tid'] || 'jss-next-image'} />;
    },
}));

const mockPlaceholderProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    ...jest.requireActual('@sitecore-jss/sitecore-jss-nextjs'),
    Placeholder: props => {
        mockPlaceholderProps(props);

        return <div data-tid={props.name}>{props.render?.()}</div>;
    },
}));

const mockBannerTitleProps = jest.fn();
jest.mock('./components/FloatingBannerTitle/FloatingBannerTitle', () => props => {
    mockBannerTitleProps(props);

    return <div data-tid='banner-title' />;
});

jest.mock('./components/FloatingUnavailableBanner/FloatingUnavailableBanner', () => () => (
    <div data-tid='floating-unavailable-banner' />
));

const mockGetRelatedDestinationsCodes = jest.fn();
jest.mock('frontend/utils/search/search.utils', () => ({
    getRelatedDestinationsCodes: (...params) => mockGetRelatedDestinationsCodes(...params),
}));

let mockUseMobileViewport = true;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

const mockGetTitleFontClassName = jest.spyOn(customisationUtils, 'getTitleFontClassName').mockReturnValue('test');

const createProps = (): THeroBannerProps => ({
    rendering: {
        placeholders: {
            [PlaceholderNames.HeroBannerTopSection]: [],
            [PlaceholderNames.LivePrice]: [],
            [PlaceholderNames.FloatingSearchpod]: [],
        },
    },
    params: { TitleFontStyle: TitleFontStyle.Default } as IHeroBannerParameters,
    fields: {
        Name: mockSitecoreField('Name'),
        Image: mockSitecoreField(mockSitecoreImageField('src')),
        Title: mockSitecoreField('title'),
        Subtitle: mockSitecoreField('Subtitle'),
        Code: mockSitecoreField('test'),
        Logo: mockSitecoreField(mockSitecoreImageField('Logo')),
        ComposedTitle: mockSitecoreField('ComposedTitle'),
        CreditIcon: mockSitecoreField(mockSitecoreImageField('CreditIcon')),
        CreditLink: mockSitecoreField(mockSitecoreLinkField('link', 'link', SitecoreLinkType.Internal)),
        CreditText: mockSitecoreField('CreditText'),
        DisableCreditAnchor: mockSitecoreField(true),
        PageCategory: mockSitecoreField('PageCategory'),
        PageDescription: mockSitecoreField('PageDescription'),
    },
});

const createStores = () =>
    createMockStores({
        trackingStore: { trackModuleClick: jest.fn() },
        layoutStore: {
            isEditMode: false,
            isSearchFlexibleOnDestinationGuide: false,
            isLivePriceEnabledForDestination: jest.fn().mockReturnValue(true),
            isDestinationPage: false,
            isVirtualResortBrowsePage: false,
            isDestinationUnavailableBannerEnabled: false,
        },
        hotelsStore: {
            getDestinationsAvailability: jest.fn(),
        },
    });

let mockProps;
let mockStores;

describe('FloatingBanner', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        mockUseMobileViewport = true;

        mockGetRelatedDestinationsCodes.mockReturnValue(['relatedRegionCode']);
    });

    it('should NOT render component when no fields', () => {
        mockProps.fields = undefined;
        const { container } = render(<FloatingBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should standard render', () => {
        render(<FloatingBanner {...mockProps} />);

        expect(mockBannerTitleProps).toHaveBeenCalledWith({
            ComposedTitle: mockProps.fields.ComposedTitle,
            Subtitle: mockProps.fields.Subtitle,
            Title: mockProps.fields.Title,
            Name: mockProps.fields.Name,
            className: 'test',
        });
        expect(mockPlaceholderProps).toHaveBeenCalledWith(
            expect.objectContaining({
                name: PlaceholderNames.HeroBannerTopSection,
            }),
        );
        expect(mockGetTitleFontClassName).toHaveBeenCalledWith(mockProps.params.TitleFontStyle);
        expect(screen.getByTestId('floating-banner')).toBeInTheDocument();
        expect(screen.getByTestId('floating-banner-inner')).toBeInTheDocument();
    });

    it('should render Logo', () => {
        render(<FloatingBanner {...mockProps} />);

        expect(screen.getByTestId('floating-logo')).toBeInTheDocument();
        expect(mockJSSNextImageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                field: mockProps.fields.Logo,
                alt: mockProps.fields.Logo.value.alt,
                fill: true,
                mediaSize: MediaSize.Small,
                'data-tid': 'floating-logo',
            }),
        );
    });

    it('Should render JSSNextImage in normal (not isEdit) mode', () => {
        render(<FloatingBanner {...mockProps} />);

        expect(screen.getByTestId('jss-next-image')).toBeInTheDocument();
        expect(mockJSSNextImageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                field: mockProps.fields.Image,
                priority: true,
                fill: true,
            }),
        );
        expect(screen.queryByTestId('jss-image')).not.toBeInTheDocument();
    });

    it('Should NOT render JSSNextImage in isEdit mode', () => {
        mockStores.layoutStore.isEditMode = true;
        render(<FloatingBanner {...mockProps} />);

        expect(screen.queryByTestId('jss-next-image')).not.toBeInTheDocument();
        expect(screen.getByTestId('jss-image')).toBeInTheDocument();
        expect(mockJSSImageProps).toHaveBeenCalledWith({
            field: mockProps.fields.Image,
            alt: mockProps.fields.Image.value.alt,
        });
    });

    it('Should render search pod mobile placeholder', () => {
        render(<FloatingBanner {...mockProps} />);
        const banner = screen.getByTestId('floating-banner');
        const searchPod = screen.getByTestId(PlaceholderNames.FloatingSearchpod);

        expect(mockPlaceholderProps).toHaveBeenCalledWith(
            expect.objectContaining({
                name: PlaceholderNames.FloatingSearchpod,
                isFloating: true,
                rendering: mockProps.rendering,
            }),
        );
        expect(banner).not.toContainElement(searchPod);
        expect(searchPod).toBeInTheDocument();
    });

    it('Should render search pod desktop placeholder', () => {
        mockUseMobileViewport = false;
        render(<FloatingBanner {...mockProps} />);
        const banner = screen.getByTestId('floating-banner');
        const searchPod = screen.getByTestId(PlaceholderNames.FloatingSearchpod);

        expect(screen.getByTestId('desktop-search-pod')).toHaveClass('desktopSearchPod');
        expect(mockPlaceholderProps).toHaveBeenCalledWith(
            expect.objectContaining({
                name: PlaceholderNames.FloatingSearchpod,
                isFloating: true,
                rendering: mockProps.rendering,
            }),
        );
        expect(banner).toContainElement(searchPod);
    });

    describe('CreditAnchor', () => {
        it('should render CreditAnchor when all credit fields are defined', () => {
            render(<FloatingBanner {...mockProps} />);
            expect(screen.getByTestId('credit-anchor')).toBeInTheDocument();
            expect(mockCreditAnchorComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    fields: {
                        CreditIcon: mockProps.fields.CreditIcon,
                        CreditText: mockProps.fields.CreditText,
                        CreditLink: mockProps.fields.CreditLink,
                        DisableCreditAnchor: mockProps.fields.DisableCreditAnchor,
                    },
                    isPillStyle: true,
                    isHomepageBannerElement: false,
                }),
            );
        });

        it('should not render CreditAnchor when CreditIcon field is not defined', () => {
            mockProps.fields.CreditIcon = undefined;
            render(<FloatingBanner {...mockProps} />);

            expect(screen.queryByTestId('credit-anchor')).not.toBeInTheDocument();
        });

        it('should not render CreditAnchor when CreditText field is not defined', () => {
            mockProps.fields.CreditText = undefined;
            render(<FloatingBanner {...mockProps} />);

            expect(screen.queryByTestId('credit-anchor')).not.toBeInTheDocument();
        });

        it('should not render CreditAnchor when CreditLink field is not defined', () => {
            mockProps.fields.CreditLink = undefined;
            render(<FloatingBanner {...mockProps} />);

            expect(screen.queryByTestId('credit-anchor')).not.toBeInTheDocument();
        });
    });

    describe('LivePrice', () => {
        it('should render LivePrice on not virtual region browse page', async () => {
            mockProps.cheapestLivePriceForDestinationPage = mockLivePrice;
            mockGetRelatedDestinationsCodes.mockReturnValue([]);

            render(<FloatingBanner {...mockProps} />);

            await waitFor(() => {
                expect(mockPlaceholderProps).toHaveBeenCalledWith(
                    expect.objectContaining({
                        name: PlaceholderNames.LivePrice,
                        livePrice: mockLivePrice,
                        destinationVirtualCode: undefined,
                        destinationRelatedCodes: [],
                        isFlexibleSearch: false,
                        availableOriginsSearchEnabled: true,
                        isHolidaysResultButtonEnabled: true,
                        hasGenericTaxTooltip: true,
                    }),
                );
            });
        });

        it('should render LivePrice on virtual region or resort browse page', async () => {
            mockStores.layoutStore.isVirtualRegionBrowsePage = true;
            mockProps.cheapestLivePriceForDestinationPage = mockLivePrice;
            mockStores.layoutStore.isDestinationPage = true;

            render(<FloatingBanner {...mockProps} />);

            await waitFor(() => {
                expect(mockPlaceholderProps).toHaveBeenCalledWith(
                    expect.objectContaining({
                        name: PlaceholderNames.LivePrice,
                        destinationVirtualCode: 'test',
                    }),
                );
            });
        });

        it('should render LivePrice with related region when isVirtualRegionBrowsePage is true', () => {
            mockProps.cheapestLivePriceForDestinationPage = mockLivePrice;
            mockStores.layoutStore.isDestinationPage = true;
            mockStores.layoutStore.isVirtualRegionBrowsePage = true;

            render(<FloatingBanner {...mockProps} />);

            expect(mockPlaceholderProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    destinationRelatedCodes: ['relatedRegionCode'],
                }),
            );
        });
    });

    describe('FloatingUnavailableBanner', () => {
        it('should render unavailable banner when destination is not available', async () => {
            mockStores.layoutStore.isDestinationUnavailableBannerEnabled = true;
            mockStores.layoutStore.isDestinationPage = true;
            mockStores.hotelsStore.getDestinationsAvailability = jest.fn().mockResolvedValue({ test: false });

            render(<FloatingBanner {...mockProps} />);

            await waitFor(() => {
                expect(screen.getByTestId('floating-unavailable-banner')).toBeInTheDocument();
            });
        });

        it('should NOT render unavailable banner when it turned off in settings', async () => {
            mockStores.layoutStore.isDestinationUnavailableBannerEnabled = false;
            mockStores.layoutStore.isDestinationPage = true;
            mockStores.hotelsStore.getDestinationsAvailability = jest.fn().mockResolvedValue({ test: false });

            render(<FloatingBanner {...mockProps} />);

            await waitFor(() => {
                expect(screen.queryByTestId('floating-unavailable-banner')).not.toBeInTheDocument();
            });
        });

        it('should NOT render unavailable banner on not destination pages', async () => {
            mockStores.layoutStore.isDestinationUnavailableBannerEnabled = true;
            mockStores.layoutStore.isDestinationPage = false;
            mockStores.hotelsStore.getDestinationsAvailability = jest.fn().mockResolvedValue({ test: false });

            render(<FloatingBanner {...mockProps} />);

            await waitFor(() => {
                expect(screen.queryByTestId('floating-unavailable-banner')).not.toBeInTheDocument();
            });
        });
    });
});
