import * as React from 'react';
import classNames from 'classnames';

const SvgExtrasLined = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'extras-lined-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M16.5 11.5h-4v-4A.5.5 0 0012 7a.5.5 0 00-.5.5v4h-4a.5.5 0 00-.5.5.5.5 0 00.5.5h4v4a.5.5 0 00.5.5.5.5 0 00.5-.5v-4h4a.5.5 0 00.5-.5.5.5 0 00-.5-.5z' />
        <path d='M12 2a10 10 0 1010 10A10 10 0 0012 2zm0 18a8 8 0 118-8 8 8 0 01-8 8z' />
    </svg>
);

export default SvgExtrasLined;
