using easyJet.Feature.SitecoreEnhancment.Logging;
using easyJet.Feature.SitecoreEnhancment.Services;
using easyJet.Foundation.SitecoreExtensions.Services;

namespace easyJet.Feature.SitecoreEnhancment.CustomFields.FieldTypes
{
    /// <summary>
    /// Encapsulates dependencies for RenderingMappingEditor to reduce constructor parameters.
    /// </summary>
    public class RenderingMappingEditorDependencies
    {
        public IDatabaseProvider DatabaseProvider { get; set; }

        public IRenderingMappingHtmlBuilder HtmlBuilder { get; set; }

        public IRenderingParameterEditorService ParameterEditorService { get; set; }

        public ISitecoreContextProvider ContextProvider { get; set; }

        public ISheerUiService SheerUiService { get; set; }

        public IHttpContextAccessor HttpContextAccessor { get; set; }

        public IHostingEnvironmentService HostingEnvironmentService { get; set; }

        public IRenderingMappingLogger Logger { get; set; }

        public IRenderingIdExtractionService RenderingIdExtractionService { get; set; }
    }
}
