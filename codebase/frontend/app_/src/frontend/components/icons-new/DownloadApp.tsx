import * as React from 'react';
import classNames from 'classnames';

const SvgDownloadApp = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'download-app-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M11.29 18.13a1.21 1.21 0 00.3.2.94.94 0 00.76 0 1 1 0 00.3-.2l3.6-3.59a1 1 0 10-1.42-1.42L13 15V3a1 1 0 00-2 0v12l-1.89-1.88a1 1 0 10-1.42 1.42z' />
        <path d='M21 11a1 1 0 00-1 1v8H4v-8a1 1 0 00-2 0v9a1 1 0 001 1h18a1 1 0 001-1v-9a1 1 0 00-1-1z' />
    </svg>
);

export default SvgDownloadApp;
