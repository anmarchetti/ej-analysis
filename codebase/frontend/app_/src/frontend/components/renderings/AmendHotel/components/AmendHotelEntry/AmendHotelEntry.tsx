import { FunctionComponent } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import Button from 'frontend/components/common/Button';

export interface IAmendHotelEntry {
    onClick: (e: React.MouseEvent) => void;
    label?: string;
}

const AmendHotelEntry: FunctionComponent<IAmendHotelEntry> = ({ label, onClick }) => {
    const { isAmendCTAVisible, isAmendCTADisabled, isLoadingAlternativeHotels } = useStore(
        (stores: IHolidaysStores) => ({
            isAmendCTADisabled: stores.amendHotelStore.isAmendCTADisabled,
            isAmendCTAVisible: stores.amendHotelStore.isAmendCTAVisible,
            isLoadingAlternativeHotels: stores.amendHotelStore.isLoadingAlternativeHotels,
        }),
    );

    if (!isAmendCTAVisible) {
        return null;
    }

    return (
        <Button
            isOutlined
            isSmall
            dataTid='amend-hotel-entry-cta'
            disabled={isAmendCTADisabled}
            onClick={onClick}
            isLoading={isLoadingAlternativeHotels}
        >
            {label}
        </Button>
    );
};

export default observer(AmendHotelEntry);
