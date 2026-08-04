import React, { FC } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { leftColumn, rightColumn } from 'frontend/utils/array.utils';
import { sortDepartureAirportsAlphabetically } from 'frontend/utils/search/search.utils';
import { MarketCode } from 'models/data/MarketSettings';
import { IAirport, IAirportCountry } from 'models/sitecore/IAirportsData';

import AirportCheckboxRow from './components/AirportCheckboxRow/AirportCheckboxRow';
import GeoInput from './components/GeoInput/GeoInput';

import styles from './AirportCheckboxColumns.module.scss';

interface IAirportCheckboxColumnsProps {
    countries: IAirportCountry[];
    isChecked: (code: IAirport | IAirportCountry) => boolean;
    isDisabled: (item: IAirport | IAirportCountry) => boolean;
    onAddOrigin: (code: string) => void;
    onRemoveOrigin: (code: string) => void;
    origins: string[];
    setOrigins: (codes: string[]) => void;
    isSearchBarDropdown?: boolean;
}

const AirportCheckboxColumns: FC<IAirportCheckboxColumnsProps> = props => {
    const { marketCode } = useStore(stores => ({
        marketCode: stores.marketStore.marketCode,
    }));

    const airportsNamesWithCountries: IAirport[] = (props.countries || []).reduce((res, country) => {
        const countryName = country.name;

        const addCountryNameToAirportName = (airports: IAirport[]): IAirport[] =>
            airports.map(airport => {
                if (!airport.airports && !airport.name.includes(countryName)) {
                    airport.name = `(${countryName}) ${airport.name}`;
                }

                if (airport.airports) {
                    addCountryNameToAirportName(airport.airports);
                }

                return airport;
            });

        const airports =
            marketCode !== country.code && marketCode !== MarketCode.UK
                ? addCountryNameToAirportName(country.airports)
                : country.airports;

        return [...res, ...airports];
    }, [] as IAirport[]);

    const airports =
        marketCode !== MarketCode.UK
            ? sortDepartureAirportsAlphabetically(airportsNamesWithCountries)
            : airportsNamesWithCountries;

    const columnClassName = classNames(styles.column, 'airport-column');

    const renderColumn = (items: IAirport[]): React.JSX.Element[] =>
        items.map(group => (
            <AirportCheckboxRow
                key={group.name}
                group={group}
                origins={props.origins}
                setOrigins={props.setOrigins}
                onAddOrigin={props.onAddOrigin}
                onRemoveOrigin={props.onRemoveOrigin}
                isDisabled={props.isDisabled}
                isChecked={props.isChecked}
            />
        ));

    return (
        <>
            <div className={columnClassName}>
                <GeoInput
                    countries={props.countries}
                    onAddOrigin={props.onAddOrigin}
                    onRemoveOrigin={props.onRemoveOrigin}
                    isSearchBarDropdown={props.isSearchBarDropdown}
                />
                {renderColumn(leftColumn(airports))}
            </div>
            <div className={columnClassName}>{renderColumn(rightColumn(airports))}</div>
        </>
    );
};

export default AirportCheckboxColumns;
