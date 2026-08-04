import * as React from 'react';
import classNames from 'classnames';

const SvgSuccessLined = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'success-lined-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M12 2a10 10 0 1010 10A10 10 0 0012 2zm0 18a8 8 0 118-8 8 8 0 01-8 8z' />
        <path d='M17.92 8.31a1 1 0 00-1.42 0l-6.37 6.35L7.48 12a1 1 0 00-1.41 0 1 1 0 000 1.42l3.36 3.36a1 1 0 00.7.29 1 1 0 00.71-.29l7.08-7a1 1 0 000-1.47z' />
    </svg>
);

export default SvgSuccessLined;
