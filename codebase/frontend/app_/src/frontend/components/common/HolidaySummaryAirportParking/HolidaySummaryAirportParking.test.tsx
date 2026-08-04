import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockAirportParking } from 'frontend/__mocks__/airportParking';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import HolidaySummaryAirportParking, {
    IAirportParkingInfoFields,
    IHolidaySummaryAirportParkingProps,
} from './HolidaySummaryAirportParking';

let mockProps: IHolidaySummaryAirportParkingProps;

const mockAirportParkingInfoFields: IAirportParkingInfoFields = {
    AirportParkingTitle: {
        value: '{airport} Parking booked with:',
    },
    AirportParkingInstructions: {
        value: 'Look for an email from Holiday Extras with further instructions',
    },
};

const createProps = (): IHolidaySummaryAirportParkingProps => ({
    airportParking: mockAirportParking,
    airportParkingInfoFields: mockAirportParkingInfoFields,
    dataTid: 'airport-parking-holiday-summary',
});

let mockStores;
jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/tokenizer', () => ({
    Tokenizer: {
        replaceToken: (str: string, token: string, value: string) => str?.replace(token, value),
    },
}));

describe('<HolidaySummaryAirportParking />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it('should render the component', () => {
        render(<HolidaySummaryAirportParking {...mockProps} />);

        expect(screen.getByTestId(mockProps.dataTid)).toBeInTheDocument();
        expect(screen.getByText(mockProps.airportParking.title)).toBeInTheDocument();
        expect(screen.getByTestId(`${mockProps.dataTid}-parking-icon`)).toBeInTheDocument();
        expect(screen.getByTestId(`${mockProps.dataTid}-parking-title`)).toBeInTheDocument();
        expect(screen.getByTestId(`${mockProps.dataTid}-parking-name`)).toBeInTheDocument();
        expect(screen.getByTestId(`${mockProps.dataTid}-parking-dates`)).toBeInTheDocument();
        expect(screen.getByTestId(`${mockProps.dataTid}-parking-instructions`)).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.GlobalsLabelsAirportParking)).toBeInTheDocument();
    });

    it('should render the generic title when departureAirportName is not provided', () => {
        render(<HolidaySummaryAirportParking {...mockProps} />);

        const titleElement = screen.getByTestId(`${mockProps.dataTid}-parking-title`);

        expect(titleElement).toHaveTextContent(SitecoreDictionary.GlobalsLabelsAirportParking);
    });

    it('should render the dynamic title when departureAirportName and fields are provided', () => {
        const airportName = 'London Gatwick';
        mockProps.departureAirportName = airportName;

        render(<HolidaySummaryAirportParking {...mockProps} />);

        const titleElement = screen.getByTestId(`${mockProps.dataTid}-parking-title`);
        const expectedTitle = 'London Gatwick Parking booked with:';

        expect(titleElement).toHaveTextContent(expectedTitle);
        expect(screen.queryByText(SitecoreDictionary.GlobalsLabelsAirportParking)).not.toBeInTheDocument();
    });

    it('should render instructions from the fields prop', () => {
        render(<HolidaySummaryAirportParking {...mockProps} />);

        const instructionsElement = screen.getByTestId(`${mockProps.dataTid}-parking-instructions`);

        expect(instructionsElement).toHaveTextContent(mockAirportParkingInfoFields.AirportParkingInstructions.value);
    });

    it('should render an empty instructions block if fields are not provided', () => {
        mockProps.airportParkingInfoFields = undefined;

        render(<HolidaySummaryAirportParking {...mockProps} />);

        const instructionsElement = screen.getByTestId(`${mockProps.dataTid}-parking-instructions`);

        expect(instructionsElement).toBeEmptyDOMElement();
    });

    it('should display the correctly formatted parking period string', () => {
        render(<HolidaySummaryAirportParking {...mockProps} />);

        const expectedDateString = 'Wed 23rd Apr 2025 11:50 - Thu 1st May 2025 02:25';
        const dateElement = screen.getByTestId(`${mockProps.dataTid}-parking-dates`);

        expect(dateElement).toHaveTextContent(expectedDateString);
    });
});
