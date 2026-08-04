using System.Collections.Generic;
using System.Linq;
using CsvHelper;
using CsvHelper.Configuration;
using CsvHelper.TypeConversion;
using easyJet.Foundation.Atcom.Models.Domain;

namespace easyJet.Foundation.Atcom.Converter
{
    /// <summary>
    /// Converters data from csv file to seasonal facilities type.
    /// </summary>
    public class SeasonalFacilitiesArrayConverter : TypeConverter
    {
        /// <inheritdoc/>
        public override object ConvertFromString(string text, IReaderRow row, MemberMapData memberMapData)
        {
            var seasonalFacilities = new List<RoomSeasonalFacilitiesFileModel>();
            if (text == null)
            {
                return seasonalFacilities;
            }

            for (int i = 0; i < row.Context.Record.Length; i += 4)
            {
                var record = row.Context.Record.Skip(9 + i).Take(4).ToArray();
                if (record.Length == 4)
                {
                    seasonalFacilities.Add(new RoomSeasonalFacilitiesFileModel()
                    {
                        FacilityCode = record[1],
                        StartDate = record[2],
                        EndDate = record[3],
                    });
                }
            }

            return seasonalFacilities;
        }

        /// <inheritdoc/>
        public override string ConvertToString(object value, IWriterRow row, MemberMapData memberMapData)
        {
            if (!(value is List<RoomSeasonalFacilitiesFileModel> seasonalFacilities))
            {
                return string.Empty;
            }

            return string.Join("\t", seasonalFacilities.Select(x => x.ToString()));
        }
    }
}