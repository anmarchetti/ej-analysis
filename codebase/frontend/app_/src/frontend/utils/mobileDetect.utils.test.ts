import { deviceDetect } from './mobileDetect.utils';

const mockDeviceDetect = jest.fn();
const mockMobileDeviceDetect = jest.fn();
const mockPhoneDeviceDetect = jest.fn();
jest.mock('mobile-detect', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(data => {
        mockDeviceDetect(data);

        return {
            mobile: mockMobileDeviceDetect,
            phone: mockPhoneDeviceDetect,
        };
    }),
}));

describe('mobileDetect.utils', () => {
    describe('deviceDetect', () => {
        it('Should return isMobile:true when detect UnknownMobile', () => {
            mockMobileDeviceDetect.mockReturnValueOnce('UnknownMobile');

            const result = deviceDetect('user-agent');

            expect(mockDeviceDetect).toHaveBeenCalledWith('user-agent');
            expect(result).toStrictEqual({
                isMobile: true,
            });
        });

        it('Should return isMobile:true when .phone() and .mobile() return non empty value', () => {
            mockMobileDeviceDetect.mockReturnValue('mobile');
            mockPhoneDeviceDetect.mockReturnValue('phone');

            const result = deviceDetect('user-agent');

            expect(result).toStrictEqual({
                isMobile: true,
            });
        });

        it('Should return isMobile:false when .phone() returns true, but .mobile(), somehow, returns null', () => {
            mockMobileDeviceDetect.mockReturnValue(null);
            mockPhoneDeviceDetect.mockReturnValue('phone');

            const result = deviceDetect('user-agent');

            expect(result).toStrictEqual({
                isMobile: false,
            });
        });

        it('Should return isMobile:false when .phone() returns null, but .mobile() returns non empty value', () => {
            mockMobileDeviceDetect.mockReturnValue('mobile');
            mockPhoneDeviceDetect.mockReturnValue(null);

            const result = deviceDetect('user-agent');

            expect(result).toStrictEqual({
                isMobile: false,
            });
        });
    });
});
