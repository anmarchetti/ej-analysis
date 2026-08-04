import { FunctionComponent } from 'react';
import { observer } from 'mobx-react';

import { TrailingZeroDisplay } from 'code/currency';
import { DATE_FORMATS } from 'code/dates';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { formatDateL10n, getTimeWithoutSeconds } from 'frontend/utils/date.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import SvgCross from 'frontend/components/icons-new/Cross';
import { useAirportParkingLocalStore } from 'frontend/components/renderings/AirportParking/stores/airportParkingLocalStore';

import styles from './SelectedAirportParkingCard.module.scss';

interface ISelectedAirportParkingCardProps {
    cardTitle: string;
    selectedFromDate: string;
    selectedToDate: string;
}

const SelectedAirportParkingCard: FunctionComponent<ISelectedAirportParkingCardProps> = ({
    selectedToDate,
    selectedFromDate,
    cardTitle,
}) => {
    const { tracking } = useAirportParkingLocalStore();
    const { selectedAirportParking, formatMoney, currency, getPhrase, toggleIsParkingPopupOpened, validateParking } =
        useStore((stores: IHolidaysStores) => ({
            selectedAirportParking: stores.airportParkingStore.selectedAirportParking,
            formatMoney: stores.marketStore.formatMoney,
            currency: stores.marketStore.currency,
            getPhrase: stores.layoutStore.getPhrase,
            toggleIsParkingPopupOpened: stores.airportParkingStore.toggleIsParkingPopupOpened,
            validateParking: stores.airportParkingStore.validateParking,
        }));

    if (!selectedAirportParking) {
        return null;
    }

    const {
        brandImage,
        title,
        bookingDetails: { totalPrice, startDate, startTime, endDate, endTime },
    } = selectedAirportParking;

    const formattedPrice = formatMoney(totalPrice, {
        trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
        currency,
    });

    const formattedStartDate: string = formatDateL10n(startDate, DATE_FORMATS.DayOfWeekOrdinalDayMonthYearAbbr);
    const formattedStartTime: string = getTimeWithoutSeconds(startTime);

    const formattedEndDate: string = formatDateL10n(endDate, DATE_FORMATS.DayOfWeekOrdinalDayMonthYearAbbr);
    const formattedEndTime: string = getTimeWithoutSeconds(endTime);

    const onEdit = (): void => {
        tracking.trackSelectedParkingEditButton(getPhrase(SitecoreDictionary.GlobalsButtonsEdit), cardTitle);
        toggleIsParkingPopupOpened();
    };

    const onRemove = (): void => {
        tracking.trackSelectedParkingRemoveButton(selectedAirportParking);
        validateParking(null, tracking.trackAirportParkingUpdatedInExtrasPage);
    };

    return (
        <div className={styles.container} data-tid='selected-airport-parking-card'>
            {brandImage ? (
                <div
                    className={styles.image}
                    style={{ backgroundImage: `url('${brandImage}')` }}
                    data-tid='selected-parking-image-box'
                />
            ) : (
                <div className={styles.noImageBox} data-tid='selected-parking-no-image-box' />
            )}
            <div className={styles.content}>
                <div className={styles.parkingNameAndPriceWrapper}>
                    <h3 data-tid='selected-parking-title' className={styles.parkingName}>
                        {title}
                    </h3>
                    <span className={styles.price}>{formattedPrice}</span>
                </div>
                <div className={styles.dateAndButtonsContainer}>
                    <div>
                        {selectedFromDate && (
                            <span data-tid='selected-parking-from-date'>
                                {Tokenizer.replaceTokens(selectedFromDate, {
                                    [Tokens.Date]: formattedStartDate,
                                    [Tokens.Time]: formattedStartTime,
                                })}
                            </span>
                        )}
                        {selectedToDate && (
                            <span data-tid='selected-parking-to-date'>
                                {Tokenizer.replaceTokens(selectedToDate, {
                                    [Tokens.Date]: formattedEndDate,
                                    [Tokens.Time]: formattedEndTime,
                                })}
                            </span>
                        )}
                    </div>
                    <div className={styles.actions}>
                        <Button
                            className={styles.removeButton}
                            isText
                            data-tid='selected-parking-remove-btn'
                            onClick={onRemove}
                        >
                            <SvgCross />
                            {getPhrase(SitecoreDictionary.GlobalsButtonsRemove)}
                        </Button>
                        <Button
                            isOutlined
                            className={styles.editButton}
                            data-tid='selected-parking-edit-btn'
                            onClick={onEdit}
                        >
                            {getPhrase(SitecoreDictionary.GlobalsButtonsEdit)}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default observer(SelectedAirportParkingCard);
