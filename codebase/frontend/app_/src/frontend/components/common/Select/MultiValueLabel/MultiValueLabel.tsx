import React from 'react';
import { components } from 'react-select';

import styles from './MultiValueLabel.module.scss';

const MultiValueLabel = ({ children, props }) => (
    <components.MultiValueLabel {...props}>
        <div className={styles.multiValueLabel} data-tid='multi-value-content'>
            {children}
        </div>
    </components.MultiValueLabel>
);

export default MultiValueLabel;
