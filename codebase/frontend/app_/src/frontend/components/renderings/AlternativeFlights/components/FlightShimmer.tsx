import * as React from 'react';

export const FlightShimmer = () => (
    <div className='flight-card-shimmer' data-tid='flight-shimmer'>
        <div className='departure-flight'>
            <div className='first-column'>
                <div className='placeholder-shimmer date' />
                <div className='placeholder-shimmer time' />
                <div className='placeholder-shimmer direction' />
            </div>
            <div className='second-column'>
                <div className='placeholder-shimmer time' />
                <div className='placeholder-shimmer direction' />
            </div>
        </div>
        <div className='separator' />
        <div className='arrival-flight'>
            <div className='first-column'>
                <div className='placeholder-shimmer time' />
                <div className='placeholder-shimmer direction' />
            </div>
            <div className='second-column'>
                <div className='placeholder-shimmer date' />
                <div className='placeholder-shimmer time' />
                <div className='placeholder-shimmer direction' />
            </div>
            <div className='third-column'>
                <div className='placeholder-shimmer btn' />
            </div>
        </div>
    </div>
);
