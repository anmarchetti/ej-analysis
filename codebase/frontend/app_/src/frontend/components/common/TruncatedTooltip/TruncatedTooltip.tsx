import React, { useEffect, useRef, useState } from 'react';
import { Tooltip } from 'react-tooltip';

import useStore from 'frontend/hooks/useStore';

import truncatedTooltipStyle from './truncatedTooltip.module.scss';

interface ITruncatedTooltip {
    id: string;
    text: string;
    className?: string;
}

export const TruncatedTooltip = ({ className, text, id }: ITruncatedTooltip) => {
    const { isScreenLarge } = useStore(stores => ({
        isScreenLarge: stores.appStore.isScreenLarge,
    }));

    const textElementRef = useRef<HTMLSpanElement>(null);
    const [isShowTooltip, setIsShowTooltip] = useState<boolean>(false);

    useEffect(() => {
        if (textElementRef.current !== null) {
            const compare = textElementRef.current.scrollWidth > textElementRef.current.clientWidth;
            const isNeedToShowTooltip = compare && isScreenLarge;
            setIsShowTooltip(isNeedToShowTooltip);

            return;
        }

        setIsShowTooltip(false);
    }, [isScreenLarge]);

    return (
        <React.Fragment>
            <span className={className} id={id} ref={textElementRef} data-tid={id}>
                {text}
            </span>
            {isShowTooltip && (
                <Tooltip
                    clickable={false}
                    place='bottom'
                    anchorSelect={`#${id}`}
                    variant='light'
                    float
                    content={text}
                    className={truncatedTooltipStyle.truncatedTooltip}
                    positionStrategy='fixed'
                />
            )}
        </React.Fragment>
    );
};
