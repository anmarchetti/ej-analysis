import React from 'react';
import { render, screen } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { mockedPoster } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { IHotel } from 'models/data/IHotel';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import { PackageIconTypes } from 'models/enum/PackageIconTypes';
import * as posterUtils from 'frontend/components/renderings/HotelPoster/HotelPoster.utils';

import { HotelDetailsLayout, IHotelDetailsLayoutProps } from './HotelDetailsLayout';

const mockPriceLabelComponent = jest.fn();
const mockHolidayPackageIconsComponent = jest.fn();
const mockGetTouristTaxLabelForPoster = jest.spyOn(posterUtils, 'getTouristTaxLabelForPoster');

jest.mock('frontend/components/common/PriceLabel/PriceLabel', () => ({
    __esModule: true,
    default: props => {
        mockPriceLabelComponent(props);

        return <div data-tid='price-label' />;
    },
}));

jest.mock('frontend/components/common/HolidayPackageIcons', () => ({
    __esModule: true,
    default: props => {
        mockHolidayPackageIconsComponent(props);

        return <div data-tid='holiday-package-icons' />;
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

jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: ({ className }) => <div data-tid='jss-image' className={className} />,
}));

const createPoster = () => ({ ...mockedPoster });
jest.mock('react-tooltip', () => ({
    Tooltip: jest.fn().mockImplementation(() => <div role='tooltip' />),
}));

const mockRichTextWithLinksProps = jest.fn();

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinksProps(props);

        return <div data-tid={props.dataId}>{props.field.value}</div>;
    },
}));

const createStores = () => ({
    appStore: { isScreenLessMedium: false },
    layoutStore: { getPhrase: jest.fn(), basePath: '', isTouristTaxEnabled: true },
    marketStore: { formatMoney: jest.fn() },
    bookingStore: {
        currency: CurrencyCode.EUR,
        hotel: { images: [{ large: '' }], location: { name: 'name' } } as Nullable<IHotel>,
        selectedOffer: {
            accom: {},
            transport: { routes: [] },
            touristTaxPP: 24,
        } as unknown as Nullable<IOfferWithoutAltBoards>,
        isLuxuryPackage: false,
    },
});

const createProps: () => IHotelDetailsLayoutProps = () => ({
    fields: {
        AirportLabel: mockSitecoreField('AirportLabel'),
        BoardLabel: mockSitecoreField('BoardLabel'),
        ConclusionLabel: mockSitecoreField('ConclusionLabel'),
        DepositLabel: mockSitecoreField('DepositLabel'),
        RoomLabel: mockSitecoreField('RoomLabel'),
        RoundUpDescription: mockSitecoreField('RoundUpDescription'),
        RoundUpTitle: mockSitecoreField('RoundUpTitle'),
    },
    posterFields: {
        FastTrackSecurityIcon: mockSitecoreField(mockSitecoreImageField('FastTrackSecurityIcon')),
        FastTrackSecurityLabel: mockSitecoreField('FastTrackSecurityLabel'),
    },
    params: {},
    rendering: {},
    hasEjLogo: false,
    hasUMLogo: false,
    logoImage: mockSitecoreField(mockSitecoreImageField('LogoImage')),
    UMLogoImage: 'um-logo',
    posterId: 'posterId',
    wholePartPP: 0,
});

let mockPoster = createPoster();
let mockStores = createStores();
let mockProps = createProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => ({ ...mockStores, ...mockPoster }),
}));

const mockGetPosterMeta = jest.spyOn(posterUtils, 'getPosterMeta');

