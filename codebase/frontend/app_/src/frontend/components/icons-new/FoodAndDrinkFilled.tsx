import * as React from 'react';
import classNames from 'classnames';

const SvgFoodAndDrinkFilled = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'food-and-drink-filled-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M22 2.76a.76.76 0 00-.8-.76h-.05A3.19 3.19 0 0018 5.19v5.87a.76.76 0 00.76.76H20V21a1 1 0 001 1 1 1 0 001-1V11.06zM15.73 2a.49.49 0 00-.5.49v4a.5.5 0 01-.5.49.49.49 0 01-.5-.49v-4a.5.5 0 00-.5-.49.49.49 0 00-.5.49v4a.5.5 0 01-.5.49.49.49 0 01-.5-.49v-4a.5.5 0 00-.5-.49.49.49 0 00-.5.49v3.83a2.43 2.43 0 00.6 1.59 2.5 2.5 0 00.9.67V21a1 1 0 001 1 1 1 0 001-1V8.58a2.69 2.69 0 00.9-.67 2.43 2.43 0 00.6-1.59V2.49a.5.5 0 00-.5-.49z' />
        <path d='M11 9.45H7.46V7a.49.49 0 00-.15-.36L4.74 4.07a.5.5 0 00-.71 0 .48.48 0 000 .7L6.46 7.2v2.25H2.7a.67.67 0 00-.66.74l1.28 11.22A.66.66 0 004 22h5.32a.67.67 0 00.66-.57l1.64-11.22a.67.67 0 00-.62-.76zm-1.55 2L9 14a2.69 2.69 0 00-3.13.5 1 1 0 01-1.35.05l-.32-3.1z' />
    </svg>
);

export default SvgFoodAndDrinkFilled;
