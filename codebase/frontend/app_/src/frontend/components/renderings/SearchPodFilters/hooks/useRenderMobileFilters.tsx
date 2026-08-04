import classNames from 'classnames';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import SearchFilterStore from 'frontend/store/holidays/search/SearchFiltersStore';
import { TStores } from 'frontend/store/IStores';
import { isLoadingStatus } from 'models/enum/DataStatus';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import MobileFilterModal from 'frontend/components/common/MobileFilterModal/MobileFilterModal';
import Popup from 'frontend/components/common/Popup/PopupNew';
import SvgFilterLined from 'frontend/components/icons-new/FilterLined';
import SvgTick from 'frontend/components/icons-new/Tick';

export interface IUseRenderMobileFiltersReturn {
    renderFiltersButton: (params: { className?: string } | void) => JSX.Element;
    renderFiltersPopup: () => JSX.Element | null;
}

const cb = (ctx: SearchFilterStore) => {
    ctx.selectedFilterGroups = new Set();
    ctx.isModalDisplayed = false;
};

export const useRenderMobileFilters = (): IUseRenderMobileFiltersReturn => {
    const { getPhrase, status, amount, isFiltersLoaded, isModalDisplayed, onChangeSearchFilterStore, isPromoPage } =
        useStore((stores: TStores) => ({
            getPhrase: stores.layoutStore.getPhrase,
            status: stores.hotelsStore.status,
            amount: stores.searchFiltersStore.countableFilters.length,
            isFiltersLoaded: stores.searchFiltersStore.isFiltersLoaded,
            isModalDisplayed: stores.searchFiltersStore.isModalDisplayed,
            onChangeSearchFilterStore: stores.searchFiltersStore.onChangeSearchFilterStore,
            isPromoPage: stores.layoutStore.isPromoPage,
        }));

    const isMobile = useMobileViewport();

    const renderFiltersPopup = () => {
        if (!isMobile || !isModalDisplayed) return null;

        // Unfortunately, we are limited in making changes
        // to non-interactive components due to SonarCloud rules.
        // This means that if we change the onClick
        // in PopupNew (div element), SonarCloud will not allow these changes.
        return (
            <Popup fullWidth onClose={() => {}}>
                {() => (
                    <MobileFilterModal
                        onClose={() => {
                            onChangeSearchFilterStore({
                                cb,
                            });
                        }}
                    />
                )}
            </Popup>
        );
    };

    const renderFiltersButton = ({ className }: { className?: string } | void = {}) => {
        if (isLoadingStatus(status) && !isFiltersLoaded) {
            return (
                <div
                    className={classNames('placeholder-filter-btn placeholder-shimmer', className)}
                    data-tid='shimmer'
                />
            );
        }

        return (
            <div className={classNames('search-filter', className)} data-tid='search-filter'>
                <Button
                    isText={!isPromoPage}
                    isOutlined={isPromoPage}
                    id='filter-button'
                    onClick={() => onChangeSearchFilterStore({ key: 'isModalDisplayed', value: true })}
                    className={classNames('search-pod-filter__button')}
                    dataTid='filter-button'
                >
                    <i>
                        <SvgFilterLined />
                    </i>
                    <span>{getPhrase(SitecoreDictionary.SearchPodFiltersTitlesFilters)}</span>
                    {!!amount && (
                        <i className='active-icon' data-tid='active-icon'>
                            <SvgTick />
                        </i>
                    )}
                </Button>
            </div>
        );
    };

    return {
        renderFiltersButton,
        renderFiltersPopup,
    };
};
