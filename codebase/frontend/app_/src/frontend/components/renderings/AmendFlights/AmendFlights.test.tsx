import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores, mockAmendPaymentInfo, mockFlightsRoutes, mockValidatedFlights } from 'frontend/__mocks__';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import { IAmendTransport } from 'models/data/IAmendBookingFlights';
import { DataStatus } from 'models/enum/DataStatus';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import AmendFlights from 'frontend/components/renderings/AmendFlights/AmendFlights';

expect.extend(toHaveNoViolations);

jest.mock('frontend/components/common/Link', () => ({ href, children }) => <a href={href}>{children}</a>);

const priceTooltipText = 'Price is subject to change.';
const priceTooltipPromoSeatsText = 'Promo can not be applied to seats.';

const createProps = () => ({
    fields: {
        Title: { value: 'title' },
        AlternativeFlightsTitle: { value: 'title2' },
        FiltersOrder: [],
        TimeFilters: [],
        SortDefault: {},
        SortOrder: [],
        SignpostTitle: { value: 'SignpostTitle' },
        SignpostText: { value: 'SignpostText' },
        PriceTooltipText: { value: priceTooltipText },
        PriceTooltipPromoSeatsText: { value: priceTooltipPromoSeatsText },
    },
    rendering: 'rendering',
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockPlaceholderProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: props => {
        mockPlaceholderProps(props);

        return <div data-tid={props.name}>{props.children}</div>;
    },
    Text: ({ field }) => <h2>{field.value}</h2>,
}));

const mockCardProps = jest.fn();
jest.mock('frontend/components/renderings/AmendFlights/components/AmendFlightCard/AmendFlightCard', () => props => {
    mockCardProps(props);

    return <div data-tid='card' />;
});

let mockIsFlightSelectedProp;
const mockAmendAlternativeFlightsProps = jest.fn();
jest.mock(
    'frontend/components/renderings/AmendFlights/components/AmendAlternativeFlights/AmendAlternativeFlights',
    () => ({
        __esModule: true,
        default: props => {
            mockAmendAlternativeFlightsProps(props);
            mockIsFlightSelectedProp = props.isFlightSelected(mockValidatedFlights.transports[0]);

            return (
                <div data-tid='alternative'>
                    {/*Aria-label here only to pass accessibility test*/}
                    <button
                        data-tid='change-flight'
                        onClick={() =>
                            props.onChangeFlight({
                                routes: mockFlightsRoutes,
                                amendmentPaymentInfo: mockAmendPaymentInfo,
                            })
                        }
                        aria-label='change-flight'
                    />
                    <div>{props.priceTooltipText}</div>
                </div>
            );
        },
    }),
);

jest.mock('frontend/components/renderings/AmendFlights/components/SeatDropOffPopup/SeatsDropOffPopup', () => ({
    __esModule: true,
    SeatDropOffPopup: ({ onClose, onContinue }) => (
        <div data-tid='seat-drop-popup'>
            <button data-tid='close-button' onClick={onClose} />
            <button data-tid='continue-button' onClick={onContinue} />
        </div>
    ),
}));

jest.mock('frontend/components/renderings/AmendmentBasket/components/FlightsBasket/FlightsBasket', () => ({
    __esModule: true,
    default: () => <div data-tid='flights-basket' />,
}));

jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    ...jest.requireActual('frontend/hooks/useMediaQuery'),
    useMobileViewport: jest.fn(() => false),
}));

