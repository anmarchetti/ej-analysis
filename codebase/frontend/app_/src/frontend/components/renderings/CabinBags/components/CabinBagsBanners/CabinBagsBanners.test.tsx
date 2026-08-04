import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockCabinBagsFields } from 'frontend/__mocks__/cabinBags';
import { EventLabels } from 'models/enum/tracking/GenericEventParams';

import CabinBagsBanners, { ICabinBagsBannersProps } from './CabinBagsBanners';

const createProps = (): ICabinBagsBannersProps => ({
    fields: mockCabinBagsFields,
    hasPrice: true,
});

const createStores = () => ({
    bookingStore: {
        isFlightExtrasFailed: false,
        isFlightExternal: true,
        extraLuggage: {
            isLCBFull: false,
            isLCBAlmostFull: false,
        },
        extraLuggageCategoriesExist: true,
        cabinBagsCategoriesExist: true,
        holdLuggage: {
            setHoldLuggagePopupOpened: jest.fn(p => p),
        },
    },
    layoutStore: {
        isCabinBagsEnabled: true,
        isExtraLuggageEnabled: true,
        isViewBookingPage: false,
    },
    trackingStore: {
        trackLCBBanners: jest.fn(),
    },
    viewBookingStore: {
        isBookingOutOfSync: false,
        isFlightExternal: false,
    },
});

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockInfoBlock = jest.fn();
jest.mock('frontend/components/common/InfoBlock/InfoBlock.tsx', () => ({
    __esModule: true,
    default: ({ onClick, ...restProps }) => {
        mockInfoBlock(restProps);

        return (
            <div data-tid={restProps.dataTid}>
                <button onClick={onClick} data-tid='info-block-button' />
            </div>
        );
    },
}));

