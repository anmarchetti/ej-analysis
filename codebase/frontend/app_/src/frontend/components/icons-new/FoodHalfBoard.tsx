import * as React from 'react';
import classNames from 'classnames';

const SvgFoodHalfBoard = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'food-half-board-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M17.77 2.76A.76.76 0 0017 2a3.19 3.19 0 00-3.19 3.19v5.87a.76.76 0 00.76.76h1.23V21a1 1 0 001 1 1 1 0 001-1V11.06zM10.73 2a.49.49 0 00-.5.49v4a.5.5 0 01-.5.49.49.49 0 01-.5-.49v-4a.5.5 0 00-.5-.49.49.49 0 00-.5.49v4a.5.5 0 01-.5.49.49.49 0 01-.5-.49v-4a.5.5 0 00-.5-.49.49.49 0 00-.5.49v3.83a2.43 2.43 0 00.6 1.59 2.5 2.5 0 00.9.67V21a1 1 0 001 1 1 1 0 001-1V8.58a2.59 2.59 0 00.9-.67 2.43 2.43 0 00.6-1.59V2.49a.5.5 0 00-.5-.49z' />
    </svg>
);

export default SvgFoodHalfBoard;
