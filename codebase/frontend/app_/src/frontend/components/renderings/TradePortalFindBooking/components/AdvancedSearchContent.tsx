import React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { ITradePortalFindBookingFields } from 'frontend/components/renderings/TradePortalFindBooking/TradePortalFindBooking';

interface IAdvancedSearchContentProps {
    fields: ITradePortalFindBookingFields;
}

export const AdvancedSearchContent = ({ fields }: IAdvancedSearchContentProps) => {
    if (!fields) {
        return null;
    }

    const { AdvancedSearchName } = fields;

    return <Text field={AdvancedSearchName} tag='h4' />;
};

export default AdvancedSearchContent;
