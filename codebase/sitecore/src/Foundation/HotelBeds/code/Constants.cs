using Sitecore.Data;

namespace easyJet.Foundation.HotelBeds
{
    public struct Constants
    {
        public struct CacheIdentifiers
        {
            public static string RoomTypes = "RoomTypes";
        }

        public struct Performance
        {
            public const string SyncRoomsGetAllHotelsBatchSize = "HotelBeds.GetAllHotelsBatchSize";
        }

        public struct Templates
        {
            public struct ResyncFacilititesRecord
            {
                public static readonly ID ID = new ID("{3C2D4E01-B546-4CB6-9157-21DE94BEE36A}");

                public struct Fields
                {
                    public const string HotelCode = "HotelCode";
                    public const string HotelName = "HotelName";
                    public const string DateTime = "DateTime";
                    public const string Message = "Message";
                }
            }
        }
    }
}