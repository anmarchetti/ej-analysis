import * as React from 'react';
import classNames from 'classnames';

const SvgFavouriteLined = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'favourite-lined-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M7.46 4.92a3.19 3.19 0 012.76 1.66l1.71 2.93 1.73-2.91a3.36 3.36 0 012.88-1.68c1.78 0 3.22 1.57 3.41 3.72v.12a4.22 4.22 0 01-.14 1.34 7 7 0 01-2.15 3.58L12 18.79l-5.62-5.1a7 7 0 01-2.21-3.59A4.11 4.11 0 014 8.78v-.14c.19-2.15 1.63-3.72 3.41-3.72m0-2c-2.84 0-5.11 2.33-5.4 5.54a5.57 5.57 0 00.16 2.1A9 9 0 005 15.17l6.17 5.6a1.19 1.19 0 00.79.31 1.18 1.18 0 00.78-.3L19 15.17a9 9 0 002.77-4.61 6 6 0 00.23-2.1c-.3-3.21-2.57-5.54-5.41-5.54a5.37 5.37 0 00-4.6 2.66 5.15 5.15 0 00-4.53-2.66z' />
    </svg>
);

export default SvgFavouriteLined;
