import { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import LeftHandFilters from 'frontend/components/common/LeftHandFilter';
import styles from 'frontend/components/common/MapPopup/MapPopup.module.scss';

export interface IMobileFiltersModalProps {
    onClose: () => void;
}

const MobileFilterModal: FC<IMobileFiltersModalProps> = ({ onClose }) => {
    const { getPhrase } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    return (
        <div className={styles.leftColumn}>
            <LeftHandFilters />

            <div className={styles.footer} data-tid='mobile-filters-modal-footer'>
                <Button isTransparent isFullWidth onClick={onClose} dataTid='close-filters-container-mobile-btn'>
                    {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                </Button>

                <Button isFullWidth onClick={onClose} dataTid='apply-filters-container-mobile-btn'>
                    {getPhrase(SitecoreDictionary.GlobalsButtonsApply)}
                </Button>
            </div>
        </div>
    );
};

export default observer(MobileFilterModal);
