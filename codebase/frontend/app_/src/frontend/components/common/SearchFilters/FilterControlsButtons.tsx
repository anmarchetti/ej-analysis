import React, { FC } from 'react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import Button from 'frontend/components/common/Button';

export interface IFilterControlsButtonsProps extends IComponentWithDictionary {
    onApply: () => void;
    onCancel: () => void;
    content?: string;
    isApplyDisabled?: boolean;
}

const FilterControlsButtons: FC<IFilterControlsButtonsProps> = ({
    content,
    isApplyDisabled,
    onApply,
    onCancel,
    getPhrase,
}) => (
    <div className={'filter-group-btns'}>
        {content && <div className='content'>{content}</div>}
        <Button isTransparent onClick={onCancel} dataTid='cancel-filters-btn' className='btn__dropdown-close'>
            {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
        </Button>
        <Button
            onClick={onApply}
            dataTid='apply-filters-btn'
            className='btn__dropdown-apply'
            disabled={isApplyDisabled}
        >
            {getPhrase(SitecoreDictionary.GlobalsButtonsApply)}
        </Button>
    </div>
);

export default FilterControlsButtons;
