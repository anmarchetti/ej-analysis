import { FC } from 'react';
import classNames from 'classnames';

import { MediaSize } from 'models/data/MediaSizeParams';
import { IMasonryTemplateProps } from 'frontend/components/renderings/MasonryCarousel/MasonryCarousel';

import MasonryItem from './MasonryItem/MasonryItem';

export const templateClass = 'one-row-template';

const OneRowTemplate: FC<IMasonryTemplateProps> = props => (
    <div
        className={classNames(
            'masonry-container',
            templateClass,
            props.items.length === 3 && 'x3-items',
            props.className,
        )}
        data-tid='one-row-template-container'
    >
        <div className='masonry-row'>
            {(props.items || []).map((item, i) => (
                <MasonryItem
                    item={item}
                    key={i}
                    mediaSize={MediaSize.Big}
                    isUnavailable={
                        props.destinationsAvailability
                            ? !props.destinationsAvailability[item.fields?.Code?.value]
                            : false
                    }
                    isNumberOfNightsLabel={!!props.isNumberOfNightsLabel}
                />
            ))}
        </div>
    </div>
);

export default OneRowTemplate;
