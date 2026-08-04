import * as React from 'react';
import classNames from 'classnames';

const SvgRoomFacilitiesFilled = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'room-facilities-filled-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M20 12.25H5.22v-6a2.23 2.23 0 014.23-1h-.26a1 1 0 000 2h1.62v.55a.38.38 0 00.38.37.37.37 0 00.37-.37v-.51h.63a1 1 0 000-2h-.63a4.23 4.23 0 00-8.34 1V16.4a4.59 4.59 0 003.19 4.36v.7a.5.5 0 00.5.5.51.51 0 00.5-.5V21a3 3 0 00.42.05h7.88v.45a.51.51 0 00.5.5.5.5 0 00.5-.5V21a4.59 4.59 0 004.05-4.55v-3.4a.8.8 0 00-.76-.8z' />
        <path d='M9.81 8.08v2a.38.38 0 00.38.38.37.37 0 00.37-.38v-2a.37.37 0 00-.37-.38.38.38 0 00-.38.38zm1.38 1.26a.38.38 0 00-.38.37v1a.38.38 0 00.38.38.37.37 0 00.37-.38v-1a.37.37 0 00-.37-.37z' />
    </svg>
);

export default SvgRoomFacilitiesFilled;
