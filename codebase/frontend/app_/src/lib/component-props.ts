import {
    ComponentParams,
    ComponentRendering,
    Field,
    LayoutServiceContext,
    RouteData,
} from '@sitecore-jss/sitecore-jss-nextjs';

/**
 * Styleguide sitecore context value shape
 */
export type TStyleguideSitecoreContextValue = LayoutServiceContext & {
    route: RouteData;
    itemId?: string;
};

/**
 * Shared styleguide specimen fields
 */
export type TStyleguideSpecimenFields = {
    fields: {
        description: Field<string>;
        heading: Field<string>;
    };
};

/**
 * Shared styleguide component props
 */
export type TStyleguideComponentProps = {
    params: ComponentParams;
    rendering: ComponentRendering;
};

/**
 * Styleguide component props with context
 * You can access `sitecoreContext` by withSitecoreContext/useSitecoreContext
 * @example withSitecoreContext()(ContentBlock)
 * @example const { sitecoreContext } = useSitecoreContext()
 */
export type TStyleguideComponentWithContextProps = TStyleguideComponentProps & {
    sitecoreContext: TStyleguideSitecoreContextValue;
};
