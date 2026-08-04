import { FC } from 'react';

import { toKebabCase } from 'frontend/utils/string.utils';
import styles from 'frontend/components/renderings/SocialMediaContent/PosterLayout.module.scss';

/**
 * Downloadable image with dataUri source needs to be link,
 * if we need to specify filename
 */
interface IDownloadableImageProps {
    name: string;
    size: number;
    src: Nullable<string>;
}

export const DownloadableImage: FC<IDownloadableImageProps> = ({ name, size, src }) => (
    <a href={src || '#'} onClick={e => e.preventDefault()} className={styles.imgLink} download={toKebabCase(name)}>
        {!!src && (
            <img
                className={styles.image}
                width={size}
                height={size}
                src={src}
                alt={name}
                title={name}
                data-tid='downloadable-image'
            />
        )}
    </a>
);
