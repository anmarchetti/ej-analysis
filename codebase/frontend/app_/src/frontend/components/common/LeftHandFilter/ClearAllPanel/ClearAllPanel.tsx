import { FC } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { BaseSearchFilterStore } from 'frontend/store/base/search/BaseSearchFilterStore';
import { IHolidaysStores } from 'frontend/store/holidays/create-stores';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';

import styles from './ClearAllPanel.module.scss';

interface IClearAllPanel {
    storeInstance: BaseSearchFilterStore;
}

const ClearAllPanel: FC<IClearAllPanel> = ({ storeInstance }) => {
    const { onClearAll, countableFilters, hideClearAllBtn } = storeInstance;
    const { isScreenLessMedium, getPhrase } = useStore((stores: IHolidaysStores) => ({
        isScreenLessMedium: stores.appStore.isScreenLessMedium,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    if (!isScreenLessMedium) return null;

    const amount = countableFilters.length;

    return (
        <div data-tid='clear-panel' className={classNames(styles.clear, { [styles.hidden]: !amount })}>
            {!hideClearAllBtn && (
                <Button isTransparent onClick={onClearAll}>
                    {getPhrase(SitecoreDictionary.GlobalsButtonsClearAll)}
                </Button>
            )}

            <span className={styles.text}>
                {Tokenizer.replaceToken(
                    getPhrase(
                        amount === 1
                            ? SitecoreDictionary.SearchPodFiltersLabelsNumberOfSelectedFiltersSingle
                            : SitecoreDictionary.SearchPodFiltersLabelsNumberOfSelectedFilters,
                    ),
                    Tokens.FilterCount,
                    amount.toString(),
                )}
            </span>
        </div>
    );
};

export default observer(ClearAllPanel);
