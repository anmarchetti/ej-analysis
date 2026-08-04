using easyJet.Foundation.Analytics.Models.Profiles;
using Sitecore.Data;

namespace easyJet.Feature.Tracker
{
    public static class Constants
    {
        public const string DbNameCustomValueKey = "dbName";

        public struct TemplateIds
        {
            public static readonly ID HotelDetailsPage = new ID("{757936EF-C946-447F-9E37-90140EE1D938}");
            public static readonly ID ViewBookingPage = new ID("{089BDF45-B601-48EF-8515-7E5DFC659E5F}");
            public static readonly ID HotelPage = new ID("{28E5E169-8F72-4F90-A277-280A8302B607}");
        }

        public static class QueryParams
        {
            public const string AccommodationId = "accId";
        }

        public static class ContextItemKeys
        {
            public const string CurrentItemKey = "sc_CurrentItem";
        }

        public static class HotelItemFields
        {
            public const string CodeKey = "Code";
        }

        public static class EskelSettings
        {
            public const string Endpoint = "Eskel.EndPoint";
            public const string SolrBatch = "Eskel.SolrBatch";
        }

        public static class DfloSettings
        {
            public const string EmailsEndPoint = "Dflo.EmailsEndPoint";
            public const string EmailBodyEndPoint = "Dflo.EmailBodyEndPoint";
            public const string Method = "Dflo.Method";
            public const string SkipSslVerification = "Dflo.SkipSSLVerification";
        }

        public static class HotelPageEvent
        {
            public const string AccommodationId = "AccommodationId";
            public const string Name = "Name";
            public const string CountryCode = "Country";
            public const string LocationCode = "Location";
            public const string ThemeCode = "HotelTheme";
            public const string TypeCode = "Type";
        }

        public static class Performance
        {
            public const string XConnectBatchSize = "XConnect.BatchSize";
            public const string MaxConcurrentTasks = "Parallel.MaxConcurrentTasks";
            public const string RequestTimeout = "Http.RequestTimeout";
            public static string BatchFailureLimit = "Dflo.BatchFailureLimit";
            public static string ResubmissionLimit = "Dflo.ResubmissionLimit";
            public static string BatchPortion = "Dflo.BatchPortion";
        }

        public static class Profiles
        {
            public const string HotelThemesProfileExportCacheKey = "HotelThemesExportCache";

            public static class Fields
            {
                public const string Input = "Input File";
                public const string Export = "Output File";
                public const string Status = "Status";
                public const string MessageLog = "Message";
                public const string ExportResortsCheckbox = "Export Resorts";
            }
        }
    }
}