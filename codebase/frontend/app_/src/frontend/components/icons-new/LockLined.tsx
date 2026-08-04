import * as React from 'react';
import classNames from 'classnames';

const SvgLockLined = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'lock-lined-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M18.22 9.21H16.3V6.29a4.29 4.29 0 00-8.58 0v2.92H5.78a2.35 2.35 0 00-2.35 2.35v8.09A2.35 2.35 0 005.78 22h12.44a2.35 2.35 0 002.35-2.35v-8.09a2.35 2.35 0 00-2.35-2.35zm-8.5-2.92a2.29 2.29 0 014.58 0v2.92H9.72zm8.85 13.36a.35.35 0 01-.35.35H5.78a.35.35 0 01-.35-.35v-8.09a.35.35 0 01.35-.35h12.44a.35.35 0 01.35.35z' />
        <path d='M12 12.6a2 2 0 00-2 2 2 2 0 001 1.73v1.27a1 1 0 002 0v-1.28a2 2 0 00-1-3.72z' />
    </svg>
);

export default SvgLockLined;
