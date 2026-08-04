import { componentFactory } from 'temp/componentFactory';

import { ISitecoreLayout } from 'models/data/SitecoreLayout';

export const preloadDynamicRenderings = (layout: ISitecoreLayout): void => {
    const renderingsNames: string[] = [];

    // get all unique renderings names from layout
    const getComponentsNames = (placeholders: { [key: string]: any }) => {
        if (!placeholders) {
            return;
        }

        Object.keys(placeholders).forEach(pKey => {
            const components = placeholders[pKey];

            components.forEach(component => {
                if (!renderingsNames.includes(component.componentName)) {
                    renderingsNames.push(component.componentName);
                }

                getComponentsNames(component.placeholders);
            });
        });
    };

    if (layout?.sitecore.route.placeholders) {
        getComponentsNames(layout?.sitecore.route.placeholders);
    }

    renderingsNames.forEach(name => {
        // check if component is dynamic and have preload function
        const preload = componentFactory(name)?.render?.preload;

        if (preload) {
            preload();
        }
    });
};
