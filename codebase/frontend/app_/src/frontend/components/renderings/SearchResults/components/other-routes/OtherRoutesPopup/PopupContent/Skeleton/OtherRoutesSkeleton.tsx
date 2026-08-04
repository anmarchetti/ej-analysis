import React from 'react';

const OtherRoutesSkeleton = (props: { isMobile?: boolean }) =>
    props.isMobile ? (
        <>
            <div className='table-row mobile'>
                <div className='table-col align-left placeholder-shimmer'>
                    <div>
                        <div className='table-col' />
                        <div className='table-col' />
                        <div className='table-col' />
                    </div>
                </div>
                <div className='table-col small placeholder-shimmer' />
            </div>
            <div className='table-row mobile'>
                <div className='table-col align-left placeholder-shimmer'>
                    <div>
                        <div className='table-col' />
                        <div className='table-col' />
                        <div className='table-col' />
                    </div>
                </div>
                <div className='table-col small placeholder-shimmer' />
            </div>
            <div className='table-row mobile'>
                <div className='table-col align-left placeholder-shimmer'>
                    <div>
                        <div className='table-col' />
                        <div className='table-col' />
                        <div className='table-col' />
                    </div>
                </div>
                <div className='table-col small placeholder-shimmer' />
            </div>
        </>
    ) : (
        <>
            <div className='table-row'>
                <div className='table-col placeholder-shimmer' />
                <div className='table-col placeholder-shimmer' />
                <div className='table-col placeholder-shimmer' />
                <div className='table-col placeholder-shimmer' />
                <div className='table-col placeholder-shimmer' />
                <div className='table-col small placeholder-shimmer' />
            </div>
            <div className='table-row'>
                <div className='table-col placeholder-shimmer' />
                <div className='table-col placeholder-shimmer' />
                <div className='table-col placeholder-shimmer' />
                <div className='table-col placeholder-shimmer' />
                <div className='table-col placeholder-shimmer' />
                <div className='table-col small placeholder-shimmer' />
            </div>
            <div className='table-row'>
                <div className='table-col placeholder-shimmer' />
                <div className='table-col placeholder-shimmer' />
                <div className='table-col placeholder-shimmer' />
                <div className='table-col placeholder-shimmer' />
                <div className='table-col placeholder-shimmer' />
                <div className='table-col small placeholder-shimmer' />
            </div>
        </>
    );

export default OtherRoutesSkeleton;
