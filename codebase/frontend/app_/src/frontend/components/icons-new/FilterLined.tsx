import * as React from 'react';
import classNames from 'classnames';

const SvgFilterLined = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='0 0 20 20'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'filter-lined-icon'}
        className={classNames('icon-svg', props.className)}
        role='graphics-symbol'
    >
        <path
            d='M1.7416 2.14171C1.8412 1.84743 2.12285 1.65401 2.43327 1.66671H17.5666C17.8726 1.65165 18.1529 1.83736 18.2583 2.12504C18.4065 2.40732 18.337 2.75482 18.0916 2.95837L12.2583 8.7917V14.5417C12.2593 14.7403 12.1778 14.9304 12.0333 15.0667L9.00827 18.0917C8.87128 18.2401 8.67685 18.3222 8.47493 18.3167C8.37481 18.3167 8.27568 18.2969 8.18327 18.2584C7.89558 18.153 7.70988 17.8727 7.72493 17.5667V8.7917L1.8916 2.95837C1.66028 2.75273 1.59845 2.41612 1.7416 2.14171Z'
            fill='#FF6600'
        />
    </svg>
);

export default SvgFilterLined;
