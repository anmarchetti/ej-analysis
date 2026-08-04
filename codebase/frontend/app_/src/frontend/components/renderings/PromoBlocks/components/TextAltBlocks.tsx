import { FC, useContext } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { IPromoBlockProps } from 'models/data/IPromoBlockFields';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';
import { TrackingContext } from 'frontend/components/renderings/PromoBlocks/components/PromoBlocksTrackingWrapper/PromoBlocksTrackingWrapper';
import styles from 'frontend/components/renderings/PromoBlocks/PromoBlocks.module.scss';

const TextBlockAlts: FC<IPromoBlockProps> = ({ items, titleClassName }) => {
    const { trackItemClick } = useContext(TrackingContext);

    return (
        <div className='row mb-lg-4' data-tid='promo-blocks'>
            {items.map(item => {
                const { Title, Description, Link } = item.fields;
                const { href: linkHref, text: linkText } = Link?.value || {};

                return (
                    <div className='col-12 col-lg-4 mb-3 d-flex' key={item.id}>
                        <div className={styles['text-alt-promo']} data-tid='promo-block'>
                            <div className={styles['text-alt-promo-body']}>
                                {!!Title && (
                                    <Text
                                        className={classNames(styles['text-alt-title'], titleClassName)}
                                        field={Title}
                                        tag='h5'
                                        data-tid='promo-block-title'
                                    />
                                )}
                                {!!Description && (
                                    <RichTextWithLinks
                                        className={styles['text-alt-description']}
                                        field={Description}
                                        dataId='promo-block-content'
                                    />
                                )}
                            </div>

                            <div className={styles['text-alt-promo-footer']}>
                                {!!linkHref && (
                                    <RouterLink
                                        link={Link}
                                        className={`${styles['text-alt-btn']} mt-3`}
                                        dataId='promo-block-link'
                                        onClick={(): void => trackItemClick?.(item, linkText)}
                                    >
                                        {linkText}
                                    </RouterLink>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default TextBlockAlts;
