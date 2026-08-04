import React, { FC } from 'react';
import { observer } from 'mobx-react';

import { useLuxuryInternalFlight } from 'frontend/hooks/useLuxuryInternalFlight';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { IGuestsAmount } from 'frontend/utils/luggage.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import JSSImage from 'frontend/components/common/JSSImage';
import RouterLink from 'frontend/components/common/RouterLink';
import ViewBookingComponentWrapper from 'frontend/components/common/ViewBookingComponentWrapper/ViewBookingComponentWrapper';
import SvgChevronRight from 'frontend/components/icons-new/ChevronRight';
import { IViewBookingFields } from 'frontend/components/renderings/ViewBooking/ViewBooking';

import { formatLuggageItems } from './holdLuggageViewBooking.utils';

import styles from './HoldLuggageViewBooking.module.scss';

export interface IHoldLuggageViewBookingProps {
    additionalFields: IViewBookingFields;
    guestsAmount: IGuestsAmount;
}

enum GridClass {
    GridOddSingular = 'grid-odd-singular',
    GridOddPlural = 'grid-odd-plural',
    GridEven = 'grid-even',
}

const GRID_COUNT = {
    Two: 2,
    Three: 3,
    Four: 4,
};

export const HoldLuggageViewBooking: FC<IHoldLuggageViewBookingProps> = ({ guestsAmount, additionalFields }) => {
    const {
        isFlightExternal,
        isExtraLuggageEnabled,
        sportEquipmentNumber,
        isScreenLessMedium,
        getPhrase,
        extraLuggageFullInfo,
        totalHoldLuggageItemsNumber,
        defaultBag,
        defaultBagsNumber,
    } = useStore((stores: TStores) => ({
        totalHoldLuggageItemsNumber: stores.viewBookingStore.extraLuggage.totalHoldLuggageItemsNumber,
        isFlightExternal: stores.viewBookingStore.isFlightExternal,
        isExtraLuggageEnabled: stores.layoutStore.isExtraLuggageEnabled,
        sportEquipmentNumber: stores.viewBookingStore.extraLuggage.sportEquipmentNumber,
        isScreenLessMedium: stores.appStore.isScreenLessMedium,
        isConfirmationPage: stores.layoutStore.isConfirmationPage,
        getPhrase: stores.layoutStore.getPhrase,
        extraLuggageFullInfo: stores.viewBookingStore.extraLuggage.extraLuggageFullInfo,
        defaultBag: stores.viewBookingStore.extraLuggage.defaultBag,
        defaultBagsNumber: stores.viewBookingStore.extraLuggage.defaultBagsNumber,
    }));
    const isLuxuryInternalFlight = useLuxuryInternalFlight();

    if ((!totalHoldLuggageItemsNumber && !guestsAmount.infants) || isLuxuryInternalFlight) {
        return null;
    }

    const shouldIncludeOnlyBasicLuggage = !isFlightExternal || !isExtraLuggageEnabled;
    const luggage = formatLuggageItems(
        extraLuggageFullInfo,
        defaultBag,
        guestsAmount.infants,
        sportEquipmentNumber,
        additionalFields,
        shouldIncludeOnlyBasicLuggage,
        defaultBagsNumber,
    );

    const determineGridClass = (count: number): GridClass => {
        if (count === GRID_COUNT.Three) {
            return GridClass.GridOddSingular;
        }

        if (count % GRID_COUNT.Two === 1 && count > GRID_COUNT.Four) {
            return GridClass.GridOddPlural;
        }

        return GridClass.GridEven;
    };
    const gridClass = determineGridClass(luggage.length);
    const imageSize = isScreenLessMedium ? '28' : '36';

    return (
        <ViewBookingComponentWrapper
            dataTid='booking-flights'
            Title={{ value: getPhrase(SitecoreDictionary.LuggageLabelsBags) }}
        >
            <div className={styles.luggage}>
                <div data-tid='luggage-list' className={`holiday-summary-item__details-list ${gridClass}`}>
                    {luggage.map((item, i) => (
                        <div
                            data-tid='luggage-item'
                            className='confirmed-luggage__type holiday-summary-item__details grid-item'
                            key={i}
                        >
                            <span className='holiday-summary-item__icon'>
                                <JSSImage field={item.icon} width={imageSize} height={imageSize} />
                            </span>
                            <h4 className='holiday-summary-item__subtitle' data-tid='luggage-subtitle'>
                                {item.quantity} x {item.name}
                            </h4>
                            <div className='confirmed-luggage__sizes' data-tid='luggage-description'>
                                {item.description}
                            </div>
                        </div>
                    ))}
                </div>
                {additionalFields.ReadMoreLink?.value?.href && (
                    <div className='confirmed-luggage__read-more no-print'>
                        <RouterLink link={additionalFields.ReadMoreLink}>
                            {additionalFields.ReadMoreLink.value.text} <SvgChevronRight />
                        </RouterLink>
                    </div>
                )}
            </div>
        </ViewBookingComponentWrapper>
    );
};

export default observer(HoldLuggageViewBooking);
