using Sitecore.Data;

namespace easyJet.Foundation.SitecoreExtensions.Configuration
{
    public class UploadCommandParam
    {
        public UploadCommandParam(string templateId, string fileFieldId, string csvDelimiter)
        {
            TemplateId = new ID(templateId);
            FileFieldId = new ID(fileFieldId);
            CsvDelimiter = csvDelimiter;
        }

        public ID TemplateId { get; set; }

        public ID FileFieldId { get; set; }

        public string CsvDelimiter { get; set; }
    }
}