import React, { useRef, useState } from 'react';
import ImageGallery from 'react-image-gallery';
import { observer } from 'mobx-react';

import { cmsUrls } from 'code/endpoints';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { extendSitecoreImage } from 'frontend/utils/url.utils';
import { IImage } from 'models/data/IHotel';
import { ImageSize } from 'models/enum/ImageSize';
import HotelImage from 'frontend/components/common/HotelImage/HotelImage';
import { ISliderImage } from 'frontend/components/common/OfferCardSlider/OfferCardSlider';
import SliderNavButton from 'frontend/components/common/SliderNavButton';
import { withRerender } from 'frontend/components/hoc';
import { IComponentWithRerenderProps } from 'frontend/components/hoc/withRerender';
import SliderImage from 'frontend/components/renderings/SearchResults/components/SliderImage';

interface IBookingHotelGalleryProps extends IComponentWithRerenderProps {
    images: IImage[];
    fallbackImage?: string;
    isPrintPreview?: boolean;
}

const NUMBER_OF_EXTRA_IMAGES = 4;

const ViewBookingHotelGallery = ({
    images,
    fallbackImage,
    isPrintPreview,
    wasRerendered,
}: IBookingHotelGalleryProps) => {
    const { isScreenLarge } = useStore((stores: TStores) => ({
        isScreenLarge: stores.appStore.isScreenLarge,
    }));

    const fallbackImageURL = fallbackImage && cmsUrls.media(fallbackImage);
    const validImages = images.filter(image => image.medium || (image.large && image.small));
    const extraImages =
        validImages.length > NUMBER_OF_EXTRA_IMAGES ? validImages.slice(-NUMBER_OF_EXTRA_IMAGES) : validImages.slice(1);
    const mainImages = validImages.slice(0, -extraImages.length);
    const [hadSliderInteraction, setSliderInteraction] = useState(false);
    const sliderRef = useRef<any>();

    const getCurrentSliderIndex = () => (sliderRef?.current ? sliderRef?.current.getCurrentIndex() : 0);

    const onSlide = () => {
        !hadSliderInteraction && setSliderInteraction(true);
    };

    const renderImage = (image: IImage, key: string | number, imageSize: ImageSize = ImageSize.Medium) => (
        <HotelImage
            key={key}
            image={image}
            defaultSize={imageSize}
            fallbackImage={fallbackImageURL}
            className='hotel-card-img'
        />
    );

    const renderSlider = (images: IImage[]) => {
        const sliderImages = images.map((image, i) => ({
            index: i,
            image: {
                id: image.id,
                large: extendSitecoreImage(image.large),
                medium: extendSitecoreImage(image.medium),
                small: extendSitecoreImage(image.small),
            },
            totalSlides: images.length,
        }));

        return (
            <ImageGallery
                items={sliderImages}
                onSlide={onSlide}
                renderItem={(i: ISliderImage) => (
                    <SliderImage
                        item={i}
                        slideIndex={getCurrentSliderIndex()}
                        fallbackImage={fallbackImageURL}
                        hadInteraction={hadSliderInteraction}
                    />
                )}
                renderLeftNav={onClick => <SliderNavButton isLeftNav onClick={onClick} />}
                renderRightNav={onClick => <SliderNavButton onClick={onClick} />}
                lazyLoad
                showThumbnails={false}
                showFullscreenButton={false}
                showIndex
                slideDuration={350}
                ref={sliderRef}
            />
        );
    };

    if ((wasRerendered && isScreenLarge) || isPrintPreview) {
        return (
            <div className='view-booking-hotel__gallery no-print'>
                <div className='view-booking-hotel__gallery-main'>
                    {renderImage(mainImages[0], 'main', ImageSize.Large)}
                </div>
                <div className='view-booking-hotel__gallery-extra'>
                    {extraImages.map((image, i) => renderImage(image, i))}
                </div>
            </div>
        );
    }

    return <div className='view-booking-hotel__gallery no-print'>{renderSlider(validImages)}</div>;
};

export default withRerender(observer(ViewBookingHotelGallery));
