import * as React from 'react';
import classNames from 'classnames';

const SvgBoatFilled = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'boat-filled-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M22.24 11.83a1 1 0 00-.08-.77 1.06 1.06 0 00-.6-.48l-1.75-.5-1.53-4.9a2.46 2.46 0 00-2.36-1.74H14.5v-.56a.85.85 0 00-.85-.88h-3.29a.86.86 0 00-.86.85v.56H8.09a2.46 2.46 0 00-2.36 1.77l-1.53 4.9-1.76.5a1.06 1.06 0 00-.6.48 1 1 0 00-.08.77l2.05 6.93v.07a7.23 7.23 0 00-.81-.06 1 1 0 000 2 3.75 3.75 0 012.06.56 4.58 4.58 0 002.43.67 4.6 4.6 0 002.44-.64 3.73 3.73 0 012.07-.59 3.76 3.76 0 012.07.56 4.57 4.57 0 002.43.67 4.62 4.62 0 002.44-.64 3.73 3.73 0 012.06-.59 1 1 0 000-2 7.23 7.23 0 00-.85.06v-.07zM8.79 15.55a1 1 0 01-1.41 0 1 1 0 111.41 0zm8.36 0a1 1 0 01-1.41 0 1 1 0 011.41-1.41 1 1 0 010 1.41zm-4.87-7.63a1.06 1.06 0 00-.56 0L6.5 9.42l1.14-3.64a.47.47 0 01.45-.34h7.83a.47.47 0 01.45.34l1.14 3.64z' />
    </svg>
);

export default SvgBoatFilled;
