import React from 'react';
import classNames from 'classnames';

import SVGCross from 'frontend/components/icons-new/Cross';

export interface ISelectedFilterPillProps {
    dataTid: string;
    label: Nullable<string>;
    onClick: () => void;
    onRemoveClick: (e: React.MouseEvent) => void;
    isDisabled?: boolean;
}

export const SelectedFilterPill = (props: ISelectedFilterPillProps) => {
    const { dataTid, label, onRemoveClick, onClick, isDisabled } = props;

    if (!label) {
        return null;
    }

    return (
        <div
            className={classNames('filter-apply__group--item', isDisabled && 'is-disabled')}
            data-tid={dataTid}
            onClick={onClick}
        >
            <span className='text'>{label}</span>
            <i className='remove-icon' onClick={onRemoveClick}>
                <SVGCross />
            </i>
        </div>
    );
};
