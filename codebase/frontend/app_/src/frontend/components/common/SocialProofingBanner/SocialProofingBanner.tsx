import { FC, useEffect, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import SiteSettings from 'models/enum/SiteSettings';
import Button from 'frontend/components/common/Button';
import JSSImageNext from 'frontend/components/common/JSSImageNext/JSSImageNext';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import SvgCross from 'frontend/components/icons-new/Cross';

import styles from './SocialProofingBanner.module.scss';

export interface ISocialProofingBannerProps {
    dataIdToObserve?: string;
    isLuxury?: boolean;
    onClose?: () => void;
    shouldHide?: boolean;
}

export const MIN_NUMBER_OF_VIEWS = 100;
const PROOFING_DATA_ID = 'proofitData';
const HOTEL_VIEWS_ATTRIBUTE = 'data-hotel-views';
const ANIMATION_DURATION = 400;
const ICON_SIZE = 24;

const SocialProofingBanner: FC<ISocialProofingBannerProps> = ({
    shouldHide = false,
    isLuxury = false,
    dataIdToObserve = '',
    onClose,
}) => {
    const { getSetting } = useStore(stores => ({
        getSetting: stores.layoutStore.getSetting,
    }));

    const isEnabled = getSetting(SiteSettings.IsSocialProofingEnabled);
    const [isClosingAnimation, setIsClosingAnimation] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const message = { value: getSetting(SiteSettings.SocialProofingTrendingText) };
    const icon = {
        value: { src: getSetting(SiteSettings.SocialProofingTrendingIcon), width: ICON_SIZE, height: ICON_SIZE },
    };

    useEffect(() => {
        if (shouldHide || !isEnabled) {
            return;
        }

        const checkAndShowIfVisible = (): boolean => {
            const proofingData = document.getElementById(PROOFING_DATA_ID);

            if (!proofingData) {
                return false;
            }

            const hotelViews = Number(proofingData.getAttribute(HOTEL_VIEWS_ATTRIBUTE) ?? 0);

            if (hotelViews >= MIN_NUMBER_OF_VIEWS) {
                setIsVisible(true);
            }

            return true;
        };

        if (checkAndShowIfVisible()) {
            return;
        }

        const domObserver = new MutationObserver(() => {
            if (checkAndShowIfVisible()) {
                domObserver.disconnect();
            }
        });

        const observerTarget = document.querySelector(`[data-tid="${dataIdToObserve}"]`) ?? document.body;
        domObserver.observe(observerTarget, {
            childList: true,
            subtree: true,
        });

        return () => domObserver.disconnect();
    }, [isEnabled, shouldHide, dataIdToObserve]);

    if (shouldHide || !isEnabled || !isVisible || !message.value) {
        return null;
    }

    const handleCloseButton = (): void => {
        setIsClosingAnimation(true);
        setTimeout(() => {
            setIsVisible(false);
            onClose?.();
        }, ANIMATION_DURATION);
    };

    return (
        <div
            className={classNames(styles.container, { [styles.luxury]: isLuxury })}
            data-tid='social-proofing-banner-container'
        >
            <div
                className={classNames(styles.wrapper, { [styles.exit]: isClosingAnimation })}
                data-tid='social-proofing-banner'
            >
                <div className={styles.content}>
                    <JSSImageNext field={icon} />
                    <RichTextWithLinks field={message} className={styles.text} data-tid='social-proofing-text' />
                </div>
                <Button
                    className={styles.closeBtn}
                    onClick={handleCloseButton}
                    dataTid='social-proofing-close-button'
                    removeDefaultClass
                >
                    <SvgCross />
                </Button>
            </div>
        </div>
    );
};

export default observer(SocialProofingBanner);
