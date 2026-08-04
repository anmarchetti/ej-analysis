import * as React from 'react';
import classNames from 'classnames';

const SvgPriceGraph = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        xmlns='http://www.w3.org/2000/svg'
        width='1em'
        height='1em'
        viewBox='0 0 21 20'
        data-tid={props['data-tid'] ?? 'price-graph-icon'}
        className={classNames('icon-svg', props.className)}
        role='graphics-symbol'
        aria-label='price-graph-icon'
    >
        <g>
            <path d='M11.3333 6.73804L6.3333 1.73804L2.23812 5.83322L3.41663 7.01173L6.3333 4.09506L11.3333 9.09506L15.5 4.92839L17.5833 7.01173L18.7618 5.83322L15.5 2.57137L11.3333 6.73804ZM15.9165 8.33329H18.8332V18.3333H15.9165V8.33329ZM6.74984 9.16663H9.6665V18.3333H6.74984V9.16663ZM2.1665 12.5H5.08317V18.3333H2.1665V12.5ZM14.2498 10.8333H11.3332V18.3333H14.2498V10.8333Z' />
        </g>
    </svg>
);

export default SvgPriceGraph;
