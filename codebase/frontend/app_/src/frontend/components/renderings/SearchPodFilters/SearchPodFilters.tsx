import React, { FC, useEffect, useRef, useState } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { isErrorStatus, isLoadingStatus } from 'models/enum/DataStatus';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import Button from 'frontend/components/common/Button';
import FiltersLoadingScreen from 'frontend/components/common/FiltersLoadingScreen/FiltersLoadingScreen';
import IconCalendar from 'frontend/components/icons/Calendar';
import OffersSort from 'frontend/components/renderings/SearchResults/components/OffersSort/OffersSort';
import PromoPageEditSearch from 'frontend/components/renderings/SearchResults/components/PromoPageEditSearch';

import { useRenderMobileFilters } from './hooks/useRenderMobileFilters';

import styles from './SearchPodFilters.module.scss';

export type TSearchPodFiltersProps = ISitecoreComponent<null, null>;

const STICKY_WRAPPER_OFFSET_TOP = 20;
export const SP_FILTERS_WRAPPER_DATA_TID = 'search-pod-filters-wrapper';

export const SearchPodFilters: FC<TSearchPodFiltersProps> = props => {
    const {
        isMaintenance,
        isPromoPage,
        getPhrase,
        setNeedOpenWhenField,
        setNeedOpenWhoField,
        status,
        isInitialPaxIsDefault,
        isFiltersLoadingScreenDisplayed,
        isFiltersLoaded,
    } = useStore((stores: TStores) => ({
        isMaintenance: stores.layoutStore.isMaintenance,
        isPromoPage: stores.layoutStore.isPromoPage,
        getPhrase: stores.layoutStore.getPhrase,
        setNeedOpenWhenField: stores.searchStore.setNeedOpenWhenField,
        setNeedOpenWhoField: stores.searchStore.setNeedOpenWhoField,
        status: stores.hotelsStore.status,
        isInitialPaxIsDefault: stores.promoPageStore.isInitialPaxIsDefault,
        isFiltersLoadingScreenDisplayed: stores.searchFiltersStore.isFiltersLoadingScreenDisplayed,
        isFiltersLoaded: stores.searchFiltersStore.isFiltersLoaded,
    }));

    const [isChooseDatesVisible, setIsChooseDatesVisible] = useState(false);

    const filterWrapper = useRef<HTMLDivElement>(null);

    const isMobile = useMobileViewport();

    const changeChooseDatesButtonState = () => {
        if (filterWrapper.current) {
            const viewportOffset = filterWrapper.current.getBoundingClientRect();

            setIsChooseDatesVisible(viewportOffset.top <= STICKY_WRAPPER_OFFSET_TOP);
        }
    };

    const openWhenField = () => {
        setNeedOpenWhenField(true);
    };

    const showPopup = () => {
        isInitialPaxIsDefault() ? setNeedOpenWhenField(true) : setNeedOpenWhoField(true);
    };

    useEffect(() => {
        if (isMaintenance || !isMobile || !isPromoPage) {
            return;
        }

        document.addEventListener('scroll', changeChooseDatesButtonState);

        return () => {
            document.removeEventListener('scroll', changeChooseDatesButtonState);
        };
    }, [isMaintenance, isMobile, isPromoPage]);

    const { renderFiltersPopup, renderFiltersButton } = useRenderMobileFilters();

    if ((isErrorStatus(status) && isPromoPage) || isMaintenance) {
        return null;
    }

    const isLoading = isLoadingStatus(status) && !isFiltersLoaded;

    return (
        <div
            className='wrapper-container py-0 wrapper-container--px search-pod-filters'
            ref={filterWrapper}
            data-tid={SP_FILTERS_WRAPPER_DATA_TID}
        >
            {isMobile && isPromoPage && isChooseDatesVisible && !isFiltersLoadingScreenDisplayed && (
                <Button className='promo-search-pod__dates-button' onClick={openWhenField}>
                    <IconCalendar />
                    <span>{getPhrase(SitecoreDictionary.SearchPodFiltersButtonsChooseDates)}</span>
                </Button>
            )}

            {isFiltersLoadingScreenDisplayed && <FiltersLoadingScreen />}

            {renderFiltersPopup()}

            {!isFiltersLoadingScreenDisplayed && (
                <div
                    data-tid='search-pod-filters-inner'
                    className={classNames({
                        'search-pod-filters__inner': true,
                        'promo-search-pod__filters': isPromoPage,
                        'search-pod-filters__loader': isLoading,
                    })}
                >
                    {isMobile && (
                        <div
                            className={classNames(styles.actions, {
                                [styles.promoActions]: isPromoPage,
                            })}
                        >
                            {renderFiltersButton({
                                className: classNames({
                                    [styles.filterWideBtn]: isPromoPage,
                                }),
                            })}

                            <OffersSort className={styles.childBtn} />
                            <Placeholder name={PlaceholderNames.SearchResultsMap} rendering={props.rendering} />
                            {isPromoPage && (
                                <PromoPageEditSearch
                                    onClick={showPopup}
                                    className={styles.childBtn}
                                    isLoading={isLoading}
                                />
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default observer(SearchPodFilters);
