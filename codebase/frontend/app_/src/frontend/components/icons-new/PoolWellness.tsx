import * as React from 'react';
import classNames from 'classnames';

const SvgPoolWellness = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'pool-wellness-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M21.55 14a1 1 0 00-1.39.28 1.33 1.33 0 01-.14.19 3 3 0 01-1.69.94 4.72 4.72 0 01-2.2-.08 16.3 16.3 0 01-2.56-1 19.19 19.19 0 00-3.22-1.22 8 8 0 00-4.42.19 7.64 7.64 0 00-2 1A7.18 7.18 0 002.25 16c0 .08-.1.15-.14.23a1 1 0 00.44 1.36 1.07 1.07 0 00.46.11 1 1 0 00.87-.54A5.09 5.09 0 015.07 16a5.79 5.79 0 011.49-.75 6.1 6.1 0 013.3-.14 17 17 0 012.92 1.12 18.62 18.62 0 002.84 1.09 7 7 0 003.14.1 5 5 0 002.79-1.61c.1-.12.19-.25.28-.38a1 1 0 00-.28-1.43zm-2.95-1.17a3 3 0 10-3-3 3 3 0 003 3z' />
        <path d='M7.05 10.68l4.32-2L12 10l-.81.4-4 2a8.39 8.39 0 011.41-.12 7.16 7.16 0 011.8.22 18.9 18.9 0 013.24 1.23 17.64 17.64 0 002.63 1l.35.09c-.39-.8-1.2-2.42-2.08-4.11l-1.78-3.8a1 1 0 00-.57-.52 1 1 0 00-.76 0L6.2 8.87a1 1 0 00-.48 1.32 1 1 0 001.33.49z' />
    </svg>
);

export default SvgPoolWellness;
