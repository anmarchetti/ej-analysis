using System.Collections.Generic;
using easyJet.Foundation.Presentation.Logging;
using easyJet.Foundation.Presentation.Models;
using easyJet.Foundation.Presentation.Repositories;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using NSubstitute;

namespace easyJet.Foundation.Presentation.Tests.Repositories
{
    /// <summary>
    /// Concrete subclass of <see cref="ExperienceContextProviderRepository"/> used exclusively by unit tests.
    /// Bypasses the HTML cache so tests exercise DB-reading logic directly without needing to wire up cache mocks.
    /// </summary>
    internal class TestableExperienceContextProviderRepository : ExperienceContextProviderRepository
    {
        public TestableExperienceContextProviderRepository(IDatabaseProvider pdatabaseProvider, IPresentationLogger plogger, ISitecoreContextProvider pcontextProvider, IFieldUtilsService pfieldUtilsService = null)
            : base(pdatabaseProvider, plogger, pcontextProvider, Substitute.For<IHtmlCacheRepository>(), pfieldUtilsService)
        {
        }

        /// <summary>Bypasses cache — reads verbose-logging flag from DB directly.</summary>
        public override bool IsVerboseLoggingEnabled()
            => FetchIsVerboseLoggingEnabled();

        /// <summary>Bypasses cache — reads from DB directly so tests remain deterministic.</summary>
        protected override IReadOnlyCollection<ExperienceContextProviderConfig> GetActiveProviders()
            => FetchActiveProviders();
    }
}
