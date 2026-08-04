import { FC, useMemo } from 'react';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getNormalizedCountries } from 'frontend/utils/search/searchPod.utils';
import { getFieldValue } from 'frontend/utils/sitecore.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IAirportCountry } from 'models/sitecore/IAirportsData';
import AirportCheckboxColumns from 'frontend/components/common/AirportCheckboxColumns/AirportCheckboxColumns';
import SearchBarDropdownScrollableBox from 'frontend/components/common/SearchBarDropdownScrollableBox/SearchBarDropdownScrollableBox';
import SearchPodFooterButtons from 'frontend/components/common/SearchPodFooterButtons/SearchPodFooterButtons';
import { useSearchPodStore } from 'frontend/components/renderings/SearchPod/stores/createStore';

import styles from './SearchBarDropdownAirports.module.scss';

export interface ISearchBarDropdownAirportsProps {
    airports: string[];
    countries: IAirportCountry[];
    id: string;
    onAddAirport: (code: string) => void;
    onClear: () => void;
    onClose: () => void;
    onRemoveAirport: (code: string) => void;
    setOrigins: (codes: string[]) => void;
    applyBtnText?: string;
    isDialogRole?: boolean;
}

const SearchBarDropdownAirports: FC<ISearchBarDropdownAirportsProps> = ({
    airports,
    countries,
    id,
    onAddAirport,
    onClear,
    onClose,
    onRemoveAirport,
    setOrigins,
    applyBtnText,
    isDialogRole,
}) => {
    const { getPhrase, isDisabledItem, isCheckedItem } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        isDisabledItem: stores.searchStore.searchFrom.isDisabledItem,
        isCheckedItem: stores.searchStore.searchFrom.isCheckedItem,
    }));

    const { fields: { FromDropdownStatusResultsCount, FromDropdownLabel } = {} } = useSearchPodStore();

    const normalizedCountries = useMemo(() => getNormalizedCountries(countries || []), [countries]);

    const ariaStatusMessage = useMemo(() => {
        let airportsCount = 0;

        for (const country of normalizedCountries) {
            country.airports.forEach(item => {
                if (!item.airports) {
                    airportsCount++;
                } else {
                    airportsCount += item.airports.length;
                }
            });
        }

        const msg = Tokenizer.replaceToken(
            getFieldValue(FromDropdownStatusResultsCount),
            Tokens.Number,
            airportsCount.toString(),
        );

        return msg;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [normalizedCountries]);

    const titleId = `${id}-title`;
    const ariaAttributes = isDialogRole
        ? { role: 'dialog', 'aria-modal': true, 'aria-labelledby': titleId }
        : undefined;

    return (
        <div className={styles.dropdown} data-tid='airports-dropdown' id={id} {...ariaAttributes}>
            <output className='visually-hidden' id='search-status' aria-live='assertive' aria-relevant='all'>
                {ariaStatusMessage}
            </output>

            <h2 className={styles.head} id={titleId}>
                {getFieldValue(FromDropdownLabel)}
            </h2>

            <SearchBarDropdownScrollableBox className={styles.scrollableBox}>
                <AirportCheckboxColumns
                    countries={normalizedCountries}
                    origins={airports}
                    setOrigins={setOrigins}
                    onAddOrigin={onAddAirport}
                    onRemoveOrigin={onRemoveAirport}
                    isChecked={isCheckedItem}
                    isDisabled={isDisabledItem}
                    isSearchBarDropdown
                />
            </SearchBarDropdownScrollableBox>
            <SearchPodFooterButtons
                applyButtonLabel={applyBtnText || getPhrase(SitecoreDictionary.GlobalsButtonsApply)}
                clearButtonLabel={getPhrase(SitecoreDictionary.GlobalsLabelsClearSelection)}
                isShownClearButton={airports.length > 0}
                onApplyClick={onClose}
                onCloseClick={onClose}
                onClearClick={onClear}
                isApplyButtonDisabled={airports.length === 0}
                fieldName={SearchBarDropdown.From}
            />
        </div>
    );
};

export default observer(SearchBarDropdownAirports);
