import * as React from 'react';
import classNames from 'classnames';

const SvgExternalLink = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='0 0 24 24'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'external-link-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M2,4 L0,4 L0,20 C0,21.1 0.9,22 2,22 L18,22 L18,20 L2,20 L2,4 Z M20,0 L6,0 C4.9,0 4,0.9 4,2 L4,16 C4,17.1 4.9,18 6,18 L20,18 C21.1,18 22,17.1 22,16 L22,2 C22,0.9 21.1,0 20,0 Z M20,16 L6,16 L6,2 L20,2 L20,16 Z' />
    </svg>
);

export default SvgExternalLink;
