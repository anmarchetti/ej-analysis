import { RefObject, useMemo, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SiteSettings from 'models/enum/SiteSettings';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreCompositeField, ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import JSSImageNext from 'frontend/components/common/JSSImageNext/JSSImageNext';
import ImageGallery from 'frontend/components/icons/ImageGallery';
import FullScreenImageCarousel from 'frontend/components/renderings/HotelDetails/HotelImageCarousel/components/FullScreenImageCarousel';

import NeedToKnowInformation from './components/NeedToKnowInformation';

import styles from './NeedToKnow.module.scss';

interface INeedToKnowFields {
    Description: ISitecoreField<string>;
    Images: ISitecoreCompositeField<INeedToKnowImage>[];
    Information: ISitecoreCompositeField<INeedToKnowInformation>[];
    Subtitle: ISitecoreField<string>;
    Title: ISitecoreField<string>;
    ViewGallery: ISitecoreField<string>;
}

export interface INeedToKnowInformation {
    InformationContent: ISitecoreField<string>;
    InformationIcon: ISitecoreField<ISitecoreImage>;
    InformationSmallPrint: ISitecoreField<string>;
}

interface INeedToKnowImage {
    Image: ISitecoreField<ISitecoreImage>;
    Url: ISitecoreField<IImageUrl>;
}

interface IImageUrl {
    href: string;
}
interface INeedToKnowProps extends ISitecoreComponent<INeedToKnowFields, null> {
    className?: string | null;
    containerRef?: RefObject<HTMLDivElement>;
}

const NeedToKnow = ({ fields, containerRef, className = null }: INeedToKnowProps) => {
    const { getSetting } = useStore((stores: TStores) => ({
        getSetting: stores.layoutStore.getSetting,
    }));

    const [isCarouselOpen, setIsCarouselOpen] = useState(false);

    const fallbackImage = getSetting(SiteSettings.HotelFallbackImage);

    const { Title, Description, Subtitle, Images, ViewGallery, Information } = fields || {};

    const [carouselImages, firstImage] = useMemo(() => {
        const isFirstImageSrc = !!Images?.[0]?.fields.Image?.value?.src;
        const firstImage = isFirstImageSrc ? Images?.[0]?.fields.Image : { value: { src: fallbackImage } };
        const carousel = Images?.map((image, i, arr) => {
            const { id, fields } = image;

            return {
                index: i,
                image: {
                    id: id,
                    large: fields?.Image.value?.src,
                    medium: fields?.Image.value?.src,
                    small: fields?.Image.value?.src,
                },
                totalSlides: arr.length,
                thumbnailClass: 'img-carousel-thumbnails__thumbnail',
            };
        });

        return [carousel, firstImage];
    }, [Images]);

    const toggleCarousel = () => {
        setIsCarouselOpen(isOpen => !isOpen);
    };

    if (!fields || (!!Images && Images?.length <= 0 && !!Information && Information?.length <= 0)) {
        return null;
    }

    return (
        <>
            {!!carouselImages && isCarouselOpen && (
                <FullScreenImageCarousel
                    images={carouselImages}
                    fallbackImage={fallbackImage}
                    onClose={toggleCarousel}
                    currentImageIndex={0}
                />
            )}
            <div className={`${styles.needToKnow} ${className}`} ref={containerRef} data-tid='need-to-know-block'>
                {!!Images && Images?.length > 0 && (
                    <div className={styles.galleryWrapper} data-tid='need-to-know-gallery-wrapper'>
                        {!!Title?.value && (
                            <Text
                                field={Title}
                                tag='p'
                                className={styles.title}
                                data-tid='need-to-know-gallery-title'
                            />
                        )}
                        {!!Description?.value && (
                            <Text
                                field={Description}
                                tag='p'
                                className={styles.content}
                                data-tid='need-to-know-gallery-description'
                            />
                        )}
                        <div
                            className={styles.galleryImageWrapper}
                            onClick={toggleCarousel}
                            data-tid='need-to-know-gallery'
                        >
                            <div className={styles.gallery}>
                                <div className={styles.image}>
                                    <div className={styles.overflow} />
                                    <JSSImageNext field={firstImage} fill />
                                </div>

                                {!!ViewGallery?.value && (
                                    <div className={styles.viewGalleryBlock}>
                                        <ImageGallery className={styles.icon} />
                                        <Text field={ViewGallery} tag='p' className={`${styles.viewGallery} my-0`} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {!!Information && Information?.length > 0 && (
                    <div className={styles.needToKnowWrapper} data-tid='need-to-know-info-wrapper'>
                        {!!Subtitle && (
                            <Text
                                field={Subtitle}
                                tag='p'
                                className={styles.subtitle}
                                data-tid='need-to-know-info-title'
                            />
                        )}
                        <div className={styles.informationWrapper} data-multirow={Information.length > 4}>
                            {Information.map(({ id, fields }) => (
                                <NeedToKnowInformation key={id} {...fields} />
                            ))}
                        </div>
                        {Information.filter(({ fields }) => !!fields.InformationSmallPrint?.value).map(
                            ({ id, fields }) => (
                                <Text
                                    key={`smallprint-${id}`}
                                    field={fields.InformationSmallPrint}
                                    tag='p'
                                    className={`${styles.smallPrint} mb-0`}
                                    data-tid='need-to-know-small-print'
                                />
                            ),
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default NeedToKnow;
