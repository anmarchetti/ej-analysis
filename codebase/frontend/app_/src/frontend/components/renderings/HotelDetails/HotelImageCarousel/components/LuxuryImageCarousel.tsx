import { FC } from 'react';
import classNames from 'classnames';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';
import PromoBadge from 'frontend/components/common/PromoBadge';
import Expand from 'frontend/components/icons-new/Expand';

import styles from './LuxuryImageCarousel.module.scss';

export const LUX_BLUR_IMG_ID = 'lux-carousel-blur-img';
export const LUX_MAIN_IMG_ID = 'lux-carousel-main-img';
export interface INewHotelCarouselProps extends IComponentWithDictionary {
    imageSrc: string;
    onExpand: () => void;
    renderCard: JSX.Element;
    renderSocialProofing: (isLuxury: boolean) => JSX.Element;
    children?: React.ReactNode;
    onPlayVideo?: () => void;
    promoText?: string;
}

const LuxuryImageCarousel: FC<INewHotelCarouselProps> = ({
    imageSrc,
    getPhrase,
    children,
    renderCard,
    promoText,
    onPlayVideo,
    onExpand,
    renderSocialProofing,
}) => (
    <div className={styles.wrapper}>
        <div className={styles.main}>
            <JSSImageNext id={LUX_BLUR_IMG_ID} field={{ value: { src: imageSrc } }} className={styles.blur} fill />
            <JSSImageNext
                id={LUX_MAIN_IMG_ID}
                field={{ value: { src: imageSrc } }}
                className={styles.image}
                fill
                data-tid='lux-carousel-main-img'
            />

            <div className={styles.content}>
                <div className={styles.leftColumn}>
                    <div>
                        <div className={classNames(styles.btnWrapper, { [styles.larger]: !!onPlayVideo })}>
                            <button
                                className={styles.expand}
                                onClick={onExpand}
                                data-tid='lux-carousel-expand-btn'
                                aria-label='Open Fullscreen'
                            >
                                <Expand />

                                {!onPlayVideo && (
                                    <p className={styles.text}>
                                        {getPhrase(SitecoreDictionary.HotelDetailsLabelsViewGallery)}
                                    </p>
                                )}
                            </button>

                            {!!onPlayVideo && (
                                <button className={styles.play} onClick={onPlayVideo} data-tid='lux-carousel-play-btn'>
                                    <p className={styles.text}>
                                        {getPhrase(SitecoreDictionary.HotelDetailsLabelsPlayVideo)}
                                    </p>
                                    <div className={styles.triangle} />
                                </button>
                            )}
                        </div>
                        {renderSocialProofing(true)}
                    </div>

                    <div>
                        <PromoBadge text={promoText} />
                    </div>
                </div>

                <div className={styles.cardWrapper}>{renderCard}</div>
            </div>
        </div>

        <div className={styles.carouselWrapper}>
            <div className={styles.carousel}>{children}</div>
        </div>
    </div>
);

export default LuxuryImageCarousel;
