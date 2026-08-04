import * as React from 'react';
import classNames from 'classnames';

const SvgEmailLined = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'email-lined-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M17.51 6a2.55 2.55 0 012.55 2.54v7a2.55 2.55 0 01-2.55 2.54h-11a2.55 2.55 0 01-2.55-2.54v-7A2.55 2.55 0 016.49 6h11m0-2h-11a4.55 4.55 0 00-4.55 4.49v7a4.55 4.55 0 004.55 4.54h11a4.55 4.55 0 004.55-4.54v-7A4.55 4.55 0 0017.51 4z' />
        <path d='M12 13.87a1 1 0 01-.59-.19L2.93 7.52A1 1 0 014.1 5.9l7.9 5.72 7.75-6A1 1 0 0121 7.22l-8.34 6.44a1 1 0 01-.66.21z' />
    </svg>
);

export default SvgEmailLined;
