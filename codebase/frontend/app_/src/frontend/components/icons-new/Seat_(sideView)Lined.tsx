import * as React from 'react';
import classNames from 'classnames';

const SvgSeatSideViewLined = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'seat-side-view-lined-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M19.17 20H16v-3h1.44a2.76 2.76 0 000-5.52h-6.1v-.07l-2-7.33a2.76 2.76 0 00-5.41 1.44L7.11 17H10v3H5.77a1 1 0 000 2h13.4a1 1 0 000-2zM8.63 15L5.86 5a.76.76 0 01.07-.58.78.78 0 01.46-.36.64.64 0 01.2 0 .76.76 0 01.73.56l2 7.33v.07l.4 1.47h7.63a.76.76 0 010 1.52zM14 20h-2v-3h2z' />
    </svg>
);

export default SvgSeatSideViewLined;
