export const getVideoId = (
    isCloudinaryDisabled?: boolean,
    cloudinaryId: string = '',
    youtubeId: string = '',
): string => {
    if (isCloudinaryDisabled || !cloudinaryId) {
        return youtubeId;
    }

    return cloudinaryId;
};
