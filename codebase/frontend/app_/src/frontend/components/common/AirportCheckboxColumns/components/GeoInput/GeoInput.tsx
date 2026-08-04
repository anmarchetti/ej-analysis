import React, { FC, useLayoutEffect, useState } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import {
    getAllAvailableAirports,
    getClosestAirport,
    getGeoPosition,
    IPosition,
    isPointInsidePolygon,
} from 'frontend/utils/geo.utils';
import { GeoError } from 'models/enum/GeoError';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IAirportCountry } from 'models/sitecore/IAirportsData';
import Checkbox from 'frontend/components/common/Checkbox';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import IconGeolocation from 'frontend/components/icons-new/Geolocation';
import SvgWarningFilledTransparent from 'frontend/components/icons-new/WarningFilledTransparent';

import styles from './GeoInput.module.scss';

export interface IGeoInputError {
    message: string;
    description?: string;
}

export interface IGeoInputProps {
    countries: IAirportCountry[];
    onAddOrigin: (code: string) => void;
    onRemoveOrigin: (code: string) => void;
    isSearchBarDropdown?: boolean;
}

const GeoInput: FC<IGeoInputProps> = ({ countries, isSearchBarDropdown, onAddOrigin, onRemoveOrigin }) => {
    const {
        originFromGeo,
        isGeolocationEnabled,
        geolocationBounds,
        onAddOriginFromGeo,
        getPhrase,
        availableOriginsCodes,
    } = useStore(stores => ({
        originFromGeo: stores.searchStore.searchFrom.originFromGeo,
        isGeolocationEnabled: stores.layoutStore.isGeolocationEnabled,
        geolocationBounds: stores.layoutStore.geolocationBounds,
        onAddOriginFromGeo: stores.searchStore.searchFrom.onAddOriginFromGeo,
        getPhrase: stores.layoutStore.getPhrase,
        availableOriginsCodes: stores.searchStore.searchFrom.availableOriginsCodes,
    }));

    const [geoError, setGeoError] = useState<Nullable<IGeoInputError>>(null);
    const [position, setPosition] = useState<Nullable<IPosition>>(null);
    const [closestAirport, setClosestAirport] = useState<Nullable<string>>(null);

    const geoErrors = {
        [GeoError.NotInBounds]: {
            message: SitecoreDictionary.GeoInputErrorsNotInBounds,
            description: SitecoreDictionary.GeoInputErrorsNotInBoundsDescr,
        },
        [GeoError.UserDisabled]: { message: SitecoreDictionary.GeoInputErrorsGeolocationDisabled },
    };

    useLayoutEffect(() => {
        const fetchPosition = async () => {
            const currentPosition = await getGeoPosition();
            setPosition(currentPosition);
        };

        fetchPosition().catch(() => {
            setGeoError(geoErrors[GeoError.UserDisabled]);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!isGeolocationEnabled || !geolocationBounds) {
        return null;
    }

    const handleGeolocation = (): void => {
        if (!position) {
            setGeoError(geoErrors[GeoError.UserDisabled]);

            return;
        }

        const isPositionInBounds = isPointInsidePolygon(
            [position.coords.latitude, position.coords.longitude],
            geolocationBounds,
        );

        if (!isPositionInBounds) {
            setGeoError(geoErrors[GeoError.NotInBounds]);

            return;
        }

        const closestAirport = getClosestAirport(
            position,
            getAllAvailableAirports(countries || [], availableOriginsCodes),
        );

        if (closestAirport) {
            setClosestAirport(closestAirport.code);

            if (isSearchBarDropdown) {
                onAddOriginFromGeo(closestAirport);
            } else {
                onAddOrigin(closestAirport.code);
            }
        }
    };

    const onChange = (): void => {
        if (closestAirport) {
            onRemoveOrigin(originFromGeo || closestAirport);
            setClosestAirport(null);
        } else {
            handleGeolocation();
        }
    };

    return (
        <div className={styles.item} data-tid='geo-input'>
            <Checkbox
                tick
                medium
                checked={!!closestAirport}
                onChange={onChange}
                disabled={geoError !== null || availableOriginsCodes?.length === 0}
                label={getPhrase(SitecoreDictionary.GeoInputLabelsUseGeolocation)}
                render={() => <IconGeolocation />}
            />

            {geoError && (
                <div className={styles.error}>
                    <ErrorMessage
                        message={getPhrase(geoError.message)}
                        description={geoError.description ? getPhrase(geoError.description) : ''}
                        isTransparent
                        icon={<SvgWarningFilledTransparent />}
                    />
                </div>
            )}
        </div>
    );
};

export default observer(GeoInput);
