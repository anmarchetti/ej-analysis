import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { createLocalStore } from 'frontend/utils/createLocalStore';
import { IContactUsProps } from 'frontend/components/renderings/ContactUs/ContactUs';

import { ContactUsStore } from './ContactUsStore';

export const [withContactUsStore, useContactUsStore] = createLocalStore<ContactUsStore, IContactUsProps | object>(
    (rootStore: HolidaysRootStore) => new ContactUsStore(rootStore),
);
