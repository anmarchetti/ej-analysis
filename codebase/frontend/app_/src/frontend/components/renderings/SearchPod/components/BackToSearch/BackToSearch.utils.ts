import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getFieldValue } from 'frontend/utils/sitecore.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { useSearchPodStore } from 'frontend/components/renderings/SearchPod/stores/createStore';

export const useBackButtonLabel = (isMobile: boolean, isBackToPrevUrl: boolean): string => {
    const { getPhrase } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const { fields: { BackToSearchButtonText } = {} } = useSearchPodStore();

    if (isBackToPrevUrl) {
        return getPhrase(SitecoreDictionary.GlobalsButtonsBack);
    }

    return isMobile ? getPhrase(SitecoreDictionary.GlobalsButtonsBack) : getFieldValue(BackToSearchButtonText);
};

export const useEditButtonLabel = (isMobile: boolean, isEditMode: boolean): string => {
    const { fields: { CloseSearchCriteria, CloseSearchCriteriaMobile, EditSearch, EditSearchMobile } = {} } =
        useSearchPodStore();

    if (isMobile) {
        return isEditMode ? getFieldValue(CloseSearchCriteriaMobile) : getFieldValue(EditSearchMobile);
    }

    return isEditMode ? getFieldValue(CloseSearchCriteria) : getFieldValue(EditSearch);
};
