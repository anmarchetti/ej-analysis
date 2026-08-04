import { AxiosResponse } from 'axios';

import { IImage } from 'models/data/IHotel';

const GuidRegex = /[\dA-F]{8}-?[\dA-F]{4}-?[\dA-F]{4}-?[\dA-F]{4}-?[\dA-F]{12}/i;

const arrayMoveMutate = (array: any[], from: number, to: number) => {
    const startIndex = to < 0 ? array.length + to : to;
    const item = array.splice(from, 1)[0];
    array.splice(startIndex, 0, item);
};

/** Move items in array */
export const arrayMove = <T>(array: T[], from: number, to: number): T[] => {
    array = array.slice();
    arrayMoveMutate(array, from, to);

    return array;
};

export const getImageByField = (imageField: string, id?: string): IImage | null => {
    // get image guid from string we got from image field (it looks like this: <image mediaid=\"{F3F9E746-0804-433C-A509-3E8662869573}\" />)
    const match = imageField.match(GuidRegex);

    if (!match) {
        return null;
    }

    // remove dashes
    const imageId = match[0].replace(/-/g, '').toLowerCase();

    const image: IImage = {
        small: `/-/jssmedia/${imageId}.ashx?w=320`,
        medium: `/-/jssmedia/${imageId}.ashx?w=800`,
        large: `/-/jssmedia/${imageId}.ashx?w=1024`,
    };

    if (id) {
        image.id = id;
    }

    return image;
};

/** Get item id from create repsonce */
export const getItemIdFromResponse = (resp: AxiosResponse): string | null => {
    // for some reason item id stored in header location
    const location = resp.headers.location;

    if (!location) {
        return null;
    }

    const match = location.match(GuidRegex);

    if (!match) {
        return null;
    }

    return match[0];
};

/**
 * Returns object with property `value`
 * @param value
 */
export const withValue = <T>(value: T): { value: T } => ({ value });

/**
 * Returns small image from img field
 * @param imgField
 * @param itemId
 */
export const getSmallImage = (imgField: string, itemId: string): string | null =>
    (!!imgField?.length && getImageByField(imgField, itemId)?.small) || null;

/**
 * Prevent clicks for buttons in ExperienceEditor, that are created using <a> tag with href="#".
 */
export const fixExpEditorClickEvents = (): void => {
    document.addEventListener('click', (e: Event) => {
        const target = e.target as Element;

        if (
            target?.classList?.contains('scChromeDropDownRow') ||
            target?.parentElement?.classList?.contains('scChromeDropDownRow')
        ) {
            e.preventDefault();
        }
    });
};
