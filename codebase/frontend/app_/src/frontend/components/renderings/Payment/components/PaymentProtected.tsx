import React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { ISitecoreField, ISitecoreImage as ISinecureImage } from 'models/sitecore/generic/ISitecoreField';
import JSSImage from 'frontend/components/common/JSSImage';

interface IPaymentProtected {
    protectionImage?: ISitecoreField<ISinecureImage>;
    protectionTitle?: ISitecoreField<string>;
}

export function PaymentProtected(props: IPaymentProtected) {
    const { protectionImage, protectionTitle } = props;

    return (
        <div className='payment-protection' data-tid='payment-protection'>
            {protectionImage && <JSSImage field={protectionImage} />}
            {protectionTitle && <Text field={protectionTitle} tag='strong' />}
        </div>
    );
}

export default PaymentProtected;
