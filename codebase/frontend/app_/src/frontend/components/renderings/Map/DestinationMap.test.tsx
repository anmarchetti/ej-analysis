import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { DestinationPageTemplateName } from 'frontend/hooks/useHolidaysDestinationPageTypeName';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { MediaSize } from 'models/data/MediaSizeParams';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';

import DestinationMap from './DestinationMap';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockUseHolidaysDestinationPageTypeName: DestinationPageTemplateName | undefined;

jest.mock('frontend/hooks/useHolidaysDestinationPageTypeName', () => ({
    ...jest.requireActual('frontend/hooks/useHolidaysDestinationPageTypeName'),
    __esModule: true,
    default: () => mockUseHolidaysDestinationPageTypeName,
}));

jest.mock('frontend/services/hotels.service', () => ({
    __esModule: true,
    HotelsService: {
        fetchDestinationHotels: jest.fn().mockResolvedValue({
            features: [{ geometry: { coordinates: [11, 12] } }],
        }),
    },
}));

const mockMapComponent = jest.fn();
jest.mock('frontend/components/common/MapComponent/MapComponent', () => props => {
    mockMapComponent(props);

    return <div data-tid='popup' />;
});

jest.mock('frontend/utils/isBackend', () => jest.fn());

const createProps = () => ({
    fields: {
        ExploreContent: mockSitecoreField('Explore our map of {region}'),
        MapImage: mockSitecoreField(mockSitecoreImageField('/')),
    } as any,
    params: {
        MaxZoom: 20,
        MinZoom: 4,
        InitialZoom: 7,
    } as any,
    rendering: { placeholders: { [PlaceholderNames.CTA]: [] } },
});
const createStores = () =>
    createMockStores({
        appStore: { isScreenExtraSmall: false },
        layoutStore: {
            isDestinationMapEnableOnDesktop: true,
            layout: { sitecore: { route: { fields: { Name: { value: 'Spain' }, Code: { value: 'ES' } } } } },
        },
        bookingStore: {
            isShownDestinationMapOnDesktop: false,
            isShownDestinationMapOnMobile: false,
            toggleDestinationMapVisibilityOnDesktop: jest.fn(),
            toggleDestinationMapVisibilityOnMobile: jest.fn(),
        },
        trackingStore: {
            trackMapEvent: jest.fn(),
            trackEventWithParams: jest.fn(),
        },
    });

let mockProps = createProps();
let mockStores = createStores();

const mockJSSIMageNextProps = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: props => {
        mockJSSIMageNextProps(props);

        return <div data-tid='jss-image-next' />;
    },
}));

describe('<DestinationMap />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        mockUseHolidaysDestinationPageTypeName = undefined;
        mockMapComponent.mockClear();
    });

    it('Should render initial component', async () => {
        const { getByTestId } = render(<DestinationMap {...mockProps} />);
        await waitFor(() => expect(getByTestId('destination-wrapper')).toBeInTheDocument());

        expect(screen.getByTestId('jss-image-next')).toBeInTheDocument();
        expect(mockJSSIMageNextProps).toHaveBeenCalledWith(
            expect.objectContaining({
                field: mockProps.fields.MapImage,
                fill: true,
                mediaSize: MediaSize.Small,
            }),
        );
    });

    it('Should toggle map on click', async () => {
        const { getByTestId } = render(<DestinationMap {...mockProps} />);

        await userEvent.click(getByTestId('destination-toggle'));
        await waitFor(() => expect(mockStores.bookingStore.toggleDestinationMapVisibilityOnDesktop).toHaveBeenCalled());
    });

    it('Should not track map opening when useHolidaysDestinationPageTypeName returns undefined', async () => {
        const { getByTestId } = render(<DestinationMap {...mockProps} />);

        await userEvent.click(getByTestId('destination-toggle'));
        await waitFor(() => expect(mockStores.trackingStore.trackEventWithParams).not.toHaveBeenCalled());
    });

    it('Should not track map opening when useHolidaysDestinationPageTypeName returns defined value', async () => {
        mockUseHolidaysDestinationPageTypeName = DestinationPageTemplateName.Resort;
        const { getByTestId } = render(<DestinationMap {...mockProps} />);

        await userEvent.click(getByTestId('destination-toggle'));
        await waitFor(() =>
            expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventAction: EventActions.Map,
                    eventCategory: EventCategories.DestinationGuide,
                    eventLabel: 'View Map',
                    eventType: EventTypes.Interaction,
                },
                {
                    genericValue1: mockUseHolidaysDestinationPageTypeName,
                    genericValue2: null,
                    genericValue3: null,
                    genericValue4: null,
                    destinationUrl: null,
                },
            ),
        );
    });

    it('Should render desktop popup', async () => {
        mockStores.bookingStore.isShownDestinationMapOnDesktop = true;
        const { getByTestId } = render(<DestinationMap {...mockProps} />);

        await waitFor(() => expect(getByTestId('destination-map-popup')).toBeInTheDocument());

        // FIX: Wrap assertion in waitFor so it retries until the async data fetch updates the props
        await waitFor(() => {
            expect(mockMapComponent).toHaveBeenCalledWith({
                center: {
                    lat: 12,
                    lng: 11,
                },
                className: undefined,
                clickableIcons: true,
                closeControlPosition: undefined,
                defaultZoom: 7,
                gestureHandling: undefined,
                hotels: [
                    {
                        geometry: {
                            coordinates: [11, 12],
                        },
                    },
                ],
                maxZoom: 20,
                minZoom: 4,
                onUnmount: expect.any(Function),
                zoomControlPosition: undefined,
            });
        });
    });

    it('Should close map once open without tracking', async () => {
        mockStores.bookingStore.isShownDestinationMapOnDesktop = true;
        const { getByTestId } = render(<DestinationMap {...mockProps} />);

        await userEvent.click(getByTestId('destination-popup-close'));
        await waitFor(() => expect(mockStores.bookingStore.toggleDestinationMapVisibilityOnDesktop).toBeCalled());
        expect(mockStores.trackingStore.trackEventWithParams).not.toHaveBeenCalled();
    });

    it('Should not render desktop popup', async () => {
        mockStores.appStore.isScreenExtraSmall = true;
        mockStores.bookingStore.isShownDestinationMapOnMobile = true;
        const { queryByTestId } = render(<DestinationMap {...mockProps} />);

        await waitFor(() => expect(queryByTestId('destination-map-popup')).not.toBeInTheDocument());
    });
});
