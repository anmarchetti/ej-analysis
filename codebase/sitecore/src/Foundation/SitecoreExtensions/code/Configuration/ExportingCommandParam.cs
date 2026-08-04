using System.Diagnostics.CodeAnalysis;
using Sitecore.Data;

namespace easyJet.Foundation.SitecoreExtensions.Configuration
{
    [ExcludeFromCodeCoverage]
    public class ExportingCommandParam
    {
        public ExportingCommandParam(string templateId)
        {
            TemplateId = new ID(templateId);
        }

        public ID TemplateId { get; set; }
    }
}