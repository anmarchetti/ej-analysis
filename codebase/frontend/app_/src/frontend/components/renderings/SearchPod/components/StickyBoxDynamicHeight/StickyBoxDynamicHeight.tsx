import { FC, useRef, useState } from 'react';

import { STICKY_BOX_ID } from 'frontend/components/common/StickyBox';

import styles from './StickyBoxDynamicHeight.module.scss';

const AUTO_HEIGHT = 'auto';

export interface IStickyBoxDynamicHeightProps {
    render: (resetHeight: () => void, freezeHeight: () => void) => React.ReactNode;
}

const StickyBoxDynamicHeight: FC<IStickyBoxDynamicHeightProps> = ({ render }) => {
    const [contentHeight, setContentHeight] = useState<string>(AUTO_HEIGHT);
    const stickyBoxRef = useRef<HTMLDivElement | null>(null);

    const resetHeight = (): void => {
        setContentHeight(AUTO_HEIGHT);
    };

    const freezeHeight = (): void => {
        if (!stickyBoxRef.current) {
            return;
        }

        const boundingClientRect = stickyBoxRef.current.getBoundingClientRect();
        setContentHeight(boundingClientRect.top > 0 ? AUTO_HEIGHT : `${boundingClientRect.height}px`);
    };

    return (
        <div
            id={STICKY_BOX_ID}
            className={styles.wrapper}
            data-tid='sticky-box-dynamic'
            ref={stickyBoxRef}
            style={{ height: contentHeight }}
        >
            {render(resetHeight, freezeHeight)}
        </div>
    );
};

export default StickyBoxDynamicHeight;
