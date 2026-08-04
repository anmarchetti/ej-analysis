using System.Collections.Generic;
using System.Linq;
using System.Xml.Linq;
using easyJet.Foundation.Presentation.Repositories;
using easyJet.Foundation.Presentation.Services;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Presentation.Pipelines.GetXmlBasedLayoutDefinition
{
    public class AddPartialDesignsRenderings : BaseAddPartialDesignsRenderings
    {
        private readonly ILayoutXmlService layoutXmlService;
        private readonly IPageDesignRepository pageDesignRepository;
        private readonly IQueryStringProvider queryStringProvider;

        public AddPartialDesignsRenderings(
            ILayoutXmlService service,
            IHtmlCacheRepository cache,
            IPageDesignRepository pPageDesignRepository,
            IQueryStringProvider iQueryStringProvider)
            : base(cache)
        {
            layoutXmlService = service;
            pageDesignRepository = pPageDesignRepository;
            queryStringProvider = iQueryStringProvider;
        }

        protected override Item GetPageDesign(Item item)
        {
            if (item == null)
            {
                return null;
            }

            var experienceContextProviderValue = queryStringProvider.GetQueryString(Constants.QueryStringParams.ExperienceContextProvider);
            return pageDesignRepository.ResolveActivePageDesign(item, experienceContextProviderValue);
        }

        protected override List<XElement> GetRenderings(Item contextItem, Item pageDesign)
        {
            return layoutXmlService.GetRenderings(contextItem, pageDesign).ToList();
        }

        protected override void MergePartialDesignsRenderings(XElement layout, List<XElement> designRenderings)
        {
            layoutXmlService.MergePartialDesignsRenderings(layout, designRenderings);
        }
    }
}