import { FC, useContext } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { isEven } from 'frontend/utils/numbers';
import { IPromoBlockProps } from 'models/data/IPromoBlockFields';
import { MediaSize } from 'models/data/MediaSizeParams';
import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';
import ContentModal from 'frontend/components/renderings/ContentModal/ContentModal';
import { TrackingContext } from 'frontend/components/renderings/PromoBlocks/components/PromoBlocksTrackingWrapper/PromoBlocksTrackingWrapper';
import styles from 'frontend/components/renderings/PromoBlocks/PromoBlocks.module.scss';

const VerticalStripeBlocks: FC<IPromoBlockProps> = ({ items, titleClassName, isButtonOutlined }) => {
    const { trackItemClick } = useContext(TrackingContext);

    return (
        <div className='row mb-4'>
            {items
                .filter(item => !!item.fields)
                .map((item, index) => {
                    const { ModalContent, Title, Description, Link, Image } = item.fields;
                    const { href: linkHref, text: linkText } = Link?.value || {};
                    const modalFields = ModalContent?.fields;
                    const promoClass = index !== 0 || isEven(items.length) ? 'col-lg-6' : '';

                    return (
                        <div className={`col-12 mb-4 ${promoClass}`} key={item.id}>
                            <div className={styles['vertical-stripe-promo']} data-tid='vertical-stripe-promo-block'>
                                <div className={styles['bg--image']} data-tid='vertical-stripe-bg-image'>
                                    <JSSImageNext field={Image} mediaSize={{ desktop: MediaSize.Large }} fill />
                                </div>
                                <div className={styles['component-info']}>
                                    <div className={styles['component-content']}>
                                        {!!Title && (
                                            <Text
                                                className={classNames(
                                                    styles['vertical-stripe-title'],
                                                    'mb-3',
                                                    titleClassName,
                                                )}
                                                field={Title}
                                                tag='h2'
                                                data-tid='vertical-stripe-title'
                                            />
                                        )}
                                        {!!Description && (
                                            <RichTextWithLinks
                                                className={styles['description']}
                                                field={Description}
                                                dataId='vertical-stripe-description'
                                            />
                                        )}
                                        {!!linkHref && (
                                            <RouterLink
                                                link={Link}
                                                className={classNames(
                                                    styles['promo-button'],
                                                    styles['promo-button-size'],
                                                    'btn',
                                                    'mt-3',
                                                    {
                                                        ['btn--outlined']: isButtonOutlined,
                                                    },
                                                )}
                                                dataId='promo-block-button'
                                                onClick={(): void => trackItemClick?.(item, linkText)}
                                            >
                                                {linkText}
                                            </RouterLink>
                                        )}
                                        {!!modalFields?.ModalButtonText && (
                                            <ContentModal
                                                fields={modalFields}
                                                params={{ IsOutlined: true }}
                                                rendering={false}
                                                className={`${styles['promo-button-size']} mt-3`}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
        </div>
    );
};
export default VerticalStripeBlocks;
