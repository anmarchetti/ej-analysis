import { FunctionComponent } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { GuestType } from 'models/enum/GuestType';
import { getAccommodationMeta } from 'frontend/components/common/HolidaySummary/HolidaySummary.utils';

import styles from './HolidaySummaryPlainOptions.module.scss';

interface IHolidaySummaryPlainOptionsProps {
    guestsCount: Record<GuestType, number>;
    dataTid?: string;
}

const HolidaySummaryPlainOptions: FunctionComponent<IHolidaySummaryPlainOptionsProps> = ({
    guestsCount,
    dataTid = 'summary-plain-option',
}) => {
    const { getPhrase } = useStore(store => ({
        getPhrase: store.layoutStore.getPhrase,
    }));

    const options = getAccommodationMeta(guestsCount, getPhrase);

    if (!options.length) {
        return null;
    }

    return (
        <div className={classNames(styles.container, 'plain-options')} data-tid={dataTid}>
            {options.map(({ label, Icon }, i) => (
                <div key={label} className={styles.item}>
                    <Icon data-tid={`${dataTid}-icon-${i}`} className={styles.icon} />
                    <div data-tid={`${dataTid}-title-${i}`} className={styles.title}>
                        {label}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default HolidaySummaryPlainOptions;
