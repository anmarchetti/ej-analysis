import { FC } from 'react';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { BaseSearchFilterStore } from 'frontend/store/base/search/BaseSearchFilterStore';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import AnimatedCounter from 'frontend/components/common/AnimatedCounter/AnimatedCounter';
import Button from 'frontend/components/common/Button';

import styles from './FilterHeader.module.scss';

interface IFilterHeader {
    storeInstance: BaseSearchFilterStore;
}

const FilterHeader: FC<IFilterHeader> = ({ storeInstance }) => {
    const { onClearAll, countableFilters, hideClearAllBtn } = storeInstance;
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const amount = countableFilters.length;

    return (
        <div className={styles.filtersHeader} data-tid='filters-header'>
            <span className='filter-count'>
                <AnimatedCounter value={amount} />

                {Tokenizer.replaceToken(
                    getPhrase(
                        amount === 1
                            ? SitecoreDictionary.SearchPodFiltersLabelsNumberOfSelectedFiltersSingle
                            : SitecoreDictionary.SearchPodFiltersLabelsNumberOfSelectedFilters,
                    ),
                    Tokens.FilterCount,
                    '',
                )}
            </span>

            {!!amount && !hideClearAllBtn && (
                <Button isTransparent onClick={onClearAll} data-tid='clear-all-button'>
                    {getPhrase(SitecoreDictionary.GlobalsButtonsClearAll)}
                </Button>
            )}
        </div>
    );
};

export default observer(FilterHeader);
