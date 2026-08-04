import { FunctionComponent } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import JSSImageNext from 'frontend/components/common/JSSImageNext/JSSImageNext';

import styles from './HolidayExtrasPromoBanner.module.scss';

export interface IHolidayExtrasPromoBannerProps {
    promotionLogo: ISitecoreField<ISitecoreImage>;
    promotionText: ISitecoreField<string>;
}
const HolidayExtrasPromoBanner: FunctionComponent<IHolidayExtrasPromoBannerProps> = ({
    promotionText,
    promotionLogo,
}) => (
    <div className={styles.promotionContainer}>
        {!!promotionText && (
            <Text className={styles.promotionText} tag='span' field={promotionText} data-tid='promotion-text-title' />
        )}
        {!!promotionLogo && <JSSImageNext field={promotionLogo} width={162} height={24} />}
    </div>
);

export default HolidayExtrasPromoBanner;
