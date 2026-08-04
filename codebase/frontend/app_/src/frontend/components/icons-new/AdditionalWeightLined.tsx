import * as React from 'react';
import classNames from 'classnames';

const SvgAdditionalWeightLined = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'additional-weight-lined-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M9.5 14.4h2v2a.5.5 0 001 0v-2h2a.5.5 0 00.5-.5.5.5 0 00-.5-.5h-2v-2a.5.5 0 10-1 0v2h-2a.5.5 0 00-.5.5.5.5 0 00.5.5z' />
        <path d='M20.17 6.75H16V4.88A1.92 1.92 0 0014.08 3H9.92A1.92 1.92 0 008 4.88v1.87H3.83A1.83 1.83 0 002 8.58v10.63A1.83 1.83 0 003.83 21h16.34A1.83 1.83 0 0022 19.21V8.58a1.83 1.83 0 00-1.83-1.83zM6 19H4V8.75h2zm4-14h4v1.74h-4zm6 14H8V8.75h8zm4 0h-2V8.75h2z' />
    </svg>
);

export default SvgAdditionalWeightLined;
