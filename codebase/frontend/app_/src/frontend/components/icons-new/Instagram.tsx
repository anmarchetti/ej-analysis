import * as React from 'react';
import classNames from 'classnames';

const SvgInstagram = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'instagram-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M16 2H8a6 6 0 00-6 6v8a6 6 0 006 6h8a6 6 0 006-6V8a6 6 0 00-6-6zm4 14a4 4 0 01-4 4H8a4 4 0 01-4-4V8a4 4 0 014-4h8a4 4 0 014 4z' />
        <path d='M12 6.83A5.17 5.17 0 1017.17 12 5.18 5.18 0 0012 6.83zm0 8.33A3.16 3.16 0 1115.16 12 3.15 3.15 0 0112 15.16zm5.18-9.53a1.24 1.24 0 101.24 1.24 1.24 1.24 0 00-1.24-1.24z' />
    </svg>
);

export default SvgInstagram;
