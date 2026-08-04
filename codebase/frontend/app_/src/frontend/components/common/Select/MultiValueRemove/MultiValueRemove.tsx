import React from 'react';
import { components } from 'react-select';

import Cross from 'frontend/components/icons-new/Cross';

import styles from './MultiValueRemove.module.scss';

const MultiValueRemove = props => (
    <components.MultiValueRemove {...props}>
        <Cross className={styles.multiValueRemove} />
    </components.MultiValueRemove>
);

export default MultiValueRemove;
