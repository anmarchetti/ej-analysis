import { FunctionComponent } from 'react';
import * as React from 'react';
import classNames from 'classnames';

import { cmsUrls } from 'code/endpoints';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import { getRoomName } from 'frontend/utils/offer.utils';
import { roomTitleNormalize } from 'frontend/utils/string.utils';
import { IBoardType, IRoomType } from 'models/data/IHotel';
import { ITransfer } from 'models/data/ITransfer';
import EcoCertifiedPill from 'frontend/components/common/EcoCertifiedPill';
import ImageWithFilter, { SVGFilterMatrix } from 'frontend/components/common/ImageWithFilter/ImageWithFilter';
import UrgencyMessage from 'frontend/components/common/UrgencyMessage/UrgencyMessage';
import { useUrgencyMessageText } from 'frontend/components/common/UrgencyMessage/UrgencyMessage.hooks';
import SVGHotelBedFilled from 'frontend/components/icons-new/HotelBedFilled';
import BoardTypeIcon from 'frontend/components/renderings/BoardTypes/components/BoardTypeIcon/BoardTypeIcon';

import styles from './OfferExtras.module.scss';

interface IOfferExtrasProps {
    boardType: IBoardType;
    roomType: IRoomType;
    transfer: ITransfer;
    avail?: number;
    className?: string;
    ecoFacility?: {
        name: string;
        tooltip: string;
    };
    isUrgencyMessageVisible?: boolean;
}

const OfferExtras: FunctionComponent<IOfferExtrasProps> = ({
    roomType,
    boardType,
    transfer,
    ecoFacility,
    isUrgencyMessageVisible,
    avail,
    className,
}) => {
    const { urgencyMessageText, urgencyMessageTooltipText } = useUrgencyMessageText({ avail: avail });

    const roomName = roomTitleNormalize(getRoomName(roomType));
    const transferIconUrl = transfer?.iconUrl;
    const isMobile = useMobileViewport();
    const isUrgencyMessageRendered = isUrgencyMessageVisible && !!avail;

    return (
        <>
            {isMobile && ecoFacility && <EcoCertifiedPill title={ecoFacility.name} tooltip={ecoFacility.tooltip} />}
            <div className={classNames(styles.tripDetails, className)} data-tid='trip-details'>
                <div
                    className={classNames(styles.detailsItem, { [styles.roomDetailsItem]: isUrgencyMessageRendered })}
                    data-tid='room-type'
                >
                    <div>
                        <div className={styles.roomInfo}>
                            <i className={styles.detailsIcon} data-tid='room-icon'>
                                <SVGHotelBedFilled />
                            </i>
                            <div
                                className={classNames({ [styles.roomDetails]: isUrgencyMessageRendered })}
                                data-tid='room-title'
                            >
                                <span>{roomName}</span>
                            </div>
                        </div>
                        {isUrgencyMessageRendered && (
                            <UrgencyMessage
                                className={styles.urgencyMessage}
                                message={urgencyMessageText}
                                tooltip={urgencyMessageTooltipText}
                            />
                        )}
                    </div>
                </div>
                <div className={styles.detailsItem} data-tid='board-type'>
                    <i className={styles.detailsIcon} data-tid='board-icon'>
                        <BoardTypeIcon iconUrl={boardType.iconUrl} />
                    </i>
                    <span>{boardType.title || boardType.name}</span>
                </div>
                {transfer && (
                    <div className={styles.detailsItem} data-tid='transfer'>
                        {transferIconUrl && (
                            <i className={styles.detailsIcon} data-tid='transfer-icon'>
                                <ImageWithFilter
                                    imageSrc={cmsUrls.media(transferIconUrl)}
                                    filterMatrix={SVGFilterMatrix.Grayscale}
                                    className={styles.icon}
                                />
                            </i>
                        )}
                        <span>{transfer.name}</span>
                    </div>
                )}
            </div>
        </>
    );
};

export default OfferExtras;
