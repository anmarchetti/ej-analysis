import React, { Component } from 'react';
import classNames from 'classnames';
import { inject, observer } from 'mobx-react';
import sanitize from 'sanitize-html';

import { cmsUrls } from 'code/endpoints';
import { MarketStore } from 'frontend/store/base/market/MarketStore';
import { TStores } from 'frontend/store/IStores';
import { IFilterOption } from 'models/data/IFilters';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import Callout from 'frontend/components/common/Callout/Callout';
import Checkbox from 'frontend/components/common/Checkbox';
import RadioButton from 'frontend/components/common/RadioButton';
import { withRerender } from 'frontend/components/hoc';
import { IComponentWithRerenderProps } from 'frontend/components/hoc/withRerender';
import IconInfoCircle from 'frontend/components/icons/InfoCircle';

export interface IFilterCheckControlProps extends IComponentWithRerenderProps {
    checked: boolean;
    getFormattedNumber: MarketStore['getFormattedNumber'];
    onChange: () => void;
    option: IFilterOption;
    disabled?: boolean;
    hiddenZeroCount?: boolean;
    hideLabelCount?: boolean;
    isRadioButton?: boolean;
    isScreenLessMedium?: boolean;
    label?: string | JSX.Element;
    renderIcon?: () => any;
}

@observer
export class FilterCheckControl extends Component<IFilterCheckControlProps> {
    get className() {
        return classNames('checkbox-item', this.props.disabled && 'disabled');
    }

    getLabel() {
        const { label, hideLabelCount, option, getFormattedNumber, hiddenZeroCount } = this.props;

        if (label) {
            return label;
        }

        if (hideLabelCount) {
            return option.name || option.code;
        }

        const formattedCount = getFormattedNumber(option.count || 0);
        const count =
            option.groupCode !== FilterGroupCodes.Destination && (option.count > 0 || !hiddenZeroCount)
                ? ` (${formattedCount})`
                : '';

        return `${option.name || option.code}${count}`;
    }

    renderTooltip() {
        const { tooltipText, groupCode, icon, name } = this.props.option;

        if (!tooltipText) {
            return null;
        }

        let content = <div>{tooltipText}</div>;

        if (groupCode === FilterGroupCodes.HotelTypes) {
            content = (
                <div className='text-center' data-tid='callout-content-hotel-types'>
                    {icon && <img className='filter-checkbox__callout-icon' src={cmsUrls.media(icon)} alt={name} />}
                    <div dangerouslySetInnerHTML={{ __html: sanitize(tooltipText) }} />
                </div>
            );
        }

        return (
            <Callout
                content={content}
                orientation={this.props.option.tooltipOrientation || CalloutOrientation.Bottom}
                position={this.props.option.tooltipPosition || CalloutPosition.Right}
                isShownOnHover={this.props.wasRerendered && !this.props.isScreenLessMedium}
                className='filter-checkbox__callout'
            >
                <i className='more-info' role='info'>
                    <IconInfoCircle />
                </i>
            </Callout>
        );
    }

    private renderCheckboxIcon = (url?: string) => {
        if (url && this.props.option.groupCode !== FilterGroupCodes.HotelTypes) {
            return (
                <img
                    data-tid='checkbox-icon'
                    className='checkbox__icon'
                    src={cmsUrls.media(url)}
                    alt={this.props.option.name}
                />
            );
        }

        return null;
    };

    render() {
        return (
            <div className={this.className} data-tid={this.props.option.code}>
                {this.props.isRadioButton ? (
                    <RadioButton
                        checked={this.props.checked}
                        label={this.getLabel()}
                        onChange={() => this.props.onChange()}
                    />
                ) : (
                    <div className='filter-checkbox__wrapper'>
                        <Checkbox
                            disabled={this.props.disabled}
                            checked={this.props.checked}
                            onChange={() => this.props.onChange()}
                            tick
                            medium
                            render={() => this.renderCheckboxIcon(this.props.option.icon)}
                        >
                            {this.getLabel()}
                        </Checkbox>
                        {this.renderTooltip()}
                    </div>
                )}
            </div>
        );
    }
}

export default inject((stores: TStores) => ({
    isScreenLessMedium: stores.appStore.isScreenLessMedium,
    getFormattedNumber: stores.marketStore.getFormattedNumber,
}))(withRerender(FilterCheckControl));
