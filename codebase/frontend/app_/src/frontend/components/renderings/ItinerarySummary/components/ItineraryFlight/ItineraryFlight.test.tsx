import { render, screen } from '@testing-library/react';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

import { mockBooking } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import ItineraryFlight, { IItineraryFlightProps } from './ItineraryFlight';

dayjs.extend(isoWeek);

const createProps = (): IItineraryFlightProps => ({
    ArrivesLabel: mockSitecoreField('arrives'),
    DepartsLabel: mockSitecoreField('departs'),
    FlightInbound: mockSitecoreField('flight inbound'),
    FlightOutbound: mockSitecoreField('flight outbound'),
    SpeedyBoardingIcon: mockSitecoreField(mockSitecoreImageField('speedyBoardingIcon')),
    SpeedyBoardingLabel: mockSitecoreField('speedyBoardingLabel'),
    SpeedyBoardingText: mockSitecoreField('speedyBoardingText'),
    SpeedyBoardingTooltip: mockSitecoreField('SpeedyBoardingTooltip'),
    isArrival: false,
    isExpanded: false,
    setExpanded: jest.fn(),
    route: mockBooking.package.transport.routes[1], // inbound route
    isLuxuryPackage: false,
    isGreyedOut: false,
});

let props: IItineraryFlightProps;

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

jest.mock('frontend/components/icons-new/DepartureFilled', () => ({
    __esModule: true,
    default: props => <div data-tid='flight-icon-item' className={props.className} />,
}));

describe('<ItineraryFlight />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('should render itinerary flight item component with route data', () => {
        render(<ItineraryFlight {...props} />);

        expect(screen.getByTestId('flight-icon-item')).toHaveClass('icon--reflect-x');
        expect(mockItineraryItemComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                title: props.FlightInbound,
                hideSeparator: !props.isArrival,
                isExpanded: props.isExpanded,
                setExpanded: props.setExpanded,
                isGreyedOut: props.isGreyedOut,
            }),
        );

        expect(mockItineraryItemSubtitleComponent).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                subtitle: props.DepartsLabel,
                content: 'ACE - 20:40',
            }),
        );

        expect(mockItineraryItemSubtitleComponent).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                subtitle: props.ArrivesLabel,
                content: 'LGW - 00:45',
            }),
        );
        expect(mockItineraryFeature).not.toHaveBeenCalled();
    });

    it('should render itinerary flight item component when isLuxuryPackage is true', () => {
        props.isLuxuryPackage = true;
        render(<ItineraryFlight {...props} />);
        expect(mockItineraryFeature).toHaveBeenCalledWith({
            title: props.SpeedyBoardingLabel,
            description: props.SpeedyBoardingText,
            icon: props.SpeedyBoardingIcon,
            isExpanded: false,
            dataTid: 'flight-collapsed',
        });
    });

    it('should not contain a mirrored svg flight icon when it is arrival flight', () => {
        props.isArrival = true;

        render(<ItineraryFlight {...props} />);

        expect(screen.getByTestId('flight-icon-item')).not.toHaveClass('icon--reflect-x');
        expect(mockItineraryItemComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                title: props.FlightOutbound,
                hideSeparator: !props.isArrival,
                isExpanded: props.isExpanded,
                setExpanded: props.setExpanded,
                isGreyedOut: props.isGreyedOut,
            }),
        );
    });

    describe('expanded mode', () => {
        beforeEach(() => {
            props.isExpanded = true;
        });

        it('should render expanded flight content', () => {
            render(<ItineraryFlight {...props} />);

            const route = props.route!;

            expect(screen.getByTestId('itinerary-flight-ext-number')).toBeInTheDocument();

            expect(screen.getByTestId('itinerary-flight-dep-time')).toHaveTextContent('20:40');
            expect(screen.getByTestId('itinerary-flight-arr-time')).toHaveTextContent('00:45');

            expect(screen.getByTestId('itinerary-flight-dep-airport-name')).toHaveTextContent(route.depName);
            expect(screen.getByTestId('itinerary-flight-dep-airport-code')).toHaveTextContent(`${route.depPt}`);

            expect(screen.getByTestId('itinerary-flight-arr-airport-name')).toHaveTextContent(route.arrName);
            expect(screen.getByTestId('itinerary-flight-arr-airport-code')).toHaveTextContent(`(${route.arrPt})`);

            expect(screen.queryByTestId('itinerary-flight-dep-terminal')).not.toBeInTheDocument();
            expect(screen.queryByTestId('itinerary-flight-arr-terminal')).not.toBeInTheDocument();
        });

        it('should render itinerary flight item when isLuxuryPackage is true', () => {
            props.isLuxuryPackage = true;
            props.isArrival = true;
            render(<ItineraryFlight {...props} />);
            expect(mockItineraryFeature).toHaveBeenCalledWith({
                title: props.SpeedyBoardingLabel,
                description: props.SpeedyBoardingText,
                icon: props.SpeedyBoardingIcon,
                isExpanded: true,
                dataTid: 'flight-expanded',
                tooltipText: null,
            });
        });

        it('should render tooltip when arrival flight on lux package', () => {
            props.isLuxuryPackage = true;
            props.isArrival = false;
            render(<ItineraryFlight {...props} />);
            expect(mockItineraryFeature).toHaveBeenCalledWith(
                expect.objectContaining({
                    isExpanded: true,
                    dataTid: 'flight-expanded',
                    tooltipText: props.SpeedyBoardingTooltip?.value,
                }),
            );
        });

        it('should render departure and arrival terminal information', () => {
            const route = props.route!;
            route.depTerminal = 'route-2 dep terminal';
            route.arrTerminal = 'route-2 arr terminal';

            render(<ItineraryFlight {...props} />);

            expect(screen.getByTestId('itinerary-flight-dep-terminal')).toHaveTextContent(route.depTerminal);
            expect(screen.getByTestId('itinerary-flight-arr-terminal')).toHaveTextContent(route.arrTerminal);
        });
    });

    it('should NOT render the component when route is undefined', () => {
        props.route = undefined;

        const { container } = render(<ItineraryFlight {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render greyed out state', () => {
        props.isGreyedOut = true;
        render(<ItineraryFlight {...props} />);

        expect(mockItineraryItemComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                isGreyedOut: true,
            }),
        );
    });
});
