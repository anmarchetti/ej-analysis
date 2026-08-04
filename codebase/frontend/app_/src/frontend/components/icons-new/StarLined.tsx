import * as React from 'react';
import classNames from 'classnames';

const SvgStarLined = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'star-lined-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M21.56 11.1a1.41 1.41 0 00.37-1.47 1.43 1.43 0 00-1.16-1L15.93 8a.64.64 0 01-.48-.34l-2.16-4.44a1.44 1.44 0 00-2.58 0L8.55 7.61a.64.64 0 01-.48.39l-4.84.71a1.43 1.43 0 00-1.16 1 1.41 1.41 0 00.37 1.47l3.5 3.42a.61.61 0 01.18.56l-.83 4.74a1.39 1.39 0 00.32 1.16 1.46 1.46 0 001.77.35l4.33-2.27a.57.57 0 01.58 0l4.34 2.27a1.4 1.4 0 001.76-.35 1.39 1.39 0 00.32-1.16l-.83-4.82a.61.61 0 01.18-.56zm-4.9 2a2.61 2.61 0 00-.75 2.33l.63 3.69-3.32-1.75a2.72 2.72 0 00-1.22-.3 2.64 2.64 0 00-1.23.31l-3.31 1.73.63-3.69a2.59 2.59 0 00-.76-2.33l-2.68-2.62 3.71-.54a2.6 2.6 0 002-1.44L12 5.13l1.66 3.36a2.6 2.6 0 002 1.44l3.71.54z' />
    </svg>
);

export default SvgStarLined;
