import { FC, useState } from 'react';
import Image, { ImageProps } from 'next/image';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { FALLBACK_IMAGE_URL, imageLoader } from 'frontend/utils/image.utils';

interface IAppImageProps extends ImageProps {
    src: string;
    fallbackImage?: string;
}

const AppImage: FC<IAppImageProps> = ({ src, fallbackImage, ...props }) => {
    const { isEditMode, isPreviewMode } = useStore((stores: TStores) => ({
        isEditMode: stores.layoutStore.isEditMode,
        isPreviewMode: stores.layoutStore.isPreviewMode,
    }));

    const [error, setError] = useState<boolean>(false);
    const fallback = fallbackImage ?? FALLBACK_IMAGE_URL;

    if (!src) {
        return null;
    }

    const imageError = (): void => {
        setError(true);
    };

    return (
        <Image
            src={error ? fallback : src}
            loader={isPreviewMode || isEditMode ? (): string => src : imageLoader}
            onError={imageError}
            {...props}
        />
    );
};

export default AppImage;
