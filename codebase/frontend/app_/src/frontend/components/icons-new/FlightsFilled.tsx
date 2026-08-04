import * as React from 'react';
import classNames from 'classnames';

const SvgFlightsFilled = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        className={classNames('icon-svg', props.className)}
        data-tid='flight-icon'
    >
        <path d='M20.44 3.56a1.74 1.74 0 00-2.48 0l-4.24 4.23L6 5.23a.69.69 0 00-.72.17l-1 1a.7.7 0 00.13 1.1l6 3.67-4 3.93-1.81-.29a.56.56 0 00-.51.16l-.88.88a.58.58 0 00.22 1l2.57.84a.58.58 0 01.36.36l.88 2.52a.58.58 0 001 .22l.76-.88a.56.56 0 00.16-.51l-.26-1.81 3.94-3.94 3.68 6a.7.7 0 001.09.13l1-1a.73.73 0 00.17-.72l-2.57-7.75L20.44 6a1.74 1.74 0 000-2.44z' />
    </svg>
);

export default SvgFlightsFilled;
