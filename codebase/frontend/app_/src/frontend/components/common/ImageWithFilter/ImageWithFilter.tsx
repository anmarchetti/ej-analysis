import useUniqueId from 'frontend/hooks/useUniqueId';

export enum SVGFilterMatrix {
    Grayscale = '1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 1 0',
    Orange = '0 0 0 0 1 0 0 0 0 .15 0 0 0 0 0 0 0 0 1 0',
    Green = '0 0 0 0 .1 0 0 0 0 .35 0 0 0 0 0 0 0 0 1 0',
    Red = '0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0',
    Grey = '1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 .4 0',
    Lightblack = '0 0 0 0 0   0 0 0 0 0   0 0 0 0 0   0 0 0 .8 0',
}

interface IImageWithFilterProps {
    imageSrc: string;
    className?: string;
    dataTid?: string;
    filterMatrix?: SVGFilterMatrix;
    isPrintPreview?: boolean;
}

const ImageWithFilter = ({ imageSrc, filterMatrix, className, dataTid }: IImageWithFilterProps) => {
    const filterId = useUniqueId('svg-filter');

    if (!imageSrc) {
        return null;
    }

    return (
        <svg
            viewBox='0 0 24 24'
            width='1em'
            height='1em'
            aria-hidden='true'
            focusable='false'
            className={className}
            data-tid={dataTid}
        >
            <defs>
                <filter id={filterId}>
                    <feColorMatrix in='SourceAlpha' type='matrix' values={filterMatrix} />
                </filter>
            </defs>

            <image
                filter={filterMatrix ? `url(#${filterId})` : undefined}
                xlinkHref={imageSrc}
                width='100%'
                height='100%'
            />
        </svg>
    );
};

export default ImageWithFilter;
