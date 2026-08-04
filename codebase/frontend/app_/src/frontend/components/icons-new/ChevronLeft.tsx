import * as React from 'react';
import classNames from 'classnames';

const SvgChevronLeft = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'chevron-left-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M8.92 12l8.29-8.29a1 1 0 000-1.41 1 1 0 00-1.42 0l-9 9a1 1 0 000 1.42l9 9a1 1 0 00.71.3 1 1 0 00.71-.3 1 1 0 000-1.41z' />
    </svg>
);

export default SvgChevronLeft;
