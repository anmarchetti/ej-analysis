import classNames from 'classnames';

import SvgTick from 'frontend/components/icons-new/Tick';

import styles from './TickCheck.module.scss';

export interface ITickCheckProps {
    index?: number;
    isChecked?: boolean;
    isDisabled?: boolean;
}

const TickCheck = ({ isChecked, isDisabled, index }: ITickCheckProps) => (
    <div
        className={classNames(
            styles.container,
            {
                [styles.checked]: isChecked,
                [styles.disabled]: isDisabled,
            },
            'tick-check',
        )}
        data-tid='tick'
    >
        {isChecked ? <SvgTick /> : index}
    </div>
);

export default TickCheck;
