import React from 'react';
import { render } from '@testing-library/react';

import RouteInfoBlock from './RouteInfoBlock';

const createProps = () => ({
    info: {
        duration: 'duration',
        routeType: [],
        stops: 2,
        distance: 'distance',
    },
    containerClassName: 'test-container-class',
    itemClassName: 'test-item-class',
    getPhrase: jest.fn(p => p),
});

let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

jest.mock('frontend/components/icons/Clock', () => () => <div data-tid='clock' />);

jest.mock('frontend/components/icons/TourBus', () => () => <div data-tid='tour-bus' />);

jest.mock('frontend/components/icons/RunMan', () => () => <div data-tid='run-man' />);

jest.mock('frontend/components/icons/Taxi', () => () => <div data-tid='taxi' />);

jest.mock('frontend/components/icons/LocationPicker', () => () => <div data-tid='location-picker' />);

describe('<RouteInfoBlock />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render container class name', () => {
        const { container } = render(<RouteInfoBlock {...mockProps} />);

        expect(container.getElementsByClassName('test-container-class').length).toBe(1);
    });

    it('should render 4 item class name', () => {
        const { container } = render(<RouteInfoBlock {...mockProps} />);

        expect(container.getElementsByClassName('test-item-class').length).toBe(4);
    });

    it('should render clock icon', () => {
        const { getByTestId } = render(<RouteInfoBlock {...mockProps} />);

        expect(getByTestId('clock')).toBeInTheDocument();
    });

    it('should render TourBus icon if Bus is first in routes types', () => {
        mockProps.info.routeType = ['Bus', 'Walking'];
        const { getByTestId } = render(<RouteInfoBlock {...mockProps} />);

        expect(getByTestId('tour-bus')).toBeInTheDocument();
    });

    it('should render 2 RunMan icons if Walking is first in routes types', () => {
        mockProps.info.routeType = ['Walking', 'Bus'];
        const { getAllByTestId } = render(<RouteInfoBlock {...mockProps} />);

        expect(getAllByTestId('run-man').length).toBe(2);
    });

    it('should render Taxi icon if Car is first in routes types', () => {
        mockProps.info.routeType = ['Car', 'Walking'];
        const { getByTestId } = render(<RouteInfoBlock {...mockProps} />);

        expect(getByTestId('taxi')).toBeInTheDocument();
    });

    it('should render routeTypes text joined by "or" if Bus is first in routes types', () => {
        mockProps.info.routeType = ['Bus', 'Walking'];
        const { getByText } = render(<RouteInfoBlock {...mockProps} />);

        expect(getByText('Bus or Walking')).toBeInTheDocument();
    });

    it('should render LocationPicker icon', () => {
        const { getByTestId } = render(<RouteInfoBlock {...mockProps} />);

        expect(getByTestId('location-picker')).toBeInTheDocument();
    });

    it('should render duration with hrs', () => {
        const { getByText } = render(<RouteInfoBlock {...mockProps} />);

        expect(getByText('duration')).toBeInTheDocument();
        expect(getByText('Globals.Labels.Time.HoursPluralAbbr')).toBeInTheDocument();
    });

    it('should render distance with km', () => {
        const { getByText } = render(<RouteInfoBlock {...mockProps} />);

        expect(getByText('distance')).toBeInTheDocument();
        expect(getByText('Map.Kilometer')).toBeInTheDocument();
    });

    it('should render number of stops with locations', () => {
        const { getByText } = render(<RouteInfoBlock {...mockProps} />);

        expect(getByText('2')).toBeInTheDocument();
        expect(getByText('Map.Locations')).toBeInTheDocument();
    });
});
