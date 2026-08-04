using System;
using Newtonsoft.Json;
using Sitecore.Configuration;

namespace easyJet.Foundation.HotelBeds.Models.Domain
{
    public class Image
    {
        [JsonProperty("path")]
        public string SrcUrl { get; set; }

        [JsonProperty("imageTypeCode")]
        public string ImageTypeСode { get; set; }

        [JsonProperty("type")]
        public Type Type { get; set; }

        [JsonProperty("order")]
        public string Order { get; set; }

        [JsonProperty("roomType")]
        public string RoomType { get; set; }

        [JsonProperty("roomCode")]
        public string RoomCode { get; set; }

        public string SmallImage => CombineUrls(Settings.GetSetting("HotelBeds.ImageSizePrefixUrl.Small"), SrcUrl);

        public string MediumImage => CombineUrls(Settings.GetSetting("HotelBeds.ImageSizePrefixUrl.Medium"), SrcUrl);

        public string LargeImage => CombineUrls(Settings.GetSetting("HotelBeds.ImageSizePrefixUrl.Large"), SrcUrl);

        public string TypeCode => !string.IsNullOrEmpty(ImageTypeСode) ? ImageTypeСode : Type?.Code;

        private string CombineUrls(string baseUrl, string url)
        {
            return new Uri(new Uri(baseUrl), url).ToString();
        }
    }
}