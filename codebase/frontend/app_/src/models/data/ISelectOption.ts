export interface ISelectOption {
    label: string | number;
    value: string | number;
}

export interface ICountryCodeSelectOption extends ISelectOption {
    iso2: string;
}

export interface IReactSelectOption<L, V> {
    label: L;
    value: V;
}

export type TMonthOption = IReactSelectOption<string, number>;
export type TYearOption = IReactSelectOption<number, number>;
