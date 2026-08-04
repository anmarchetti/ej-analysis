import { FC } from 'react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import SvgCalendarLined from 'frontend/components/icons-new/CalendarLined';

import styles from './ComparePriceButton.module.scss';

export interface IComparePriceButtonProps {
    onClick: () => void;
}

const ComparePriceButton: FC<IComparePriceButtonProps> = ({ onClick }) => {
    const { getPhrase } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    return (
        <Button className={styles.button} type='button' onClick={onClick} data-tid='compare-price-button' isOutlined>
            <i className={styles.icon}>
                <SvgCalendarLined />
            </i>

            {getPhrase(SitecoreDictionary.PriceGraphButtonsViewComparePrices)}
        </Button>
    );
};

export default ComparePriceButton;
