import * as React from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import SvgEditFilled from 'frontend/components/icons-new/EditFilled';

interface IPromoPageEditSearchProps {
    onClick: () => void;
    className?: string;
    isLoading?: boolean;
}

export const PromoPageEditSearch = ({ onClick, className, isLoading }: IPromoPageEditSearchProps) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    if (isLoading) {
        return <div className='placeholder-filter-btn placeholder-shimmer' data-tid='placeholder-shimmer' />;
    }

    return (
        <div className={classNames('edit-search', className)}>
            <Button isText onClick={onClick} className='search-pod-filter__button'>
                <i>
                    <SvgEditFilled />
                </i>
                <span>{getPhrase(SitecoreDictionary.SearchResultsLabelsEditSearch)}</span>
            </Button>
        </div>
    );
};

export default PromoPageEditSearch;
