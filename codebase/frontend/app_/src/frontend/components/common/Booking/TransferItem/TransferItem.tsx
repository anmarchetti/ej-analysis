import * as React from 'react';
import { FunctionComponent } from 'react';
import { ComponentRendering, Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { cmsUrls } from 'code/endpoints';
import { Tokens } from 'code/tokens';
import useDataUrl from 'frontend/hooks/useDataUrl';
import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { ITransfer } from 'models/data/ITransfer';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { TransferType } from 'models/enum/transfer/TransferType';
import ImageWithFilter, { SVGFilterMatrix } from 'frontend/components/common/ImageWithFilter/ImageWithFilter';
import TransferDuration from 'frontend/components/renderings/Transfer/components/TransferDuration/TransferDuration';

import TransferItemAmendButton from './components/TransferItemAmendButton/TransferItemAmendButton';

import styles from './TransferItem.module.scss';

interface ITransferItemProps {
    rendering: ComponentRendering;
    transfer: ITransfer;
    isIconOrange?: boolean;
    isPrintPreview?: boolean;
    onAmendTransfersClick?: (e) => void;
    showOccupancy?: boolean;
}

export const TransferItem: FunctionComponent<ITransferItemProps> = ({
    transfer,
    isIconOrange,
    isPrintPreview,
    showOccupancy,
    rendering,
    onAmendTransfersClick,
}) => {
    const { getPhrase, isTransferDurationEnabled, isAmendCTAVisible, isFlightAndHotelPackage } = useStore(
        (stores: TStores) => ({
            getPhrase: stores.layoutStore.getPhrase,
            isTransferDurationEnabled: stores.layoutStore.isTransferDurationEnabled,
            isAmendCTAVisible: isHolidayStore(stores) && stores.amendTransfersStore.isAmendCTAVisible,
            isFlightAndHotelPackage:
                isHolidayStore(stores) &&
                (stores.viewBookingStore.isFlightAndHotelPackage || stores.bookingStore.isFlightAndHotelPackage),
        }),
    );

    const { name, content, iconUrl, type, quantity } = transfer;
    const doesTransferItemExist = !!rendering?.placeholders?.[PlaceholderNames.TransferInstructions]?.length;
    const getTitle = () => {
        let title = name;

        // For Shared show the number of booked seats (quantity)
        if (type === TransferType.Shared && showOccupancy && quantity) {
            title += `, ${Tokenizer.replaceToken(
                getPhrase(
                    quantity > 1
                        ? SitecoreDictionary.TransferLabelsSeatsPluralPhrase
                        : SitecoreDictionary.TransferLabelsSeatSingularPhrase,
                ),
                Tokens.Number,
                String(quantity),
            )}`;
        }

        return title;
    };
    const title = getTitle();
    const imageSrc = (iconUrl && cmsUrls.media(iconUrl)) || '';
    const printableSrc = useDataUrl(imageSrc);

    return (
        <div className='confirmed-transfer__item'>
            <div data-tid='confirmed-transfer-info' className='confirmed-transfer__info holiday-summary-item__details'>
                {!!iconUrl &&
                    (isIconOrange ? (
                        <ImageWithFilter
                            imageSrc={isPrintPreview ? printableSrc : imageSrc}
                            filterMatrix={SVGFilterMatrix.Orange}
                            className='holiday-summary-item__icon'
                        />
                    ) : (
                        <img src={imageSrc} className='holiday-summary-item__icon' alt={name} />
                    ))}
                <div>
                    {!!title && (
                        <h4 data-tid='confirmed-transfer-subtitle' className='holiday-summary-item__subtitle'>
                            {title}
                        </h4>
                    )}
                    {!!content && (
                        <div
                            data-tid='confirmed-transfer-content'
                            className='holiday-summary-item__text'
                            dangerouslySetInnerHTML={{ __html: content }}
                        />
                    )}
                </div>
                {transfer.transferInfo && doesTransferItemExist && (
                    <Placeholder
                        name={PlaceholderNames.TransferInstructions}
                        rendering={rendering}
                        departureInstruction={transfer.transferInfo.depInstr}
                        arrivalInstruction={transfer.transferInfo.arrivalInstr}
                    />
                )}

                {!!transfer.transferInfo?.duration &&
                    Number(transfer.transferInfo.duration) > 0 &&
                    isTransferDurationEnabled && (
                        <TransferDuration
                            duration={transfer.transferInfo.duration}
                            className={styles.transferDuration}
                            iconClassName={styles.transferDurationIcon}
                        />
                    )}
            </div>
            {isAmendCTAVisible && !isFlightAndHotelPackage && (
                <TransferItemAmendButton onAmendTransfersClick={onAmendTransfersClick} />
            )}
        </div>
    );
};

export default observer(TransferItem);
