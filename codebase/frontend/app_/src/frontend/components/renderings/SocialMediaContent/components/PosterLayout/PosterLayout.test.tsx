import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CurrencyCode } from 'code/currency';
import { Tokens } from 'code/tokens';
import { createMockStores, imageMock, mockLuggageListFields } from 'frontend/__mocks__';
import { getBgImage } from 'frontend/utils/image.utils';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { RouteDirection } from 'models/enum/RouteDirection';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import * as posterUtils from 'frontend/components/renderings/HotelPoster/HotelPoster.utils';
import { ISocialMediaContentProps } from 'frontend/components/renderings/SocialMediaContent/interfaces';
import { getSocialText } from 'frontend/components/renderings/SocialMediaContent/utils/rendering.utils';

import PosterLayout from './PosterLayout';

jest.mock('frontend/components/renderings/SocialMediaContent/utils/rendering.utils');
const mockGetSocialText = getSocialText as jest.MockedFn<typeof getSocialText>;

jest.spyOn(posterUtils, 'getTouristTaxLabelForPoster').mockReturnValue('(tax label)');

const createStores = () =>
    createMockStores({
        amendPaymentStore: {
            currency: CurrencyCode.CHF,
        },
        bookingStore: {
            hotel: {
                name: 'hotel name',
                location: { name: 'location name' },
                closestFacility: { distance: 300 },
                images: [imageMock],
            },
            selectedOffer: {
                pricePP: 123,
                accom: { stay: 4 },
                transport: { routes: [{ direction: RouteDirection.Outbound, depName: 'depName' }] },
                transfers: [],
            },
            isLuxuryPackage: false,
            totalPricePPWithTouristTax: 150,
        },
        marketStore: {
            formatMoney: jest.fn(el => el),
        },
        layoutStore: {
            basePath: 'basePath',
            isHotelDetailsBrowsePage: false,
            isTouristTaxEnabled: true,
        },
    });
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/SocialMediaContent/hooks/useRenderedImage', () => ({
    useRenderedImage: () => ['', jest.fn()],
}));

const mockPriceLabelComponent = jest.fn();
jest.mock('frontend/components/common/PriceLabel/PriceLabel', () => ({
    __esModule: true,
    default: props => {
        mockPriceLabelComponent(props);

        return (
            <div data-tid='price-label'>
                {props.wrapLabelBeforePrice('prefix')}
                {props.price}
                {props.wrapLabelAfterPrice('postfix')}
            </div>
        );
    },
}));

const mockLuxuryWrapper = jest.fn();
jest.mock('frontend/components/common/LuxuryWrapper/LuxuryWrapper', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockLuxuryWrapper(props);

        return <div data-tid='luxury-wrapper'>{children}</div>;
    },
}));

jest.mock('frontend/utils/image.utils');
const mockGetBgImage = getBgImage as jest.MockedFn<typeof getBgImage>;

