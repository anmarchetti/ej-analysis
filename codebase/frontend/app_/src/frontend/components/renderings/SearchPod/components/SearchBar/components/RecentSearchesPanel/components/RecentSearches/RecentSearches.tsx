import { FC, useEffect, useState } from 'react';
import * as React from 'react';
import { Transition } from 'react-transition-group';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { buildKeyBasedOnMarket } from 'frontend/utils/market.utils';
import { getValidSearches } from 'frontend/utils/search/search.utils';
import { getFieldValue } from 'frontend/utils/sitecore.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { getWebStorageItem, removeWebStorageItem, setWebStorageItem } from 'frontend/utils/webStorage.utils';
import { IPrefilledSearchParams } from 'models/data/IPrefilledSearchParams';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';
import Button from 'frontend/components/common/Button';
import Drawer from 'frontend/components/common/Drawer';
import SvgChevronDown from 'frontend/components/icons-new/ChevronDown';
import SvgChevronRight from 'frontend/components/icons-new/ChevronRight';
import styles from 'frontend/components/renderings/SearchPod/components/SearchBar/components/RecentSearchesPanel/components/RecentSearches/RecentSearches.module.scss';
import RecentSearchesContent from 'frontend/components/renderings/SearchPod/components/SearchBar/components/RecentSearchesPanel/components/RecentSearchesContent/RecentSearchesContent';
import { useSearchPodStore } from 'frontend/components/renderings/SearchPod/stores/createStore';

export interface IRecentSearchesProps {
    changeSelectedDropdown: (dropdown?: SearchBarDropdown | null) => void;
    isHidden: boolean;
    isOpen: boolean;
}

export enum RecentSearchesActions {
    Open = 'Open',
    Close = 'Close',
    Clear = 'Clear',
    Cancel = 'Cancel',
    Select = 'Select',
    Delete = 'Delete',
}

