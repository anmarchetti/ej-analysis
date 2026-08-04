import * as React from 'react';
import classNames from 'classnames';

const SvgDepositLined = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'deposit-lined-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M18 13.25a4 4 0 104 4 4 4 0 00-4-4zm0 7a3 3 0 113-3 3 3 0 01-3 3z' />
        <path d='M4.07 15.52v-5.38h14.46v2.17a4.76 4.76 0 012 .68V4.07a1.32 1.32 0 00-1.32-1.32H3.39a1.32 1.32 0 00-1.32 1.32V16.2a1.32 1.32 0 001.32 1.32H13v-.27a5 5 0 01.33-1.73zm0-10.77h14.46v1.69H4.07z' />
        <rect x={7.6} y={12.9} width={5.54} height={1.85} rx={0.75} />
        <path d='M4.83 13.83a.93.93 0 10.93-.93.93.93 0 00-.93.93zM18.35 17v-1.16a.5.5 0 10-1 0v1.33a.47.47 0 00.15.35L19 19a.51.51 0 00.36.15.5.5 0 00.34-.15.5.5 0 000-.71z' />
    </svg>
);

export default SvgDepositLined;
