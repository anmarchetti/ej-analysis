import { FC } from 'react';
import { observer } from 'mobx-react';

import { getDigits } from './AnimatedCounter.utils';
import NumberColumn from './NumberColumn';

import styles from './AnimatedCounter.module.scss';

export interface IAnimatedCounterProps {
    value?: number;
}

const AnimatedCounter: FC<IAnimatedCounterProps> = ({ value = 0 }) => {
    const digits = getDigits(value);

    return (
        <div className={styles.wrapper}>
            {digits.map(({ value, id }) => (
                <NumberColumn key={id} digit={value} />
            ))}
        </div>
    );
};

export default observer(AnimatedCounter);
