using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace easyJet.Foundation.HotelBeds.Models.Domain
{
    public class Board : BaseObject
    {
        [JsonProperty("description")]
        public LocalizedContent Description { get; set; }
    }
}
