import { FunctionComponent, ReactNode } from 'react';

import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import JSSImageNext from 'frontend/components/common/JSSImageNext/JSSImageNext';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import styles from './BookExtrasBlock.module.scss';

export interface IBookExtrasBlockProps {
    bannerImage: ISitecoreField<ISitecoreImage>;
    buttonText: ISitecoreField<string>;
    description: ISitecoreField<string>;
    onClick: () => void;
    title: string;
    promoBanner?: ReactNode;
}

const BookExtrasBlock: FunctionComponent<IBookExtrasBlockProps> = ({
    title,
    bannerImage,
    onClick,
    description,
    buttonText,
    promoBanner,
}) => (
    <div className={styles.bookExtrasBlock} data-tid='extras-block'>
        <div className={styles.bannerImage} data-tid='extras-block-image'>
            {!!bannerImage && <JSSImageNext field={bannerImage} fill />}
            {!!title && (
                <h2 className={`${styles.extrasBlockTitle} d-sm-none`} data-tid='extras-block-mobile-title'>
                    {title}
                </h2>
            )}
        </div>
        <div className={styles.componentInfo}>
            <div className={styles.componentContent}>
                {!!title && (
                    <h2
                        className={`${styles.extrasBlockTitle} d-none d-sm-block`}
                        data-tid='extras-block-desktop-title'
                    >
                        {title}
                    </h2>
                )}
                {promoBanner}

                {!!description && (
                    <RichTextWithLinks
                        className={styles.description}
                        field={description}
                        data-tid='extras-block-description'
                    />
                )}
                <Button className={`${styles.buyNowButton} btn mt-3`} data-tid='buy-now-button' onClick={onClick}>
                    {buttonText?.value}
                </Button>
            </div>
        </div>
    </div>
);
export default BookExtrasBlock;
