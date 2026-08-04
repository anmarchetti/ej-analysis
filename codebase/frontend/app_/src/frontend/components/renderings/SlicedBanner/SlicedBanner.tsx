import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { IAnchorParameters } from 'models/data/IAnchorParameters';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import SlicedBannerImage from 'frontend/components/common/SlicedBannerImage/SlicedBannerImage';

import styles from './SlicedBanner.module.scss';

export enum Direction {
    Left = 'left',
    Right = 'right',
}

interface ISlicedBannerParameters extends IAnchorParameters {
    SliceDirection: Direction;
}

interface ISlicedBannerFields {
    Image: ISitecoreField<ISitecoreImage>;
    Subtitle: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

export type TSlicedBannerProps = ISitecoreComponent<ISlicedBannerFields, ISlicedBannerParameters>;

const SlicedBanner = (props: TSlicedBannerProps) => {
    if (!props.fields) {
        return null;
    }

    const { Title, Subtitle, Image } = props.fields;
    const { SliceDirection, Anchor } = props.params;

    const isSliceDirectionRight = SliceDirection === Direction.Right;

    return (
        <div data-tid='sliced-banner'>
            {Image?.value.src && <SlicedBannerImage image={Image} isSliceDirectionRight={isSliceDirectionRight} />}
            <div className={classNames(styles.wrapper, 'wrapper-component-container')} id={Anchor}>
                <div className='wrapper-shape'>
                    <div className='wrapper-component-container__inner'>
                        <div className={styles.content} data-tid='sliced-banner-content'>
                            <Text field={Title} tag='h2' className={styles.title} data-tid='sliced-banner-title' />
                            <Text
                                tag='p'
                                field={Subtitle}
                                className={styles.subtitle}
                                data-tid='sliced-banner-subtitle'
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SlicedBanner;
