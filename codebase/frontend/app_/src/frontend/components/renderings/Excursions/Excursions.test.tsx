import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { Tokens } from 'code/tokens';
import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { mockReplaceToken } from 'frontend/__mocks__/utils/tokenizer';
import excursionsService from 'frontend/services/excursions.service';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions } from 'models/enum/tracking/GenericEventParams';

import { getMockedExcursionsResponse } from './__mocks__/excursion';
import Excursions, { IExcursionsProps } from './Excursions';
import * as utils from './Excursions.utils';

jest.mock('react-intersection-observer', () => ({
    ...jest.requireActual('react-intersection-observer'),
    useInView: jest.fn(() => mockUseInView),
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/services/excursions.service', () => ({
    getExcursionsForDestination: jest.fn(() => mockedExcursionsResponse),
}));

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

const mockExcursionCarousel = jest.fn();

jest.mock('frontend/components/renderings/Excursions/components/ExcursionCarousel/ExcursionCarousel', () => ({
    __esModule: true,
    default: props => {
        mockExcursionCarousel(props);

        return <div data-tid='excursion-carousel' />;
    },
}));

jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    Tokenizer: {
        replaceToken: mockReplaceToken,
    },
}));

const mockUseInView = { inView: true };
const mockedExcursionsResponse = getMockedExcursionsResponse();
const expectedQueryString = 'utm_source=UK-en-GB-Booking-Confirmation-Page&utm_campaign=layoutname&utm_medium=web';

const createProps = (): IExcursionsProps => ({
    fields: {
        Title: mockSitecoreField('Title'),
        PoweredBy: mockSitecoreField('PoweredBy'),
        SeeMoreMobile: mockSitecoreField('SeeMoreMobile'),
        SeeMoreDesktop: mockSitecoreField('SeeMoreDesktop'),
        Logo: mockSitecoreField(mockSitecoreImageField('Logo')),
        Description: mockSitecoreField('Description'),
        FreeCancellation: mockSitecoreField('FreeCancellation'),
        LikelyToSellOut: mockSitecoreField('LikelyToSellOut'),
    },
    params: { isLeftAligned: false, isPrimaryCTA: false },
    rendering: {},
    location: 'test location',
    startDate: '1',
    endDate: '2',
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            isExcursionsEnabled: true,
            descriptionMaxLines: 5,
            destinationCode: 'test',
            isCountryBrowsePage: true,
            isRegionBrowsePage: false,
            isResortBrowsePage: false,
            isConfirmationPage: true,
            isViewBookingPage: false,
            isRegionCityBrowsePage: false,
            destinationParents: [],
            layoutName: 'layoutName',
            lang: 'en',
            displayName: 'Spain',
        },
        trackingStore: {
            trackExcursionsAction: jest.fn(),
        },
        bookingStore: {
            booking: {
                marketCode: 'UK',
            },
        },
        viewBookingStore: {
            booking: {},
        },
        marketStore: {
            marketCode: 'CH',
        },
    });

let props;
let mockStores;

