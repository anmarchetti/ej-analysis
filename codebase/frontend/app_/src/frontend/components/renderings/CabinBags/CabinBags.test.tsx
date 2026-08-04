import React from 'react';
import { render, screen } from '@testing-library/react';

import { Tokens } from 'code/tokens';
import { createMockStores } from 'frontend/__mocks__';
import { mockAncillariesParams } from 'frontend/__mocks__/ancillaries';
import { mockCabinBagsFields } from 'frontend/__mocks__/cabinBags';
import { mockReplaceToken, mockTokenizer } from 'frontend/__mocks__/utils/tokenizer';
import ScrollAnchorId from 'models/enum/ScrollAnchorId';
import { OutlineBannerTheme } from 'frontend/components/common/OutlineBanner/OutlineBannerTheme';

import { CabinBags, TCabinBagsProps } from './CabinBags';

const createFields = () => ({
    Icon: mockCabinBagsFields.Icon,
    OutboundIcon: mockCabinBagsFields.OutboundIcon,
    ReturnIcon: mockCabinBagsFields.ReturnIcon,
    Title: mockCabinBagsFields.Title,
    OutlineBannerTextContent: mockCabinBagsFields.OutlineBannerTextContent,
});

const createProps = (): TCabinBagsProps => ({
    fields: mockCabinBagsFields,
    params: mockAncillariesParams,
    rendering: {},
});

const createStores = () =>
    createMockStores({
        guestDetailsStore: { adultsAndChildrenNumber: 2 },
        bookingStore: {
            extraLuggage: {
                isLCBAddingUnavailable: false,
                getLargeCabinBagsFormattedPrice: jest.fn(() => '23$'),
                setLCBGreenPromoShown: jest.fn(),
            },
            isFlightExternal: true,
        },
        layoutStore: {
            isTradePortal: false,
            isPricesHidden: false,
            getPhrase: jest.fn(p => p),
            isPostBookingPages: false,
            isViewBookingPage: false,
            isExtrasPage: true,
        },
        viewBookingStore: {
            isFlightExternal: true,
        },
        appStore: {
            isLoading: false,
        },
    });

let mockProps = createProps();
let mockStores = createStores();
let processedFields = createFields();

jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    Tokenizer: {
        replaceToken: mockReplaceToken,
    },
}));

const mockRemoveWebStorageItem = jest.fn();
jest.mock('frontend/utils/webStorage.utils', () => ({
    __esModule: true,
    removeWebStorageItem: () => mockRemoveWebStorageItem(),
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockAncillaries = jest.fn();
jest.mock('frontend/components/common/Ancillaries/Ancillaries', () => ({
    __esModule: true,
    default: props => {
        mockAncillaries(props);

        return (
            <div data-tid='ancillaries'>
                {props.children}
                {props.outboundSelection}
                {props.inboundSelection}
                {props.actionPanel}
            </div>
        );
    },
}));

const mockCabinBagsDropdown = jest.fn();
jest.mock('frontend/components/renderings/CabinBags/components/CabinBagsDropdown/CabinBagsDropdown', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockCabinBagsDropdown(props);

        return <div data-tid='cabin-bags-dropdown' />;
    },
}));

const mockCabinBagsActionPanel = jest.fn();
jest.mock('frontend/components/renderings/CabinBags/components/CabinBagsActionPanel/CabinBagsActionPanel', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockCabinBagsActionPanel(props);

        return <div data-tid='cabin-bags-action-panel' />;
    },
}));

const mockCabinBagsRouteInfo = jest.fn();
jest.mock('frontend/components/renderings/CabinBags/components/CabinBagsRouteInfo/CabinBagsRouteInfo', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockCabinBagsRouteInfo(props);

        return <div data-tid='cabin-bags-route-info' />;
    },
}));

const mockCabinBagsBanners = jest.fn();
jest.mock('frontend/components/renderings/CabinBags/components/CabinBagsBanners/CabinBagsBanners', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockCabinBagsBanners(props);

        return <div data-tid='cabin-bags-banners' />;
    },
}));

const mockOutlineBannerContext = jest.fn();
jest.mock('frontend/components/common/OutlineBanner/OutlineBanner.tsx', () => ({
    __esModule: true,
    OutlineBannerContext: {
        Provider: props => {
            mockOutlineBannerContext(props);

            return <div>{props.children}</div>;
        },
    },
}));

