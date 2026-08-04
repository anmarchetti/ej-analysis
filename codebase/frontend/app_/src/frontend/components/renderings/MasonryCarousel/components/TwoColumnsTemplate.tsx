import { FC } from 'react';
import classNames from 'classnames';

import { MediaSize } from 'models/data/MediaSizeParams';
import { IMasonryTemplateProps } from 'frontend/components/renderings/MasonryCarousel/MasonryCarousel';

import MasonryItem from './MasonryItem/MasonryItem';

export const templateClass = 'two-columns-template';

const TwoColumnsTemplate: FC<IMasonryTemplateProps> = props => {
    const classes = classNames(
        'masonry-container',
        templateClass,
        props.items.length === 5 && 'x5-items',
        props.items.length === 7 && 'x7-items',
    );
    const items = [...props.items];

    return (
        <div className={classes} data-tid='two-columns-template-container'>
            <div className='left'>
                <div className='masonry-row'>
                    {items.splice(0, 2).map((item, i) => (
                        <MasonryItem
                            item={item}
                            key={i}
                            isUnavailable={
                                props.destinationsAvailability
                                    ? !props.destinationsAvailability[item.fields?.Code?.value]
                                    : false
                            }
                        />
                    ))}
                </div>
                <div className='masonry-row'>
                    {items.splice(0, props.items.length === 5 ? 2 : 3).map((item, i) => (
                        <MasonryItem
                            item={item}
                            key={i}
                            isUnavailable={
                                props.destinationsAvailability
                                    ? !props.destinationsAvailability[item.fields?.Code?.value]
                                    : false
                            }
                        />
                    ))}
                </div>
            </div>
            <div className='right'>
                <div className='masonry-row'>
                    {items.splice(0, items.length).map((item, i) => (
                        <MasonryItem
                            item={item}
                            key={i}
                            mediaSize={props.items.length === 5 ? MediaSize.Big : MediaSize.Small}
                            isUnavailable={
                                props.destinationsAvailability
                                    ? !props.destinationsAvailability[item.fields?.Code?.value]
                                    : false
                            }
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TwoColumnsTemplate;
