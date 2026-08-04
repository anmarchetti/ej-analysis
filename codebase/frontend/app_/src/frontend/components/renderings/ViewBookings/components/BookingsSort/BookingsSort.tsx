import React, { FC } from 'react';
import Select from 'react-select';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { ISelectOption } from 'models/data/ISelectOption';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import DropdownIndicator from 'frontend/components/common/Select/DropdownIndicator/DropdownIndicator';
import ValueContainer from 'frontend/components/common/Select/ValueContainer';
import BookingsSortMobile from 'frontend/components/renderings/ViewBookings/components/BookingsSortMobile/BookingsSortMobile';

import styles from './BookingsSort.module.scss';

interface IBookingsSortProps {
    isSortByDisabled: boolean;
    setSortBy: (option: ISelectOption) => void;
    sortBy: ISelectOption;
    sortOptions: ISelectOption[];
}

const BookingsSort: FC<IBookingsSortProps> = ({ sortBy, isSortByDisabled, setSortBy, sortOptions }) => {
    const { getPhrase } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));
    const isMobile = useMobileViewport();

    return isMobile ? (
        <BookingsSortMobile
            options={sortOptions}
            sortBy={sortBy}
            onApplySortBy={(option): void => setSortBy(option)}
            isSortByDisabled={isSortByDisabled}
        />
    ) : (
        <div data-tid='bookings-sort-desktop' className={styles.bookingsSort}>
            <Select
                className='custom-select'
                classNamePrefix='custom-select'
                options={sortOptions}
                defaultValue={sortBy}
                value={sortBy}
                onChange={(option): void => setSortBy(option)}
                isSearchable={false}
                components={{ DropdownIndicator, ValueContainer }}
                blurInputOnSelect={true}
                isDisabled={isSortByDisabled}
                maxMenuHeight={250}
                selectProps={{ hasCustomPlaceholder: false }}
                placeholder={getPhrase(SitecoreDictionary.SearchResultsLabelsSortBy)}
            />
        </div>
    );
};

export default observer(BookingsSort);
