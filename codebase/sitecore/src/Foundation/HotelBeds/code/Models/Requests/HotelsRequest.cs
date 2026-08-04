namespace easyJet.Foundation.HotelBeds.Models.Requests
{
    public class HotelsRequest : BaseRequest
    {
        public string HotelCodes { get; set; }

        public string Language { get; set; }

        public override string GetRequestString()
        {
            return $"/hotels{GetQueryString()}";
        }

        protected override string GetQueryString()
        {
            var lang = string.IsNullOrEmpty(Language) ? DefaultLanguage : Language;
            return $"?fields=all&from=1&to={BatchStep}&codes={HotelCodes}&language={lang}{UseSecondaryLanguageQueryParam}{LastUpdateDateQueryParam}";
        }
    }
}