import * as React from 'react';
import classNames from 'classnames';

const SvgFamilyLined = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        className={classNames('icon-svg', props.className)}
        data-tid={props['data-tid'] ?? 'family-lined-icon'}
    >
        <path d='M8 16.21H4A2.77 2.77 0 016.74 14h3a2.45 2.45 0 01.38 0 2.37 2.37 0 011.38-3.74A3.43 3.43 0 106.36 12 4.74 4.74 0 002 16.79v1.42h5.76v-1a3.3 3.3 0 01.24-1zm.32-8.42a1.43 1.43 0 11-1.49 1.43 1.43 1.43 0 011.44-1.43zm13.68 9a4.73 4.73 0 00-4.33-4.71 3.43 3.43 0 10-5.33-2.86 3.52 3.52 0 00.2 1.12 2.36 2.36 0 011.37 3.72h3.33A2.77 2.77 0 0120 16.21h-3.9a3.29 3.29 0 01.18 1v1H22zm-6.23-9a1.43 1.43 0 11-1.43 1.43 1.43 1.43 0 011.45-1.43z' />
        <circle cx={12.02} cy={12.65} r={1.75} />
        <path d='M12.84 14.76h-1.68a2.66 2.66 0 00-2.66 2.66v.79h7v-.79a2.66 2.66 0 00-2.66-2.66z' />
    </svg>
);

export default SvgFamilyLined;
