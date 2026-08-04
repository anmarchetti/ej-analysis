using System;
using Sitecore.Configuration;

namespace easyJet.Foundation.HotelBeds.Models.Requests
{
    public abstract class BaseRequest
    {
        public DateTime? LastUpdateTime { get; set; }

        protected string BatchStep { get; set; }

        protected string DefaultLanguage { get; set; }

        protected string UseSecondaryLanguage { get; set; }

        protected string LastUpdateDateQueryParam => LastUpdateTime.HasValue ? $"&lastUpdateTime={LastUpdateTime.Value:yyyy-MM-dd}" : string.Empty;

        protected string UseSecondaryLanguageQueryParam => !string.IsNullOrEmpty(UseSecondaryLanguage) ? $"&useSecondaryLanguage={UseSecondaryLanguage}" : string.Empty;

        protected BaseRequest()
        {
            BatchStep = Settings.GetSetting("HotelBeds.BatchStep");
            DefaultLanguage = Settings.GetSetting("HotelBeds.DefaultLanguage");
            UseSecondaryLanguage = Settings.GetSetting("HotelBeds.UseSecondaryLanguage");
        }

        public abstract string GetRequestString();

        protected virtual string GetQueryString()
        {
            return $"?fields=all&language={DefaultLanguage}&from=1&to={BatchStep}{UseSecondaryLanguageQueryParam}{LastUpdateDateQueryParam}";
        }
    }
}