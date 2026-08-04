import { Image as ImageJSS, Placeholder, Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { getSitecoreImageBackgroundStyles } from 'frontend/utils/getImage';
import { MediaSize } from 'models/data/MediaSizeParams';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { ITradePortalGroupBookingFields } from 'frontend/components/renderings/TradePortalGroupBooking/TradePortalGroupBooking';

import styles from './GroupBookingHeader.module.scss';

interface IGroupBookingHeaderProps {
    fields: ITradePortalGroupBookingFields;
    rendering: any;
}

const GroupBookingHeader = ({ fields, rendering }: IGroupBookingHeaderProps) => {
    const { isScreenLessMedium, isEditMode } = useStore(stores => ({
        isScreenLessMedium: stores.appStore.isScreenLessMedium,
        isEditMode: stores.layoutStore.isEditMode,
    }));

    const { Title, Name, Image } = fields;

    const getBackgroundStyles = (): React.CSSProperties | undefined =>
        getSitecoreImageBackgroundStyles(Image, MediaSize.Large, isScreenLessMedium, isEditMode);

    return (
        <div
            className={classNames(
                'page-hero-banner page-hero-banner--gradient-overlay',
                styles['group-booking-banner'],
            )}
            style={getBackgroundStyles()}
        >
            {isEditMode && (
                <div className='exp-editor-bg-image'>
                    <ImageJSS field={Image} />
                </div>
            )}

            <div className='page-hero-banner__inner wrapper-container--px'>
                <div className='page-hero-banner__placeholder-top'>
                    <Placeholder name={PlaceholderNames.HeroBannerTopSection} rendering={rendering} />
                </div>

                <div className='page-hero-banner__main-content'>
                    <div className={classNames('page-hero-banner__text-block')}>
                        <h1 className={classNames('page-hero-banner__title')}>
                            <Text field={Title || Name} />{' '}
                        </h1>
                    </div>
                </div>
            </div>

            <div className={classNames('page-hero-banner__triangle', 'triangle-start')} />
        </div>
    );
};

export default GroupBookingHeader;
