namespace easyJet.Foundation.HotelBeds.Models.Requests
{
    public class HotelRequest : BaseRequest
    {
        public string HotelCode { get; set; }

        public string Language { get; set; }

        public override string GetRequestString()
        {
            return $"/hotels/{GetQueryString()}";
        }

        protected override string GetQueryString()
        {
            var lang = string.IsNullOrEmpty(Language) ? DefaultLanguage : Language;
            return $"{HotelCode}?language={lang}{UseSecondaryLanguageQueryParam}{LastUpdateDateQueryParam}";
        }
    }
}