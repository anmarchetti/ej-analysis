import * as React from 'react';
import classNames from 'classnames';

const SvgAdditionalWeightFilled = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'additional-weight-filled-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M16 4.88A1.92 1.92 0 0014.08 3H9.92A1.92 1.92 0 008 4.88V21h8V6.75zM10 5h4v1.74h-4zm4.5 9.44h-2v2a.5.5 0 01-1 0v-2h-2a.5.5 0 01-.5-.5.5.5 0 01.5-.5h2v-2a.5.5 0 111 0v2h2a.5.5 0 01.5.5.5.5 0 01-.5.46zM2 8.58v10.63A1.83 1.83 0 003.83 21H6V6.75H3.83A1.83 1.83 0 002 8.58zm18.17-1.83H18V21h2.17A1.83 1.83 0 0022 19.21V8.58a1.83 1.83 0 00-1.83-1.83z' />
    </svg>
);

export default SvgAdditionalWeightFilled;
