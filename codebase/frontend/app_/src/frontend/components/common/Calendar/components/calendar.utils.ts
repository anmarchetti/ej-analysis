import Flatpickr from 'react-flatpickr';
import { Instance } from 'flatpickr/dist/types/instance';

import { cmsUrls } from 'code/endpoints';
import { BaseLayoutStore } from 'frontend/store/base/layout/BaseLayoutStore';
import SiteSettings from 'models/enum/SiteSettings';

export const UNAVAILABLE_OVERLAY_CLASS = 'month-unavailable';

export const makeOverlayOnDisabledMonths = (
    overlayDisabledMonths: boolean,
    refFpCalendar: React.MutableRefObject<Flatpickr | null>,
    getSetting: (SiteSettings) => any,
): void => {
    const instance = refFpCalendar?.current?.flatpickr;

    if (!overlayDisabledMonths || !instance) return;

    unavailableMonthOverlay(instance, getSetting);
};

export const unavailabilityOverlay = (image: string, content: string): HTMLDivElement => {
    const wrapper = document.createElement('div');
    wrapper.classList.add(UNAVAILABLE_OVERLAY_CLASS);

    const img = document.createElement('img');
    img.src = image;
    const text = document.createElement('p');
    text.textContent = content;

    wrapper.append(img);
    wrapper.append(text);

    return wrapper;
};

export const unavailableMonthOverlay = (instance: Instance, getSetting: BaseLayoutStore['getSetting']): void => {
    const months = instance.rContainer?.querySelectorAll('.dayContainer');
    months?.forEach(month => {
        const daysInMonth = [
            ...month.querySelectorAll(
                '.flatpickr-day:not(.prevMonthDay):not(.nextMonthDay):not(.not_available):not(.flatpickr-disabled):not(.notAllowed)',
            ),
        ];

        if (!daysInMonth.length) {
            const img = cmsUrls.media(getSetting(SiteSettings.DateUnavailableImage));
            const text = getSetting(SiteSettings.DateUnavailableMessage);
            const wrapper = unavailabilityOverlay(img, text);
            month.appendChild(wrapper);
        }
    });
};
