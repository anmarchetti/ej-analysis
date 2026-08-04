import React, { FC, useRef } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { Guid } from 'guid-typescript';

import { useSearchPodStore } from 'frontend/components/renderings/SearchPod/stores/createStore';

export interface ISearchBarSuggestionsPopupShimmerProps {
    className: string;
    isMultiline: boolean;
}

export const DEFAULT_ITEM_COUNT = 3;

const SearchBarSuggestionsPopupShimmer: FC<ISearchBarSuggestionsPopupShimmerProps> = ({ className, isMultiline }) => {
    const { fields: { LoadingLabel } = {} } = useSearchPodStore();

    const popupItemShimmerContent = (
        <div>
            <div className={`popup-item-${isMultiline ? 'top' : 'left'}`}>
                <i className='icon placeholder-shimmer' />
                <span className='popup-item-name placeholder-shimmer' />
            </div>
            <div className={classNames('placeholder-shimmer', `popup-item-${isMultiline ? 'bottom' : 'right'}`)} />
        </div>
    );

    const itemIds = useRef(Array.from({ length: DEFAULT_ITEM_COUNT }, () => Guid.create().toString()));

    return (
        <div className={className}>
            <div className='sb-popup-inner'>
                <Text tag='div' className='sb-popup--loading__msg' field={LoadingLabel} />
                <div className='popup-items'>
                    {itemIds.current.map(id => (
                        <div className='popup-item popup-item-shimmer' key={id}>
                            {popupItemShimmerContent}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SearchBarSuggestionsPopupShimmer;
