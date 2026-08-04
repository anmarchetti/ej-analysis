import React, { FC } from 'react';

import Checkbox from 'frontend/components/common/Checkbox';
import IconBed from 'frontend/components/icons/Bed';
import IconMapMarker from 'frontend/components/icons/MapMarker';

import styles from './CheckboxItem.module.scss';

interface ICheckboxItemProps {
    checked: boolean;
    code: string;
    name: string;
    onChange: (e) => void;
    dataType?: string;
    disabled?: boolean;

    disabledShowUnchecked?: boolean;
    enableIfChecked?: boolean;
    hotelIcon?: boolean;

    icon?: boolean;
}

const CheckboxItem: FC<ICheckboxItemProps> = props => (
    <div className={styles.item} data-tid={props.code} data-type={props.dataType}>
        <Checkbox
            tick
            medium
            checked={props.checked}
            onChange={props.onChange}
            disabled={props.disabled}
            enableIfChecked={props.enableIfChecked}
            disabledShowUnchecked={props.disabledShowUnchecked}
            render={() => (
                <span className={styles.content}>
                    {props.icon && <IconMapMarker />}
                    {props.hotelIcon && <IconBed />}

                    {props.name}
                </span>
            )}
        />
    </div>
);

export default CheckboxItem;
