namespace easyJet.Foundation.XConnect.Common.Model
{
    public struct ContactPhoneData
    {
        public ContactPhoneData(string mobilePhoneCode, string mobilePhoneNumber)
        {
            MobilePhoneCode = mobilePhoneCode;
            MobilePhoneNumber = mobilePhoneNumber;
        }

        public string MobilePhoneCode { get; }

        public string MobilePhoneNumber { get; }
    }
}