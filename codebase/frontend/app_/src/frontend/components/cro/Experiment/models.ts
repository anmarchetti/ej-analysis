import { TestDevices, TestPages } from './constants';

export interface ITestConfig {
    device?: TestDevices;
    page?: TestPages;
}

export interface ITest {
    testId: string | number;
    testVariant: string;
    testConfig?: ITestConfig;
}
