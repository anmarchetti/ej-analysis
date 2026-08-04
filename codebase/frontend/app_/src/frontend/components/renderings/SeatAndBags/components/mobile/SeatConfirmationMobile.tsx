import * as React from 'react';
import classNames from 'classnames';

import { SignDisplay } from 'code/currency';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { getFullPassengerName } from 'frontend/utils/passenger.utils';
import { getPassengerByDisplayName, getTitle, getTitleConstant } from 'frontend/utils/seatAndBags.utils';
import { IFlightPassenger } from 'models/data/AncillariesInfo';
import { ISeatsAndBagsFields } from 'models/data/ISeatsAndBagsFields';
import { GuestType } from 'models/enum/GuestType';
import { PassengerDisplayName } from 'models/enum/PassengerType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import AncillariesPersonDetails from 'frontend/components/common/AncillariesPersonDetails/AncillariesPersonDetails';
import SeatSelectionMobile from 'frontend/components/renderings/SeatAndBags/components/mobile/SeatSelectionMobile';
import SeatBag from 'frontend/components/renderings/SeatAndBags/components/SeatBag';
import SeatProducts from 'frontend/components/renderings/SeatAndBags/components/SeatProducts/SeatProducts';

interface ISeatConfirmationMobileProps {
    color: string;
    numberOfPerson: number;
    passenger: IFlightPassenger;
    fields?: ISeatsAndBagsFields;
    isPricesHidden?: boolean;
}

const SeatConfirmationMobile = React.forwardRef<HTMLDivElement, ISeatConfirmationMobileProps>(
    ({ passenger, color, fields, numberOfPerson, isPricesHidden = false }: ISeatConfirmationMobileProps, ref) => {
        const { getPhrase, formatMoney, currency } = useStore(stores => ({
            getPhrase: stores.layoutStore.getPhrase,
            formatMoney: stores.marketStore.formatMoney,
            currency: stores.seatMapStore.currency,
        }));

        if (!fields?.Children) {
            return null;
        }

        const { FallbackBenefit } = fields;
        const { seat, withInfant, type } = passenger;
        const { price, priceBand, seatNumber, products } = seat || {};

        const adultWithInfantFields = getPassengerByDisplayName(fields.Children, PassengerDisplayName.AdultInfant);
        const adultFields = getPassengerByDisplayName(fields.Children, PassengerDisplayName.Adult);
        const childFields = getPassengerByDisplayName(fields.Children, PassengerDisplayName.Child);

        const childAgeToken = {
            [Tokens.PassengerAge]: passenger.age?.toString() || '',
        };

        const adultInfantTitle = getTitle(
            getFullPassengerName(passenger, getPhrase),
            adultWithInfantFields?.Title?.value || '',
        );
        const adultTitle = getTitle(getFullPassengerName(passenger, getPhrase), adultFields?.Title?.value);
        const childTitle = getTitle(
            getFullPassengerName(passenger, getPhrase),
            childFields?.Title?.value,
            childAgeToken,
        );

        const adultInfantTitleConstant = getTitleConstant(numberOfPerson, adultWithInfantFields?.TitleConstant?.value);
        const adultTitleConstant = getTitleConstant(numberOfPerson, adultFields?.TitleConstant?.value);
        const childTitleConstant = getTitleConstant(numberOfPerson, childFields?.TitleConstant?.value, childAgeToken);

        return (
            <div ref={ref} className='seat-confirmation__container'>
                <div className='seat-confirmation__seat-selection'>
                    <div className='seat-confirmation__people'>
                        {withInfant && type === GuestType.Adult && (
                            <AncillariesPersonDetails
                                personIcon={adultWithInfantFields?.Icon}
                                titleConstant={adultInfantTitleConstant}
                                title={adultInfantTitle}
                            />
                        )}

                        {!withInfant && type === GuestType.Adult && (
                            <AncillariesPersonDetails
                                personIcon={adultFields?.Icon}
                                titleConstant={adultTitleConstant}
                                title={adultTitle}
                            />
                        )}

                        {type === GuestType.Child && (
                            <AncillariesPersonDetails
                                personIcon={childFields?.Icon}
                                titleConstant={childTitleConstant}
                                title={childTitle}
                            />
                        )}
                    </div>
                    {!!seatNumber ? (
                        <SeatSelectionMobile text={priceBand} seatNumber={seatNumber} seatColor={color} />
                    ) : (
                        <SeatSelectionMobile text={getPhrase(SitecoreDictionary.GlobalsLabelsNoSeatSelected)} />
                    )}
                </div>
                {!seatNumber ? (
                    <SeatBag
                        count={1}
                        icon={FallbackBenefit?.fields?.Icon}
                        text={FallbackBenefit?.fields?.Name?.value}
                    />
                ) : (
                    <div className='seat-confirmation__price-container'>
                        <SeatProducts products={products} />
                        {price !== undefined && !isPricesHidden && (
                            <div
                                data-cs-mask
                                className={classNames(
                                    'seat-confirmation__price',
                                    !!seat?.hasSecondaryStyle && 'seat-confirmation__price--secondary-color',
                                )}
                                data-tid='confirmed-seat-price'
                            >
                                {formatMoney(Number(price), { currency, signDisplay: SignDisplay.Always })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    },
);

export default SeatConfirmationMobile;
