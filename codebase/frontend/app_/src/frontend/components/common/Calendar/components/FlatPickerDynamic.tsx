import dynamic from 'next/dynamic';

export type { default as TReactFlatpickr } from 'react-flatpickr';
export type { Instance as TReactFlatpickrInstance } from 'flatpickr/dist/types/instance';

export const DynamicFlatPicker = dynamic(() => import('./FlatPicker').then(m => m.default));
