import { FC, useContext } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { IPromoBlockProps } from 'models/data/IPromoBlockFields';
import JSSImage from 'frontend/components/common/JSSImage';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';
import { TrackingContext } from 'frontend/components/renderings/PromoBlocks/components/PromoBlocksTrackingWrapper/PromoBlocksTrackingWrapper';
import styles from 'frontend/components/renderings/PromoBlocks/PromoBlocks.module.scss';

interface IPromoBlocksIconAltProps extends IPromoBlockProps {
    multiRow: boolean;
}

const IconTextBlocksAlt: FC<IPromoBlocksIconAltProps> = ({ items, multiRow, titleClassName }) => {
    const { trackItemClick } = useContext(TrackingContext);

    return (
        <div className='row mb-lg-4'>
            {items.map(item => (
                <div className={classNames('col-12 col-md-6 mb-3', !multiRow && 'col-lg-4')} key={item.id}>
                    <div className={styles['icon-alt-promo']} data-tid='promo-block-item'>
                        <JSSImage
                            className={`${styles['icon']} ${styles['hide-mobile']}`}
                            field={item.fields.Image}
                            data-tid='promo-block-icon-desktop'
                        />
                        <div className='d-block'>
                            <div className={styles['title-wrapper']} data-tid='promo-block-title-wrapper'>
                                <JSSImage
                                    className={`${styles['icon']} ${styles['hide-desktop']}`}
                                    field={item.fields.Image}
                                    data-tid='promo-block-icon-mobile'
                                />
                                {!!item.fields?.Title && (
                                    <Text
                                        className={classNames(styles['icon-alt-title'], titleClassName)}
                                        field={item.fields.Title}
                                        tag='p'
                                    />
                                )}
                            </div>
                            {!!item.fields?.Description && (
                                <RichTextWithLinks
                                    className={styles['icon-alt-description']}
                                    field={item.fields.Description}
                                    dataId='promo-block-description'
                                />
                            )}
                        </div>
                        {!!item.fields.Link?.value?.href && (
                            <RouterLink
                                link={item.fields.Link}
                                className='link-overlay'
                                onClick={(): void => trackItemClick?.(item)}
                            />
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default IconTextBlocksAlt;
