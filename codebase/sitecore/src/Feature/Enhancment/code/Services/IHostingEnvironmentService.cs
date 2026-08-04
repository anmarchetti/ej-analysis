using System;

namespace easyJet.Feature.SitecoreEnhancment.Services
{
    public interface IHostingEnvironmentService
    {
        string MapPath(string virtualPath);

        bool FileExists(string physicalPath);

        string ReadAllText(string physicalPath);
    }
}
