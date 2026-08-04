import React from 'react';
import { components } from 'react-select';
import classNames from 'classnames';

import SVGChevronDown from 'frontend/components/icons-new/ChevronDown';

import styles from './DropdownIndicator.module.scss';

const DropdownIndicator = props => (
    <components.DropdownIndicator {...props}>
        <i className={classNames('select-group__control--icon', props.isMulti && styles.multiDropdownIndicator)}>
            <SVGChevronDown />
        </i>
    </components.DropdownIndicator>
);
export default DropdownIndicator;
