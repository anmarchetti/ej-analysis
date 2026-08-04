export const mockStepsStateInit = {
    HolidaySummary: { isOpened: true, isDisabled: false, isChecked: false },
    RefundOptions: { isOpened: false, isDisabled: true, isChecked: false },
    Confirmation: { isOpened: false, isDisabled: true, isChecked: false },
};

export const mockStepOneChecked = {
    HolidaySummary: { isOpened: false, isDisabled: false, isChecked: true },
    RefundOptions: { isOpened: true, isDisabled: false, isChecked: false },
    Confirmation: { isOpened: false, isDisabled: true, isChecked: false },
};

export const mockStepTwoChecked = {
    HolidaySummary: { isOpened: false, isDisabled: false, isChecked: true },
    RefundOptions: { isOpened: false, isDisabled: false, isChecked: true },
    Confirmation: { isOpened: true, isDisabled: false, isChecked: false },
};
