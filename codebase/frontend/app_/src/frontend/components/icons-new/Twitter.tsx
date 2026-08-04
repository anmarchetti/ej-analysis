import classNames from 'classnames';

const SvgTwitter = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='0 0 36 36'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'twitter-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path
            fillRule='evenodd'
            clipRule='evenodd'
            d='M13.0782 4.5H3.95582L14.4681 19.3046L3.75 31.5H7.44658L16.1199 21.6311L23.1277 31.5H32.25L21.1656 15.89L31.1756 4.5H27.479L19.5139 13.5635L13.0782 4.5ZM24.5255 28.6747L9.36549 7.32505H11.6797L26.8398 28.6747H24.5255Z'
        />
    </svg>
);

export default SvgTwitter;
