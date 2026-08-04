import { FC } from 'react';
import { observer } from 'mobx-react';

import useNumberColumn, { RANGE_10_ARRAY } from './NumberColumn.utils';

interface INumberColumn {
    digit: number;
}

import styles from './NumberColumn.module.scss';

const NumberColumn: FC<INumberColumn> = ({ digit }) => {
    const { containerRef } = useNumberColumn({ digit });

    return (
        <div className={styles.wrapper} ref={containerRef}>
            <div className={styles.column}>
                {RANGE_10_ARRAY.map(num => (
                    <span key={num} className={styles.digit} data-tid={digit === num ? 'selected-digit' : ''}>
                        {num}
                    </span>
                ))}
            </div>

            <span className={styles.placeholder}>0</span>
        </div>
    );
};

export default observer(NumberColumn);
