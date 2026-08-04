import useStore from 'frontend/hooks/useStore';
import { formatPriceToTwoDecimalPlaces, getSeatBorderColor } from 'frontend/utils/seatAndBags.utils';
import { IPassengerSeat } from 'models/data/ISeatMapStore';
import { ISeatsAndBagsFields } from 'models/data/ISeatsAndBagsFields';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { LuggageAllowanceType } from 'frontend/components/cro/BasketAB/components/Flight';
import SeatBag from 'frontend/components/renderings/SeatAndBags/components/SeatBag';
import SeatProducts from 'frontend/components/renderings/SeatAndBags/components/SeatProducts/SeatProducts';

import SeatSelectionDesktop from './SeatSelectionDesktop';

interface ISeatSelectionAndLuggageDesktopProps {
    fields: ISeatsAndBagsFields;
    isPricesHidden?: boolean;
    seat?: IPassengerSeat;
}

export const SeatSelectionAndLuggageDesktop = ({
    seat,
    fields,
    isPricesHidden = false,
}: ISeatSelectionAndLuggageDesktopProps) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));
    const { price, priceBand, seatNumber, products } = seat || {};

    if (!fields) {
        return null;
    }

    const { FallbackBenefit } = fields;

    return (
        <>
            {!!seatNumber ? (
                <SeatSelectionDesktop
                    text={priceBand ?? ''}
                    color={getSeatBorderColor(seat?.priceBand)}
                    seatNumber={seatNumber}
                    price={formatPriceToTwoDecimalPlaces(price)}
                    hasSecondaryStyle={seat?.hasSecondaryStyle}
                    isPricesHidden={isPricesHidden}
                />
            ) : (
                <>
                    <SeatSelectionDesktop text={getPhrase(SitecoreDictionary.GlobalsLabelsNoSeatSelected)} />
                    <div className='seat-confirmation__bags' data-tid='fallback-bag'>
                        <SeatBag
                            count={1}
                            icon={FallbackBenefit?.fields?.Icon}
                            text={FallbackBenefit?.fields?.Name?.value}
                        />
                    </div>
                </>
            )}

            <div className='seat-confirmation__bags'>
                <SeatProducts products={products?.filter(p => p.id !== LuggageAllowanceType.LargeOverheadBag)} />
            </div>
        </>
    );
};

export default SeatSelectionAndLuggageDesktop;