describe('<CabinBagsBanners />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render nothing when cabin bags are available', () => {
        const { container } = render(<CabinBagsBanners {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('should render request failure banner', () => {
        it('when isFlightExtrasFailed is true', () => {
            mockStores.bookingStore.isFlightExtrasFailed = true;

            render(<CabinBagsBanners {...mockProps} />);

            expect(mockInfoBlock).toHaveBeenCalledWith({
                title: mockCabinBagsFields.RequestFailureBanner!.fields.Title,
                text: mockCabinBagsFields.RequestFailureBanner!.fields.Subtitle,
                withWarningIcon: true,
                dataTid: 'lcb-failure-banner',
                className: 'banner',
            });
            expect(screen.getByTestId('lcb-failure-banner')).toBeInTheDocument();
        });

        it('when cabinBagsCategoriesExist is false', () => {
            mockStores.bookingStore.cabinBagsCategoriesExist = false;

            render(<CabinBagsBanners {...mockProps} />);

            expect(mockInfoBlock).toHaveBeenCalledWith({
                title: mockCabinBagsFields.RequestFailureBanner!.fields.Title,
                text: mockCabinBagsFields.RequestFailureBanner!.fields.Subtitle,
                withWarningIcon: true,
                dataTid: 'lcb-failure-banner',
                className: 'banner',
            });
            expect(screen.getByTestId('lcb-failure-banner')).toBeInTheDocument();
        });

        it('when hasPrice is false', () => {
            mockProps.hasPrice = false;

            render(<CabinBagsBanners {...mockProps} />);

            expect(mockInfoBlock).toHaveBeenCalledWith({
                title: mockCabinBagsFields.RequestFailureBanner!.fields.Title,
                text: mockCabinBagsFields.RequestFailureBanner!.fields.Subtitle,
                withWarningIcon: true,
                dataTid: 'lcb-failure-banner',
                className: 'banner',
            });
            expect(screen.getByTestId('lcb-failure-banner')).toBeInTheDocument();
        });

        it('when isFlightExtrasFailed is true and RequestFailureBanner does not exists', () => {
            mockStores.bookingStore.isFlightExtrasFailed = true;
            mockProps.fields.RequestFailureBanner = undefined;

            render(<CabinBagsBanners {...mockProps} />);

            expect(mockInfoBlock).toHaveBeenCalledWith({
                title: undefined,
                text: undefined,
                withWarningIcon: true,
                dataTid: 'lcb-failure-banner',
                className: 'banner',
            });
            expect(screen.getByTestId('lcb-failure-banner')).toBeInTheDocument();
        });
    });

    describe('should render internal flight banner', () => {
        it('when isFlightExternal is false', () => {
            mockStores.bookingStore.isFlightExternal = false;

            render(<CabinBagsBanners {...mockProps} />);

            expect(mockInfoBlock).toHaveBeenCalledWith({
                title: mockCabinBagsFields.InternalFlightBanner!.fields.Title,
                text: mockCabinBagsFields.InternalFlightBanner!.fields.Subtitle,
                dataTid: 'lcb-internal-flight-banner',
                className: 'banner',
            });
            expect(screen.getByTestId('lcb-internal-flight-banner')).toBeInTheDocument();
        });

        it('when isFlightExternal is false AND InternalFlightBanner does NOT exists', () => {
            mockStores.bookingStore.isFlightExternal = false;
            mockProps.fields.InternalFlightBanner = undefined;

            render(<CabinBagsBanners {...mockProps} />);

            expect(mockInfoBlock).toHaveBeenCalledWith({
                title: undefined,
                text: undefined,
                dataTid: 'lcb-internal-flight-banner',
                className: 'banner',
            });
            expect(screen.getByTestId('lcb-internal-flight-banner')).toBeInTheDocument();
        });
    });

    describe('should render cabin bags unavailable banner when isCabinBagsEnabled == false', () => {
        beforeEach(() => {
            mockStores.layoutStore.isCabinBagsEnabled = false;
        });

        const { CabinBagsUnavailableContent, CabinBagsUnavailableCTAContent } = mockCabinBagsFields;

        it('with CTA when isExtraLuggageEnabled == true AND isFlightExtrasFailed == false', () => {
            render(<CabinBagsBanners {...mockProps} />);

            expect(screen.getByTestId('lcb-unavailable-banner-with-cta')).toBeInTheDocument();
            expect(mockInfoBlock).toHaveBeenCalledWith({
                title: CabinBagsUnavailableCTAContent?.fields.Title,
                text: CabinBagsUnavailableCTAContent?.fields.Subtitle,
                dataTid: 'lcb-unavailable-banner-with-cta',
                className: 'banner',
                btnLabel: CabinBagsUnavailableCTAContent?.fields.ButtonLabel,
            });
        });

        it('without CTA when cabinBagsCategoriesExist == false', () => {
            mockStores.bookingStore.cabinBagsCategoriesExist = false;

            render(<CabinBagsBanners {...mockProps} />);

            expect(screen.getByTestId('lcb-unavailable-banner')).toBeInTheDocument();
            expect(mockInfoBlock).toHaveBeenCalledWith({
                title: CabinBagsUnavailableContent?.fields.Title,
                text: CabinBagsUnavailableContent?.fields.Subtitle,
                dataTid: 'lcb-unavailable-banner',
                className: 'banner',
                btnLabel: undefined,
            });
        });

        it('without CTA when isFlightExtrasFailed == true', () => {
            mockStores.bookingStore.isFlightExtrasFailed = true;

            render(<CabinBagsBanners {...mockProps} />);

            expect(screen.getByTestId('lcb-unavailable-banner')).toBeInTheDocument();
            expect(mockInfoBlock).toHaveBeenCalledWith({
                title: CabinBagsUnavailableContent?.fields.Title,
                text: CabinBagsUnavailableContent?.fields.Subtitle,
                dataTid: 'lcb-unavailable-banner',
                className: 'banner',
                btnLabel: undefined,
            });
        });

        it('without CTA when isExtraLuggageEnabled == false', () => {
            mockStores.layoutStore.isExtraLuggageEnabled = false;

            render(<CabinBagsBanners {...mockProps} />);

            expect(screen.getByTestId('lcb-unavailable-banner')).toBeInTheDocument();
            expect(mockInfoBlock).toHaveBeenCalledWith({
                title: CabinBagsUnavailableContent?.fields.Title,
                text: CabinBagsUnavailableContent?.fields.Subtitle,
                dataTid: 'lcb-unavailable-banner',
                className: 'banner',
                btnLabel: undefined,
            });
        });

        it('should call setHoldLuggagePopupOpened with true on button click', async () => {
            render(<CabinBagsBanners {...mockProps} />);

            const button = screen.getByTestId('info-block-button');

            await userEvent.click(button);

            expect(mockStores.bookingStore.holdLuggage.setHoldLuggagePopupOpened).toHaveBeenCalledWith(true);
        });
    });

    describe('should render lcb full banners when isLCBFull == true', () => {
        beforeEach(() => {
            mockStores.bookingStore.extraLuggage.isLCBFull = true;
        });

        const { Title, Subtitle, ButtonLabel } = mockCabinBagsFields.CabinBagsFullWithHLBanner!.fields;

        it('with CabinBagsFullWithHLBanner props', () => {
            render(<CabinBagsBanners {...mockProps} />);

            expect(screen.getByTestId('lcb-full-banner')).toBeInTheDocument();
            expect(mockInfoBlock).toHaveBeenCalledWith({
                title: Title,
                text: Subtitle,
                dataTid: 'lcb-full-banner',
                btnLabel: ButtonLabel,
                className: 'banner',
            });
            expect(mockStores.trackingStore.trackLCBBanners).toHaveBeenCalledWith(EventLabels.CapacityFull);
        });

        it('AND CabinBagsFullWithHLBanner does NOT exists without title and description', () => {
            render(
                <CabinBagsBanners
                    {...mockProps}
                    fields={{ ...mockProps.fields, CabinBagsFullWithHLBanner: undefined }}
                />,
            );

            expect(mockInfoBlock).toHaveBeenCalledWith({
                title: undefined,
                text: undefined,
                btnLabel: undefined,
                dataTid: 'lcb-full-banner',
                className: 'banner',
            });
            expect(screen.getByTestId('lcb-full-banner')).toBeInTheDocument();
        });

        describe('AND isHoldLuggageEnabled == false', () => {
            beforeEach(() => {
                mockStores.layoutStore.isExtraLuggageEnabled = false;
            });

            it('with CabinBagsFullBanner props', () => {
                render(<CabinBagsBanners {...mockProps} />);

                expect(screen.getByTestId('lcb-full-banner')).toBeInTheDocument();
                expect(mockInfoBlock).toHaveBeenCalledWith({
                    title: mockCabinBagsFields.CabinBagsFullBanner!.fields.Title,
                    text: mockCabinBagsFields.CabinBagsFullBanner!.fields.Subtitle,
                    dataTid: 'lcb-full-banner',
                    className: 'banner',
                });
            });

            it('with isExtraLuggageEnabled == true and extraLuggageCategoriesExist == false', () => {
                mockStores.layoutStore.isExtraLuggageEnabled = true;
                mockStores.bookingStore.extraLuggageCategoriesExist = false;

                render(<CabinBagsBanners {...mockProps} />);

                expect(screen.getByTestId('lcb-full-banner')).toBeInTheDocument();
                expect(mockInfoBlock).toHaveBeenCalledWith({
                    title: mockCabinBagsFields.CabinBagsFullBanner!.fields.Title,
                    text: mockCabinBagsFields.CabinBagsFullBanner!.fields.Subtitle,
                    dataTid: 'lcb-full-banner',
                    className: 'banner',
                });
            });

            it('AND CabinBagsFullBanner does NOT exists without title and description', () => {
                render(
                    <CabinBagsBanners
                        {...mockProps}
                        fields={{ ...mockProps.fields, CabinBagsFullBanner: undefined }}
                    />,
                );

                expect(mockInfoBlock).toHaveBeenCalledWith({
                    title: undefined,
                    text: undefined,
                    dataTid: 'lcb-full-banner',
                    className: 'banner',
                });
                expect(screen.getByTestId('lcb-full-banner')).toBeInTheDocument();
            });
        });

        it('should call setHoldLuggagePopupOpened with true on button click', async () => {
            render(<CabinBagsBanners {...mockProps} />);

            const button = screen.getByTestId('info-block-button');

            await userEvent.click(button);

            expect(mockStores.bookingStore.holdLuggage.setHoldLuggagePopupOpened).toHaveBeenCalledWith(true);
            expect(mockStores.trackingStore.trackLCBBanners).toHaveBeenCalledWith(EventLabels.CapacityFullClick);
        });
    });

    it('should render lcb almost full banners when isLCBAlmostFull is true', () => {
        mockStores.bookingStore.extraLuggage.isLCBAlmostFull = true;

        render(<CabinBagsBanners {...mockProps} />);

        expect(screen.getByTestId('lcb-almost-full-banner')).toBeInTheDocument();
        expect(mockInfoBlock).toHaveBeenCalledWith({
            title: mockCabinBagsFields.CabinBagsAlmostFullBanner!.fields.Title,
            text: mockCabinBagsFields.CabinBagsAlmostFullBanner!.fields.Subtitle,
            dataTid: 'lcb-almost-full-banner',
            className: 'banner',
        });
        expect(mockStores.trackingStore.trackLCBBanners).toHaveBeenCalledWith(EventLabels.PartialCapacityFull);
    });

    it('should display lcb unavailable banner on view booking page', () => {
        mockStores.layoutStore.isViewBookingPage = true;

        render(<CabinBagsBanners {...mockProps} />);
        expect(screen.getByTestId('lcb-unavailable-banner-view-booking')).toBeInTheDocument();
        expect(mockInfoBlock).toHaveBeenCalledWith({
            title: mockCabinBagsFields.UnavailablePostBookContent!.fields.Title,
            text: mockCabinBagsFields.UnavailablePostBookContent!.fields.Subtitle,
            link: mockCabinBagsFields.UnavailablePostBookContent!.fields.Link,
            dataTid: 'lcb-unavailable-banner-view-booking',
            className: 'banner postFlow',
            textClass: 'postFlowTextClass',
            btnClass: 'postFlowButtonClass',
        });
    });

    it('should display out of sync banner when isBookingOutOfSync === true AND isFlightExternalViewBookingStore === true', () => {
        mockStores.viewBookingStore.isBookingOutOfSync = true;
        mockStores.viewBookingStore.isFlightExternal = true;

        render(<CabinBagsBanners {...mockProps} />);
        expect(screen.getByTestId('lcb-out-of-sync-banner')).toBeInTheDocument();
        expect(mockInfoBlock).toHaveBeenCalledWith({
            title: mockCabinBagsFields.OutOfSyncBanner!.fields.Title,
            text: mockCabinBagsFields.OutOfSyncBanner!.fields.Subtitle,
            link: mockCabinBagsFields.OutOfSyncBanner!.fields.Link,
            dataTid: 'lcb-out-of-sync-banner',
            className: 'banner postFlow',
            btnClass: 'postFlowOOSButtonClass',
        });
    });
});
