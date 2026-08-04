import { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import CheckboxItem from 'frontend/components/common/CheckboxItem/CheckboxItem';
import { useSearchPodStore } from 'frontend/components/renderings/SearchPod/stores/createStore';

const AnywhereInput: FC = () => {
    const { isAnywhereSelected, onAnywhereCheck, getPhrase, trackToAnywhereSelect } = useStore(stores => ({
        isAnywhereSelected: stores.searchStore.searchTo.isAnywhereSelected,
        onAnywhereCheck: stores.searchStore.onAnywhereCheck,
        getPhrase: stores.layoutStore.getPhrase,
        trackToAnywhereSelect: stores.trackingStore.searchPod.trackToAnywhereSelect,
    }));
    const { isSearchPodInitialized } = useSearchPodStore() || {};

    const handleAnywhereCheck = (): void => {
        onAnywhereCheck(false);

        if (isSearchPodInitialized) {
            trackToAnywhereSelect();
        }
    };

    return (
        <CheckboxItem
            code='anywhere'
            checked={isAnywhereSelected}
            onChange={handleAnywhereCheck}
            disabled={false}
            name={getPhrase(SitecoreDictionary.SearchPodLabelsAnywhere)}
        />
    );
};

export default observer(AnywhereInput);
