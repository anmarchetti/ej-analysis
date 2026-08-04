import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { TStores } from 'frontend/store/IStores';
import { IDestinationCountry } from 'models/data/IDestinationCountries';

import DestinationCheckboxColumns from './DestinationCheckboxColumns';

const mockAnywhereInput = jest.fn();
jest.mock('frontend/components/common/SearchBarDropdownTo/components/AnywhereInput/AnywhereInput', () =>
    jest.fn(props => {
        mockAnywhereInput(props);

        return <div data-tid='anywhere-input'>Anywhere Input Mock</div>;
    }),
);

const mockCheckboxDestinationRowGroup = jest.fn();
jest.mock(
    'frontend/components/common/SearchBarDropdownTo/components/CheckboxDestinationRowGroup/CheckboxDestinationRowGroup',
    () =>
        jest.fn(props => {
            mockCheckboxDestinationRowGroup(props);

            return (
                <div data-tid={`checkbox-dest-group-${props.parent?.code || 'unknown'}`}>
                    {props.parent?.name} Group Mock
                </div>
            );
        }),
);

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockStores: TStores;

describe('DestinationCheckboxColumns', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            searchStore: {
                searchTo: {
                    availableDestinationsCodes: [] as string[],
                    countriesWithRegions: [
                        { code: 'DUB', name: 'Dublin' },
                        { code: 'LON', name: 'London' },
                    ] as IDestinationCountry[],
                },
            },
        });
    });

    it('should render AnywhereInput when IsAnywhereShownOnSearchPod setting is true', () => {
        render(<DestinationCheckboxColumns />);

        expect(screen.getByTestId('anywhere-input')).toBeInTheDocument();
        expect(mockAnywhereInput).toHaveBeenCalled();
    });

    it('should not render AnywhereInput when IsAnywhereShownOnSearchPod setting is false', () => {
        mockStores.layoutStore.getSetting = jest.fn(() => false);
        render(<DestinationCheckboxColumns />);

        expect(screen.queryByTestId('anywhere-input')).not.toBeInTheDocument();
    });

    it('should render CheckboxDestinationRowGroup for each destination and pass correct props', () => {
        const destinations: IDestinationCountry[] = [
            { code: 'USA', name: 'United States' },
            { code: 'CAN', name: 'Canada' },
        ];
        const selected = ['USA'];
        const available = ['USA', 'CAN', 'MEX'];

        mockStores.searchStore.searchTo.countriesWithRegions = destinations;
        mockStores.searchStore.searchTo.selectedDestinationCodes = selected;
        mockStores.searchStore.searchTo.availableDestinationsCodes = available;

        render(<DestinationCheckboxColumns />);

        expect(screen.getByTestId('checkbox-dest-group-USA')).toBeInTheDocument();
        expect(screen.getByTestId('checkbox-dest-group-CAN')).toBeInTheDocument();
        expect(mockCheckboxDestinationRowGroup).toHaveBeenCalledTimes(2);

        expect(mockCheckboxDestinationRowGroup).toHaveBeenCalledWith(
            expect.objectContaining({
                parent: destinations[0],
                availableCodes: available,
                hasTopMargin: true,
            }),
        );
        expect(mockCheckboxDestinationRowGroup).toHaveBeenCalledWith(
            expect.objectContaining({
                parent: destinations[1],
                availableCodes: available,
                hasTopMargin: false,
            }),
        );
    });

    it('should NOT render CheckboxDestinationRowGroup if countriesWithRegions are null', () => {
        const destinations = null as unknown as IDestinationCountry[];
        const available = ['USA', 'CAN', 'MEX'];

        mockStores.searchStore.searchTo.countriesWithRegions = destinations;
        mockStores.searchStore.searchTo.availableDestinationsCodes = available;

        render(<DestinationCheckboxColumns />);

        expect(mockCheckboxDestinationRowGroup).not.toHaveBeenCalled();
    });

    it('should NOT render CheckboxDestinationRowGroup if destination is null ', () => {
        const destinations = [null] as unknown as IDestinationCountry[];
        const available = ['USA', 'CAN', 'MEX'];

        mockStores.searchStore.searchTo.countriesWithRegions = destinations;
        mockStores.searchStore.searchTo.availableDestinationsCodes = available;

        render(<DestinationCheckboxColumns />);

        expect(mockCheckboxDestinationRowGroup).not.toHaveBeenCalled();
    });
});
