import * as React from 'react';
import classNames from 'classnames';

const SvgAdultFemale = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'adult-female-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <circle cx={12} cy={4.02} r={2} />
        <path d='M15.49 7.8c-.18-.68-.53-1.28-1.18-1.28H9.69c-.65 0-1 .6-1.18 1.28C8.36 8.33 7 13 7 13a.61.61 0 00.59.75 1 1 0 00.9-.75L9.9 9.08h.3L8.32 15h1.88v6a.84.84 0 101.67 0v-6.08h.26v6.16a.84.84 0 101.67 0V15h1.88L13.8 9.08h.3L15.56 13a1 1 0 00.9.75.61.61 0 00.59-.75s-1.41-4.67-1.56-5.2z' />
    </svg>
);

export default SvgAdultFemale;
