import * as React from 'react';
import classNames from 'classnames';

const SvgList = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'list-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M3 15a1 1 0 10-1-1 1 1 0 001 1zM3 5a1 1 0 101 1 1 1 0 00-1-1zm0 4a1 1 0 101 1 1 1 0 00-1-1zm4-2h14a1 1 0 000-2H7a1 1 0 000 2z' />
        <rect x={6.01} y={9} width={16} height={2} rx={1} />
        <rect x={6.01} y={13} width={16} height={2} rx={1} />
        <path d='M21 17H7a1 1 0 000 2h14a1 1 0 000-2zM3 17a1 1 0 101 1 1 1 0 00-1-1z' />
    </svg>
);

export default SvgList;
