import classNames from 'classnames';

const SvgCompareIcon = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        width='20'
        height='16'
        viewBox='0 0 20 16'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        data-tid={props['data-tid'] ?? 'svg-compare-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path
            d='M17.5858 7H5C4.44772 7 4 6.55228 4 6C4 5.44772 4.44771 5 5 5H15L12.7071 2.70711C12.3166 2.31658 12.3166 1.68342 12.7071 1.29289L12.7929 1.20711C13.1834 0.816582 13.8166 0.816583 14.2071 1.20711L18.2929 5.29289C18.9229 5.92286 18.4767 7 17.5858 7Z'
            fill='#fff'
        />
        <path
            d='M2.41422 9L15 9C15.5523 9 16 9.44772 16 10C16 10.5523 15.5523 11 15 11L5.00001 11L7.29289 13.2929C7.68342 13.6834 7.68342 14.3166 7.29289 14.7071L7.20711 14.7929C6.81658 15.1834 6.18342 15.1834 5.79289 14.7929L1.70711 10.7071C1.07715 10.0771 1.52331 9 2.41422 9Z'
            fill='#fff'
        />
    </svg>
);

export default SvgCompareIcon;
