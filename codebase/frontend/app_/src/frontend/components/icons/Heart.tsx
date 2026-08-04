import classNames from 'classnames';

const SvgHeart = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        width='30'
        height='30'
        viewBox='0 0 24 24'
        fill='none'
        stroke='white'
        strokeWidth='1.5'
        xmlns='http://www.w3.org/2000/svg'
        className={classNames('icon-svg', props.className)}
        role='graphics-symbol'
        aria-label='heart-icon'
        data-tid={props['data-tid'] ?? 'heart-icon'}
    >
        <path
            d='M13.4841 21.4442C12.6484 22.1871 11.3619 22.1871 10.5263 21.4334L10.4053 21.3257C4.63253 16.2115 0.860982 12.8631 1.00393 8.68555C1.0699 6.8552 2.02653 5.10022 3.57694 4.06661C6.47982 2.1286 10.0644 3.033 11.9997 5.25096C13.935 3.033 17.5196 2.11783 20.4225 4.06661C21.9729 5.10022 22.9295 6.8552 22.9955 8.68555C23.1494 12.8631 19.3669 16.2115 13.5941 21.3473L13.4841 21.4442Z'
            fill='none'
        />
    </svg>
);

export default SvgHeart;
