using System.Collections.Generic;
using System.Linq;
using CsvHelper;
using CsvHelper.Configuration;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class TransferInfoMap : ClassMap<TransferInfo>
    {
        public TransferInfoMap()
        {
            Map(m => m.AirportId).Name("AirportId");
            Map(m => m.ResortId).Name("ResortId");
            Map(m => m.ResortName).Name("ResortName");
            Map(m => m.ProductId).Name("ProductId");
            Map(m => m.ValidFrom).Name("ValidFrom");
            Map(m => m.ValidTo).Name("ValidTo");
            Map(m => m.Type).Name("VehicleType");
            Map(m => m.TransfersMinutes).Name("TransferMinutes");
            Map(m => m.CurrencyCode).Name("CurrencyCode");
            Map(m => m.NetReturnPrice).Name("NetReturnPrice");
            Map(m => m.MinPax).Name("MinPax");
            Map(m => m.MaxPax).Name("MaxPax");
            Map(m => m.PerPerson).Name("PerPerson");
            Map(m => m.TimeRestriction).Name("TimeRestriction");
            Map(m => m.ArrivalInstr).ConvertUsing(row => GetLanguageFieldData(row, "ArrivalInstr"));
            Map(m => m.DepInstr).ConvertUsing(row => GetLanguageFieldData(row, "DepInstr"));
        }

        private static Dictionary<string, string> GetLanguageFieldData(IReaderRow row, string columnNamePrefix)
        {
            var dic = new Dictionary<string, string>();
            var fieldNames = row.Context.HeaderRecord.Where(i => i.StartsWith(columnNamePrefix)).ToList();

            foreach (var fieldName in fieldNames)
            {
                var field = row.GetField(fieldName);
                var language = fieldName.ToLower().Replace(columnNamePrefix.ToLower(), string.Empty);
                // Support legacy format
                if (fieldNames.Count == 1 && string.IsNullOrEmpty(language))
                {
                    language = "en";
                }

                if (!dic.ContainsKey(language))
                {
                    dic.Add(language, field);
                }
            }

            return dic;
        }
    }
}