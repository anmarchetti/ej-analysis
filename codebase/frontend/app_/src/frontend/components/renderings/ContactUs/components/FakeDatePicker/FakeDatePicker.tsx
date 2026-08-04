import React, { FC } from 'react';
import classNames from 'classnames';

import { Tokens } from 'code/tokens';
import { Tokenizer } from 'frontend/utils/tokenizer';
import IconCalendar from 'frontend/components/icons/Calendar';

import styles from './FakeDatePicker.module.scss';

export interface IFakeDatePickerProps {
    ariaExpanded: boolean;
    ariaLabelNoSelection: string;
    ariaLabelSelectedValue: string;
    id: string;
    label: string;
    onClick: () => void;
    value: string;
}

export const FakeDatePicker: FC<IFakeDatePickerProps> = ({
    label,
    value,
    onClick,
    ariaExpanded,
    ariaLabelNoSelection,
    ariaLabelSelectedValue,
    id,
}) => {
    const ariaLabel = value
        ? Tokenizer.replaceToken(ariaLabelSelectedValue, Tokens.Value, value)
        : ariaLabelNoSelection;

    return (
        <div className={styles.fakeDatePicker}>
            <button
                id={id}
                data-tid='booking-dates-picker'
                type='button'
                className={styles.fakeInput}
                onClick={onClick}
                aria-label={ariaLabel}
                aria-haspopup='dialog'
                aria-expanded={ariaExpanded}
            >
                {value}
            </button>
            <IconCalendar isUnwrapped className={classNames(styles.icon)} />
            <label
                className={classNames(styles.label, value && styles.floatingLabel)}
                htmlFor={id}
                data-tid='booking-dates-picker-label'
            >
                {label}
            </label>
        </div>
    );
};

export default FakeDatePicker;
