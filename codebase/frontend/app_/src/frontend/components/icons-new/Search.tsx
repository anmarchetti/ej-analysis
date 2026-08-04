import * as React from 'react';
import classNames from 'classnames';

const SvgSearch = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'search-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M21.7 20.28l-4.52-4.51a8.51 8.51 0 10-1.41 1.41l4.51 4.51a1 1 0 101.42-1.41zM4 10.51a6.5 6.5 0 116.5 6.5 6.51 6.51 0 01-6.5-6.5z' />
    </svg>
);

export default SvgSearch;
