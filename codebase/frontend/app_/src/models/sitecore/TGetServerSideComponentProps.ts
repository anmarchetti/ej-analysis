import { ComponentRendering } from '@sitecore-jss/sitecore-jss-nextjs';

import { TServerSidePageContext } from 'lib/page-props';
import { ISitecoreLayout } from 'models/data/SitecoreLayout';

export type TGetServerSideComponentProps<R = unknown> = {
    (rendering: ComponentRendering, layout: ISitecoreLayout, context: TServerSidePageContext): Promise<R>;
};
