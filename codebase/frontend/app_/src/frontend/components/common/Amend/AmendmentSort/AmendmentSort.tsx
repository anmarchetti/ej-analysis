import { FC } from 'react';
import Select from 'react-select';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { ISelectOption } from 'models/data/ISelectOption';
import { AlternativeFlightsSortBy } from 'models/enum/AlternativeFlightsSortBy';
import { AlternativeHotelsSortingOptions } from 'models/enum/AlternativeHotelsSortingOptions';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import DropdownIndicator from 'frontend/components/common/Select/DropdownIndicator/DropdownIndicator';
import ValueContainer from 'frontend/components/common/Select/ValueContainer';

import AmendmentSortMobile from './AmendmentSortMobile';

interface IAmendmentSortProps {
    onChangeSortBy: (value: string) => void;
    options: ISelectOption[];
    selectedSortOption: Nullable<ISelectOption>;
    sortBy: AlternativeFlightsSortBy | AlternativeHotelsSortingOptions;
    isDisabled?: boolean;
    isHotelChangeFlow?: boolean;
    isLoading?: boolean;
    selectClassName?: string;
    wrapperClassName?: string;
}

export const AmendmentSort: FC<IAmendmentSortProps> = ({
    onChangeSortBy,
    sortBy,
    options,
    selectedSortOption,
    selectClassName = '',
    wrapperClassName,
    isDisabled,
    isLoading,
    isHotelChangeFlow,
}) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const isMobile = useMobileViewport();

    if (isMobile) {
        return (
            <AmendmentSortMobile
                options={options}
                sortBy={sortBy}
                onApplySortBy={onChangeSortBy}
                isDisabled={isDisabled}
                isHotelChangeFlow={isHotelChangeFlow}
                wrapperClassName={wrapperClassName}
            />
        );
    }

    if (isLoading) {
        return <div className='placeholder-shimmer' data-tid='search-results-loading-skeleton-sort' />;
    }

    return (
        <div className={wrapperClassName}>
            <Select
                isDisabled={isDisabled}
                className={classNames('custom-select', selectClassName)}
                classNamePrefix='custom-select'
                options={options}
                value={selectedSortOption}
                onChange={({ value }) => onChangeSortBy(value)}
                isSearchable={false}
                components={{ DropdownIndicator, ValueContainer }}
                blurInputOnSelect={true}
                maxMenuHeight={250}
                selectProps={{ hasCustomPlaceholder: false }}
                placeholder={getPhrase(SitecoreDictionary.SearchResultsLabelsSortBy)}
            />
        </div>
    );
};

export default observer(AmendmentSort);
