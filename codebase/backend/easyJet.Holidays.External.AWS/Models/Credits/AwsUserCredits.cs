using easyJet.Holidays.Api.Domain.Data.Vouchers;

namespace easyJet.Holidays.External.AWS.Models.Credits
{
    public class AwsUserCredits
    {
        public string MemberId { get; set; }
        public Dictionary<string, MyCreditInfo> UserCredits { get; set; }
        public int Timestamp { get; set; }
    }
}