describe('<HotelDetailsLayout />', () => {
    beforeEach(() => {
        mockStores = createStores();
        mockProps = createProps();
        mockPoster = createPoster();
        mockPoster.activeId = 'default';
    });

    it('should NOT render when fields are empty', () => {
        mockProps.fields = undefined;

        const { container } = render(<HotelDetailsLayout {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when hotelInfo is NOT provided', () => {
        mockStores.bookingStore.hotel = undefined;

        const { container } = render(<HotelDetailsLayout {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when offer is NOT provided', () => {
        mockStores.bookingStore.selectedOffer = undefined;

        const { container } = render(<HotelDetailsLayout {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when getPosterMeta returns null', () => {
        mockGetPosterMeta.mockReturnValueOnce(null);

        const { container } = render(<HotelDetailsLayout {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('easyJet logo', () => {
        it('should NOT render logo when hasEjLogo is falsy', () => {
            mockProps.hasEjLogo = false;

            render(<HotelDetailsLayout {...mockProps} />);

            expect(screen.queryByTestId('jss-image')).not.toBeInTheDocument();
        });

        it('should NOT render logo when no field found', () => {
            mockProps.hasEjLogo = true;
            mockProps.logoImage = undefined;

            render(<HotelDetailsLayout {...mockProps} />);

            expect(screen.queryByTestId('jss-image')).not.toBeInTheDocument();
        });

        it('should render logo when image and hasEjLogo are provided', () => {
            mockProps.hasEjLogo = true;
            mockProps.logoImage = mockSitecoreField(mockSitecoreImageField('LogoImage'));

            render(<HotelDetailsLayout {...mockProps} />);

            expect(screen.getByTestId('jss-image')).toHaveClass('logo');
        });

        it('should render luxury logo when isLuxuryPackage is true', () => {
            mockProps.hasEjLogo = true;
            mockProps.logoImage = mockSitecoreField(mockSitecoreImageField('LogoImage'));
            mockStores.bookingStore.isLuxuryPackage = true;

            render(<HotelDetailsLayout {...mockProps} />);

            expect(screen.getByTestId('jss-image')).toHaveClass('logo luxury');
        });
    });

    describe('Luxury content', () => {
        beforeEach(() => {
            mockStores.bookingStore.isLuxuryPackage = true;
        });

        it('should render luxury wrapper with fast track security icon', () => {
            render(<HotelDetailsLayout {...mockProps} />);

            expect(screen.getByTestId('luxury-wrapper')).toBeInTheDocument();
            expect(mockLuxuryWrapper).toHaveBeenCalledWith({
                bannerClassName: 'luxuryBanner',
                id: 'posterId',
                label: undefined,
                renderChildrenOnly: true,
                wrapperClassName: 'poster priority',
            });

            expect(mockHolidayPackageIconsComponent).toHaveBeenCalledWith({
                className: 'hotel-poster',
                packageIcons: [],
                transfer: null,
                extraLuggage: undefined,
                isLuxuryPackage: true,
                iconClassName: 'iconWrapper',
                extraIcon: {
                    iconUrl: 'FastTrackSecurityIcon',
                    key: PackageIconTypes.FastTrack,
                    name: 'FastTrackSecurityLabel',
                },
            });
        });

        it('should include fast track security icon without fast track label when label is NOT provided', () => {
            mockProps.posterFields.FastTrackSecurityLabel = undefined;

            render(<HotelDetailsLayout {...mockProps} />);

            expect(mockHolidayPackageIconsComponent).toHaveBeenCalledWith({
                className: 'hotel-poster',
                packageIcons: [],
                transfer: null,
                extraLuggage: undefined,
                isLuxuryPackage: true,
                iconClassName: 'iconWrapper',
                extraIcon: {
                    iconUrl: 'FastTrackSecurityIcon',
                    key: PackageIconTypes.FastTrack,
                    name: '',
                },
            });
        });

        it('should NOT include fast track security icon when icon is NOT provided', () => {
            mockProps.posterFields.FastTrackSecurityIcon = undefined;

            render(<HotelDetailsLayout {...mockProps} />);

            expect(mockHolidayPackageIconsComponent).toHaveBeenCalledWith({
                className: 'hotel-poster',
                packageIcons: [],
                transfer: null,
                extraLuggage: undefined,
                isLuxuryPackage: true,
                extraIcon: undefined,
                iconClassName: 'iconWrapper',
            });
        });
    });

    describe('user management logo', () => {
        it('should NOT render logo when hasUMLogo is falsy', () => {
            mockPoster.hasUMLogo = false;
            render(<HotelDetailsLayout {...mockProps} />);

            expect(screen.queryByTestId('um-logo')).not.toBeInTheDocument();
        });

        it('should NOT render logo when UMLogoImage is not defined', () => {
            mockProps.UMLogoImage = undefined;
            render(<HotelDetailsLayout {...mockProps} />);

            expect(screen.queryByTestId('um-logo')).not.toBeInTheDocument();
        });
    });

    it('should render Price label', () => {
        render(<HotelDetailsLayout {...mockProps} />);

        expect(screen.getByTestId('price-label')).toBeInTheDocument();
        expect(mockPriceLabelComponent).toBeCalledWith({
            className: 'price',
            price: undefined,
            priceDictionary: 'Globals.PriceLabels.PerPerson',
            tag: 'div',
        });
    });

    it('should render holiday-package-icons', () => {
        render(<HotelDetailsLayout {...mockProps} />);

        expect(screen.getByTestId('holiday-package-icons')).toBeInTheDocument();
        expect(mockHolidayPackageIconsComponent).toHaveBeenCalledWith({
            className: 'hotel-poster',
            packageIcons: [],
            transfer: null,
            extraLuggage: undefined,
            iconClassName: 'iconWrapper',
            isLuxuryPackage: false,
            extraIcon: undefined,
        });
    });

    describe('Tourist Tax Label', () => {
        it('should render tourist tax label when isTouristTaxEnabled is true and label is returned', () => {
            mockGetTouristTaxLabelForPoster.mockReturnValueOnce('Tourist tax: €24');

            render(<HotelDetailsLayout {...mockProps} />);

            expect(screen.getByText('Tourist tax: €24')).toBeInTheDocument();
            expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
                field: { value: 'Tourist tax: €24' },
                className: 'touristTax',
                tag: 'div',
                dataId: 'tourist-tax-label',
            });
        });

        it('should NOT render tourist tax label when getTouristTaxLabelForPoster returns empty string', () => {
            mockStores.layoutStore.isTouristTaxEnabled = false;
            mockGetTouristTaxLabelForPoster.mockReturnValueOnce('');

            render(<HotelDetailsLayout {...mockProps} />);

            expect(screen.queryByTestId('tourist-tax-label')).not.toBeInTheDocument();
            expect(mockGetTouristTaxLabelForPoster).toHaveBeenCalledWith(false, expect.any(Function), 24);
        });
    });
});
