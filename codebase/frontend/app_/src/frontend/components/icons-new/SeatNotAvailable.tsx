import * as React from 'react';
import classNames from 'classnames';

const SvgSeatNotAvailable = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'seat-not-available-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path
            d='M20.59 18.25a2 2 0 00-2-2h-2.16l3.49 3.49a2 2 0 00.67-1.49zm-15.2-2a2 2 0 00-1.32 3.5l3.5-3.5zm2.53 0l-3.65 3.66a2 2 0 001.12.34h13.2a2 2 0 001.14-.35l-3.65-3.65zM12 12.18l-3.58 3.57h7.16L12 12.18zm3.93 3.57h2.26a1.3 1.3 0 001.3-1.3v-9.4a1 1 0 00-.06-.3L12.18 12zm3.42-11.27a1.31 1.31 0 00-1.16-.73H5.79a1.31 1.31 0 00-1.15.72L12 11.82zm-14.79.26a1.08 1.08 0 00-.07.31v9.4a1.3 1.3 0 001.3 1.3h2.28L11.82 12zM4 14.92V6.38a1 1 0 10-2 0v8.54a1 1 0 102 0zm16-8.63v8.53a1 1 0 102 0V6.29a1 1 0 10-2 0z'
            fill='gray'
        />
        <path d='M19.92 19.74l-3.49-3.49-.5-.5L12.18 12l7.25-7.25 2.66-2.66a.13.13 0 000-.18.12.12 0 00-.17 0l-2.57 2.57L12 11.82 4.64 4.47 2.08 1.91a.12.12 0 00-.17 0 .13.13 0 000 .18l2.65 2.65L11.82 12l-3.75 3.75-.5.5-3.5 3.5-2.16 2.16a.13.13 0 000 .18.12.12 0 00.09 0 .11.11 0 00.08 0l2.19-2.18 3.65-3.66.5-.5L12 12.18l3.58 3.57.5.5 3.65 3.65 2.19 2.19a.11.11 0 00.08 0 .12.12 0 00.09 0 .13.13 0 000-.18z' />
    </svg>
);

export default SvgSeatNotAvailable;
