import React from 'react';
import { components } from 'react-select';

import styles from './MultiValueContainer.module.scss';

const MultiValueContainer = ({ children, props }) => (
    <components.MultiValueContainer {...props}>
        <div className={styles.multiValueContainer} data-tid='multi-value-container'>
            {children}
        </div>
    </components.MultiValueContainer>
);

export default MultiValueContainer;
