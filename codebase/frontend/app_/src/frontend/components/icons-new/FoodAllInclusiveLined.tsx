import * as React from 'react';
import classNames from 'classnames';

const SvgFoodAllInclusiveLined = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'food-all-inclusive-lined-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M22 2.76a.76.76 0 00-.78-.76A3.19 3.19 0 0018 5.19v5.87a.76.76 0 00.77.76H20V21a1 1 0 001 1 1 1 0 001-1V11.06zM15.75 2a.49.49 0 00-.5.49v4a.5.5 0 01-1 0v-4a.5.5 0 00-1 0v4a.5.5 0 01-1 0v-4a.5.5 0 00-1 0v3.83a2.43 2.43 0 00.6 1.59 2.5 2.5 0 00.9.67V21a1 1 0 001 1 1 1 0 001-1V8.58a2.5 2.5 0 00.9-.67 2.43 2.43 0 00.6-1.59V2.49a.49.49 0 00-.5-.49zM9.52 8.08V2.61A.62.62 0 008.9 2H2.63a.61.61 0 00-.63.61v8.13a3.74 3.74 0 002.8 3.61V20h-1a1 1 0 000 2h4a1 1 0 100-2h-1v-5.67a3.75 3.75 0 002.72-3.59V8.09zM7.52 4v3a2.53 2.53 0 00-2.46.72.89.89 0 01-1 .21V4zm-1.75 8.49A1.75 1.75 0 014 10.74v-.82a3 3 0 00.43.05 2.79 2.79 0 002-.88.86.86 0 011 0v1.67a1.76 1.76 0 01-1.66 1.73z' />
    </svg>
);

export default SvgFoodAllInclusiveLined;
