export const onZoomChangedCallback =
    ({
        map,
        setZoomStatus,
        maxZoom,
        minZoom,
    }: {
        map: google.maps.Map;
        maxZoom: number;
        minZoom: number;
        setZoomStatus: (value: number) => void;
    }): (() => void) =>
    (): void => {
        const zoom = map.getZoom();

        const max = zoom === maxZoom ? 1 : 0;
        const min = zoom === minZoom ? -1 : 0;

        // max => 1
        // min => -1
        // otherwise => 0
        setZoomStatus(max || min);
    };

export const changeZoom = ({ value, map }: { map: google.maps.Map; value: number }): void =>
    map.setZoom(map.getZoom()! + value);
