import { forwardRef, Ref } from 'react';

interface IHotelImageCarouselThumbnailsProps {
    isLoading: boolean;
}

export const HotelImageCarouselThumbnails = forwardRef(
    ({ isLoading }: IHotelImageCarouselThumbnailsProps, ref: Ref<HTMLDivElement>) => {
        if (isLoading)
            return (
                <div
                    className='placeholder-thumbnails d-none d-lg-block'
                    key='placeholders'
                    data-tid='placeholder-thumbnails'
                >
                    <div className='placeholder-thumbnail placeholder-shimmer' />
                    <div className='placeholder-thumbnail placeholder-shimmer' />
                    <div className='placeholder-thumbnail placeholder-shimmer' />
                    <div className='placeholder-thumbnail placeholder-shimmer' />
                    <div className='placeholder-thumbnail placeholder-shimmer' />
                    <div className='placeholder-thumbnail placeholder-shimmer' />
                    <div className='placeholder-thumbnail placeholder-shimmer' />
                    <div className='placeholder-thumbnail placeholder-shimmer' />
                    <div className='placeholder-thumbnail placeholder-shimmer' />
                    <div className='placeholder-thumbnail placeholder-shimmer' />
                </div>
            );

        return (
            <figure
                ref={ref}
                key='thumbnails'
                className='img-carousel-thumbnails hotel-thumbnails'
                aria-label='Hotel images gallery'
                data-tid='img-carousel-thumbnails'
            />
        );
    },
);

export default HotelImageCarouselThumbnails;
