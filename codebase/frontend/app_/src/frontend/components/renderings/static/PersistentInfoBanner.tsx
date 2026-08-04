import * as React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { inject } from 'mobx-react';

import { useIsMounted } from 'frontend/hooks/useIsMounted';
import { TStores } from 'frontend/store/IStores';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import { JSSImage } from 'frontend/components/common/JSSImage';
import StickyBox from 'frontend/components/common/StickyBox';
import { withRerender } from 'frontend/components/hoc';

interface IPersistentInfoBannerProps extends ISitecoreComponent<IPersistentInfoBannerSitecoreFields> {
    wasMaintenancePopupShown: boolean;
}

export interface IPersistentInfoBannerSitecoreFields {
    Description: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    Title: ISitecoreField<string>;
}

const PersistentInfoBanner = (props: IPersistentInfoBannerProps) => {
    const isMounted = useIsMounted();

    if (!props.fields?.Title) {
        return null;
    }

    // do not show popup is maintenance popup is still shown (http://jra.europe.easyjet.local/browse/EJH-9986)
    const classes = classNames('header-info-banner', (!isMounted || !props.wasMaintenancePopupShown) && 'd-none');

    const { fields } = props;

    return (
        <StickyBox
            stickyMobile={true}
            render={() => (
                <div className={classes}>
                    <div className='header-info-banner__content d-flex align-items-center'>
                        <div className='header-info-banner__icon'>
                            <JSSImage field={fields.Icon} />
                        </div>
                        <div className='flex-grow-1'>
                            <div className='header-info-banner__title'>
                                <Text field={fields.Title} />
                            </div>
                            <div className='header-info-banner__description'>
                                <Text field={fields.Description} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        />
    );
};

export default inject((stores: TStores) => ({
    wasMaintenancePopupShown: stores.appStore.wasMaintenancePopupShown,
}))(withRerender(PersistentInfoBanner));