describe('<PosterLayout />', () => {
    const resetMocks = (): ISocialMediaContentProps => ({
        downloadPoster: jest.fn(),
        hasEjLogo: false,
        hasUMLogo: false,
        logoImage: mockSitecoreField(mockSitecoreImageField('image')),
        UMLogoImage: 'UMLogoImage',
        posterFields: {
            DownloadLabel: mockSitecoreField('DownloadLabel'),
            LogoCheckboxLabel: mockSitecoreField('LogoCheckboxLabel'),
            ShowAgentLogoCheckboxLabel: mockSitecoreField('ShowAgentLogoCheckboxLabel'),
            FastTrackSecurityIcon: mockSitecoreField(mockSitecoreImageField('FastTrackSecurityIcon')),
            FastTrackSecurityLabel: mockSitecoreField('FastTrackSecurityLabel'),
        },
        posterId: 'posterId',
        posterName: 'posterName',
        toggleEjLogo: jest.fn(),
        toggleUMLogo: jest.fn(),
        fields: {
            CopyLabel: mockSitecoreField('CopyLabel'),
            DownloadDesc: mockSitecoreField('DownloadDesc'),
            LeftSectionDesc: mockSitecoreField('LeftSectionDesc'),
            LeftSectionTitle: mockSitecoreField('LeftSectionTitle'),
            PriceCheckboxLabel: mockSitecoreField('PriceCheckboxLabel'),
            RightSectionDesc: mockSitecoreField('RightSectionDesc'),
            RightSectionTitle: mockSitecoreField('RightSectionTitle'),
            DepositLabel: mockSitecoreField('DepositLabel'),
            AirportLabel: mockSitecoreField(`AirportLabel ${Tokens.Airport}`),
            YourHolidayQuoteLabel: mockSitecoreField('YourHolidayQuoteLabel'),
            ...mockLuggageListFields,
        },
        params: {},
        rendering: {},
    });
    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createStores();
    });

    it('should render empty element when posterFields is empty', () => {
        mocks.posterFields = undefined as any;
        const { container } = render(<PosterLayout {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render empty element when hotel info is empty', () => {
        mockStores.bookingStore.hotel = undefined as any;
        const { container } = render(<PosterLayout {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render social-media-poster', () => {
        render(<PosterLayout {...mocks} />);

        expect(screen.getByTestId('social-media-poster')).toBeInTheDocument();
    });

    it('should correctly call getBgImage', () => {
        render(<PosterLayout {...mocks} />);

        expect(mockGetBgImage).toBeCalledWith([imageMock], mockStores.layoutStore.basePath, false);
    });

    it('should correctly call getSocialText', () => {
        render(<PosterLayout {...mocks} />);

        expect(mockGetSocialText).toBeCalledWith(
            {
                closestFacility: mockStores.bookingStore.hotel.closestFacility,
                images: [imageMock],
                location: mockStores.bookingStore.hotel.location,
                name: mockStores.bookingStore.hotel.name,
            },
            '4 Globals.Labels.NightsPlural Globals.PriceLabels.PerPersonFrom150undefined (tax label)',
            mockStores.bookingStore.selectedOffer,
            {
                airportLabel: `AirportLabel ${mockStores.bookingStore.selectedOffer.transport.routes[0].depName}`,
                depositLabel: mocks.fields!.DepositLabel.value,
                fastTrackSecurityLabel: 'FastTrackSecurityLabel',
                getPhrase: mockStores.layoutStore.getPhrase,
                getFormattedNumber: mockStores.marketStore.getFormattedNumber,
            },
        );
    });

    describe('LeftSectionTitle', () => {
        it('should render LeftSectionTitle', () => {
            render(<PosterLayout {...mocks} />);

            expect(screen.getByTestId('left-section-title')).toBeInTheDocument();
        });

        it('should not render LeftSectionTitle', () => {
            mocks.fields!.LeftSectionTitle.value = '';
            render(<PosterLayout {...mocks} />);

            expect(screen.queryByTestId('left-section-title')).not.toBeInTheDocument();
        });
    });

    describe('LeftSectionDesc', () => {
        it('should render LeftSectionDesc', () => {
            render(<PosterLayout {...mocks} />);

            expect(screen.getByTestId('left-section-desc')).toBeInTheDocument();
        });

        it('should not render LeftSectionDesc', () => {
            mocks.fields!.LeftSectionDesc.value = '';
            render(<PosterLayout {...mocks} />);

            expect(screen.queryByTestId('left-section-desc')).not.toBeInTheDocument();
        });
    });

    describe('location-name', () => {
        it('should render location-name', () => {
            render(<PosterLayout {...mocks} />);

            expect(screen.getByTestId('location-name')).toBeInTheDocument();
        });

        it('should not render location-name', () => {
            mockStores.bookingStore.hotel.location.name = '';
            render(<PosterLayout {...mocks} />);

            expect(screen.queryByTestId('location-name')).not.toBeInTheDocument();
        });
    });

    describe('hotel-name', () => {
        it('should render hotel-name', () => {
            render(<PosterLayout {...mocks} />);

            expect(screen.getByTestId('hotel-name')).toBeInTheDocument();
        });

        it('should not render hotel-name', () => {
            mockStores.bookingStore.hotel.name = '';
            render(<PosterLayout {...mocks} />);

            expect(screen.queryByTestId('hotel-name')).not.toBeInTheDocument();
        });
    });

    describe('logoImage', () => {
        it('should not render logoImage', () => {
            mocks.logoImage = mockSitecoreField(mockSitecoreImageField(''));
            render(<PosterLayout {...mocks} />);

            expect(screen.queryByTestId('easyjet-logo')).not.toBeInTheDocument();
        });

        it('should render logoImage', () => {
            render(<PosterLayout {...mocks} />);

            expect(screen.getByTestId('easyjet-logo')).toBeInTheDocument();
        });
    });

    describe('UMLogoImage', () => {
        it('should not render UMLogoImage when it is not defined', () => {
            mocks.UMLogoImage = undefined;
            render(<PosterLayout {...mocks} />);

            expect(screen.queryByTestId('um-logo')).not.toBeInTheDocument();
        });

        it('should render UMLogoImage when it is defined', () => {
            render(<PosterLayout {...mocks} />);

            expect(screen.getByTestId('um-logo')).toBeInTheDocument();
        });
    });

    describe('PriceLabel', () => {
        it('should not render PriceLabel when no offer', () => {
            mockStores.bookingStore.selectedOffer = undefined as any;
            render(<PosterLayout {...mocks} />);

            expect(screen.queryByTestId('price-label')).not.toBeInTheDocument();
        });

        it('should not render PriceLabel initially', () => {
            mockStores.bookingStore.selectedOffer = undefined as any;
            render(<PosterLayout {...mocks} />);

            expect(screen.queryByTestId('price-label')).not.toBeInTheDocument();
        });

        it('should render PriceLabel when checkbox clicked', async () => {
            render(<PosterLayout {...mocks} />);

            expect(screen.queryByTestId('price-label')).not.toBeInTheDocument();

            await userEvent.click(screen.getByTestId('hide-price-checkbox'));

            expect(mockPriceLabelComponent).toBeCalledWith(
                expect.objectContaining({
                    className: 'promo-slide__item__price',
                    dataTid: 'price-label',
                    priceDictionary: 'Globals.PriceLabels.PerPersonFrom',
                    tag: 'div',
                }),
            );
            expect(screen.getByTestId('price-label')).toBeInTheDocument();
            expect(within(screen.getByTestId('price-label')).getByText(150)).toBeInTheDocument();
        });
    });

    describe('LogoCheckboxLabel', () => {
        it('should render LogoCheckboxLabel', () => {
            render(<PosterLayout {...mocks} />);

            expect(screen.getByTestId('hide-ej-logo-checkbox')).toBeInTheDocument();
        });

        it('should not render LogoCheckboxLabel', () => {
            mocks.posterFields.LogoCheckboxLabel!.value = '';
            render(<PosterLayout {...mocks} />);

            expect(screen.queryByTestId('hide-ej-logo-checkbox')).not.toBeInTheDocument();
        });

        it('should call toggleEjLogo when clicked', async () => {
            render(<PosterLayout {...mocks} />);

            await userEvent.click(screen.getByTestId('hide-ej-logo-checkbox'));

            expect(mocks.toggleEjLogo).toHaveBeenCalled();
        });
    });

    describe('LogoCheckboxLabel', () => {
        it('should render ShowAgentLogoCheckboxLabel', () => {
            render(<PosterLayout {...mocks} />);

            expect(screen.getByTestId('hide-um-logo-checkbox')).toBeInTheDocument();
            expect(screen.getByTestId('hide-um-logo-checkbox')).toHaveTextContent('ShowAgentLogoCheckboxLabel');
        });

        it('should not render ShowAgentLogoCheckboxLabel when it is not defined', () => {
            mocks.posterFields.ShowAgentLogoCheckboxLabel!.value = '';
            render(<PosterLayout {...mocks} />);

            expect(screen.queryByTestId('hide-um-logo-checkbox')).not.toBeInTheDocument();
        });

        it('should not render ShowAgentLogoCheckboxLabel when UMLogoImage is not defined', () => {
            mocks.UMLogoImage = undefined;
            render(<PosterLayout {...mocks} />);

            expect(screen.queryByTestId('hide-um-logo-checkbox')).not.toBeInTheDocument();
        });

        it('should call toggleUMLogo when clicked', async () => {
            render(<PosterLayout {...mocks} />);

            await userEvent.click(screen.getByTestId('hide-um-logo-checkbox'));

            expect(mocks.toggleUMLogo).toHaveBeenCalled();
        });
    });

    describe('PriceCheckboxLabel', () => {
        it('should render PriceCheckboxLabel', () => {
            render(<PosterLayout {...mocks} />);

            expect(screen.getByTestId('hide-price-checkbox')).toBeInTheDocument();
        });

        it('should not render PriceCheckboxLabel', () => {
            mocks.fields!.PriceCheckboxLabel.value = '';
            render(<PosterLayout {...mocks} />);

            expect(screen.queryByTestId('hide-price-checkbox')).not.toBeInTheDocument();
        });
    });

    describe('DownloadLabel', () => {
        it('should not render DownloadLabel when DownloadLabel not set', () => {
            mocks.posterFields!.DownloadLabel!.value = '';
            render(<PosterLayout {...mocks} />);

            expect(screen.queryByTestId('download-poster')).not.toBeInTheDocument();
        });

        it('should not render DownloadLabel when posterName not set', () => {
            mocks.posterName = '';
            render(<PosterLayout {...mocks} />);

            expect(screen.queryByTestId('download-poster')).not.toBeInTheDocument();
        });

        it('should render DownloadLabel', () => {
            render(<PosterLayout {...mocks} />);

            expect(screen.getByTestId('download-poster')).toBeInTheDocument();
        });

        it('should call downloadPoster when clicked', async () => {
            render(<PosterLayout {...mocks} />);

            await userEvent.click(screen.getByTestId('download-poster'));

            expect(mocks.downloadPoster).toBeCalledWith('posterName', 1);
        });
    });

    describe('RightSectionTitle', () => {
        it('should render RightSectionTitle', () => {
            render(<PosterLayout {...mocks} />);

            expect(screen.getByTestId('right-section-title')).toBeInTheDocument();
        });

        it('should not render RightSectionTitle', () => {
            mocks.fields!.RightSectionTitle.value = '';
            render(<PosterLayout {...mocks} />);

            expect(screen.queryByTestId('right-section-title')).not.toBeInTheDocument();
        });
    });

    describe('RightSectionDesc', () => {
        it('should render RightSectionDesc', () => {
            render(<PosterLayout {...mocks} />);

            expect(screen.getByTestId('right-section-desc')).toBeInTheDocument();
        });

        it('should not render RightSectionDesc', () => {
            mocks.fields!.RightSectionDesc.value = '';
            render(<PosterLayout {...mocks} />);

            expect(screen.queryByTestId('right-section-desc')).not.toBeInTheDocument();
        });
    });

    describe('CopyLabel', () => {
        const writeText = jest.fn();

        Object.assign(navigator, {
            clipboard: {
                writeText,
            },
        });

        it('should render CopyLabel', () => {
            render(<PosterLayout {...mocks} />);

            expect(screen.getByTestId('clipboard-copy')).toBeInTheDocument();
        });

        it('should not render CopyLabel', () => {
            mocks.fields!.CopyLabel.value = '';
            render(<PosterLayout {...mocks} />);

            expect(screen.queryByTestId('clipboard-copy')).not.toBeInTheDocument();
        });

        it('should copyToClipboard', async () => {
            const mockSocialText = 'social text';

            mockGetSocialText.mockReturnValue(mockSocialText);
            render(<PosterLayout {...mocks} />);

            const button = screen.getByTestId('clipboard-copy');
            await userEvent.click(button);

            expect(writeText).toBeCalledWith(mockSocialText);
        });
    });

    describe('Luxury content', () => {
        beforeEach(() => {
            mockStores.bookingStore.isLuxuryPackage = true;
            mocks.hasEjLogo = true;
        });

        it('should render luxury wrapper', () => {
            render(<PosterLayout {...mocks} />);

            expect(screen.getByTestId('luxury-wrapper')).toBeInTheDocument();
            expect(mockLuxuryWrapper).toHaveBeenCalledWith({
                bannerClassName: 'luxuryBanner priority',
                id: 'posterId',
                label: SitecoreDictionary.GlobalsLabelsLuxuryCollection,
                renderChildrenOnly: false,
                wrapperClassName: 'poster priority',
            });
        });

        it('should render location-name with luxury class', () => {
            render(<PosterLayout {...mocks} />);

            expect(screen.getByTestId('location-name')).toHaveClass('location luxury');
        });
    });
});
