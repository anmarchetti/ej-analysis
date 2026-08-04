import { FC, useContext } from 'react';
import { EventData, Swipeable } from 'react-swipeable';
import classNames from 'classnames';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import { FloatingPopupContext } from 'frontend/components/common/FloatingPopup/FloatingPopup';

import styles from './SwipeableContent.module.scss';

interface ISwipeableContentProps {
    children: React.ReactNode;
}

const SwipeableContent: FC<ISwipeableContentProps> = ({ children }) => {
    const isMobile = useMobileViewport();
    const { setTranslateY, onClose } = useContext(FloatingPopupContext);

    const onSwipedPopup = (eventData: EventData) => {
        if (!isMobile) {
            return;
        }

        if (eventData.dir === 'Down') {
            onClose();
        }
    };

    const onSwipingPopup = (eventData: EventData) => {
        const { absY, deltaY, event } = eventData;

        event.preventDefault();
        event.stopPropagation();

        setTranslateY(deltaY < 0 ? absY : 0);
    };

    return (
        <Swipeable
            onSwiped={onSwipedPopup}
            onSwiping={onSwipingPopup}
            className={classNames(isMobile && styles.swipeZone)}
        >
            {children}
        </Swipeable>
    );
};

export default SwipeableContent;
