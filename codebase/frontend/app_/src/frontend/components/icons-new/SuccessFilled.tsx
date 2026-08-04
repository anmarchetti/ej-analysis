import * as React from 'react';
import classNames from 'classnames';

const SvgSuccessFilled = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'success-filled-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M12 2a10 10 0 1010 10A10 10 0 0012 2zm5.92 7.73l-7.08 7.05a1 1 0 01-.71.29 1 1 0 01-.7-.29l-3.36-3.36a1 1 0 010-1.42 1 1 0 011.41 0l2.65 2.66 6.37-6.35a1 1 0 111.42 1.42z' />
    </svg>
);

export default SvgSuccessFilled;
