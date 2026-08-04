import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import LoadingAnimation from 'frontend/components/common/LoadingAnimation/LoadingAnimation';

import styles from './FiltersLoadingScreen.module.scss';

const FiltersLoadingScreen = () => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    return (
        <div className={styles.filtersLoadingWrapper} data-tid='filters-loading-wrapper'>
            <LoadingAnimation />
            <h3 className={styles.loadingTitle} data-tid='filters-loading-title'>
                {getPhrase(SitecoreDictionary.SearchPodFiltersPromoPageLabelsLoadingTitle)}
            </h3>
            <p className={styles.loadingSubtitle} data-tid='filters-loading-subtitle'>
                {getPhrase(SitecoreDictionary.SearchPodFiltersPromoPageLabelsLoadingSubtitle)}
            </p>
        </div>
    );
};

export default FiltersLoadingScreen;
