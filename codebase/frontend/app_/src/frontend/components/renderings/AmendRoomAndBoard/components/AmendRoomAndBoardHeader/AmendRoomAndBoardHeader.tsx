import { observer } from 'mobx-react';

import { cmsUrls } from 'code/endpoints';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getAmendmentRoundedPrice } from 'frontend/utils/amendBooking.utils';
import { getRoomName } from 'frontend/utils/offer.utils';
import { roomTitleNormalize } from 'frontend/utils/string.utils';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import AmendPageStickyHeader from 'frontend/components/common/AmendPageStickyHeader/AmendPageStickyHeader';
import ImageWithFilter, { SVGFilterMatrix } from 'frontend/components/common/ImageWithFilter/ImageWithFilter';
import SVGHotelBedFilled from 'frontend/components/icons-new/HotelBedFilled';

import styles from './AmendRoomAndBoardHeader.module.scss';

export interface IAmendRoomAndBoardHeaderProps {
    additionalCostLabel: string;
    refundAmountLabel: string;
    priceTooltipContent?: ISitecoreField<string>;
}

const AmendRoomAndBoardHeader = ({
    additionalCostLabel,
    refundAmountLabel,
    priceTooltipContent,
}: IAmendRoomAndBoardHeaderProps) => {
    const { chosenRoom, chosenBoard, chosenRoomVariant, isOriginalVariantChosen, isLoading, confirmChosenVariant } =
        useStore((stores: IHolidaysStores) => ({
            getPhrase: stores.layoutStore.getPhrase,
            chosenRoom: stores.amendRoomAndBoardStore.chosenRoom,
            chosenBoard: stores.amendRoomAndBoardStore.chosenBoard,
            chosenRoomVariant: stores.amendRoomAndBoardStore.chosenRoomVariant,
            isOriginalVariantChosen: stores.amendRoomAndBoardStore.isOriginalVariantChosen,
            confirmChosenVariant: stores.amendRoomAndBoardStore.confirmChosenVariant,
            isLoading: stores.amendRoomAndBoardStore.isLoadingValidatedOptions,
        }));

    if (!chosenRoom || !chosenBoard || !chosenRoomVariant) {
        return null;
    }

    const { fullAmendmentCharges } = chosenRoomVariant;
    const { roomType } = chosenRoom;
    const { iconUrl: boardIcon, title: boardTitle } = chosenBoard;
    const isDisabled = isOriginalVariantChosen || isLoading;
    const roomTitle = getRoomName(roomType);
    const priceLabel = fullAmendmentCharges < 0 ? refundAmountLabel : additionalCostLabel;
    const roundedPrice = getAmendmentRoundedPrice(fullAmendmentCharges);

    return (
        <div className={styles.wrapper}>
            <AmendPageStickyHeader
                isConfirmButtonDisabled={isDisabled}
                onContinueBtnClick={confirmChosenVariant}
                price={roundedPrice}
                isPriceHidden={isDisabled}
                priceLabel={priceLabel}
                priceTooltipContent={priceTooltipContent}
            >
                <div className={styles.content}>
                    <div className={styles.description} data-tid='rbc-header-board-type'>
                        <ImageWithFilter
                            imageSrc={cmsUrls.media(boardIcon)}
                            filterMatrix={SVGFilterMatrix.Grayscale}
                            className={styles.icon}
                        />
                        <div>{roomTitleNormalize(boardTitle)}</div>
                    </div>
                    <div className={styles.description} data-tid='rbc-header-room-type'>
                        <SVGHotelBedFilled />
                        <div>{roomTitleNormalize(roomTitle)}</div>
                    </div>
                </div>
            </AmendPageStickyHeader>
        </div>
    );
};

export default observer(AmendRoomAndBoardHeader);
