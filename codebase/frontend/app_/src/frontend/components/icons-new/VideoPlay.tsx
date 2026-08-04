import classNames from 'classnames';

const VideoPlayIcon = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='0 0 120 120'
        xmlns='http://www.w3.org/2000/svg'
        data-tid={props['data-tid'] ?? 'video-play-icon'}
        className={classNames('icon-svg', props.className)}
        role='graphics-symbol'
        aria-label='play-icon'
    >
        <g clipPath='url(#clip0_7_8636)'>
            <path d='M60 10C32.4 10 10 32.4 10 60C10 87.6 32.4 110 60 110C87.6 110 110 87.6 110 60C110 32.4 87.6 10 60 10ZM50 82.5V37.5L80 60L50 82.5Z' />
        </g>
        <defs>
            <clipPath id='clip0_7_8636'>
                <rect width='120' height='120' fill='white' />
            </clipPath>
        </defs>
    </svg>
);

export default VideoPlayIcon;
