using System.Collections.Generic;
using CsvHelper.Configuration.Attributes;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class TransferInfo
    {
        [Index(0)]
        public string AirportId { get; set; }

        [Index(1)]
        public string ResortId { get; set; }

        [Index(2)]
        public string ResortName { get; set; }

        [Index(3)]
        public string ProductId { get; set; }

        [Index(4)]
        public string ValidFrom { get; set; }

        [Index(5)]
        public string ValidTo { get; set; }

        [Index(6)]
        public string Type { get; set; }

        [Index(7)]
        public string TransfersMinutes { get; set; }

        [Index(8)]
        public string CurrencyCode { get; set; }

        [Index(9)]
        public string NetReturnPrice { get; set; }

        [Index(10)]
        public string MinPax { get; set; }

        [Index(11)]
        public string MaxPax { get; set; }

        [Index(12)]
        public string PerPerson { get; set; }

        [Index(13)]
        public string TimeRestriction { get; set; }

        [Index(14)]
        public Dictionary<string, string> ArrivalInstr { get; set; }

        [Index(15)]
        public Dictionary<string, string> DepInstr { get; set; }
    }
}