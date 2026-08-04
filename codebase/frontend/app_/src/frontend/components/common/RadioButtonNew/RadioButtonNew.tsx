import React, { FC } from 'react';
import classNames from 'classnames';

import { IRadioButtonNewProps } from './interfaces';

import styles from './RadioButtonNew.module.scss';

const RadioButtonNew: FC<IRadioButtonNewProps> = ({
    checked,
    disabled,
    dataTid,
    id,
    readOnly,
    pill,
    name,
    onChange,
    value,
    label,
    csMask,
    labelClass,
    children,
}) => (
    <label
        className={classNames({
            [styles.radioButton]: true,
            [styles.disabled]: disabled,
            [styles.checked]: checked,
            [styles.pill]: pill,
        })}
        data-tid={dataTid}
        htmlFor={id}
    >
        <input
            type='radio'
            name={name}
            checked={checked}
            disabled={disabled}
            readOnly={readOnly}
            onChange={e => onChange?.(e)}
            value={value ?? 'on'}
            id={id}
        />
        {label && (
            <span data-tid='radio-label' className={classNames(styles.label, labelClass)} data-cs-mask={csMask}>
                {label}
            </span>
        )}
        {children}
    </label>
);

export default RadioButtonNew;
