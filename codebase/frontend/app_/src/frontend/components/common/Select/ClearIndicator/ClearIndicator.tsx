import { components } from 'react-select';
import classNames from 'classnames';

import Cross from 'frontend/components/icons-new/Cross';

import styles from './ClearIndicator.module.scss';

const ClearIndicator = ({ className, onMouseDown, ...props }) => (
    <components.ClearIndicator {...props}>
        {onMouseDown ? (
            <button type='button' className={styles.btn} onMouseDown={onMouseDown}>
                <i className={classNames(styles.clearIndicator, className)} data-tid='clear-indicator-icon'>
                    <Cross />
                </i>
            </button>
        ) : (
            <i className={classNames(styles.clearIndicator, className)} data-tid='clear-indicator-icon'>
                <Cross />
            </i>
        )}
    </components.ClearIndicator>
);

export default ClearIndicator;
