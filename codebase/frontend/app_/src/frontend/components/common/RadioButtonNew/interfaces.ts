import React from 'react';

export interface IRadioButtonNewProps {
    checked?: boolean;
    children?: React.JSX.Element;
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
