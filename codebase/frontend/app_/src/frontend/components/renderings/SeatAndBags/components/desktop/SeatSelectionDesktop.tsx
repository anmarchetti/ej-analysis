import classNames from 'classnames';

import { SignDisplay, TrailingZeroDisplay } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { SeatColor } from 'models/enum/SeatColor';

export interface ISeatSelectionDesktopProps {
    text: string;
    color?: SeatColor;
    hasSecondaryStyle?: boolean;
    isPricesHidden?: boolean;
    price?: string | null;
    seatNumber?: string | null;
}

const SeatSelectionDesktop = ({
    text,
    color,
    seatNumber,
    price,
    hasSecondaryStyle = false,
    isPricesHidden = false,
}: ISeatSelectionDesktopProps) => {
    const { currency, formatMoney } = useStore((stores: TStores) => ({
        currency: stores.seatMapStore.currency,
        formatMoney: stores.marketStore.formatMoney,
    }));

    return (
        <div className='seat-confirmation__credentials' data-tid='seat-confirmation'>
            <div>
                {seatNumber && (
                    <span
                        className={`seat-confirmation__seat-number seat-confirmation__seat-number--border-color-${color}`}
                    >
                        {seatNumber}
                    </span>
                )}
                {text && <span className='seat-confirmation__place'>{text}</span>}
            </div>
            {!isPricesHidden && !!price && (
                <div data-tid='seat-price'>
                    <span
                        className={classNames(
                            'seat-confirmation__price',
                            hasSecondaryStyle && 'seat-confirmation__price--secondary-color',
                        )}
                    >
                        {formatMoney(Number(price), {
                            currency,
                            signDisplay: SignDisplay.Always,
                            trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                        })}
                    </span>
                </div>
            )}
        </div>
    );
};

export default SeatSelectionDesktop;
