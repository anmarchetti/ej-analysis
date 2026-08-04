import * as React from 'react';
import classNames from 'classnames';

const SvgFavicon = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'favicon-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M21.08 6.61A7.7 7.7 0 0019 4.1 9.73 9.73 0 0012.67 2a10.9 10.9 0 00-4.31.84A10.42 10.42 0 004 6.23a9.52 9.52 0 00-2 5.9 10 10 0 001.14 4.65 9.57 9.57 0 002.21 2.82 10.23 10.23 0 006.9 2.4 11.54 11.54 0 007.16-2.32A3.51 3.51 0 0021.16 17a2 2 0 00-.49-1.29 1.26 1.26 0 00-1-.61 2.18 2.18 0 00-1.07.45 6.65 6.65 0 01-1.91.88 7.37 7.37 0 01-2.09.34 4.54 4.54 0 01-3-1.14 3.16 3.16 0 01-1.37-2.4c0-.34.19-.53.61-.53h9.21a1.72 1.72 0 001.38-.77A4 4 0 0022 9.81a6.61 6.61 0 00-.92-3.2zM13.39 9h-2a2.77 2.77 0 01-1-.15 1.12 1.12 0 01-.24-.85 2.77 2.77 0 01.57-1.64 2 2 0 011.72-.87 2 2 0 011.6.64 2.37 2.37 0 01.61 1.72Q14.65 9 13.39 9z' />
    </svg>
);

export default SvgFavicon;
