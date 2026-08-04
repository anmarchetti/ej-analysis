import { FC } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import styles from './NewItemPill.module.scss';

export interface INewItemPillProps {
    className?: string;
    isShown?: boolean;
}

export const NewItemPill: FC<INewItemPillProps> = ({ isShown = false, className }) => {
    const { getPhrase } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const newLabel = getPhrase(SitecoreDictionary.GlobalsLabelsNewLabel);

    if (!isShown || !newLabel) {
        return null;
    }

    return (
        <div data-tid='new-item-pill' className={classNames(styles.pill, className)}>
            {newLabel}
        </div>
    );
};

export default NewItemPill;
