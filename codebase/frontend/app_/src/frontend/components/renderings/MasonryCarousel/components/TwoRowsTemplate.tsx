import { FC } from 'react';
import classNames from 'classnames';

import { MediaSize } from 'models/data/MediaSizeParams';
import { IMasonryTemplateProps } from 'frontend/components/renderings/MasonryCarousel/MasonryCarousel';

import MasonryItem from './MasonryItem/MasonryItem';

export const templateClass = 'two-rows-template';

const TwoRowsTemplate: FC<IMasonryTemplateProps> = props => {
    const classes = classNames(
        'masonry-container',
        templateClass,
        props.items.length === 4 && 'x4-items',
        props.items.length === 6 && 'x6-items',
    );
    const middle = Math.trunc(props.items.length / 2);
    const mediaSize = props.items.length === 4 ? MediaSize.Medium : MediaSize.Small;

    return (
        <div className={classes} data-tid='masonry-container'>
            <div className='masonry-row' data-tid='masonry-row-first'>
                {props.items.slice(0, middle).map((item, i) => (
                    <MasonryItem
                        item={item}
                        key={i}
                        mediaSize={mediaSize}
                        isUnavailable={
                            props.destinationsAvailability
                                ? !props.destinationsAvailability[item.fields?.Code?.value]
                                : false
                        }
                    />
                ))}
            </div>
            <div className='masonry-row' data-tid='masonry-row-second'>
                {props.items.slice(middle).map((item, i) => (
                    <MasonryItem
                        item={item}
                        key={i}
                        mediaSize={mediaSize}
                        isUnavailable={
                            props.destinationsAvailability
                                ? !props.destinationsAvailability[item.fields?.Code?.value]
                                : false
                        }
                    />
                ))}
            </div>
        </div>
    );
};

export default TwoRowsTemplate;
