import { FC, useEffect, useRef, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { RichText } from '@sitecore-jss/sitecore-jss-react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { MediaSize } from 'models/data/MediaSizeParams';
import Button from 'frontend/components/common/Button';
import JSSImageNext from 'frontend/components/common/JSSImageNext/JSSImageNext';
import SVGChevronDown from 'frontend/components/icons-new/ChevronDown';
import { IChangeFeeInfoProps } from 'frontend/components/renderings/ChangeFeeInfo/ChangeFeeInfo';

import styles from './ChangeFeeInfoDesktop.module.scss';

const LAYOUT_TIMEOUT = 500;

const ChangeFeeInfoDesktop: FC<IChangeFeeInfoProps> = ({ fields, descriptionText }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [isStuck, setIsStuck] = useState(false);
    const textRef = useRef<HTMLSpanElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const offsetTopRef = useRef(0);

    const updateAmendmentBasketHeight = (): void => {
        setTimeout(() => {
            const stickyBoxes = Array.from(document.querySelectorAll('#sticky-box'));
            offsetTopRef.current = stickyBoxes.reduce((acc, elem: HTMLElement) => acc + elem.offsetHeight, 0);
        }, LAYOUT_TIMEOUT); //Target element is in the different rendering, and the render order is unknown
    };

    useEffect(() => {
        const checkOverflow = (): void => {
            if (!textRef.current) return;

            setIsExpanded(false);

            const isOverflowing = textRef.current.scrollWidth > textRef.current.clientWidth;
            setIsOverflowing(isOverflowing);
        };

        checkOverflow();
        window.addEventListener('resize', checkOverflow);

        return () => window.removeEventListener('resize', checkOverflow);
    }, []);

    useEffect(() => {
        const checkIfActuallySticky = () => {
            if (!containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const isStuck = rect.top <= offsetTopRef.current;
            setIsStuck(isStuck);
        };

        updateAmendmentBasketHeight();
        checkIfActuallySticky();

        window.addEventListener('resize', updateAmendmentBasketHeight);
        window.addEventListener('scroll', checkIfActuallySticky);

        return () => {
            window.removeEventListener('resize', updateAmendmentBasketHeight);
            window.removeEventListener('scroll', checkIfActuallySticky);
        };
    }, []);

    if (!fields) return null;

    const { Title, ViewLessCTA, ViewMoreCTA, Icon } = fields;

    const CTAField = isExpanded ? ViewLessCTA : ViewMoreCTA;

    const toggleExpansion = (): void => setIsExpanded(isExpanded => !isExpanded);

    return (
        <div
            ref={containerRef}
            data-tid='change-fee-info-wrapper'
            className={classNames(styles.wrapper, 'fee-banner-desktop')}
        >
            <div
                data-tid='change-fee-info-container'
                className={classNames(styles.container, {
                    [styles.stuck]: isStuck,
                    stuck: isStuck,
                })}
                style={{
                    top: offsetTopRef.current,
                }}
            >
                <div className={styles.content}>
                    <div className={styles.icon}>
                        <JSSImageNext field={Icon} fill mediaSize={MediaSize.Small} />
                    </div>
                    <span
                        ref={textRef}
                        data-tid='change-fee-info-text'
                        className={classNames(styles.text, {
                            [styles.isCollapsed]: !isExpanded,
                        })}
                    >
                        <Text className={styles.title} tag='span' field={Title} />{' '}
                        <RichText field={{ value: descriptionText }} tag='span' className={styles.description} />
                    </span>

                    {isOverflowing && (
                        <Button className={styles.expand} onClick={toggleExpansion} isTransparent>
                            <Text field={CTAField} />

                            <SVGChevronDown className={classNames(isExpanded && 'icon--reflect-y')} />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default observer(ChangeFeeInfoDesktop);
