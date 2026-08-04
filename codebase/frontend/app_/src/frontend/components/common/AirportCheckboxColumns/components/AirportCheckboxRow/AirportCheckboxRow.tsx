import { FC, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IAirport, IAirportCountry } from 'models/sitecore/IAirportsData';
import CheckboxItem from 'frontend/components/common/CheckboxItem/CheckboxItem';
import IconChevronDown from 'frontend/components/icons/ChevronDown';
import { useSearchPodStore } from 'frontend/components/renderings/SearchPod/stores/createStore';

import styles from './AirportCheckboxRow.module.scss';

export interface IAirportCheckboxRowProps {
    group: IAirport;
    isChecked: (item: IAirport | IAirportCountry) => boolean;
    isDisabled: (item: IAirport | IAirportCountry) => boolean;
    onAddOrigin: (code: string) => void;
    onRemoveOrigin: (code: string) => void;
    origins: string[];
    setOrigins: (codes: string[]) => void;
}

interface IChangeGroupAcc {
    newOrigins: string[];
    selectedAirportNames: string[];
}

const AirportCheckboxRow: FC<IAirportCheckboxRowProps> = ({
    group,
    isChecked,
    isDisabled,
    onAddOrigin,
    onRemoveOrigin,
    origins,
    setOrigins,
}) => {
    const { getPhrase, originFromGeo, trackFromRegionSelectAll, trackFromRegionSelectSingle } = useStore(
        (stores: TStores) => ({
            getPhrase: stores.layoutStore.getPhrase,
            originFromGeo: stores.searchStore.searchFrom.originFromGeo,
            trackFromRegionSelectAll: stores.trackingStore.searchPod.trackFromRegionSelectAll,
            trackFromRegionSelectSingle: stores.trackingStore.searchPod.trackFromRegionSelectSingle,
        }),
    );

    const { isSearchPodInitialized } = useSearchPodStore() || {};

    const [isOpened, setIsOpened] = useState<boolean>(true);
    const airports = group.airports || [];

    const toggleGroup = (): void => {
        setIsOpened(prev => !prev);
    };

    const changeGroupSelection = (isSelected: boolean): void => {
        const { newOrigins, selectedAirportNames } = airports.reduce(
            (acc: IChangeGroupAcc, airport) => {
                const airportCode = airport.code;

                if (isSelected) {
                    if (!isDisabled(airport) && !acc.newOrigins.includes(airportCode)) {
                        acc.newOrigins.push(airportCode);
                        acc.selectedAirportNames.push(airport.itemName ?? '');
                    }
                } else {
                    const idx = acc.newOrigins.indexOf(airportCode);

                    if (airportCode !== originFromGeo && idx !== -1) {
                        acc.newOrigins.splice(idx, 1);
                    }
                }

                return acc;
            },
            { newOrigins: [...origins], selectedAirportNames: [] },
        );

        if (isSearchPodInitialized) {
            trackFromRegionSelectAll(group, selectedAirportNames, origins, isSelected);
        }

        setOrigins(newOrigins);
    };

    const changeItemSelection = (isSelected: boolean, code: string): void => {
        if (isSearchPodInitialized) {
            trackFromRegionSelectSingle(group, code, isSelected);
        }

        if (isSelected) {
            onAddOrigin(code);

            return;
        }

        onRemoveOrigin(code);
    };

    const isGroup = !!airports?.length;

    return (
        <div className={classNames(styles.row, 'group-of-airports', { [styles.openedRow]: isOpened })}>
            {isGroup && (
                <button
                    className={classNames(styles.dropdown, 'dropdown', { [styles.openedDropdown]: isOpened })}
                    onClick={toggleGroup}
                >
                    <IconChevronDown />
                </button>
            )}

            <CheckboxItem
                code={group.code}
                name={isGroup ? `${group.name} ${getPhrase(SitecoreDictionary.SearchPodLabelsAll)}` : group.name}
                icon
                disabled={isDisabled(group)}
                checked={isChecked(group)}
                onChange={
                    isGroup
                        ? (e): void => changeGroupSelection(e.target.checked)
                        : (e): void => changeItemSelection(e.target.checked, group.code)
                }
                disabledShowUnchecked
            />

            {isGroup && (
                <div className={classNames(styles.row, styles.subRow)}>
                    {airports.map(airport => (
                        <CheckboxItem
                            key={airport.code}
                            code={airport.code}
                            name={airport.name}
                            disabled={isDisabled(airport)}
                            checked={isChecked(airport)}
                            disabledShowUnchecked
                            onChange={(e): void => changeItemSelection(e.target.checked, airport.code)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default observer(AirportCheckboxRow);
