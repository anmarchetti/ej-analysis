import React from 'react';

import SvgSeatSideViewFilled from 'frontend/components/icons-new/Seat_(sideView)Filled';

export interface ISeatMapSpinnerProps {
    header?: string;
}

const SeatMapSpinner = (props: ISeatMapSpinnerProps) => (
    <div className='seat-map-spinner' data-tid='seat-map-spinner'>
        <div className='overlay-spinner'>
            <div className='overlay-spinner__container'>
                <div className='overlay-spinner__icon-container'>
                    <div className='overlay-spinner__icon' />
                    <SvgSeatSideViewFilled />
                </div>

                {props.header && <div className='overlay-spinner__header'>{props.header}</div>}

                <div className='animation-wrapper'>
                    <div className='animation-row'>
                        <div className='placeholder-loading placeholder-shimmer' />
                        <div className='placeholder-loading placeholder-shimmer' />
                        <div className='placeholder-loading placeholder-shimmer' />
                        <div className='placeholder-loading placeholder-shimmer' />
                        <div className='placeholder-loading placeholder-shimmer' />
                        <div className='placeholder-loading placeholder-shimmer' />
                        <div className='placeholder-loading placeholder-shimmer' />
                    </div>
                    <div className='animation-row'>
                        <div className='placeholder-loading placeholder-shimmer' />
                        <div className='placeholder-loading placeholder-shimmer' />
                        <div className='placeholder-loading placeholder-shimmer' />
                        <div className='placeholder-loading placeholder-shimmer' />
                        <div className='placeholder-loading placeholder-shimmer' />
                        <div className='placeholder-loading placeholder-shimmer' />
                        <div className='placeholder-loading placeholder-shimmer' />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default SeatMapSpinner;
