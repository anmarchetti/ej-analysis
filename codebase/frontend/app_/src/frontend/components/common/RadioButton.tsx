import React, { FC } from 'react';
import classNames from 'classnames';

export interface IRadioButtonProps {
    checked?: boolean;
    children?: React.ReactNode;
    className?: string;
    csMask?: boolean;
    dataTid?: string;
    disabled?: boolean;
    id?: string;
    label?: string | JSX.Element;
    labelClass?: string;
    name?: string;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    pill?: boolean;
    readOnly?: boolean;
    value?: string | number;
}

const RadioButton: FC<IRadioButtonProps> = props => (
    <label
        className={classNames(
            'radio',
            props.disabled && 'radio--disabled',
            props.checked && 'radio--checked',
            props.pill && 'radio--pill',
            props.className,
        )}
        data-tid={props.dataTid}
        htmlFor={props.id}
    >
        <input
            type='radio'
            name={props.name}
            checked={props.checked}
            disabled={props.disabled}
            readOnly={props.readOnly}
            onChange={e => props.onChange?.(e)}
            value={props.value ?? 'on'}
            id={props.id}
        />
        {props.label && (
            <span
                data-tid='radio-label'
                className={classNames('radio__label', props.labelClass)}
                data-cs-mask={props.csMask}
            >
                {props.label}
            </span>
        )}
        {props.children}
    </label>
);

export default RadioButton;
