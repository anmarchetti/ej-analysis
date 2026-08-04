import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import INavLink from 'models/data/INavLink';
import { ShowOn } from 'models/enum/ShowOn';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';

import styles from './ManageBooking.module.scss';

interface IManageBookingFields {
    Panels: IManageBookingPanel[];
}
interface IManageBookingPanel {
    fields: {
        Content: ISitecoreField<string>;
        Links: INavLink[];
        Title: ISitecoreField<string>;
    };
    id: string;
}

type TManageBookingPanelProps = ISitecoreComponent<IManageBookingFields>;

const ManageBooking = ({ fields }: TManageBookingPanelProps) => {
    const { isLoggedIn } = useStore((stores: IHolidaysStores) => ({
        isLoggedIn: stores.userStore.isLoggedIn,
    }));

    if (!fields) {
        return null;
    }

    return (
        <div className='row'>
            {fields.Panels.map(item => {
                const { Title, Content, Links } = item.fields;

                return (
                    <div className='col-12 col-md my-3' key={item.id}>
                        <div className={styles['panel']} data-tid='manage-booking-panel'>
                            {!!Title && (
                                <Text
                                    className={styles['title']}
                                    field={Title}
                                    tag='p'
                                    data-tid='manage-booking-title'
                                />
                            )}
                            {!!Content && <RichTextWithLinks field={Content} dataId='manage-booking-content' />}

                            {Links.map(link => {
                                const { Link, ShowOn: showCase } = link.fields;

                                if (
                                    (!isLoggedIn && showCase?.value === ShowOn.ShowOnLogedIn) ||
                                    (isLoggedIn && showCase?.value === ShowOn.ShowOnLogedOut)
                                ) {
                                    return null;
                                }

                                return (
                                    <RouterLink className='btn' link={Link} key={link.id} dataId='manage-booking-btn'>
                                        {Link?.value.text}
                                    </RouterLink>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default observer(ManageBooking);
