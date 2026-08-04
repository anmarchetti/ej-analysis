namespace easyJet.Holidays.Api.Domain.Data.Authentication
{
    public abstract class AuthModel
    {
        public string IpAddress { get; set; }
        public int KeepMeSignedInMinutes { get; set; }
    }
}
