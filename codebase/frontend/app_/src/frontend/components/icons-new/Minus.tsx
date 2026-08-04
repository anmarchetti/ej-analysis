import * as React from 'react';
import classNames from 'classnames';

const SvgMinus = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'minus-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <rect x={11} y={2} width={2} height={20} rx={1} transform='rotate(-90 12 12)' />
    </svg>
);

export default SvgMinus;
