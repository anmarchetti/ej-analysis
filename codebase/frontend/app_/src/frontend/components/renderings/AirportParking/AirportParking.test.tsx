import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { RouteDirection } from 'models/enum/RouteDirection';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

import AirportParking, { IAirportParkingFields } from './AirportParking';

const createProps = (): ISitecoreComponent<IAirportParkingFields> => ({
    fields: {
        AirportParkingButtonText: mockSitecoreField('Buy Now'),
        AirportParkingDescription: mockSitecoreField('Description'),
        AirportParkingImage: mockSitecoreField(mockSitecoreImageField('Image')),
        AirportParkingTitle: mockSitecoreField('{destination} Title'),
        BackToExtrasButtonText: mockSitecoreField('Back To extras'),
        ParkingCardTransfersText: mockSitecoreField('Transfers'),
        HolidayExtrasLogo: mockSitecoreField(mockSitecoreImageField('HolidayExtrasLogo')),
        HolidayExtrasLogoText: mockSitecoreField('Powered by'),
        SelectedFromDate: mockSitecoreField('From {date} at {time}'),
        SelectedToDate: mockSitecoreField('From {date} at {time}'),
        SectionTitle: mockSitecoreField('Your Parking'),
        ParkingDetailsViewBackButtonText: mockSitecoreField('Parking details view back button'),
        ParkingDetailsViewBackButtonTextMobile: mockSitecoreField('Parking detail view back button mobile'),
        ParkingDetailsViewLogoText: mockSitecoreField('Parking detail view logo text'),
        ParkingListMoreInfoButtonText: mockSitecoreField('Parking list more info button text'),
    },
    params: {},
    rendering: {},
});

const mockJSSImageNext = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    default: props => {
        mockJSSImageNext(props);

        return <div data-tid='jss-image-next' />;
    },
}));

const mockPromoBanner = jest.fn();
jest.mock('frontend/components/common/ExternalExtras/HolidayExtrasPromoBanner/HolidayExtrasPromoBanner', () => ({
    __esModule: true,
    default: props => {
        mockPromoBanner(props);

        return <div data-tid='promo-banner' />;
    },
}));

const mockSelectedParkingCard = jest.fn();
jest.mock('./components/SelectedAirportParkingCard/SelectedAirportParkingCard', () => ({
    __esModule: true,
    default: props => {
        mockSelectedParkingCard(props);

        return <div data-tid='selected-airport-parking-card'>{props.promoBanner}</div>;
    },
}));

const mockParkingListPopup = jest.fn();
jest.mock('./components/ParkingListPopup/ParkingListPopup', () => ({
    __esModule: true,
    default: props => {
        mockParkingListPopup(props);

        return <div data-tid='parking-list-popup'>{props.promoBanner}</div>;
    },
}));

const mockBookExtrasBlock = jest.fn();
jest.mock('frontend/components/common/ExternalExtras/BookExtrasBlock/BookExtrasBlock', () => ({
    __esModule: true,
    default: props => {
        mockBookExtrasBlock(props);

        return (
            <div data-tid='extras-block'>
                <div>{props.promoBanner}</div>
                <button onClick={props.onClick} data-tid='buy-now-button' />
            </div>
        );
    },
}));

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextProps(props);

        return <div data-tid='section-title'>{props.field.value}</div>;
    },
}));

const createLocalStore = () => ({
    tracking: {
        trackParkingModuleInExtrasPageImpression: jest.fn(),
        trackBuyNowCtaClick: jest.fn(),
    },
});

jest.mock('frontend/components/renderings/AirportParking/stores/airportParkingLocalStore', () => ({
    ...jest.requireActual('frontend/components/renderings/AirportParking/stores/airportParkingLocalStore'),
    useAirportParkingLocalStore: () => mockUseAirportParkingLocalStore,
    withAirportParkingLocalStore: Component => Component,
}));

let props;
let mockStores;
let mockUseAirportParkingLocalStore;
const mockUseInView = { inView: true };

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('react-intersection-observer', () => ({
    ...jest.requireActual('react-intersection-observer'),
    useInView: jest.fn(() => mockUseInView),
}));