const mockUseLuxuryInternalFlight = jest.fn().mockReturnValue(false);
jest.mock('frontend/hooks/useLuxuryInternalFlight', () => ({
    useLuxuryInternalFlight: () => mockUseLuxuryInternalFlight(),
}));

describe('<CabinBags />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        processedFields = createFields();
    });

    it('should skip render when no fields', () => {
        delete mockProps.fields;

        render(<CabinBags {...mockProps} />);

        expect(screen.queryByTestId('large-cabin-bags')).not.toBeInTheDocument();
    });

    it('should render shimmer while loading on Extras Page', () => {
        mockStores.appStore.isLoading = true;
        render(<CabinBags {...mockProps} />);

        expect(screen.getByTestId('shimmer')).toBeInTheDocument();
        expect(screen.queryByTestId('large-cabin-bags')).not.toBeInTheDocument();
    });

    it('should not render shimmer while loading on other pages', () => {
        mockStores.appStore.isLoading = true;
        mockStores.layoutStore.isExtrasPage = false;
        render(<CabinBags {...mockProps} />);

        expect(screen.queryByTestId('shimmer')).not.toBeInTheDocument();
        expect(screen.getByTestId('large-cabin-bags')).toBeInTheDocument();
    });

    it('should render default', () => {
        render(<CabinBags {...mockProps} />);

        expect(screen.getByTestId('large-cabin-bags')).toBeInTheDocument();
        expect(screen.getByTestId('large-cabin-bags')).not.toHaveClass('internalFlightContainer');
        expect(screen.getByTestId('ancillaries')).toBeInTheDocument();
        expect(mockTokenizer.replaceToken).toHaveBeenCalledWith(
            mockProps.fields?.DefaultContent?.fields.Description.value,
            Tokens.Price,
            '23$',
        );
        expect(mockAncillaries).toHaveBeenCalledWith(
            expect.objectContaining({
                fields: processedFields,
                isCabinBags: true,
                params: mockAncillariesParams,
                Description: {
                    value: 'Get an extra 10kg cabin bag, and Speedy Boarding for just {price} per person, per flight 23$',
                },
                Subtitle: mockCabinBagsFields.DefaultContent?.fields.Subtitle,
            }),
        );

        expect(screen.queryAllByTestId('cabin-bags-route-info').length).toBe(2);
        expect(mockCabinBagsRouteInfo).toHaveBeenNthCalledWith(1, {
            numberOfBags: mockStores.guestDetailsStore.adultsAndChildrenNumber,
            fields: mockProps.fields,
            isOverheadShown: true,
        });
        expect(mockCabinBagsRouteInfo).toHaveBeenNthCalledWith(2, {
            numberOfBags: mockStores.guestDetailsStore.adultsAndChildrenNumber,
            fields: mockProps.fields,
            isOverheadShown: true,
        });

        expect(screen.getByTestId('cabin-bags-dropdown')).toBeInTheDocument();
        expect(mockCabinBagsDropdown).toHaveBeenCalledWith(
            expect.objectContaining({
                fields: mockCabinBagsFields,
            }),
        );

        expect(screen.getByTestId('cabin-bags-action-panel')).toBeInTheDocument();
        expect(mockCabinBagsActionPanel).toHaveBeenCalledWith({
            fields: mockCabinBagsFields,
        });

        expect(mockStores.bookingStore.extraLuggage.getLargeCabinBagsFormattedPrice).toHaveBeenCalled();
    });

    it('should NOT render CabinBagsDropdown AND CabinBagsActionPanel when isLCBAddingUnavailable = true', () => {
        mockStores.bookingStore.extraLuggage.isLCBAddingUnavailable = true;

        render(<CabinBags {...mockProps} />);

        expect(screen.getByTestId('large-cabin-bags')).toBeInTheDocument();
        expect(screen.getByTestId('ancillaries')).toBeInTheDocument();
        expect(mockAncillaries).toHaveBeenCalledWith(
            expect.objectContaining({
                fields: processedFields,
                isCabinBags: true,
                params: mockAncillariesParams,
                Subtitle: mockCabinBagsFields.UnavailableLCBContent?.fields.Subtitle,
                Description: mockCabinBagsFields.UnavailableLCBContent?.fields.Description,
            }),
        );

        expect(screen.queryByTestId('cabin-bags-dropdown')).not.toBeInTheDocument();
        expect(screen.queryByTestId('cabin-bags-action-panel')).not.toBeInTheDocument();
    });

    describe('Description on Trade Portal', () => {
        beforeEach(() => {
            mockStores.layoutStore.isTradePortal = true;
        });

        it('should use DescriptionWithoutPrice as Description when isPricesHidden=true', () => {
            mockStores.layoutStore.isPricesHidden = true;

            render(<CabinBags {...mockProps} />);

            expect(mockAncillaries).toHaveBeenCalledWith(
                expect.objectContaining({
                    fields: processedFields,
                    isCabinBags: true,
                    params: mockAncillariesParams,
                    Description: mockCabinBagsFields.DescriptionWithoutPrice,
                    Subtitle: mockCabinBagsFields.DefaultContent?.fields.Subtitle,
                }),
            );
        });

        it('should NOT use DescriptionWithoutPrice as Description when isPricesHidden=false', () => {
            mockStores.layoutStore.isPricesHidden = false;

            render(<CabinBags {...mockProps} />);

            expect(mockAncillaries).toHaveBeenCalledWith(
                expect.objectContaining({
                    fields: processedFields,
                    isCabinBags: true,
                    params: mockAncillariesParams,
                    Description: {
                        value: mockTokenizer.replaceToken(
                            mockProps.fields?.DefaultContent?.fields.Description.value,
                            Tokens.Price,
                            '23$',
                        ),
                    },
                    Subtitle: mockCabinBagsFields.DefaultContent?.fields.Subtitle,
                }),
            );
        });
    });

    describe('Post Booking Flow', () => {
        beforeEach(() => {
            mockStores.layoutStore.isPostBookingPages = true;
            mockStores.bookingStore.extraLuggage.isLCBAddingUnavailable = true;
        });

        it('should render CabinBagsDropdown AND apply styling', () => {
            render(<CabinBags {...mockProps} />);

            expect(screen.getByTestId('cabin-bags-dropdown')).toBeInTheDocument();
            expect(mockCabinBagsDropdown).toHaveBeenCalledWith(
                expect.objectContaining({
                    fields: mockCabinBagsFields,
                }),
            );
            expect(screen.getByTestId('large-cabin-bags')).toHaveClass('containerAlt');
            expect(screen.queryByTestId('cabin-bags-banners')).not.toBeInTheDocument();
        });

        it('should render CabinBagsBanners if seats reservation is possible', () => {
            mockStores.layoutStore.isViewBookingPage = true;
            mockStores.viewBookingStore.isSeatReservationPossible = true;

            render(<CabinBags {...mockProps} />);

            expect(screen.queryByTestId('cabin-bags-banners')).toBeInTheDocument();
            expect(mockCabinBagsBanners).toHaveBeenCalledWith({ fields: mockCabinBagsFields, hasPrice: true });
        });

        it('should NOT render CabinBagsBanners if seats reservation is not possible', () => {
            mockStores.layoutStore.isViewBookingPage = true;
            mockStores.viewBookingStore.isBookingOutOfSync = true;

            render(<CabinBags {...mockProps} />);

            expect(screen.queryByTestId('cabin-bags-banners')).not.toBeInTheDocument();
        });
    });

    describe('internal flight ', () => {
        it('should NOT render when it is luxury internal flight', () => {
            mockUseLuxuryInternalFlight.mockReturnValue(true);

            render(<CabinBags {...mockProps} />);

            expect(screen.queryByTestId('large-cabin-bags')).not.toBeInTheDocument();
            mockUseLuxuryInternalFlight.mockReturnValue(false);
        });

        it('should render as an internal flight component', () => {
            mockStores.bookingStore.isFlightExternal = false;
            mockStores.viewBookingStore.isFlightExternal = false;

            render(<CabinBags {...mockProps} />);

            expect(screen.getByTestId('large-cabin-bags')).toHaveClass('internalFlightContainer');
        });

        it('should render correctly when bookingStore.isFlightExternal is true', () => {
            mockStores.bookingStore.isFlightExternal = true;
            mockStores.viewBookingStore.isFlightExternal = false;

            render(<CabinBags {...mockProps} />);

            expect(screen.getByTestId('large-cabin-bags')).not.toHaveClass('internalFlightContainer');
        });

        it('should render correctly when viewBookingStore.isFlightExternal is true', () => {
            mockStores.bookingStore.isFlightExternal = false;
            mockStores.viewBookingStore.isFlightExternal = true;

            render(<CabinBags {...mockProps} />);

            expect(screen.getByTestId('large-cabin-bags')).not.toHaveClass('internalFlightContainer');
        });

        it('should render correctly when both stores.isFlightExternal are true', () => {
            mockStores.bookingStore.isFlightExternal = true;
            mockStores.viewBookingStore.isFlightExternal = true;

            render(<CabinBags {...mockProps} />);

            expect(screen.getByTestId('large-cabin-bags')).not.toHaveClass('internalFlightContainer');
        });

        it('should render correctly when both stores.isFlightExternal are false', () => {
            mockStores.bookingStore.isFlightExternal = false;
            mockStores.viewBookingStore.isFlightExternal = false;

            render(<CabinBags {...mockProps} />);

            expect(screen.getByTestId('large-cabin-bags')).toHaveClass('internalFlightContainer');
        });
    });

    describe('urgency message', () => {
        it('should clear cabin bags urgency message from sessionStorage when rendered', () => {
            render(<CabinBags {...mockProps} />);

            expect(mockRemoveWebStorageItem).toHaveBeenCalled();
        });
    });

    describe('Luxury Package', () => {
        beforeEach(() => {
            mockStores.bookingStore.isLuxuryPackage = true;
        });

        it('should NOT render action panel', () => {
            render(<CabinBags {...mockProps} />);

            expect(screen.getByTestId('large-cabin-bags')).toBeInTheDocument();
        });

        it('should render right subtitle and description', () => {
            render(<CabinBags {...mockProps} />);

            expect(mockAncillaries).toHaveBeenCalledWith(
                expect.objectContaining({
                    fields: processedFields,
                    isCabinBags: true,
                    params: mockAncillariesParams,
                    Subtitle: mockCabinBagsFields.LuxuryContent?.fields.Subtitle,
                    Description: mockCabinBagsFields.LuxuryContent?.fields.Description,
                }),
            );
        });
    });

    describe('Outline Banner', () => {
        it('should render OutlineBanner with Luxury theme when it is luxury package on extra page', () => {
            mockStores.layoutStore.isExtrasPage = true;
            mockStores.bookingStore.isLuxuryPackage = true;
            render(<CabinBags {...mockProps} />);

            expect(mockOutlineBannerContext).toHaveBeenCalledWith({
                value: {
                    theme: OutlineBannerTheme.LuxuryTheme,
                },
                children: expect.anything(),
            });

            expect(mockStores.bookingStore.extraLuggage.setLCBGreenPromoShown).toHaveBeenCalledWith(false);
        });

        it('should render OutlineBanner with PromoTheme', () => {
            mockStores.layoutStore.isExtrasPage = true;
            mockStores.bookingStore.extraLuggage.isLCBAddingUnavailable = false;
            mockStores.layoutStore.shouldPromoteBags = true;

            render(<CabinBags {...mockProps} />);

            expect(mockOutlineBannerContext).toHaveBeenCalledWith({
                value: {
                    theme: OutlineBannerTheme.PromoTheme,
                },
                children: expect.anything(),
            });

            expect(mockStores.bookingStore.extraLuggage.setLCBGreenPromoShown).toHaveBeenCalledWith(true);
        });

        it('should render OutlineBanner with no theme when it is not luxury and promo is disabled', () => {
            mockStores.layoutStore.isExtrasPage = true;
            mockStores.bookingStore.isLuxuryPackage = false;
            mockStores.layoutStore.shouldPromoteBags = false;

            render(<CabinBags {...mockProps} />);

            expect(mockOutlineBannerContext).toHaveBeenCalledWith({
                value: {
                    theme: OutlineBannerTheme.NoTheme,
                },
                children: expect.anything(),
            });

            expect(mockStores.bookingStore.extraLuggage.setLCBGreenPromoShown).toHaveBeenCalledWith(false);
        });
    });

    it('should render scroll anchor for navigation', () => {
        render(<CabinBags {...mockProps} />);

        const scrollAnchor = screen.getByTestId('cabin-bags-scroll-anchor');
        expect(scrollAnchor).toHaveAttribute('id', ScrollAnchorId.CabinBags);
        expect(scrollAnchor).toHaveAttribute('aria-hidden', 'true');
    });
});
