import * as React from 'react';
import classNames from 'classnames';

const SvgFavouriteFilled = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'favourite-filled-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M22 8.46c-.3-3.21-2.57-5.54-5.41-5.54a5.37 5.37 0 00-4.6 2.66 5.15 5.15 0 00-4.53-2.66c-2.84 0-5.11 2.33-5.4 5.54a5.57 5.57 0 00.16 2.1A9 9 0 005 15.17l6.17 5.6a1.18 1.18 0 001.57 0l6.26-5.6a9 9 0 002.77-4.61 6 6 0 00.23-2.1z' />
    </svg>
);

export default SvgFavouriteFilled;
