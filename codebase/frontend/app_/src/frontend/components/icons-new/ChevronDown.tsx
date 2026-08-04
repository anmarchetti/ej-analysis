import * as React from 'react';
import classNames from 'classnames';

const SvgChevronDown = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        className={classNames('icon-svg', props.className)}
        data-tid='svg-chevron-down'
    >
        <path d='M21.7 6.79a1 1 0 00-1.41 0L12 15.08 3.71 6.79a1 1 0 00-1.41 0 1 1 0 000 1.42l9 9a1 1 0 001.42 0l9-9a1 1 0 00-.02-1.42z' />
    </svg>
);

export default SvgChevronDown;
