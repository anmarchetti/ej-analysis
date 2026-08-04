import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { ISitecoreField, ISitecoreImage, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import JSSImage from 'frontend/components/common/JSSImage';
import RouterLink from 'frontend/components/common/RouterLink';

import styles from './EasyJetCustomer.module.scss';

interface IEasyJetCustomerProps {
    fields: {
        Image: ISitecoreField<ISitecoreImage>;
        Link: ISitecoreField<ISitecoreLink>;
        Text: ISitecoreField<string>;
        Title: ISitecoreField<string>;
    };
}

const EasyJetCustomer = ({ fields }: IEasyJetCustomerProps) => (
    <div className={styles['container']} data-tid='easyjet-customer-container'>
        {fields.Image && <JSSImage field={fields.Image} />}
        <div>
            {fields.Title && (
                <Text field={fields.Title} tag='p' className={styles['title']} data-tid='easyjet-customer-title' />
            )}
            <div className={styles['footer']}>
                {fields.Text && (
                    <Text
                        field={fields.Text}
                        className={styles['content']}
                        tag='p'
                        data-tid='easyjet-customer-content'
                    />
                )}
                {fields.Link?.value?.href && (
                    <RouterLink link={fields.Link} className={styles['link']}>
                        {fields.Link.value.text && `${fields.Link.value.text}  >`}
                    </RouterLink>
                )}
            </div>
        </div>
    </div>
);
export default EasyJetCustomer;
