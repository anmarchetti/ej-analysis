import * as React from 'react';
import classNames from 'classnames';

const SvgAdultMale = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'adult-male-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <circle cx={12} cy={4} r={2} />
        <path d='M14.7 6.5H9.3a1.37 1.37 0 00-1.36 1.37v5.57a.8.8 0 101.6 0V9.23h.35V21a1 1 0 001.93 0v-6.75h.36V21a1 1 0 001.93 0V9.23h.35v4.21a.8.8 0 101.6 0V7.87A1.37 1.37 0 0014.7 6.5z' />
    </svg>
);

export default SvgAdultMale;
