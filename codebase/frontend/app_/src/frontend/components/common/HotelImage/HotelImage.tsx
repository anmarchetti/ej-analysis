import { FC, useEffect, useState } from 'react';
import classNames from 'classnames';

import { FALLBACK_IMAGE_URL, getFallbackImage, getImage, getNextImageSrc } from 'frontend/utils/image.utils';
import { IImage } from 'models/data/IHotel';
import { ImageSize } from 'models/enum/ImageSize';
import AppImage from 'frontend/components/common/AppImage';

import styles from './HotelImage.module.scss';

export interface IHotelImageProps {
    image: IImage;
    className?: string;
    defaultSize?: ImageSize;
    fallbackImage?: string;
    notRenderEmptyImage?: boolean;
}

const HotelImage: FC<IHotelImageProps> = props => {
    const { image, defaultSize, fallbackImage } = props;
    const [url, setUrl] = useState('');

    useEffect(() => {
        setUrl(getImage(image, defaultSize));
    }, [image?.large, image?.medium, image?.small, defaultSize]); // eslint-disable-line react-hooks/exhaustive-deps

    // If initial image fails to load get fallback image
    const onError = (): void => {
        const img = getFallbackImage(image, defaultSize, fallbackImage);
        setUrl(img);
    };

    if (props.notRenderEmptyImage && !url && !fallbackImage) {
        return null;
    }

    const fallbackImageSrc = getNextImageSrc(fallbackImage ?? FALLBACK_IMAGE_URL);

    return (
        <div
            className={classNames(styles.container, props.className)}
            style={{
                backgroundImage: `url("${fallbackImageSrc}")`,
            }}
        >
            <AppImage
                src={url}
                fallbackImage={fallbackImage}
                style={{ objectPosition: 'center center', objectFit: 'cover' }}
                fill
                onError={onError}
                alt=''
            />
        </div>
    );
};

export default HotelImage;
