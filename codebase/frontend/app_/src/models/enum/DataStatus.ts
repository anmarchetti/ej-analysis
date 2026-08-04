export enum DataStatus {
    NotLoaded = 'NotLoaded',
    Loaded = 'Loaded',
    NeedToReload = 'NeedToReload',
    Error = 'LoadingError',
    Loading = 'Loading',
    LoadingMore = 'LoadingMore',
    LoadingPrevious = 'LoadingPrevious',
}

export const isNotLoadedStatus = (status: DataStatus): boolean => status === DataStatus.NotLoaded;
export const isLoadedStatus = (status: DataStatus): boolean => status === DataStatus.Loaded;
export const isNeedToReloadStatus = (status: DataStatus): boolean => status === DataStatus.NeedToReload;
export const isErrorStatus = (status: DataStatus): boolean => status === DataStatus.Error;
export const isLoadingStatus = (status: DataStatus): boolean => status === DataStatus.Loading;
export const isLoadingMoreStatus = (status: DataStatus): boolean => status === DataStatus.LoadingMore;
export const isLoadingPreviousStatus = (status: DataStatus): boolean => status === DataStatus.LoadingPrevious;
