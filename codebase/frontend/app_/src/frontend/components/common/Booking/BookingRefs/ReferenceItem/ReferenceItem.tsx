import React, { FC, useRef, useState } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { logger } from 'frontend/services/logging';
import { TStores } from 'frontend/store/IStores';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import Callout from 'frontend/components/common/Callout/Callout';
import SvgCopySimple from 'frontend/components/icons-new/CopySimple';
import SvgInfoLined from 'frontend/components/icons-new/InfoLined';

import { useAdjustCopiedLabelPosition } from './referenceItem.hooks';

import styles from './ReferenceItem.module.scss';

export interface IReferenceItemProps {
    title: string;
    children?: React.ReactNode;
    className?: string;
    dataTid?: string;
    onClick?: () => void;
    refNumberClassName?: string;
    referenceNumber?: string;
    titleClassName?: string;
    tooltip?: string;
}

export const DEFAULT_TIME = 4000;

export const ReferenceItem: FC<IReferenceItemProps> = ({
    title,
    tooltip,
    dataTid,
    referenceNumber,
    onClick,
    children,
    titleClassName,
    refNumberClassName,
    className,
}) => {
    const { getPhrase } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));
    const [isCopiedTooltipShown, setIsCopiedTooltipShown] = useState(false);
    const elementRef = useRef<HTMLDivElement | null>(null);
    const { isNearRightEdge, isNearLeftEdge, checkPosition } = useAdjustCopiedLabelPosition(elementRef);

    const onCopyClick = async (): Promise<void> => {
        if (onClick) {
            try {
                onClick();
                checkPosition();
                setIsCopiedTooltipShown(true);
                setTimeout(() => setIsCopiedTooltipShown(false), DEFAULT_TIME);
            } catch (e) {
                logger.error(e);
            }
        }
    };

    return (
        <div className={classNames(styles.bookingRef, className)} data-tid={dataTid}>
            <div data-tid={`${dataTid}-title`} className={classNames(styles.refTitleWrapper, titleClassName)}>
                <span data-tid='reference-title' className={styles.title}>
                    {title}
                </span>
                {!!tooltip && (
                    <Callout
                        className='ms-2'
                        content={<div>{tooltip}</div>}
                        orientation={CalloutOrientation.Top}
                        position={CalloutPosition.IconLeft}
                        isShownOnHover
                    >
                        <i className='more-info' data-tid={`${dataTid}-more-info-icon`}>
                            <SvgInfoLined />
                        </i>
                    </Callout>
                )}
            </div>
            {referenceNumber ? (
                <Button
                    className={classNames(styles.refNumber, refNumberClassName)}
                    dataTid={`${dataTid}-ref-number`}
                    removeDefaultClass
                    onClick={onCopyClick}
                    aria-label={`${getPhrase(SitecoreDictionary.GlobalsButtonsCopy)} ${title} ${referenceNumber}`}
                >
                    <span data-tid='ref-number' data-cs-mask>
                        {referenceNumber}
                    </span>
                    <i className={styles.copyIcon} data-tid={`${dataTid}-copy-icon`}>
                        <SvgCopySimple />
                    </i>
                </Button>
            ) : (
                <div className={classNames(styles.refNumber, refNumberClassName)} data-tid='no-ref-number-container'>
                    {children}
                </div>
            )}

            <div
                data-tid={`${dataTid}-copied-tooltip`}
                className={classNames(styles.copiedTooltip, {
                    'd-block': isCopiedTooltipShown,
                    [styles.alignToLeft]: isNearLeftEdge,
                    [styles.alignToRight]: isNearRightEdge,
                })}
                ref={elementRef}
            >
                {getPhrase(SitecoreDictionary.GlobalsLabelsCopied)}
            </div>
        </div>
    );
};
export default ReferenceItem;
