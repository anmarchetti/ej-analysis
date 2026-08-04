import { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getFieldValue } from 'frontend/utils/sitecore.utils';
import { IDestinationCountry } from 'models/data/IDestinationCountries';
import CheckboxItem from 'frontend/components/common/CheckboxItem/CheckboxItem';
import { useSearchPodStore } from 'frontend/components/renderings/SearchPod/stores/createStore';

import { useDestinationSelectionHandlers } from './DestinationCheckboxGroup.hooks';

import styles from './DestinationCheckboxGroup.module.scss';

export interface IDestinationCheckboxGroupProps {
    availableCodes: string[] | null;
    parent: IDestinationCountry;
}

const DestinationCheckboxGroup: FC<IDestinationCheckboxGroupProps> = ({ availableCodes, parent }) => {
    const {
        addDestination,
        removeDestination,
        updateDestinationCodes,
        isDisabledItem,
        isCheckedItem,
        trackToRegionSelectSingle,
        trackToRegionSelectAll,
        selectedDestinations,
        availableDestinationsCodes,
    } = useStore((stores: TStores) => ({
        addDestination: stores.searchStore.searchTo.addDestination,
        removeDestination: stores.searchStore.searchTo.removeDestination,
        updateDestinationCodes: stores.searchStore.searchTo.updateDestinationCodes,
        isDisabledItem: stores.searchStore.searchTo.isDisabledItem,
        selectedDestinations: stores.searchStore.searchTo.selectedDestinations,
        availableDestinationsCodes: stores.searchStore.searchTo.availableDestinationsCodes,
        isCheckedItem: stores.searchStore.searchTo.isCheckedItem,
        trackToRegionSelectSingle: stores.trackingStore.searchPod.trackToRegionSelectSingle,
        trackToRegionSelectAll: stores.trackingStore.searchPod.trackToRegionSelectAll,
    }));

    const { fields: { ToAllGroupCheckboxLabel } = {} } = useSearchPodStore();

    const { changeItemSelection, changeGroupSelection } = useDestinationSelectionHandlers({
        parent,
        availableCodes,
        addDestination,
        removeDestination,
        updateDestinationCodes,
        isDisabledItem,
        isCheckedItem,
        trackToRegionSelectSingle,
        trackToRegionSelectAll,
        selectedDestinations,
        availableDestinationsCodes,
    });

    const renderAllBox = parent.children && parent.children.length > 1;
    const destinations = parent.children && parent.children.length > 0 ? parent.children : [parent];
    const allPhrase = getFieldValue(ToAllGroupCheckboxLabel);

    return (
        <div className={styles.checkboxGroup}>
            {renderAllBox && (
                <div className={styles.checkboxGroupRow}>
                    <CheckboxItem
                        code={parent.code}
                        name={allPhrase ? `${allPhrase} ${parent.name}` : parent.name}
                        icon
                        disabled={isDisabledItem(parent)}
                        checked={isCheckedItem(parent)}
                        onChange={(e): void => changeGroupSelection(e.target.checked)}
                        disabledShowUnchecked
                    />
                </div>
            )}

            {destinations.map((child, i) => (
                <div
                    className={styles.checkboxGroupRow}
                    key={`${child.code}_${i}`}
                    data-tid='destination-checkbox-item'
                >
                    <CheckboxItem
                        code={child.code}
                        name={child.name}
                        disabled={isDisabledItem(child)}
                        checked={isCheckedItem(child, parent)}
                        onChange={(e): void => changeItemSelection(e.target.checked, child.code)}
                        disabledShowUnchecked
                    />
                </div>
            ))}
        </div>
    );
};

export default observer(DestinationCheckboxGroup);