describe('<Excursions />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
        mockUseInView.inView = true;
        window.open = jest.fn();
        mockUseMobileViewport = false;
    });

    describe('getExcursionsForDestination', () => {
        it('should NOT render and fetch excursions when the module is disabled', async () => {
            mockStores.layoutStore.isExcursionsEnabled = false;

            const { container } = render(<Excursions {...props} />);

            await waitFor(() => {
                expect(container).toBeEmptyDOMElement();
                expect(excursionsService.getExcursionsForDestination).not.toHaveBeenCalled();
            });
        });

        it('should NOT fetch excursions when there is no location and destination code', async () => {
            props.location = '';
            mockStores.layoutStore.destinationCode = '';
            mockStores.viewBookingStore.booking = null;

            const { container } = render(<Excursions {...props} />);

            await waitFor(() => {
                expect(container).toBeEmptyDOMElement();
                expect(excursionsService.getExcursionsForDestination).not.toHaveBeenCalled();
            });
        });

        it('should NOT be rendered when it has no fields', async () => {
            props.fields = undefined;

            const { container } = render(<Excursions {...props} />);

            await waitFor(() => expect(container).toBeEmptyDOMElement());
        });

        it('should call getExcursionsForDestination on init with the correct args', async () => {
            await act(async () => {
                render(<Excursions {...props} />);
            });

            expect(excursionsService.getExcursionsForDestination).toHaveBeenCalledWith(
                mockStores.layoutStore.destinationCode,
                mockStores.bookingStore.booking.marketCode,
                props.startDate,
                props.endDate,
            );
        });

        it('should call getExcursionsForDestination with website lang when there is no booking (promo pages)', async () => {
            mockStores.layoutStore.isConfirmationPage = false;
            mockStores.layoutStore.isViewBookingPage = false;
            props.startDate = undefined;
            props.endDate = undefined;
            await act(async () => {
                render(<Excursions {...props} />);
            });

            expect(excursionsService.getExcursionsForDestination).toHaveBeenCalledWith(
                mockStores.layoutStore.destinationCode,
                mockStores.marketStore.marketCode,
                '',
                '',
            );
        });

        it('should call getExcursionsForDestination with location prop when destinationCode is not defined', async () => {
            mockStores.layoutStore.destinationCode = undefined;
            await act(async () => {
                render(<Excursions {...props} />);
            });

            expect(excursionsService.getExcursionsForDestination).toHaveBeenCalledWith(
                props.location,
                mockStores.bookingStore.booking.marketCode,
                props.startDate,
                props.endDate,
            );
        });

        it('should call getExcursionsForDestination on init with the correct args for viewBookingStatusPage', async () => {
            const mockedViewBookingStatusPageResponse = {
                isViewBookingStatusPage: true,
                viewBookingStatusPageLocation: 'EWB',
                viewBookingStatusPageBookingStartDate: '2024-12-10',
                viewBookingStatusPageBookingEndDate: '2024-12-15',
            };

            jest.spyOn(utils, 'getViewBookingStatusPageData').mockReturnValue(mockedViewBookingStatusPageResponse);

            props.location = '';
            props.startDate = '';
            props.endDate = '';
            mockStores.layoutStore.isCountryBrowsePage = false;
            mockStores.layoutStore.isConfirmationPage = false;
            mockStores.layoutStore.isViewBookingPage = true;
            mockStores.viewBookingStore.booking = mockBooking;

            render(<Excursions {...props} />);

            expect(utils.getViewBookingStatusPageData).toHaveBeenCalledWith(
                mockStores.viewBookingStore.booking,
                false,
                false,
                false,
            );

            expect(excursionsService.getExcursionsForDestination).toHaveBeenCalledWith(
                mockedViewBookingStatusPageResponse.viewBookingStatusPageLocation,
                mockBooking.marketCode,
                mockedViewBookingStatusPageResponse.viewBookingStatusPageBookingStartDate,
                mockedViewBookingStatusPageResponse.viewBookingStatusPageBookingEndDate,
            );
        });
    });

    it('should NOT render when no fields', async () => {
        props.fields = undefined;
        const { container } = render(<Excursions {...props} />);

        await waitFor(() => expect(container).toBeEmptyDOMElement());
    });

    describe('getExcursionLinkAndExcursionsWithUtmTagging', () => {
        const spy = jest.spyOn(utils, 'getExcursionLinkAndExcursionsWithUtmTagging');

        it('should call with the correct args when isCountryBrowsePage is true', async () => {
            const { container } = render(<Excursions {...props} />);

            await waitFor(() => expect(container).not.toBeEmptyDOMElement());

            expect(spy).toHaveBeenCalledWith(
                mockedExcursionsResponse,
                true,
                true,
                false,
                mockStores.bookingStore.booking,
                {},
                mockStores.layoutStore.lang,
                mockStores.layoutStore.destinationParents,
                mockStores.layoutStore.layoutName,
            );
        });

        it('should call with the correct args when isRegionBrowsePage is true', async () => {
            mockStores.layoutStore.isCountryBrowsePage = false;
            mockStores.layoutStore.isRegionBrowsePage = true;
            const { container } = render(<Excursions {...props} />);

            await waitFor(() => expect(container).not.toBeEmptyDOMElement());

            expect(spy).toHaveBeenCalledWith(
                mockedExcursionsResponse,
                true,
                true,
                false,
                mockStores.bookingStore.booking,
                mockStores.viewBookingStore.booking,
                mockStores.layoutStore.lang,
                mockStores.layoutStore.destinationParents,
                mockStores.layoutStore.layoutName,
            );
        });

        it('should call with the correct args when isResortBrowsePage is true', async () => {
            mockStores.layoutStore.isCountryBrowsePage = false;
            mockStores.layoutStore.isResortBrowsePage = true;
            const { container } = render(<Excursions {...props} />);

            await waitFor(() => expect(container).not.toBeEmptyDOMElement());

            expect(spy).toHaveBeenCalledWith(
                mockedExcursionsResponse,
                true,
                true,
                false,
                mockStores.bookingStore.booking,
                mockStores.viewBookingStore.booking,
                mockStores.layoutStore.lang,
                mockStores.layoutStore.destinationParents,
                mockStores.layoutStore.layoutName,
            );
        });

        it('should call with the correct args when isRegionCityBrowsePage is true', async () => {
            mockStores.layoutStore.isCountryBrowsePage = false;
            mockStores.layoutStore.isRegionCityBrowsePage = true;
            const { container } = render(<Excursions {...props} />);

            await waitFor(() => expect(container).not.toBeEmptyDOMElement());

            expect(spy).toHaveBeenCalledWith(
                mockedExcursionsResponse,
                true,
                true,
                false,
                mockStores.bookingStore.booking,
                mockStores.viewBookingStore.booking,
                mockStores.layoutStore.lang,
                mockStores.layoutStore.destinationParents,
                mockStores.layoutStore.layoutName,
            );
        });

        it('should call with the correct args when isCountryBrowsePage, isRegionBrowsePage, isResortBrowsePage, isRegionCityBrowsePage are false', async () => {
            mockStores.layoutStore.isCountryBrowsePage = false;
            const { container } = render(<Excursions {...props} />);

            await waitFor(() => expect(container).not.toBeEmptyDOMElement());

            expect(spy).toHaveBeenCalledWith(
                mockedExcursionsResponse,
                false,
                true,
                false,
                mockStores.bookingStore.booking,
                mockStores.viewBookingStore.booking,
                mockStores.layoutStore.lang,
                mockStores.layoutStore.destinationParents,
                mockStores.layoutStore.layoutName,
            );
        });

        it('should call ExcursionCarousel with correct props', async () => {
            jest.spyOn(utils, 'getExcursionLinkAndExcursionsWithUtmTagging').mockReturnValueOnce({
                excursionsLink: 'excursionsLink',
                excursions: mockedExcursionsResponse.excursions,
                utmValue: 'utmValue',
            });

            await act(async () => {
                render(<Excursions {...props} />);
            });

            expect(mockExcursionCarousel).toHaveBeenCalledWith(
                expect.objectContaining({
                    fields: props.fields,
                    params: props.params,
                    excursions: mockedExcursionsResponse.excursions,
                }),
            );
        });
    });

    it('should display button link when leftAligned true and isMobile false', async () => {
        props.params.isLeftAligned = true;
        const { getByRole } = render(<Excursions {...props} />);

        await waitFor(() => expect(getByRole('link', { name: props.fields.SeeMoreDesktop.value })).toBeInTheDocument());
    });

    it('should display button link when isMobile true', async () => {
        mockUseMobileViewport = true;
        const { getByRole } = render(<Excursions {...props} />);

        await waitFor(() => expect(getByRole('link', { name: props.fields.SeeMoreMobile.value })).toBeInTheDocument());
    });

    it('should display title, desktop link and logo block', async () => {
        render(<Excursions {...props} />);

        const btn = await screen.findByTestId('excursions-btn-see-more');

        expect(btn).toHaveTextContent(props.fields.SeeMoreDesktop.value);
        expect(screen.getByTestId('excursions-title')).toHaveTextContent('Title Spain');
        expect(screen.getByTestId('excursions-logo-image')).toHaveAttribute('src', props.fields.Logo.value.src);
        expect(screen.getByTestId('excursions-logo-text')).toHaveTextContent(props.fields.PoweredBy.value);

        fireEvent.click(btn);

        expect(window.open).toHaveBeenCalledWith(`${mockedExcursionsResponse.excursionsLink}?${expectedQueryString}`);
    });

    it('should call tokenizer with correct country from current route when isConfirmationPage is false', async () => {
        mockStores.layoutStore.isConfirmationPage = false;

        render(<Excursions {...props} />);

        await waitFor(() =>
            expect(mockReplaceToken).toHaveBeenCalledWith(props.fields.Description.value, Tokens.Country, 'Spain'),
        );
    });

    it('should call tokenizer with correct country from booking', async () => {
        mockStores.bookingStore.booking = mockBooking;
        render(<Excursions {...props} />);

        await waitFor(() =>
            expect(mockReplaceToken).toHaveBeenCalledWith(
                props.fields.Description.value,
                Tokens.Country,
                mockBooking?.hotel?.country?.name,
            ),
        );
    });

    it('should push to datatalayer on clicking on the desktop link', async () => {
        const { findByTestId } = render(<Excursions {...props} />);

        const btn = await findByTestId('excursions-btn-see-more');

        fireEvent.click(btn);

        expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
            EventTypes.ViewAllExcursions,
            {
                name: props.fields.SeeMoreDesktop.value,
                destination: `${mockedExcursionsResponse.excursionsLink}?${expectedQueryString}`,
            },
            undefined,
            true,
        );
    });

    it('should push to dataLayer on clicking on the mobile link', async () => {
        mockUseMobileViewport = true;

        const { findByTestId } = render(<Excursions {...props} />);

        const btn = await findByTestId('excursions-btn-see-more');

        fireEvent.click(btn);

        expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
            EventTypes.ViewAllExcursions,
            {
                name: props.fields.SeeMoreMobile.value,
                destination: `${mockedExcursionsResponse.excursionsLink}?${expectedQueryString}`,
            },
            undefined,
            true,
        );
    });

    it('should NOT call trackEventWithParams when excursions were not received', async () => {
        jest.spyOn(utils, 'getExcursionLinkAndExcursionsWithUtmTagging').mockReturnValue({
            excursionsLink: 'excursionsLink',
            excursions: [],
            utmValue: 'utmValue',
        });
        await act(async () => {
            render(<Excursions {...props} />);
        });

        expect(mockStores.trackingStore.trackEventWithParams).not.toHaveBeenCalled();
    });

    it('should NOT render when catch exception inside getExcursionsForDestination call', async () => {
        excursionsService.getExcursionsForDestination = jest.fn().mockRejectedValueOnce(null);

        const { container } = render(<Excursions {...props} />);

        await waitFor(() => expect(container).toBeEmptyDOMElement());
    });

    it('should push to datatalayer when component is visible', async () => {
        render(<Excursions {...props} />);

        await waitFor(() => {
            expect(mockStores.trackingStore.trackExcursionsAction).toHaveBeenCalledWith([], {
                eventAction: EventActions.ExcursionsViewed,
                eventLabel: '0',
            });
        });
    });

    it('should NOT push to datatalayer when component is not visible', async () => {
        mockUseInView.inView = false;

        render(<Excursions {...props} />);

        await waitFor(() => {
            expect(mockStores.trackingStore.trackExcursionsAction).toHaveBeenCalledTimes(0);
        });
    });
});
