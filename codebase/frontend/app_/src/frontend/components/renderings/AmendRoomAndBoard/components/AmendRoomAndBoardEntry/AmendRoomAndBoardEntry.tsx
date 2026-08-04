import classnames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import AmendUpsellMessage from 'frontend/components/common/Amend/AmendUpsellMessage/AmendUpsellMessage';
import Button from 'frontend/components/common/Button';

interface IAmendRoomAndBoardEntryProps {
    onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    className?: string;
}

const AmendRoomAndBoardEntry = ({ className, onClick }: IAmendRoomAndBoardEntryProps) => {
    const { getPhrase, isLoading, isAmendCTADisabled, upgradePrice } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        isLoading: stores.amendRoomAndBoardStore.isLoadingInitialData,
        isAmendCTADisabled: stores.amendRoomAndBoardStore.isAmendCTADisabled,
        upgradePrice: stores.amendRoomAndBoardStore.upgradePrice,
    }));

    return (
        <div className='holiday-summary-item__btn-amend no-print align-items-md-end'>
            <Button
                isPlaceholderShimmer={isLoading}
                className={classnames(className)}
                isOutlined
                isSmall
                onClick={onClick}
                disabled={isAmendCTADisabled}
                dataTid='amend-room-and-board-cta'
            >
                {getPhrase(SitecoreDictionary.RoomAndBoardLabelsEdit)}
            </Button>
            <AmendUpsellMessage
                price={upgradePrice}
                priceLabel={SitecoreDictionary.ViewBookingLabelsUpgradeRoomOrBoard}
            />
        </div>
    );
};

export default observer(AmendRoomAndBoardEntry);
