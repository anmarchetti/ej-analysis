import * as React from 'react';

export interface ISeatSelectionMobileProps {
    seatColor?: string | null;
    seatNumber?: string | null;
    text?: string;
}

const SeatSelectionMobile = ({ text, seatColor, seatNumber }: ISeatSelectionMobileProps) => (
    <div className='seat-confirmation__container-selected' data-tid='seat-selection-container'>
        {text && <span className='seat-confirmation__selected'>{text}</span>}
        {seatNumber && (
            <span
                className={`seat-confirmation__seat-number seat-confirmation__seat-number--border-color-${seatColor}`}
                data-tid='seat-selection-seat-number'
            >
                {seatNumber}
            </span>
        )}
    </div>
);

export default SeatSelectionMobile;
