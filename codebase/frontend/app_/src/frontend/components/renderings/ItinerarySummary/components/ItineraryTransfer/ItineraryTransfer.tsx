import { FC, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { DATE_FORMATS } from 'code/dates';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getRouteByDirection } from 'frontend/utils/airports.utils';
import { formatDateL10n, getMinutesLocalized } from 'frontend/utils/date.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { IBookingTransfer } from 'models/data/ITransfer';
import { TransferType } from 'models/enum/transfer/TransferType';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button/Button';
import InfoBlock from 'frontend/components/common/InfoBlock/InfoBlock';
import SvgCalendarLined from 'frontend/components/icons-new/CalendarLined';
import SvgChevronRight from 'frontend/components/icons-new/ChevronRight';
import SvgClockFilled from 'frontend/components/icons-new/ClockFilled';
import SvgLocationPinFilled from 'frontend/components/icons-new/LocationPinFilled';
import SvgRoadFilled from 'frontend/components/icons-new/RoadFilled';
import SvgTaxiFilled from 'frontend/components/icons-new/TaxiFilled';
import SvgTimeRunning from 'frontend/components/icons-new/TimeRunning';
import SvgTransferFilled from 'frontend/components/icons-new/TransferFilled';
import ItineraryItem from 'frontend/components/renderings/ItinerarySummary/components/ItineraryItem/ItineraryItem';
import TransferInstructionsPopup from 'frontend/components/renderings/ItinerarySummary/components/TransferInstructionsPopup/TransferInstructionsPopup';
import { IItinerarySummarySummaryFields } from 'frontend/components/renderings/ItinerarySummary/interfaces';

import TransferDescriptionItem from './TransferDescriptionItem';
import VehicleInfo from './VehicleInfo';

import styles from './ItineraryTransfer.module.scss';

export type TItineraryTransferProps = {
    booking: IBookingInfo;
    isExpanded: boolean;
    setExpanded: () => void;
    className?: string;
    isArrival?: boolean;
    isGreyedOut?: boolean;
    isLess24HoursBeforeDeparture?: boolean;
    transfer?: IBookingTransfer;
} & IItinerarySummarySummaryFields;

type TInfoByTransferType = Partial<
    Record<TransferType, { description: ISitecoreField<string>; title?: ISitecoreField<string> }[]>
>;

