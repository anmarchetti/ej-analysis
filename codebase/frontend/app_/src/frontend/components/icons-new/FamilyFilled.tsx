import * as React from 'react';
import classNames from 'classnames';

const SvgFamilyFilled = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'family-filled-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M10.18 14.14a2.36 2.36 0 011.32-3.81 3.43 3.43 0 10-5.14 1.74A4.74 4.74 0 002 16.79v1.42h5.76v-1a3.22 3.22 0 012.42-3.07zm7.51-2.06a3.43 3.43 0 10-5.33-2.86 3.52 3.52 0 00.2 1.12 2.37 2.37 0 011.84 2.31 2.34 2.34 0 01-.55 1.5 3.21 3.21 0 012.39 3.1v1H22v-1.46a4.73 4.73 0 00-4.31-4.71z' />
        <circle cx={12.02} cy={12.65} r={1.75} />
        <path d='M12.84 14.76h-1.68a2.66 2.66 0 00-2.66 2.66v.79h7v-.79a2.66 2.66 0 00-2.66-2.66z' />
    </svg>
);

export default SvgFamilyFilled;
