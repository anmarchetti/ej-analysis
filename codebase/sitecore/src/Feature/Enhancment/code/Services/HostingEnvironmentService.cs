using System;
using System.Web.Hosting;
using easyJet.Feature.SitecoreEnhancment.Logging;

namespace easyJet.Feature.SitecoreEnhancment.Services
{
    public class HostingEnvironmentService : IHostingEnvironmentService
    {
        private readonly IRenderingMappingLogger logger;

        public HostingEnvironmentService()
            : this(new RenderingMappingLogger())
        {
        }

        public HostingEnvironmentService(IRenderingMappingLogger logger)
        {
            this.logger = logger ?? new RenderingMappingLogger();
        }

        public string MapPath(string virtualPath)
        {
            try
            {
                return HostingEnvironment.MapPath(virtualPath);
            }
            catch (Exception ex)
            {
                logger.Warn("HostingEnvironment.MapPath failed to map path.", ex, this);
                return null;
            }
        }

        public bool FileExists(string physicalPath)
        {
            if (string.IsNullOrEmpty(physicalPath))
            {
                return false;
            }

            return System.IO.File.Exists(physicalPath);
        }

        public string ReadAllText(string physicalPath)
        {
            return System.IO.File.ReadAllText(physicalPath);
        }
    }
}