const ItineraryTransfer: FC<TItineraryTransferProps> = ({
    booking,
    isArrival,
    isExpanded,
    setExpanded,
    className,
    isGreyedOut,
    transfer,
    isLess24HoursBeforeDeparture,
    ...fields
}) => {
    const [isTransferInstructionsPopupOpen, setTransferInstructionsPopupOpen] = useState(false);
    const { getPhrase, isFlightAndHotelPackage } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        isFlightAndHotelPackage: stores.viewBookingStore.isFlightAndHotelPackage,
    }));

    if (isFlightAndHotelPackage) {
        return null;
    }

    const buildTransferTitle = (transferNameText: string): string =>
        isArrival
            ? `${transferNameText} ${fields.ToHotelLabel.value}`
            : `${transferNameText} ${fields.ToAirportLabel.value}`;

    const transferTypeToTitleMap = {
        [TransferType.Private]: buildTransferTitle(fields.PrivateTransfer.value),
        [TransferType.Shared]: buildTransferTitle(fields.SharedTransfer.value),
        [TransferType.NoTransfer]: buildTransferTitle(fields.NoTransferTitle.value),
    };

    const transferIconByTypeMap = {
        [TransferType.Private]: <SvgTaxiFilled />,
        [TransferType.Shared]: <SvgTransferFilled />,
        [TransferType.NoTransfer]: <SvgRoadFilled />,
    };

    const bookingTransferType = booking.transfers[0]?.type || TransferType.NoTransfer;

    if (transfer?.transferType === TransferType.NoTransfer || bookingTransferType === TransferType.NoTransfer) {
        return (
            <ItineraryItem
                title={{ value: transferTypeToTitleMap[bookingTransferType] }}
                icon={transferIconByTypeMap[bookingTransferType]}
                className={className}
                canExpand={false}
                isExpanded={false}
                setExpanded={setExpanded}
                isGreyedOut={isGreyedOut}
            >
                <Text field={fields.NoTransferDescription} className={styles.noTransfer} tag='span' />
            </ItineraryItem>
        );
    }

    if (!transfer?.transferType || transfer.transferType === TransferType.Unknown) {
        return (
            <ItineraryItem
                title={{ value: transferTypeToTitleMap[bookingTransferType] }}
                icon={transferIconByTypeMap[bookingTransferType]}
                className={className}
                canExpand={false}
                isExpanded={false}
                setExpanded={setExpanded}
                isGreyedOut={isGreyedOut}
                itemClassName={styles.errorTransfer}
            >
                <div className={styles.content}>
                    <InfoBlock
                        text={fields.ErrorLoadingTransferText}
                        className={styles.infoBlock}
                        textClass={styles.infoBlockText}
                        iconClass={styles.infoBlockIcon}
                    />
                </div>
            </ItineraryItem>
        );
    }

    const {
        pickupLocation,
        pickupLocationName,
        pickupLocationInstructions,
        pickupTime,
        transferType,
        transferMinutes,
        what3WordsLocation,
    } = transfer;
    const transferTitle = { value: transferTypeToTitleMap[transferType] };

    const durationTimeText = getMinutesLocalized(
        transferMinutes || booking.transfers[0].transferInfo?.duration || 0,
        getPhrase,
    );

    const infoByTransferType: TInfoByTransferType = {
        [TransferType.Shared]: isArrival
            ? [
                  {
                      title: fields.AllowTimeTitle,
                      description: fields.AllowTimeDescription,
                  },
                  {
                      title: fields.FlightDelayTitle,
                      description: fields.FlightDelayDescription,
                  },
              ]
            : [
                  {
                      description: fields.ArriveEarlierSharedText,
                  },
              ],

        [TransferType.Private]: [
            isArrival
                ? {
                      title: fields.FlightDelayTitle,
                      description: fields.FlightDelayDescription,
                  }
                : {
                      description: fields.ArriveEarlierPrivateText,
                  },
        ],
    };

    const isDeparture = !isArrival;
    const hasPickupTime = Boolean(pickupTime);

    const routes = booking.package?.transport?.routes || [];
    const { inbound } = getRouteByDirection(routes);

    const getClosedPickupTimeText = (): string => {
        const date = formatDateL10n(
            pickupTime || (isArrival ? booking.transfers[0].startDate : inbound?.depDate),
            DATE_FORMATS.fullDate,
        );

        if (pickupTime) {
            const arrivalText = isArrival ? '' : fields.ArriveEarlierPickupText.value;

            return isExpanded
                ? date
                : `${date} - ${Tokenizer.replaceToken(
                      fields.PickupTimeShortText.value,
                      Tokens.Time,
                      `<strong>${formatDateL10n(pickupTime, DATE_FORMATS.time)}</strong>`,
                  )} ${arrivalText}`;
        }

        if (transferMinutes) {
            return isExpanded
                ? date
                : `${date} - ${Tokenizer.replaceToken(
                      fields.DurationText.value,
                      Tokens.Duration,
                      `<strong>${durationTimeText}</strong>`,
                  ).toLowerCase()}`;
        }

        return date;
    };

    const renderPickupTimeOrInstructions = (): Nullable<JSX.Element> => {
        if (pickupTime) {
            return (
                <TransferDescriptionItem
                    name={fields.PickupTimeLabel.value}
                    text={`${Tokenizer.replaceToken(
                        fields.PickupTimeFullText.value,
                        Tokens.Time,
                        `<strong>${formatDateL10n(pickupTime, DATE_FORMATS.time)}</strong>`,
                    )} ${fields.TimeMayVaryText.value}`}
                    icon={<SvgClockFilled className={styles.smallerIcon} />}
                    className={styles.item}
                />
            );
        }

        if (isLess24HoursBeforeDeparture && pickupLocationInstructions) {
            return (
                <TransferDescriptionItem
                    name={fields.PickupInstructionsLabel.value}
                    text={pickupLocationInstructions}
                    icon={<SvgLocationPinFilled className={styles.smallerIcon} />}
                    className={styles.item}
                />
            );
        }

        if (!isLess24HoursBeforeDeparture) {
            return (
                <TransferDescriptionItem
                    text={fields.NoPickUpTimeText.value}
                    icon={<SvgClockFilled className={styles.smallerIcon} />}
                    className={classNames(styles.item, styles.noPickupTimeItemText)}
                />
            );
        }

        return null;
    };

    const getPickupLocationText = (): string => {
        if (pickupLocationName || isArrival) {
            return pickupLocationName || '';
        }

        if (pickupLocation?.latitude && pickupLocation?.longitude) {
            return fields.DiffPickupLocationText.value;
        }

        return fields.SameLocationText.value;
    };

    const renderPickupLocationInfo = (): Nullable<JSX.Element> => {
        if (
            (pickupTime || isArrival) &&
            (isExpanded || pickupLocationName || (!pickupLocation?.latitude && !pickupLocation?.longitude))
        ) {
            return (
                <TransferDescriptionItem
                    name={fields.PickupLocationLabel.value}
                    text={getPickupLocationText()}
                    icon={isExpanded ? <SvgLocationPinFilled className={styles.smallerIcon} /> : null}
                    className={styles.item}
                />
            );
        }

        if (!pickupTime && !isLess24HoursBeforeDeparture && !isExpanded && isDeparture) {
            return <p className={styles.noPickupTime}>{fields.NoPickUpTimeText.value}</p>;
        }

        return null;
    };

    return (
        <ItineraryItem
            title={transferTitle}
            icon={transferIconByTypeMap[transferType]}
            className={className}
            isExpanded={isExpanded}
            setExpanded={setExpanded}
            isGreyedOut={isGreyedOut}
        >
            <div className={classNames(styles.subtitleWrapper, { [styles.expanded]: isExpanded })}>
                <TransferDescriptionItem
                    text={getClosedPickupTimeText()}
                    icon={isExpanded ? <SvgCalendarLined className={styles.smallerIcon} /> : null}
                    className={styles.item}
                />
                {renderPickupLocationInfo()}
            </div>
            {isExpanded && (
                <div className={styles.content}>
                    {isDeparture && renderPickupTimeOrInstructions()}

                    {(pickupTime || !isLess24HoursBeforeDeparture || !pickupLocationInstructions) && (
                        <Button
                            isText
                            className={styles.textButton}
                            onClick={(): void => setTransferInstructionsPopupOpen(true)}
                            dataTid='pickup-instructions-popup-button'
                        >
                            <Text field={fields.PickupInstructionsAndHelpLabel} component='span' /> <SvgChevronRight />
                        </Button>
                    )}

                    {((isDeparture && hasPickupTime) || isArrival) &&
                        infoByTransferType[transferType]?.map(info => (
                            <InfoBlock
                                key={info.description.value}
                                title={info.title}
                                text={info.description}
                                className={styles.infoBlock}
                                textClass={styles.infoBlockText}
                                titleClassName={styles.infoBlockTitle}
                                iconClass={styles.infoBlockIcon}
                            />
                        ))}

                    {(!!transferMinutes || !!booking.transfers[0].transferInfo?.duration) && (
                        <TransferDescriptionItem
                            name={fields.DurationLabel.value}
                            text={`${Tokenizer.replaceToken(
                                fields.DurationText.value,
                                Tokens.Duration,
                                durationTimeText,
                            )} ${fields.TimeMayVaryText.value}`}
                            icon={<SvgTimeRunning />}
                            className={classNames(styles.item, styles.divider)}
                        />
                    )}
                    <VehicleInfo transfer={transfer} fields={fields} />
                </div>
            )}
            {isTransferInstructionsPopupOpen && (
                <TransferInstructionsPopup
                    fields={fields}
                    onClose={(): void => setTransferInstructionsPopupOpen(false)}
                    transferType={transferType}
                    instructions={pickupLocationInstructions}
                    mapLocation={pickupLocation}
                    popupTitle={transferTitle}
                    what3WordsLocation={what3WordsLocation}
                    CloseButtonLabel={fields.CloseDrawerLabel}
                />
            )}
        </ItineraryItem>
    );
};

export default observer(ItineraryTransfer);
