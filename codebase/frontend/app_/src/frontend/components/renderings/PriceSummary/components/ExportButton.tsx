import { FC } from 'react';
import { ComponentRendering, Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';

import { PlaceholderNames } from 'models/enum/PlaceholderNames';

interface IExportButtonProps {
    rendering?: ComponentRendering;
}

export const ExportButton: FC<IExportButtonProps> = ({ rendering }: IExportButtonProps) =>
    rendering ? (
        <Placeholder
            name={PlaceholderNames.ExportHolidayDetails}
            rendering={rendering}
            data-tid='export-holiday-details'
        />
    ) : null;
