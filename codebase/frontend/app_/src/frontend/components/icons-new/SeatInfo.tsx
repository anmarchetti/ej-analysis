import * as React from 'react';
import classNames from 'classnames';

const SvgSeatInfo = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'seat-info-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M18.6 16.25H5.39a2 2 0 000 4H18.6a2 2 0 000-4zm-6.67-2.79A3.49 3.49 0 108.44 10a3.48 3.48 0 003.49 3.46zm.42-3v1.58a.42.42 0 01-.84 0V9.16a.42.42 0 01.84 0zm-.43-3.07a.41.41 0 01.41.41.41.41 0 01-.41.42.42.42 0 01-.42-.42.41.41 0 01.42-.36z' />
        <path d='M5.8 15.75h12.4a1.3 1.3 0 001.3-1.3v-9.4a1.3 1.3 0 00-1.3-1.3H5.8a1.3 1.3 0 00-1.3 1.3v9.4a1.3 1.3 0 001.3 1.3zm6.13-10A4.24 4.24 0 117.69 10a4.23 4.23 0 014.24-4.26zM4 14.91V6.38a1 1 0 00-2 0v8.53a1 1 0 002 0zm17-9.62a1 1 0 00-1 1v8.53a1 1 0 102 0V6.29a1 1 0 00-1-1z' />
    </svg>
);

export default SvgSeatInfo;
