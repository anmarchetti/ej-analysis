import React, { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { leftColumn, rightColumn } from 'frontend/utils/array.utils';
import { IDestinationCountry } from 'models/data/IDestinationCountries';
import SiteSettings from 'models/enum/SiteSettings';
import AnywhereInput from 'frontend/components/common/SearchBarDropdownTo/components/AnywhereInput/AnywhereInput';
import CheckboxDestinationRowGroup from 'frontend/components/common/SearchBarDropdownTo/components/CheckboxDestinationRowGroup/CheckboxDestinationRowGroup';

import styles from './DestinationCheckboxColumns.module.scss';

const DestinationCheckboxColumns: FC = () => {
    const { availableDestinationsCodes, getSetting, countriesWithRegions } = useStore((stores: TStores) => ({
        availableDestinationsCodes: stores.searchStore.searchTo.availableDestinationsCodes,
        getSetting: stores.layoutStore.getSetting,
        countriesWithRegions: stores.searchStore.searchTo.countriesWithRegions,
    }));

    const renderColumn = (
        destinations: IDestinationCountry[] | null,
        hasStartMargin?: boolean,
    ): (React.JSX.Element | null)[] =>
        (destinations || []).map((dst, i) => {
            if (!dst) {
                return null;
            }

            return (
                <CheckboxDestinationRowGroup
                    key={dst.code}
                    parent={dst}
                    availableCodes={availableDestinationsCodes}
                    hasTopMargin={hasStartMargin || i !== 0}
                />
            );
        });

    return (
        <>
            {!!countriesWithRegions?.length && (
                <>
                    <div className={styles.column}>
                        {getSetting(SiteSettings.IsAnywhereShownOnSearchPod) && <AnywhereInput />}
                        {renderColumn(leftColumn(countriesWithRegions), true)}
                    </div>
                    <div className={styles.column}>{renderColumn(rightColumn(countriesWithRegions))}</div>
                </>
            )}
        </>
    );
};

export default observer(DestinationCheckboxColumns);