export const RecentSearches: FC<IRecentSearchesProps> = ({ isOpen, isHidden, changeSelectedDropdown }) => {
    const {
        getPhrase,
        prefillSearchParams,
        isHomePage,
        isMonthSearchEnabled,
        marketCode,
        marketSettings,
        getSettingAsNumber,
        trackRecentSearches,
    } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        prefillSearchParams: stores.searchStore.prefillSearchParams,
        isHomePage: stores.layoutStore.isHomePage,
        isMonthSearchEnabled: stores.layoutStore.isMonthSearchEnabled,
        marketCode: stores.marketStore.marketCode,
        marketSettings: stores.marketStore.marketSettings,
        getSettingAsNumber: stores.layoutStore.getSettingAsNumber,
        trackRecentSearches: stores.trackingStore.searchPod.trackRecentSearches,
    }));

    const { fields: { ViewRecentSearchesPlural, ViewRecentSearchesSingular, CloseRecentSearches } = {} } =
        useSearchPodStore();

    const isMobile = useMobileViewport();

    const [recentSearches, setRecentSearches] = useState<IPrefilledSearchParams[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const recentSearchesKey = buildKeyBasedOnMarket(WebStorageKeys.RecentSearches, marketCode);
    const searchParamsKey = buildKeyBasedOnMarket(WebStorageKeys.SearchParams, marketCode);

    const viewRecentSearchesLabel = Tokenizer.replaceToken(
        recentSearches.length > 1 ? getFieldValue(ViewRecentSearchesPlural) : getFieldValue(ViewRecentSearchesSingular),
        Tokens.Amount,
        recentSearches.length.toString(),
    );

    useEffect(() => {
        const receivedRecentSearches = getWebStorageItem(recentSearchesKey, true) || [];
        const receivedSearchParams = getWebStorageItem<IPrefilledSearchParams>(searchParamsKey, true);
        const expirationMonths = getSettingAsNumber(SiteSettings.RecentSearchesExpirationMonths);
        const validSearches = getValidSearches(
            receivedRecentSearches,
            marketSettings?.AirportDepartureCodes || [],
            expirationMonths,
            isMonthSearchEnabled,
        );
        setRecentSearches(validSearches);

        if (receivedRecentSearches.length !== validSearches.length) {
            setWebStorageItem(recentSearchesKey, validSearches);
        }

        // If Month Search is disabled in Sitecore, and the received search params contains isMonthSearch,
        // replace them with a recent valid search (where isMonthSearch is false) before pre-filling the search pod.
        if (!isMonthSearchEnabled && receivedSearchParams?.isMonthSearch) {
            const validSearchParam = validSearches.length ? validSearches[0] : undefined;
            setWebStorageItem(searchParamsKey, validSearchParam);
        }
    }, [isMonthSearchEnabled]);

    /**
     * Removes recent search from LS
     */
    const onClearOne = (index: number): void => {
        const updatedSearches = [...recentSearches];
        updatedSearches.splice(index, 1);
        setRecentSearches(updatedSearches);

        if (selectedIndex !== null) {
            if (selectedIndex === index) {
                setSelectedIndex(null);
            } else if (selectedIndex > index) {
                setSelectedIndex(selectedIndex - 1);
            }
        }

        setWebStorageItem(recentSearchesKey, updatedSearches);
        trackRecentSearches(RecentSearchesActions.Delete, [recentSearches[index]]);
    };

    const closeRecentSearches = (): void => {
        changeSelectedDropdown(null);
    };

    const closeButtonHandler = (): void => {
        closeRecentSearches();
        trackRecentSearches(RecentSearchesActions.Close, recentSearches);
    };

    const cancelButtonHandler = (): void => {
        closeRecentSearches();
        trackRecentSearches(RecentSearchesActions.Cancel, recentSearches);
    };

    const openRecentSearches = (): void => {
        changeSelectedDropdown(SearchBarDropdown.Recent);
        trackRecentSearches(RecentSearchesActions.Open, recentSearches);
    };

    /**
     * Additional actions when list item is selected
     */
    const onApply = (index: number): void => {
        setSelectedIndex(index);
        prefillSearchParams(recentSearches[index], !isHomePage);
        closeRecentSearches();

        trackRecentSearches(RecentSearchesActions.Select, [recentSearches[index]]);
    };

    /**
     * Removes all recent searches from LS
     */
    const onClearAll = (): void => {
        setRecentSearches([]);
        setSelectedIndex(null);
        removeWebStorageItem(recentSearchesKey);
        closeRecentSearches();
        trackRecentSearches(RecentSearchesActions.Clear, recentSearches);
    };

    if (!recentSearches.length) {
        return null;
    }

    return (
        <Transition in={!isHidden} timeout={0}>
            {(state): JSX.Element => (
                <>
                    {isOpen ? (
                        <Button
                            isText
                            isTransparent
                            className={classNames(styles.toggle, styles[state])}
                            dataTid='recent-search-btn'
                            onClick={closeButtonHandler}
                        >
                            {!isMobile && <SvgChevronDown className={styles.iconArrow} />}
                            {getFieldValue(CloseRecentSearches)}
                            {isMobile && <SvgChevronRight className={styles.iconArrow} />}
                        </Button>
                    ) : (
                        <Button
                            isText
                            isTransparent
                            className={classNames(styles.toggle, styles[state])}
                            dataTid='recent-search-btn'
                            onClick={openRecentSearches}
                        >
                            {!isMobile && <SvgChevronDown className={styles.iconArrow} />}
                            {viewRecentSearchesLabel}
                            {isMobile && <SvgChevronRight className={styles.iconArrow} />}
                        </Button>
                    )}

                    <div className={classNames(styles.recentSearches, styles[state], isOpen && styles.isOpen)}>
                        {!isMobile ? (
                            isOpen && (
                                <div className={classNames(styles.desktopDropdown)}>
                                    <RecentSearchesContent
                                        items={recentSearches}
                                        selectedIndex={selectedIndex}
                                        onApply={onApply}
                                        onClearOne={onClearOne}
                                        onClearAll={onClearAll}
                                        onCancel={cancelButtonHandler}
                                    />
                                </div>
                            )
                        ) : (
                            <Drawer open={isOpen} className='text-start'>
                                {/* To reduce api calls on page loads, don't render the content until the drawer opens */}
                                {isOpen && (
                                    <div className={classNames(styles.mobileDropdown)}>
                                        <RecentSearchesContent
                                            items={recentSearches}
                                            selectedIndex={selectedIndex}
                                            onApply={onApply}
                                            onClearOne={onClearOne}
                                            onClearAll={onClearAll}
                                            onCancel={cancelButtonHandler}
                                        />
                                    </div>
                                )}

                                <div className='drawer__actions'>
                                    <Button isTransparent isFullWidth onClick={closeButtonHandler} dataTid='close-btn'>
                                        {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                                    </Button>
                                </div>
                            </Drawer>
                        )}
                    </div>
                </>
            )}
        </Transition>
    );
};

export default observer(RecentSearches);