describe('<AmendFlights />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            amendFlightsStore: {
                alternativeFlights: [1, 2, 3],
                numberOfShownFlights: 1,
                selectedFlight: mockValidatedFlights.transports[0] as Nullable<IAmendTransport>,
                prevSelectedFlight: {
                    ...mockValidatedFlights.transports[0],
                    amendmentCharges: 90,
                    routes: mockFlightsRoutes,
                },
                bookingRoutes: {},
                status: DataStatus.Loading,
                errataFlightInfo: {},
                initAmendFlightsPage: jest.fn(),
                changeSelectedFlight: jest.fn(),
                changePrevSelectedFlight: jest.fn(),
                resetSelectedFlight: jest.fn(),
                loadMoreAlternativeFlightsWithLivePrice: jest.fn(),
                alternativeOffers: [1, 2, 3, 5],
                setIsSeatDropPopupWasShown: jest.fn(),
                setShowSeatDropPopup: jest.fn(),
                showSeatDropPopup: false,
                haveSelectedSeats: false,
                submitFlightChangeSelection: jest.fn(),
                backLink: '/booking/my_bookings',
                cancelFlightsValidation: jest.fn(),
                hideUnavailablePopup: jest.fn(),
            },
            trackingStore: { trackFlightAmendment: jest.fn() },
            layoutStore: {
                isPageHasTemplateId: jest.fn(),
            },
        });
    });

    it('Should render AmendAlternativeFlights with right props', () => {
        render(<AmendFlights {...mockProps} />);

        expect(mockAmendAlternativeFlightsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                rendering: 'rendering',
                status: 'Loading',
                title: 'title2',
                isFlightSelected: expect.any(Function),
                onChangeFlight: expect.any(Function),
                onLoadMoreClick: expect.any(Function),
                fields: mockProps.fields,
                flights: [1, 2, 3],
                priceTooltipText: expect.anything(),
            }),
        );
    });

    describe('Render selected flight', () => {
        it('Should isSelected be true', () => {
            render(<AmendFlights {...mockProps} />);

            expect(mockIsFlightSelectedProp).toBe(true);
        });

        it('Should isSelected be false when no selectedFlight', () => {
            mockStores.amendFlightsStore.selectedFlight = null;
            render(<AmendFlights {...mockProps} />);

            expect(mockIsFlightSelectedProp).toBe(false);
        });

        it('Should isSelected be false when no selectedFlight', () => {
            mockStores.amendFlightsStore.selectedFlight = null;
            render(<AmendFlights {...mockProps} />);

            expect(mockIsFlightSelectedProp).toBe(false);
        });
    });

    it('Should NOT be rendered when no fields', () => {
        mockProps.fields = null;
        const { container } = render(<AmendFlights {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('unmount behaviour', () => {
        mockStores.layoutStore.isPageHasTemplateId = jest.fn().mockReturnValue(false);

        const { unmount } = render(<AmendFlights {...mockProps} />);
        unmount();

        expect(mockStores.amendFlightsStore.resetSelectedFlight).toHaveBeenCalledTimes(1);
        expect(mockStores.amendFlightsStore.changePrevSelectedFlight).toHaveBeenCalledWith(null);
        expect(mockStores.amendFlightsStore.cancelFlightsValidation).toHaveBeenCalledTimes(1);
    });

    it('unmount behaviour on AmendFlights page', () => {
        mockStores.layoutStore.isPageHasTemplateId = jest.fn().mockReturnValue(true);

        const { unmount } = render(<AmendFlights {...mockProps} />);
        unmount();

        expect(mockStores.amendFlightsStore.resetSelectedFlight).not.toHaveBeenCalled();
        expect(mockStores.amendFlightsStore.changePrevSelectedFlight).not.toHaveBeenCalled();
        expect(mockStores.amendFlightsStore.cancelFlightsValidation).not.toHaveBeenCalled();
    });

    it('should render price jump popup placeholder', () => {
        render(<AmendFlights {...mockProps} />);

        expect(screen.getByTestId(PlaceholderNames.PriceJumpPopup)).toBeInTheDocument();
        expect(mockPlaceholderProps).toHaveBeenCalledWith({
            name: PlaceholderNames.PriceJumpPopup,
            rendering: 'rendering',
        });
    });

    it('should render title', () => {
        const { getByRole } = render(<AmendFlights {...mockProps} />);

        expect(getByRole('heading')).toHaveTextContent('title');
    });

    it('should NOT render title', () => {
        mockProps.fields.Title = null;
        const { queryByRole } = render(<AmendFlights {...mockProps} />);

        expect(queryByRole('heading')).not.toBeInTheDocument();
    });

    describe('Default flight card', () => {
        it('should render overlay spinner', () => {
            mockStores.viewBookingStore.isLoadingBookingFromPayload = true;
            const { getByText } = render(<AmendFlights {...mockProps} />);

            expect(getByText(SitecoreDictionary.GlobalsLabelsValidatingPackage)).toBeInTheDocument();
        });

        it('should render card, alternative flights, link and button', () => {
            mockStores.amendFlightsStore.status = DataStatus.Loaded;
            render(<AmendFlights {...mockProps} />);

            expect(screen.getByTestId('card')).toBeInTheDocument();
            expect(mockCardProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    csMask: true,
                    routes: {},
                    isSelected: false,
                    errataFlightInfo: {},
                    cardClassName: 'yourFlightsCard',
                    priceDifference: -226,
                    currency: undefined,
                }),
            );
            expect(screen.getByTestId('alternative')).toBeInTheDocument();
            expect(screen.getByRole('link')).toHaveTextContent(SitecoreDictionary.AmendBookingButtonsGoBackNoChanges);
            expect(screen.getByRole('button', { name: SitecoreDictionary.GlobalsButtonsContinue })).toBeInTheDocument();
            expect(screen.queryByText('AmendBooking.Buttons.GoBackNoChanges')).toBeInTheDocument();
        });

        it('Should render card when load more in process', () => {
            mockStores.amendFlightsStore.status = DataStatus.LoadingMore;
            render(<AmendFlights {...mockProps} />);

            expect(screen.getByTestId('card')).toBeInTheDocument();
        });
    });

    it('should render error after button click and if no selected flight', () => {
        // @ts-ignore
        mockStores.amendFlightsStore.selectedFlight = null;
        render(<AmendFlights {...mockProps} />);

        const button = screen.getByRole('button', { name: SitecoreDictionary.GlobalsButtonsContinue });
        fireEvent.click(button);

        expect(screen.getByText(SitecoreDictionary.AmendFlightsErrorsSelectFlightToContinue)).toBeInTheDocument();
    });

    it('Clicking seat drop off popup continue button should call submitFlightChangeSelection', () => {
        mockStores.amendFlightsStore.showSeatDropPopup = true;

        render(<AmendFlights {...mockProps} />);

        const button = screen.getByTestId('continue-button');
        fireEvent.click(button);

        expect(mockStores.amendFlightsStore.submitFlightChangeSelection).toHaveBeenCalledTimes(1);
    });

    it('Clicking seat drop off popup close button should call setShowSeatDropPopup', () => {
        mockStores.amendFlightsStore.showSeatDropPopup = true;

        render(<AmendFlights {...mockProps} />);

        const button = screen.getByTestId('close-button');
        fireEvent.click(button);

        expect(mockStores.amendFlightsStore.setShowSeatDropPopup).toHaveBeenCalledWith(false);
    });

    it('Clicking continue button should call submitFlightChangeSelection', () => {
        render(<AmendFlights {...mockProps} />);

        const button = screen.getAllByRole('button', { name: SitecoreDictionary.GlobalsButtonsContinue })[0];
        fireEvent.click(button);

        expect(mockStores.amendFlightsStore.submitFlightChangeSelection).toHaveBeenCalledTimes(1);
    });

    it('Should render Alert Banner when haveSelectedSeats is true and fields are present', () => {
        mockStores.amendFlightsStore.haveSelectedSeats = true;

        render(<AmendFlights {...mockProps} />);

        expect(screen.getByText('SignpostTitle')).toBeInTheDocument();
        expect(screen.getByText('SignpostText')).toBeInTheDocument();
    });

    it('Should not render Alert Banner when haveSelectedSeats if false', () => {
        render(<AmendFlights {...mockProps} />);

        expect(screen.queryByText('SignpostTitle')).not.toBeInTheDocument();
        expect(screen.queryByText('SignpostText')).not.toBeInTheDocument();
    });

    it('Should not render InfoBlock when haveSelectedSeats is false', () => {
        render(<AmendFlights {...mockProps} />);

        expect(screen.queryByText('SignpostTitle')).not.toBeInTheDocument();
        expect(screen.queryByText('SignpostText')).not.toBeInTheDocument();
    });

    it('Should render InfoBlock when haveSelectedSeats is true and isScreenMedium is true', () => {
        mockStores.amendFlightsStore.haveSelectedSeats = true;
        mockStores.appStore.isScreenMedium = true;

        render(<AmendFlights {...mockProps} />);

        expect(screen.getByText('SignpostTitle')).toBeInTheDocument();
        expect(screen.getByText('SignpostText')).toBeInTheDocument();
    });

    it('Clicking change flight should call changeSelectedFlight and changePrevSelectedFlight and trackFlightAmendment', () => {
        render(<AmendFlights {...mockProps} />);

        const button = screen.getByTestId('change-flight');
        fireEvent.click(button);

        expect(mockStores.amendFlightsStore.changeSelectedFlight).toHaveBeenCalled();
        expect(mockStores.amendFlightsStore.changePrevSelectedFlight).toHaveBeenCalledWith(null);
        expect(mockStores.trackingStore.trackFlightAmendment).toHaveBeenCalledWith(
            EventTypes.PostBookingChangeFlightsSelect,
            mockFlightsRoutes,
            {},
            mockAmendPaymentInfo,
        );
    });

    it('Should NOT show that promocode is can not be applied to seats', () => {
        mockStores.layoutStore.getSetting = () => true;
        render(<AmendFlights {...mockProps} />);
        expect(screen.queryByText(priceTooltipText)).toBeInTheDocument();
        expect(screen.queryByText(priceTooltipPromoSeatsText)).not.toBeInTheDocument();
    });

    it('Should NOT show that promocode is can not be applied to seats if no promocode', () => {
        mockStores.layoutStore.getSetting = () => false;
        mockStores.viewBookingStore.booking.discountCode = undefined;

        render(<AmendFlights {...mockProps} />);
        expect(screen.queryByText(priceTooltipText)).toBeInTheDocument();
        expect(screen.queryByText(priceTooltipPromoSeatsText)).not.toBeInTheDocument();
    });

    it('show that promocode is can not be applied to seats', () => {
        mockStores.layoutStore.getSetting = () => false;
        mockStores.viewBookingStore.booking.discountCode = '1234';
        render(<AmendFlights {...mockProps} />);
        expect(screen.queryByText(priceTooltipText, { exact: false })).toBeInTheDocument();
        expect(screen.queryByText(priceTooltipPromoSeatsText, { exact: false })).toBeInTheDocument();
    });

    it('go back link should have href', () => {
        render(<AmendFlights {...mockProps} />);

        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', '/booking/my_bookings');
    });

    it('should render product unavailable popup when isPrevSelectedFlightUnavailable is true', () => {
        mockStores.amendFlightsStore.isPrevSelectedFlightUnavailable = true;
        render(<AmendFlights {...mockProps} />);

        expect(mockPlaceholderProps).toHaveBeenNthCalledWith(2, {
            name: PlaceholderNames.ProductUnavailablePopup,
            onClose: mockStores.amendFlightsStore.hideUnavailablePopup,
            rendering: 'rendering',
        });
    });

    it('Should NOT render continue and "go back" buttons on mobile viewport', () => {
        jest.mocked(useMobileViewport).mockReturnValueOnce(true);
        render(<AmendFlights {...mockProps} />);

        expect(
            screen.queryByRole('button', { name: SitecoreDictionary.GlobalsButtonsContinue }),
        ).not.toBeInTheDocument();
        expect(screen.queryByText('AmendBooking.Buttons.GoBackNoChanges')).not.toBeInTheDocument();
    });

    describe('MobileBasket', () => {
        it('Should render MobileBasket when isMobile', () => {
            jest.mocked(useMobileViewport).mockReturnValueOnce(true);
            render(<AmendFlights {...mockProps} />);

            expect(screen.getByTestId(PlaceholderNames.MobileBasket)).toBeInTheDocument();
            expect(mockPlaceholderProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: PlaceholderNames.MobileBasket,
                    rendering: 'rendering',
                    handleSubmit: mockStores.amendFlightsStore.submitFlightChangeSelection,
                    hasOptionSelected: true,
                    price: 226,
                    applyNegativeMargin: true,
                    backLink: mockStores.amendFlightsStore.backLink,
                }),
            );
            expect(screen.getByTestId('flights-basket')).toBeInTheDocument();
        });

        it('Should render MobileBasket when isMobile with rounded positive price', () => {
            mockStores.amendFlightsStore.selectedFlight.amendmentCharges = 226.1;
            jest.mocked(useMobileViewport).mockReturnValueOnce(true);
            render(<AmendFlights {...mockProps} />);

            expect(screen.getByTestId(PlaceholderNames.MobileBasket)).toBeInTheDocument();
            expect(mockPlaceholderProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    price: 227,
                }),
            );
        });

        it('Should render MobileBasket when isMobile with rounded negative price', () => {
            mockStores.amendFlightsStore.selectedFlight.amendmentCharges = -226.1;
            jest.mocked(useMobileViewport).mockReturnValueOnce(true);
            render(<AmendFlights {...mockProps} />);

            expect(screen.getByTestId(PlaceholderNames.MobileBasket)).toBeInTheDocument();
            expect(mockPlaceholderProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    price: -226,
                }),
            );
        });

        it('Should NOT render MobileBasket when isMobile is false', () => {
            render(<AmendFlights {...mockProps} />);

            expect(screen.queryByTestId(PlaceholderNames.MobileBasket)).not.toBeInTheDocument();
            expect(screen.queryByTestId('flights-basket')).not.toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<AmendFlights {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });

        it('should render aria-label', () => {
            render(<AmendFlights {...mockProps} />);

            expect(screen.getByTestId('selected-flight')).toHaveAttribute('aria-label', 'title');
        });
    });
});
