using CsvHelper.Configuration.Attributes;

namespace easyJet.Foundation.Atcom.Services.Sync
{
    internal class ExcludeDataObjectsCsvModel
    {
        [Index(0)]
        public string Name { get; set; }

        [Index(1)]
        public string Code { get; set; }
    }
}