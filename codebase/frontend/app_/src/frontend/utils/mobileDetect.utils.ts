import MobileDetect from 'mobile-detect';

export const deviceDetect = (userAgent: string) => {
    const mobileDetect = new MobileDetect(userAgent);

    if (mobileDetect.mobile() === 'UnknownMobile') {
        return {
            isMobile: true,
        };
    }

    return {
        isMobile: !!mobileDetect.phone() && !!mobileDetect.mobile(),
    };
};
