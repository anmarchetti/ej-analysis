import * as React from 'react';
import classNames from 'classnames';

const SvgPlusAlt = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        className={classNames('icon-svg', props.className)}
        fill='none'
        aria-hidden='true'
        focusable='false'
        xmlns='http://www.w3.org/2000/svg'
        data-tid={props['data-tid'] ?? 'plus-alt-icon'}
    >
        <path d='M15 10.833h-4.166V15a.836.836 0 0 1-.834.833.836.836 0 0 1-.833-.833v-4.167H5A.836.836 0 0 1 4.167 10c0-.459.375-.834.833-.834h4.167V5c0-.458.375-.833.833-.833.459 0 .834.375.834.833v4.166H15c.459 0 .834.375.834.834a.836.836 0 0 1-.834.833Z' />
    </svg>
);

export default SvgPlusAlt;
