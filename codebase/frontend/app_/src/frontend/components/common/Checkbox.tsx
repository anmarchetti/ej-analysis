import * as React from 'react';
import classNames from 'classnames';

import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import SvgTick from 'frontend/components/icons-new/Tick';

import RichTextWithLinks from './RichTextWithLinks';

interface ICheckboxProps {
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    ariaLabel?: string;
    checked?: boolean;
    checkedClassName?: string;
    children?: any;
    className?: string;
    dataTid?: string;
    disabled?: boolean;
    disabledShowUnchecked?: boolean;
    enableIfChecked?: boolean;
    hasError?: boolean;

    id?: string;
    isGreyTheme?: boolean;
    isMultipleSelect?: boolean;
    isPillStyle?: boolean;
    isRadioStyle?: boolean;
    label?: string | ISitecoreField<string>;

    label2?: string | ISitecoreField<string>;
    large?: boolean;
    medium?: boolean;
    render?: () => any;
    required?: boolean;

    rightAlign?: boolean;

    small?: boolean;

    textBig?: boolean;
    textBold?: boolean;
    textLeft?: boolean;
    textRight?: boolean;
    tick?: boolean;
    toggle?: boolean;
}

const Checkbox = React.forwardRef((props: ICheckboxProps, ref) => {
    const className = classNames(
        props.className,
        'checkbox',
        props.isMultipleSelect && 'checkbox--multiple',
        props.small && 'checkbox--small',
        props.textLeft && 'checkbox--text-left',
        props.textBold && 'checkbox--text-bold',
        props.textBig && 'checkbox--text-big',
        props.large && 'checkbox--large',
        props.medium && 'checkbox--medium',
        props.textRight && 'checkbox--text-right',
        props.tick && 'checkbox--tick',
        props.isRadioStyle && 'checkbox--radio',
        props.medium && 'checkbox--medium',
        props.disabled && 'checkbox--disabled',
        props.rightAlign && 'checkbox--right-aligned',
        props.checked && props.checkedClassName,
    );
    const controlClassName = classNames('checkbox__control', props.hasError && 'checkbox__control--error');
    const labelClassName = classNames(
        'checkbox--label',
        props.hasError && 'checkbox--text-error',
        props.isMultipleSelect && props.checked && 'checkbox--text-orange',
    );

    const labelText = typeof props.label === 'object' ? props.label?.value : props.label;
    const label2Text = typeof props.label2 === 'object' ? props.label2?.value : props.label2;

    return props.toggle ? (
        <label className={classNames('toggle check', props.isGreyTheme && 'toggle_gray')} htmlFor={props.id}>
            <input
                type='checkbox'
                checked={props.checked}
                required={props.required}
                onChange={props.onChange}
                id={props.id}
                name={props.id}
            />
            {props.label ? <span className='label label1'>{labelText}</span> : null}
            <span className='check' />
            <span className='switcher' />
            {props.label2 ? <span className='label label2'>{label2Text}</span> : null}
        </label>
    ) : (
        <label className={className} data-tid={props.dataTid} htmlFor={props.id}>
            <input
                type='checkbox'
                checked={props.disabledShowUnchecked ? props.checked && !props.disabled : props.checked}
                onChange={props.onChange}
                disabled={props.enableIfChecked ? !props.checked && props.disabled : props.disabled}
                required={props.required}
                ref={ref ? (ref as React.RefObject<HTMLInputElement>) : undefined}
                id={props.id}
                name={props.id}
            />

            {!props.isPillStyle && (
                <span className={controlClassName}>
                    {(props.tick || props.isRadioStyle) && props.checked && <SvgTick />}
                </span>
            )}

            {props.render?.()}

            {props.children ? (
                <span className={labelClassName}>{props.children}</span>
            ) : typeof props.label === 'object' ? (
                <RichTextWithLinks field={props.label} tag={'span'} className={labelClassName} />
            ) : (
                <>
                    <span className={labelClassName}>{props.label}</span>
                    <span className='visually-hidden'>{props.ariaLabel}</span>
                </>
            )}
        </label>
    );
});

export default Checkbox;