describe('<AirportParking />', () => {
    beforeEach(() => {
        mockUseInView.inView = true;

        mockStores = createMockStores({
            airportParkingStore: {
                initializeAirportParkings: jest.fn(),
                selectedAirportParking: null,
                toggleIsParkingPopupOpened: jest.fn(),
                airportParkings: [
                    {
                        title: 'Parking Title',
                        address: '123 Main St., Luton 123EAB',
                        bookingDetails: {},
                        description: 'Sell point',
                        transferTip: 'Transfer tip',
                        brandImage: '/image.jpg',
                        isMeetAndGreet: false,
                        isParkAndRide: false,
                        isParkAndStroll: true,
                    },
                ],
            },
            bookingStore: {
                outboundFlight: {
                    direction: RouteDirection.Outbound,
                    depName: 'London Gatwick',
                },
                selectedOffer: {
                    transport: {
                        routes: [],
                    },
                },
            },
            layoutStore: {
                getSetting: jest.fn().mockReturnValue(6),
                isExternalExtrasEnabled: true,
            },
        });
        props = createProps();
        mockUseAirportParkingLocalStore = createLocalStore();
    });

    describe('selectedAirportParking', () => {
        it('should render component correctly when selectedAirportParking is null', () => {
            render(<AirportParking {...props} />);

            expect(screen.getByTestId('section-title')).toBeInTheDocument();
            expect(mockBookExtrasBlock).toHaveBeenCalledWith(
                expect.objectContaining({
                    description: props.fields.AirportParkingDescription,
                    bannerImage: props.fields.AirportParkingImage,
                    buttonText: props.fields.AirportParkingButtonText,
                    onClick: expect.any(Function),
                }),
            );

            expect(screen.queryByTestId('promo-banner')).toBeInTheDocument();
            expect(mockPromoBanner).toHaveBeenCalledWith(
                expect.objectContaining({
                    promotionLogo: props.fields.HolidayExtrasLogo,
                    promotionText: props.fields.HolidayExtrasLogoText,
                }),
            );
        });

        it('should render selectedParkingCard component when selectedAirportParking is not null', () => {
            mockStores.airportParkingStore.selectedAirportParking = {
                brandImage: 'test-image-url.png',
                title: 'Test Parking',
                bookingDetails: {
                    totalPrice: 100,
                    startDate: '2023-10-01',
                    startTime: '10:00',
                    endDate: '2023-10-10',
                    endTime: '18:00',
                },
            };

            render(<AirportParking {...props} />);

            expect(screen.queryByTestId('extras-block')).not.toBeInTheDocument();

            expect(mockSelectedParkingCard).toHaveBeenCalledWith(
                expect.objectContaining({
                    selectedFromDate: props.fields.SelectedFromDate.value,
                    selectedToDate: props.fields.SelectedToDate.value,
                }),
            );

            expect(mockPromoBanner).toHaveBeenCalledWith(
                expect.objectContaining({
                    promotionLogo: props.fields.HolidayExtrasLogo,
                    promotionText: props.fields.HolidayExtrasLogoText,
                }),
            );
        });
    });

    describe('initializeAirportParkings', () => {
        it('should NOT call initializeAirportParkings on mount only when there are parkings', () => {
            render(<AirportParking {...props} />);
            expect(mockStores.airportParkingStore.initializeAirportParkings).not.toHaveBeenCalled();
        });

        it('should call initializeAirportParkings on mount only when there are no parkings', () => {
            mockStores.airportParkingStore.airportParkings = null;

            render(<AirportParking {...props} />);
            expect(mockStores.airportParkingStore.initializeAirportParkings).toHaveBeenCalledTimes(1);
        });

        it('should only call initializeAirportParkings once even if dependencies change', () => {
            mockStores.airportParkingStore.airportParkings = null;

            const { rerender } = render(<AirportParking {...props} />);

            // Simulate prop change that would trigger re-render
            rerender(<AirportParking {...props} selectedOffer={{ id: 2 }} />);

            // Rerender again to simulate updates
            rerender(<AirportParking {...props} isExternalExtrasEnabled={false} />);

            expect(mockStores.airportParkingStore.initializeAirportParkings).toHaveBeenCalledTimes(1);
        });

        it('should not call initializeAirportParkings if isExternalExtrasEnabled is false', () => {
            mockStores.layoutStore.isExternalExtrasEnabled = false;
            mockStores.airportParkingStore.airportParkings = null;

            render(<AirportParking {...props} />);
            expect(mockStores.airportParkingStore.initializeAirportParkings).not.toHaveBeenCalled();
        });

        it('should not call initializeAirportParkings if selectedOffer is null', () => {
            mockStores.bookingStore.selectedOffer = null;
            mockStores.airportParkingStore.airportParkings = null;

            render(<AirportParking {...props} />);
            expect(mockStores.airportParkingStore.initializeAirportParkings).not.toHaveBeenCalled();
        });
    });

    it('should call toggleIsParkingPopupOpened popup when buy-now-button is clicked', async () => {
        render(<AirportParking {...props} />);

        await userEvent.click(screen.getByTestId('buy-now-button'));

        expect(mockStores.airportParkingStore.toggleIsParkingPopupOpened).toHaveBeenCalledTimes(1);
    });

    it('should call trackBuyNowCtaClick when buy-now-button is clicked', async () => {
        render(<AirportParking {...props} />);

        await userEvent.click(screen.getByTestId('buy-now-button'));

        expect(mockUseAirportParkingLocalStore.tracking.trackBuyNowCtaClick).toHaveBeenCalledWith(
            props.fields.AirportParkingButtonText.value,
            'London Gatwick Title',
        );
    });

    it('should open parkingPopup with when isParkingPopupOpened is true', async () => {
        mockStores.airportParkingStore.isParkingPopupOpened = true;
        mockStores.airportParkingStore.selectedAirportParking = null;

        render(<AirportParking {...props} />);

        const parkingPopup = screen.getByTestId('parking-list-popup');
        expect(mockParkingListPopup).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'London Gatwick Title',
                BackToExtrasButtonText: props.fields.BackToExtrasButtonText,
            }),
        );

        expect(within(parkingPopup).queryByTestId('promo-banner')).toBeInTheDocument();
        expect(mockPromoBanner).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                promotionLogo: props.fields.HolidayExtrasLogo,
                promotionText: props.fields.HolidayExtrasLogoText,
            }),
        );
    });

    it('should render null if selectedOffer is null', () => {
        mockStores.bookingStore.selectedOffer = null;
        mockStores.bookingStore.outboundFlight = null;
        mockUseInView.inView = false;

        const { container } = render(<AirportParking {...props} />);

        expect(container).toBeEmptyDOMElement();
        expect(
            mockUseAirportParkingLocalStore.tracking.trackParkingModuleInExtrasPageImpression,
        ).not.toHaveBeenCalled();
    });

    it('should NOT render if airportParkings list is null', () => {
        mockStores.airportParkingStore.airportParkings = null;

        const { container } = render(<AirportParking {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render if airportParkings list is empty', () => {
        mockStores.airportParkingStore.airportParkings = [];

        const { container } = render(<AirportParking {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render without sitecore fields', () => {
        props.fields = undefined;

        const { container } = render(<AirportParking {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should not add Section Title to Dom isExternalExtrasEnabled is false', async () => {
        mockStores.layoutStore.isExternalExtrasEnabled = false;
        render(<AirportParking {...props} />);

        expect(screen.queryByTestId('section-title')).not.toBeInTheDocument();
    });

    it('should not add isHidden class to the airportparking component isAirportParkingHidden is true', async () => {
        mockStores.layoutStore.isAirportParkingHidden = true;
        render(<AirportParking {...props} />);

        expect(screen.queryByTestId('airport-parking-container')).toHaveClass('isHidden');
    });

    it('should add Section to Dom', async () => {
        render(<AirportParking {...props} />);

        expect(mockTextProps).toHaveBeenCalledWith(
            expect.objectContaining({
                field: props.fields.SectionTitle,
                tag: 'h2',
            }),
        );
        expect(screen.queryByTestId('section-title')).toBeInTheDocument();
    });

    it('should call trackParkingModuleInExtrasPageImpression when component is visible', () => {
        render(<AirportParking {...props} />);

        const container = screen.getByTestId('airport-parking-container');
        expect(container).toBeInTheDocument();

        expect(mockUseAirportParkingLocalStore.tracking.trackParkingModuleInExtrasPageImpression).toHaveBeenCalledWith(
            props.fields.SectionTitle.value,
            'London Gatwick Title',
        );
    });

    it('should NOT call trackParkingModuleInExtrasPageImpression when component is visible', () => {
        mockUseInView.inView = false;
        render(<AirportParking {...props} />);

        expect(
            mockUseAirportParkingLocalStore.tracking.trackParkingModuleInExtrasPageImpression,
        ).not.toHaveBeenCalled();
    });
});
