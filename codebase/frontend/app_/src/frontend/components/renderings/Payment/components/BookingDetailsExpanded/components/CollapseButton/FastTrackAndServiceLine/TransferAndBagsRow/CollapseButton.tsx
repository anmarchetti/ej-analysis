import { FC } from 'react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import IconChevronUp from 'frontend/components/icons-new/ChevronUp';

import styles from './CollapseButton.module.scss';

export type TCollapseButtonProps = {
    onClick: () => void;
};

export const CollapseButton: FC<TCollapseButtonProps> = ({ onClick }) => {
    const { getPhrase } = useStore(({ layoutStore }: TStores) => ({
        getPhrase: layoutStore.getPhrase,
    }));

    return (
        <Button isText onClick={onClick} dataTid='collapse-toggle' className={styles.collapseBtn}>
            {getPhrase(SitecoreDictionary.PaymentButtonsHideDetails)}
            <IconChevronUp className={styles.btnIcon} />
        </Button>
    );
};

export default CollapseButton;
