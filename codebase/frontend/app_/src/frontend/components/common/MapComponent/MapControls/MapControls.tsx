import { FC, memo, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ControlPosition, useMap } from '@vis.gl/react-google-maps';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { EventActions } from 'models/enum/tracking/GenericEventParams';

import { changeZoom, onZoomChangedCallback } from './MapControls.utils';

import styles from './MapControls.module.scss';

export interface IMapControlsProps {
    maxZoom: number;
    minZoom: number;
    zoomPosition: ControlPosition;
    closePosition?: ControlPosition;
}

const MapControls: FC<IMapControlsProps> = ({ zoomPosition, closePosition, minZoom, maxZoom }) => {
    const map = useMap();

    // we need to unify the approach across different pages
    // and eliminate duplicated logic for opening and closing
    const { close } = useStore(stores => ({
        close: (): void => {
            stores.bookingStore.toggleDestinationMapVisibilityOnMobile(false);
            stores.bookingStore.toggleMapVisibilityOnMobile(false);
            stores.bookingStore.toggleDestinationMapVisibilityOnDesktop(false);
            stores.bookingStore.toggleMapVisibilityOnDesktop(false);

            stores.trackingStore.trackMapEvent({
                action: EventActions.CloseMapClick,
            });
        },
    }));

    const [zoomStatus, setZoomStatus] = useState(0);

    const zoomContainerRef = useRef<HTMLDivElement>(document.createElement('div'));
    const closeContainerRef = useRef<HTMLDivElement>(document.createElement('div'));

    useEffect(() => {
        if (!map) return;

        const listener = map.addListener(
            'zoom_changed',
            onZoomChangedCallback({ map, setZoomStatus, maxZoom, minZoom }),
        );

        const controls = map.controls[zoomPosition];
        controls.push(zoomContainerRef.current);

        let closeControl;

        if (closePosition) {
            closeControl = map.controls[closePosition];
            closeControl.push(closeContainerRef.current);
        }

        return () => {
            listener.remove();
            controls.removeAt(0);
            closeControl?.removeAt(0);
        };
    }, [map, zoomPosition, closePosition, minZoom, maxZoom]);

    if (!map) return null;

    return (
        <>
            {createPortal(
                <div className={styles.wrapper}>
                    <button
                        className={classNames(styles.btn, styles.plus)}
                        onClick={(): void => changeZoom({ map, value: 1 })}
                        disabled={zoomStatus === 1}
                        data-tid='map-zoom-in-button'
                    />
                    <button
                        className={styles.btn}
                        onClick={(): void => changeZoom({ map, value: -1 })}
                        disabled={zoomStatus === -1}
                        data-tid='map-zoom-out-button'
                    />
                </div>,
                zoomContainerRef.current,
            )}

            {closePosition &&
                createPortal(
                    <div className={styles.wrapper}>
                        <button
                            className={classNames(styles.btn, styles.close, styles.plus)}
                            onClick={close}
                            data-tid='map-close-button'
                        />
                    </div>,
                    closeContainerRef.current,
                )}
        </>
    );
};

export default memo(MapControls);
