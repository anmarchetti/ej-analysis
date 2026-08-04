import React from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import Button from 'frontend/components/common/Button';

export interface IAmendDatesEntryProps {
    label?: string;
    onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

const AmendDatesEntry = ({ onClick, label }: IAmendDatesEntryProps) => {
    const { isLoading, isDisabled } = useStore(({ amendDatesStore }: IHolidaysStores) => ({
        isLoading: amendDatesStore.isInitialDataLoading,
        isDisabled: amendDatesStore.isAmendCTADisabled,
    }));

    return (
        <Button
            isOutlined
            isSmall
            isLoading={isLoading}
            onClick={onClick}
            disabled={isDisabled}
            dataTid='amend-dates-entry-cta'
        >
            {label}
        </Button>
    );
};

export default observer(AmendDatesEntry);
