using easyJet.Foundation.Presentation.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Mvc.Pipelines.Response.RenderRendering;

namespace easyJet.Foundation.Presentation.Pipelines.RenderRendering
{
    public class ExperienceContextProviderCacheKeyProcessor : RenderRenderingProcessor
    {
        private readonly IQueryStringProvider queryStringProvider;
        private readonly IExperienceContextProviderRepository experienceContextProviderRepository;

        public ExperienceContextProviderCacheKeyProcessor(IQueryStringProvider queryStringProvider, IExperienceContextProviderRepository experienceContextProviderRepository)
        {
            this.queryStringProvider = queryStringProvider;
            this.experienceContextProviderRepository = experienceContextProviderRepository;
        }

        public override void Process(RenderRenderingArgs args)
        {
            if (!args.Cacheable || string.IsNullOrEmpty(args.CacheKey))
            {
                return;
            }

            if (queryStringProvider.GetQueryString(Constants.QueryStringParams.ExperienceContextProvider)?.ToLowerInvariant() is string identifier && !string.IsNullOrWhiteSpace(identifier) && experienceContextProviderRepository.IsValidIdentifier(identifier))
            {
                args.CacheKey = string.Concat(args.CacheKey, "::ecp:", identifier);
            }
        }
    }
}
