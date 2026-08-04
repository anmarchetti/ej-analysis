import * as React from 'react';
import classNames from 'classnames';

const SvgChevronUp = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'chevron-up-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M21.7 15.79l-9-9a1 1 0 00-1.42 0l-9 9a1 1 0 000 1.42 1 1 0 001.41 0L12 8.92l8.29 8.29a1 1 0 001.41-1.42z' />
    </svg>
);

export default SvgChevronUp;
