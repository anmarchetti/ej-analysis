import * as React from 'react';
import classNames from 'classnames';

const SvgArrow = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        width='8'
        height='12'
        viewBox='0 0 8 12'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        data-tid={props['data-tid'] ?? 'arrow-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M0.999531 0.710632C0.609531 1.10063 0.609531 1.73063 0.999531 2.12063L4.87953 6.00063L0.999531 9.88063C0.609531 10.2706 0.609531 10.9006 0.999531 11.2906C1.38953 11.6806 2.01953 11.6806 2.40953 11.2906L6.99953 6.70063C7.38953 6.31063 7.38953 5.68063 6.99953 5.29063L2.40953 0.700632C2.02953 0.320632 1.38953 0.320632 0.999531 0.710632Z' />
    </svg>
);

export default SvgArrow;
