import * as React from 'react';
import classNames from 'classnames';

const SvgPaymentsLined = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'payments-lined-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M20.69 4H3.34A1.33 1.33 0 002 5.32v13.36A1.33 1.33 0 003.34 20h17.35A1.32 1.32 0 0022 18.68V5.32A1.32 1.32 0 0020.69 4zM4 6h16v2H4zm0 12v-6h16v6z' />
        <path d='M13 15H9a1 1 0 100 2h4a1 1 0 000-2z' />
        <circle cx={6.01} cy={16} r={1} />
    </svg>
);

export default SvgPaymentsLined;
