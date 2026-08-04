import { render, screen } from '@testing-library/react';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

import { mockBooking } from 'frontend/__mocks__';
import * as airportUtils from 'frontend/utils/airports.utils';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import ItineraryAirport, { IItineraryAirportProps } from './ItineraryAirport';

dayjs.extend(isoWeek);

const createProps = (): IItineraryAirportProps => ({
    AirportTitle: mockSitecoreField('airportTitle'),
    ArriveByLabel: mockSitecoreField('arriveByLabel'),
    ArriveByText: mockSitecoreField('arriveByText'),
    FastTrackIcon: mockSitecoreField(mockSitecoreImageField('fastTrackIcon')),
    FastTrackLabel: mockSitecoreField('fastTrackLabel'),
    FastTrackText: mockSitecoreField('fastTrackText'),
    booking: mockBooking,
    isExpanded: false,
    setExpanded: jest.fn(),
});

let props: IItineraryAirportProps;

const mockItineraryItemComponent = jest.fn();
const mockItineraryItemSubtitleComponent = jest.fn();
const mockItineraryFeature = jest.fn();

jest.mock('frontend/components/renderings/ItinerarySummary/components/ItineraryItem/ItineraryItem', () => ({
    __esModule: true,
    default: props => {
        mockItineraryItemComponent(props);

        return (
            <div data-tid='itinerary-item'>
                {props.icon}
                {props.children}
            </div>
        );
    },
}));

jest.mock(
    'frontend/components/renderings/ItinerarySummary/components/ItineraryItemSubtitle/ItineraryItemSubtitle',
    () => ({
        __esModule: true,
        default: props => {
            mockItineraryItemSubtitleComponent(props);

            return <div data-tid='itinerary-item-subtitle' />;
        },
    }),
);

jest.mock('frontend/components/renderings/ItinerarySummary/components/ItineraryFeature/ItineraryFeature', () => ({
    __esModule: true,
    default: props => {
        mockItineraryFeature(props);

        return <div data-tid='itinerary-feature' />;
    },
}));

jest.mock('frontend/components/icons-new/AirportLounge', () => ({
    __esModule: true,
    default: props => <div data-tid='airport-icon-item' className={props.className} />,
}));

describe('<ItineraryAirport />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('should render itinerary airport item component with booking full flight data', () => {
        const getUTCHoursSpy = jest.spyOn(Date.prototype, 'getUTCHours').mockReturnValue(15);
        render(<ItineraryAirport {...props} />);

        expect(mockItineraryItemComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                title: props.AirportTitle,
            }),
        );

        expect(getUTCHoursSpy).toHaveBeenCalled();

        expect(mockItineraryItemSubtitleComponent).toHaveBeenCalledWith({
            subtitle: props.ArriveByLabel,
            content: '12:10',
            dataTid: 'itinerary-airport-arrive',
        });

        expect(screen.queryByTestId('itinerary-airport-expanded')).not.toBeInTheDocument();
        expect(mockItineraryFeature).not.toHaveBeenCalled();
    });

    describe('expanded mode', () => {
        beforeEach(() => {
            props.isExpanded = true;
        });

        it('should render expanded flight content', () => {
            render(<ItineraryAirport {...props} />);

            expect(screen.getByTestId('itinerary-airport-expanded')).toBeInTheDocument();
            expect(mockItineraryFeature).toHaveBeenCalledWith({
                title: props.FastTrackLabel,
                description: props.FastTrackText,
                icon: props.FastTrackIcon,
                isExpanded: props.isExpanded,
                dataTid: 'itinerary-airport-expanded',
                className: expect.any(String),
            });
        });
    });

    it('should set routes default value as empty array when booking routes are not defined', () => {
        (props.booking.package.transport.routes as any) = undefined;

        const spy = jest.spyOn(airportUtils, 'getRouteByDirection');

        render(<ItineraryAirport {...props} />);

        expect(spy).toHaveBeenCalledWith([]);
    });

    it('should NOT render the component when booking has no routes', () => {
        props.booking.package.transport.routes = [];

        const { container } = render(<ItineraryAirport {...props} />);

        expect(container).toBeEmptyDOMElement();
    });
});
