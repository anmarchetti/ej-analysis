import * as React from 'react';
import classNames from 'classnames';

const SvgYoutube = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'youtube-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M17.85 4.92H6.15A4.15 4.15 0 002 9.08v5.84a4.15 4.15 0 004.15 4.16h11.7A4.15 4.15 0 0022 14.92V9.08a4.15 4.15 0 00-4.15-4.16zM15 12.28l-5.43 2.61a.22.22 0 01-.32-.2V9.31a.22.22 0 01.32-.19L15 11.89a.22.22 0 010 .39z' />
    </svg>
);

export default SvgYoutube;
