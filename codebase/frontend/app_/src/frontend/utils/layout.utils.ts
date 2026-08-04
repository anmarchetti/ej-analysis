import { ComponentFields, ComponentRendering, Field, Item, PlaceholdersData } from '@sitecore-jss/sitecore-jss-nextjs';

import { ISitecoreLayout } from 'models/data/SitecoreLayout';

import { deepClone } from './array.utils';

export interface IComponentWithPlaceholder {
    component: ComponentRendering;
    placeholderPath: string;
}

/**
 * get component in the layout by it's name. returns first found component
 * @param targetName component name
 */
export const findComponentByName = (layout: ISitecoreLayout, targetName: string) => {
    const mainPlaceholders = layout?.sitecore?.route?.placeholders;

    if (!mainPlaceholders) {
        return null;
    }

    const findComponentInPlaceholders = (placeholders: PlaceholdersData<string>): ComponentRendering | undefined => {
        for (const key in placeholders) {
            if (!placeholders.hasOwnProperty(key)) {
                continue;
            }

            const placeholder = placeholders[key];

            for (let i = 0; i < placeholder.length; i++) {
                const component = placeholder[i] as ComponentRendering;

                if (component.componentName === targetName) {
                    return component;
                }

                if (component.placeholders) {
                    const found = findComponentInPlaceholders(component.placeholders);

                    if (found) {
                        return found;
                    }
                }
            }
        }

        return undefined;
    };

    return findComponentInPlaceholders(mainPlaceholders) || null;
};

/**
 * get components in the layout by it's parameter. returns all components with theirs placeholders
 * @param layout - sitecore layout
 * @param paramName - parameter name
 * @param paramValue - (optional) parameter value
 */
export const findComponentsByParam = (
    layout: ISitecoreLayout,
    paramName: string,
    paramValue?: string | number,
): IComponentWithPlaceholder[] => {
    const mainPlaceholders = layout?.sitecore?.route?.placeholders;

    if (!mainPlaceholders) {
        return [];
    }

    const components: IComponentWithPlaceholder[] = [];

    const findComponentInPlaceholders = (
        placeholders: PlaceholdersData<string>,
        placeholderString?: string,
        parentComponent?: ComponentRendering,
    ): any => {
        for (const key in placeholders) {
            if (!placeholders.hasOwnProperty(key)) {
                continue;
            }

            const placeholder = placeholders[key];

            for (let i = 0; i < placeholder.length; i++) {
                const component = placeholder[i] as ComponentRendering;

                let placeholderPath = placeholderString + (placeholderString ? '/' : '') + key;

                if (parentComponent) {
                    placeholderPath += `-{${parentComponent.uid}}-0`;
                }

                if (
                    component.params?.[paramName] &&
                    (paramValue ? component.params?.[paramName] === paramValue : true)
                ) {
                    components.push({ component, placeholderPath: placeholderPath });
                }

                if (component.placeholders) {
                    findComponentInPlaceholders(component.placeholders, placeholderPath, component);
                }
            }
        }
    };

    findComponentInPlaceholders(mainPlaceholders, '');

    return components;
};

export const getAllPlaceholdersPathsFromParentComponents = (components: IComponentWithPlaceholder[]) =>
    components
        .reduce<string[]>((res, c) => {
            const placeholdersPaths = Object.keys(c.component.placeholders ?? {}).map(
                key => `${c.placeholderPath}/${key}-{${c.component.uid}}-0`,
            );

            res.push(...placeholdersPaths);

            return res;
        }, [])
        .filter((p, i, self) => self.indexOf(p) === i);

/**
 * Returns rendering with specific placeholder picked by index
 * @param rendering
 * @param placeholderKey
 * @param index
 * @returns
 */
export const filterPlaceholdersByIndex = (rendering: ComponentRendering, placeholderKey: string, index: number) => ({
    ...rendering,
    ...(rendering.placeholders && {
        placeholders: {
            ...rendering.placeholders,
            ...(rendering.placeholders[placeholderKey] && {
                [placeholderKey]: [
                    ...(rendering.placeholders[placeholderKey][index]
                        ? [rendering.placeholders[placeholderKey][index]]
                        : []),
                ],
            }),
        },
    }),
});

type TComponentFieldItem = Item[] | Field<{ [key: string]: string | boolean }>;
const modifyComponentFields = (fields: ComponentFields, fieldName: string, paramName: string, paramValue: boolean) => {
    Object.keys(fields).forEach(key => {
        const field = fields[key] as TComponentFieldItem;

        if (Array.isArray(field)) {
            field.forEach((item: Item) => {
                if (item.fields) {
                    modifyComponentFields(item.fields as ComponentFields, fieldName, paramName, paramValue);
                }
            });
        } else if (key === fieldName) {
            fields[key] = {
                ...field,
                value: { ...field.value, [paramName]: paramValue },
            };
        }
    });
};

const modifyComponentInPlaceholders = (
    placeholders: PlaceholdersData<string>,
    componentName: string,
    paramName: string,
    paramValue: boolean,
) => {
    Object.keys(placeholders).forEach(key => {
        const placeholder = placeholders[key];

        placeholder.forEach((component: ComponentRendering) => {
            component.fields && modifyComponentFields(component.fields, componentName, paramName, paramValue);

            if (component.placeholders) {
                modifyComponentInPlaceholders(component.placeholders, componentName, paramName, paramValue);
            }
        });
    });
};

const findByParamInPlaceholders = (
    placeholders: PlaceholdersData<string>,
    paramNameToFind: string,
    componentName: string,
    modifyParamName: string,
    modifyParamValue: boolean,
) => {
    Object.keys(placeholders).forEach(key => {
        const placeholder = placeholders[key];

        placeholder.forEach((component: ComponentRendering) => {
            if (component.params?.[paramNameToFind] === '1' && component.placeholders) {
                modifyComponentInPlaceholders(component.placeholders, componentName, modifyParamName, modifyParamValue);
            }

            if (component.placeholders) {
                findByParamInPlaceholders(
                    component.placeholders,
                    paramNameToFind,
                    componentName,
                    modifyParamName,
                    modifyParamValue,
                );
            }
        });
    });
};

export const updateImagesWithLazyLoading = (
    layout: ISitecoreLayout,
    paramNameToFind: string,
    componentName: string,
    modifyParamName: string,
    modifyParamValue: boolean,
): ISitecoreLayout => {
    const tempLayout = deepClone(layout);
    const mainPlaceholders = tempLayout?.sitecore?.route?.placeholders;

    if (!mainPlaceholders) {
        return tempLayout;
    }

    findByParamInPlaceholders(mainPlaceholders, paramNameToFind, componentName, modifyParamName, modifyParamValue);

    return tempLayout;
};
