using System;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.Logging;

namespace easyJet.Foundation.Destinations.Services
{
    [Service(typeof(IImagesService), Lifetime = Lifetime.Singleton)]
    public class ImagesService : IImagesService
    {
        private readonly IDestinationsLogger logger;

        public ImagesService(IDestinationsLogger logger)
        {
            this.logger = logger;
        }

        public async Task<bool> CheckIfImagesAreBroken(params string[] imageUrls)
        {
            var tasks = imageUrls.Select(url => Task.Factory.StartNew(() => CheckIfImageIsBroken(url)));
            var results = await Task.WhenAll(tasks);
            return results.Any(r => r);
        }

        /// <inheritdoc/>
        public bool CheckIfImageIsBroken(string url)
        {
            if (string.IsNullOrEmpty(url))
            {
                return false;
            }

            try
            {
                var req = WebRequest.Create(url) as HttpWebRequest;
                req.Method = "HEAD";

                using (var response = (HttpWebResponse)req.GetResponse())
                {
                    if (response.StatusCode == HttpStatusCode.OK)
                    {
                        return false;
                    }
                }
            }
            catch (WebException ex) when (
            (ex.Response as HttpWebResponse)?.StatusCode == HttpStatusCode.NotFound ||
            (ex.Response as HttpWebResponse)?.StatusCode == HttpStatusCode.Forbidden)
            {
                logger.Info($"Image: {url} is broken it returns {(ex.Response as HttpWebResponse)?.StatusCode} code.", this);
                return true;
            }
            catch (Exception ex)
            {
                logger.Info($"Can not send request URL: {url} due to {ex.Message}", this);
                return true;
            }

            return false;
        }
    }
}