using System.Collections.Generic;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class TransferType : DatasourceObject
    {
        public string Content { get; set; }

        public string IconUrl { get; set; }

        public IEnumerable<ContentByDate> ContentByDate { get; set; }
    }
}