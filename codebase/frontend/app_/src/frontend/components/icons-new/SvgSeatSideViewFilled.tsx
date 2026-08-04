import * as React from 'react';
import classNames from 'classnames';

const SvgSeatSideViewFilled = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'svg-seat-side-view-filled-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M19.17 20H16v-3h1.44a2.76 2.76 0 000-5.52h-6.1v-.07l-2-7.33a2.76 2.76 0 00-5.41 1.44L7.11 17H10v3H5.77a1 1 0 000 2h13.4a1 1 0 000-2zM14 20h-2v-3h2z' />
    </svg>
);

export default SvgSeatSideViewFilled;
