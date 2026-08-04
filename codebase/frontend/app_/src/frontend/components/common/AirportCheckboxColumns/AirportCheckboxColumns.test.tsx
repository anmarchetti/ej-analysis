import * as React from 'react';
import { render, screen, within } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { MarketCode } from 'models/data/MarketSettings';
import { IAirportCountry } from 'models/sitecore/IAirportsData';

import AirportCheckboxColumns from './AirportCheckboxColumns';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockAirportCheckboxRowProps = jest.fn();
jest.mock('./components/AirportCheckboxRow/AirportCheckboxRow', () => ({
    __esModule: true,
    default: props => {
        mockAirportCheckboxRowProps(props);

        return <div data-tid='airport-checkbox-row' />;
    },
}));

jest.mock('./components/GeoInput/GeoInput', () => ({
    __esModule: true,
    default: () => <div data-tid='geo-input' />,
}));

const createProps = () => ({
    countries: [
        {
            name: '',
            code: MarketCode.UK,
            airports: [] as any,
        },
    ] as IAirportCountry[],
    origins: [],
    checkIfMarketGroupSelected: jest.fn(),
    setOrigins: jest.fn(),
    onAddOrigin: jest.fn(),
    onRemoveOrigin: jest.fn(),
    isDisabled: jest.fn(() => false),
    isChecked: jest.fn(() => false),
});

const createStores = () =>
    createMockStores({
        marketStore: {
            marketCode: MarketCode.UK,
        },
    });

let mockProps;
let mockStores;

describe('AirportCheckboxColumns', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render two columns with GeoInput and no AirportCheckboxRow when no airports', () => {
        const { container } = render(<AirportCheckboxColumns {...mockProps} />);

        const columns = container.querySelectorAll('.airport-column');

        expect(columns.length).toBe(2);
        expect(within(columns[0] as HTMLElement).getByTestId('geo-input')).toBeInTheDocument();
        expect(screen.getAllByTestId('geo-input')).toHaveLength(1);
        expect(screen.queryByTestId('airport-checkbox-row')).not.toBeInTheDocument();
    });

    it('should render airports with country name when market code not equal to the country code', () => {
        mockStores.marketStore.marketCode = MarketCode.CH;
        mockProps.countries[0].airports = [
            { name: 'Lyon', code: 'LYS' },
            { name: 'Paris', code: 'ORY' },
        ];
        mockProps.countries[0].name = 'France';

        render(<AirportCheckboxColumns {...mockProps} />);

        expect(mockAirportCheckboxRowProps).toHaveBeenCalledTimes(mockProps.countries[0].airports.length);
        expect(mockAirportCheckboxRowProps).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                group: { ...mockProps.countries[0].airports[0], name: '(France) Lyon' },
            }),
        );
        expect(mockAirportCheckboxRowProps).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                group: { ...mockProps.countries[0].airports[1], name: '(France) Paris' },
            }),
        );
    });

    it('should render airports without country name when market code is UK', () => {
        mockStores.marketStore.marketCode = MarketCode.UK;
        mockProps.countries[0].airports = [
            { name: 'Luton', code: 'LTN' },
            { name: 'Belfast', code: 'BHD' },
            { name: 'London', code: 'LDN' },
        ];
        mockProps.countries[0].name = 'United Kingdom';

        render(<AirportCheckboxColumns {...mockProps} />);

        expect(mockAirportCheckboxRowProps).toHaveBeenCalledTimes(mockProps.countries[0].airports.length);
        expect(mockAirportCheckboxRowProps).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                group: mockProps.countries[0].airports[0],
            }),
        );
        expect(mockAirportCheckboxRowProps).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                group: mockProps.countries[0].airports[1],
            }),
        );
        expect(mockAirportCheckboxRowProps).toHaveBeenNthCalledWith(
            3,
            expect.objectContaining({
                group: mockProps.countries[0].airports[2],
            }),
        );
    });

    describe('sorting', () => {
        it('should not sort airports on UK market', () => {
            mockProps.countries[0].airports = [
                { name: 'Luton', code: 'LTN' },
                { name: 'Belfast', code: 'BHD' },
                { name: 'London', code: 'LDN' },
            ];

            render(<AirportCheckboxColumns {...mockProps} />);

            expect(mockAirportCheckboxRowProps).toHaveBeenCalledTimes(mockProps.countries[0].airports.length);
            expect(mockAirportCheckboxRowProps).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({
                    group: mockProps.countries[0].airports[0],
                }),
            );
            expect(mockAirportCheckboxRowProps).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({
                    group: mockProps.countries[0].airports[1],
                }),
            );
            expect(mockAirportCheckboxRowProps).toHaveBeenNthCalledWith(
                3,
                expect.objectContaining({
                    group: mockProps.countries[0].airports[2],
                }),
            );
        });

        it('should sort non UK airports alphabetically including special characters', () => {
            mockStores.marketStore.marketCode = MarketCode.CH;
            mockProps.countries[0].airports = [
                { name: 'Deutschland', code: 'DE' },
                { name: 'Frankreich', code: 'FR' },
                { name: 'Dänemark', code: 'DK' },
            ];

            render(<AirportCheckboxColumns {...mockProps} />);

            expect(mockAirportCheckboxRowProps).toHaveBeenCalledTimes(mockProps.countries[0].airports.length);
            expect(mockAirportCheckboxRowProps).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({
                    group: { name: 'Dänemark', code: 'DK' },
                }),
            );
            expect(mockAirportCheckboxRowProps).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({
                    group: { name: 'Deutschland', code: 'DE' },
                }),
            );
            expect(mockAirportCheckboxRowProps).toHaveBeenNthCalledWith(
                3,
                expect.objectContaining({
                    group: { name: 'Frankreich', code: 'FR' },
                }),
            );
        });
    });
});
