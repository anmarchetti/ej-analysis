import React, { FC } from 'react';
import classNames from 'classnames';

import { cmsUrls } from 'code/endpoints';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { IFilterOption } from 'models/data/IFilters';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import Checkbox from 'frontend/components/common/Checkbox';
import NewItemPill from 'frontend/components/common/Pills/NewItemPill/NewItemPill';
import RadioButton from 'frontend/components/common/RadioButton';
import TextWithTooltip from 'frontend/components/common/TextWithTooltip/TextWithTooltip';
import { Tooltip, TooltipContent, TooltipTrigger } from 'frontend/components/common/Tooltip';
import { IComponentWithRerenderProps } from 'frontend/components/hoc/withRerender';

import styles from './FilterCheckControl.module.scss';

export interface IFilterCheckControlProps extends IComponentWithRerenderProps {
    checked: boolean;
    onChange: () => void;
    option: IFilterOption;
    disabled?: boolean;
    hiddenZeroCount?: boolean;
    hideLabelCount?: boolean;
    isRadioButton?: boolean;
    label?: string | JSX.Element;
}

interface ICheckboxIconProps {
    option: IFilterOption;
}

const CheckboxIcon: FC<ICheckboxIconProps> = ({ option }) => {
    const { groupCode, icon: url, name } = option;

    if (url && groupCode !== FilterGroupCodes.HotelTypes) {
        return <img data-tid='checkbox-icon' className='checkbox__icon' src={cmsUrls.media(url)} alt={name} />;
    }

    return null;
};

const FilterCheckControl = ({
    option,
    label,
    checked,
    disabled,
    isRadioButton,
    onChange,
    hiddenZeroCount,
    hideLabelCount = true,
}: IFilterCheckControlProps): JSX.Element => {
    const { getFormattedNumber } = useStore((stores: TStores) => ({
        getFormattedNumber: stores.marketStore.getFormattedNumber,
    }));

    const getClassName = (): string => classNames('checkbox-item', disabled && 'disabled');

    const getLabel = (): JSX.Element => {
        if (label) {
            const { children: _unused, ...optionWithoutChildren } = option;

            return (
                <>
                    {label}
                    {!!option.tooltipText && (
                        <Tooltip>
                            <TooltipTrigger className={styles.tooltipTrigger} />
                            <TooltipContent {...{ ...optionWithoutChildren, text: option.tooltipText }} />{' '}
                        </Tooltip>
                    )}
                </>
            );
        }

        let count: string = '';

        if (!hideLabelCount) {
            count =
                option.groupCode !== FilterGroupCodes.Destination && (option.count > 0 || !hiddenZeroCount)
                    ? ` (${getFormattedNumber(option.count || 0)})`
                    : '';
        }

        const labelText = `${option.name || option.code}${count}`;

        return (
            <TextWithTooltip
                wrapperClassName={styles.count}
                message={labelText}
                tooltipMessage={option.tooltipText || ''}
                tag='div'
            />
        );
    };

    const id = (option.groupCode + option.code).trim();

    return (
        <div className={getClassName()} data-tid={option.code}>
            {isRadioButton ? (
                <RadioButton checked={checked} label={getLabel()} onChange={(): void => onChange()} id={id} name={id} />
            ) : (
                <div className='filter-checkbox__wrapper'>
                    <Checkbox
                        disabled={disabled}
                        checked={checked}
                        onChange={(): void => onChange()}
                        render={(): JSX.Element => <CheckboxIcon option={option} />}
                        tick
                        medium
                        id={id}
                    >
                        <NewItemPill isShown={option?.showNewLabel} className={styles.newLabelPill} />
                        {getLabel()}
                    </Checkbox>
                </div>
            )}
        </div>
    );
};

export default FilterCheckControl;
