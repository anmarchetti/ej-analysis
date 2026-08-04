import * as React from 'react';
import classNames from 'classnames';

const SvgHomeLined = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'home-lined-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M21.64 9.46l-9-7.71a1 1 0 00-1.3 0l-9 7.71A1 1 0 003 11.22a1 1 0 00.62-.22v8.14a2.32 2.32 0 002.3 2.35h12.16a2.32 2.32 0 002.3-2.35V11a1 1 0 001.26-1.54zM11 19.49V15.9h2v3.59zm7.08 0H15V15.2a1.3 1.3 0 00-1.3-1.3h-3.4A1.3 1.3 0 009 15.2v4.29H5.92a.33.33 0 01-.3-.35V9.29L12 3.82l6.38 5.47v9.85a.33.33 0 01-.3.35z' />
    </svg>
);

export default SvgHomeLined;
