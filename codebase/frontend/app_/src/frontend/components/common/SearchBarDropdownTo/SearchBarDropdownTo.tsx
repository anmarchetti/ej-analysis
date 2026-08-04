import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SearchBarDropdownScrollableBox from 'frontend/components/common/SearchBarDropdownScrollableBox/SearchBarDropdownScrollableBox';
import SearchPodFooterButtons from 'frontend/components/common/SearchPodFooterButtons/SearchPodFooterButtons';

import DestinationCheckboxColumns from './components/DestinationCheckboxColumns/DestinationCheckboxColumns';

import styles from './SearchBarDropdownTo.module.scss';

export interface ISearchBarDropdownToProps {
    id: string;
    onClose: () => void;
    title: string;
    isDialogRole?: boolean;
}

const SearchBarDropdownTo = forwardRef<HTMLDivElement, ISearchBarDropdownToProps>(
    ({ id, onClose, title, isDialogRole }, ref) => {
        const { getPhrase, selectedDestinationCodes, clearDestinations } = useStore((stores: TStores) => ({
            getPhrase: stores.layoutStore.getPhrase,
            selectedDestinationCodes: stores.searchStore.searchTo.selectedDestinationCodes,
            clearDestinations: stores.searchStore.searchTo.clearDestinations,
        }));

        const titleId = `${id}-title`;
        const ariaAttributes = isDialogRole
            ? { role: 'dialog', 'aria-modal': true, 'aria-labelledby': titleId }
            : undefined;

        return (
            <div className={styles.dropdown} id={id} data-tid='search-bar-dropdown-to' {...ariaAttributes} ref={ref}>
                <h2 className={styles.head} id={titleId}>
                    {title}
                </h2>

                <SearchBarDropdownScrollableBox className={styles.scrollable}>
                    <DestinationCheckboxColumns />
                </SearchBarDropdownScrollableBox>

                <SearchPodFooterButtons
                    applyButtonLabel={getPhrase(SitecoreDictionary.GlobalsButtonsApply)}
                    clearButtonLabel={getPhrase(SitecoreDictionary.GlobalsLabelsClearSelection)}
                    isShownClearButton={!!selectedDestinationCodes.length}
                    onApplyClick={onClose}
                    onCloseClick={onClose}
                    onClearClick={clearDestinations}
                    isApplyButtonDisabled={selectedDestinationCodes.length === 0}
                    fieldName={SearchBarDropdown.To}
                />
            </div>
        );
    },
);

SearchBarDropdownTo.displayName = 'SearchBarDropdownTo';

export default observer(SearchBarDropdownTo);
