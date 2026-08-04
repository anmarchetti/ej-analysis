export enum MediaSize {
    Large = 'large',
    Big = 'big',
    Medium = 'medium',
    Small = 'small',
}

export interface IMediaSizeParams {
    mh: number;
    mw: number;
}

/**
 * Sets of media size params must be the same as defined in sitecore config
 * (see <allowedMediaParams> in sitecore/src/Project/Holidays/code/App_Config/Include/Project/EasyJet.Project.Holidays.JavaScriptServices.config)
 */
export const getMediaSizeParams = (mediaSize: MediaSize): IMediaSizeParams => {
    switch (mediaSize) {
        case MediaSize.Large:
            return { mw: 1920, mh: 1080 };
        case MediaSize.Big:
            return { mw: 1200, mh: 650 };
        case MediaSize.Medium:
            return { mw: 800, mh: 500 };
        case MediaSize.Small:
            return { mw: 500, mh: 500 };
    }
};
