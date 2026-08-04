import React, { PureComponent } from 'react';
import classNames from 'classnames';

import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import SvgChevronDown from 'frontend/components/icons-new/ChevronDown';
import SvgChevronRight from 'frontend/components/icons-new/ChevronRight';
import SvgChevronUp from 'frontend/components/icons-new/ChevronUp';
import SvgTick from 'frontend/components/icons-new/Tick';

export interface IFilterTileProps {
    code: FilterGroupCodes;
    isActive: boolean;
    isDisabled: boolean;
    onClick: (code: FilterGroupCodes) => void;
    title: string;
    isScreenExtraSmall?: boolean;
}

export class FilterTile extends PureComponent<IFilterTileProps> {
    private get tileClassName(): string {
        return classNames(
            'btn filters--button',
            this.props.isActive && 'active',
            this.props.isDisabled && 'is-disabled',
        );
    }

    private get iconClassName(): string {
        return classNames('icon', this.props.isActive && 'icon--active');
    }

    onClick = () => !this.props.isDisabled && this.props.onClick(this.props.code);

    render() {
        return (
            <button className={this.tileClassName} onClick={this.onClick} data-tid={this.props.code}>
                {!this.props.isScreenExtraSmall && (
                    <i className={this.iconClassName}>{this.props.isActive ? <SvgChevronUp /> : <SvgChevronDown />}</i>
                )}

                <span className='title'>{this.props.title}</span>

                {this.props.isScreenExtraSmall && (
                    <span className='icon-block'>
                        {this.props.isActive && (
                            <i className={this.iconClassName}>
                                <SvgTick />
                            </i>
                        )}
                        <i className='icon'>
                            <SvgChevronRight />
                        </i>
                    </span>
                )}
            </button>
        );
    }
}

export default FilterTile;
