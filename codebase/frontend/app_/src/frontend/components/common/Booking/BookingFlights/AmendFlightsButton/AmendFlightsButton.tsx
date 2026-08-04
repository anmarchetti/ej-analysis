import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { isLoadingStatus } from 'models/enum/DataStatus';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';

interface IAmendFlightsButtonProps {
    onClick?: (e) => void;
}

export const AmendFlightsButton = ({ onClick }: IAmendFlightsButtonProps) => {
    const { amendFlightsStatus, getPhrase, isAmendCTADisabled } = useStore((stores: IHolidaysStores) => ({
        amendFlightsStatus: stores.amendFlightsStore.status,
        getPhrase: stores.layoutStore.getPhrase,
        isAmendCTADisabled: stores.amendFlightsStore.isAmendCTADisabled,
    }));

    return (
        <div className='holiday-summary-item__btn-amend no-print'>
            <Button
                isSmall
                isOutlined
                isLoading={isLoadingStatus(amendFlightsStatus)}
                onClick={onClick}
                disabled={isAmendCTADisabled}
            >
                {getPhrase(SitecoreDictionary.ViewBookingButtonsAmendFlights)}
            </Button>
        </div>
    );
};

export default observer(AmendFlightsButton);
