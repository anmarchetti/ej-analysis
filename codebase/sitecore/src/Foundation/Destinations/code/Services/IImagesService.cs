using System.Threading.Tasks;

namespace easyJet.Foundation.Destinations.Services
{
    public interface IImagesService
    {
        /// <summary>
        /// Checks if image url is broken.
        /// </summary>
        /// <param name="url">Image url.</param>
        /// <returns><see langword="true"/> if response return <see cref="HttpStatusCode.NotFound"/> or <see cref="HttpStatusCode.Unauthorized"/>.
        /// </returns>
        bool CheckIfImageIsBroken(string url);

        /// <summary>
        /// Checks if images are broken.
        /// </summary>
        /// <param name="imageUrls">image urls.</param>
        /// <returns><see langword="true"/> if response return <see cref="HttpStatusCode.NotFound"/> or <see cref="HttpStatusCode.Unauthorized"/>.
        /// </returns>
        Task<bool> CheckIfImagesAreBroken(params string[] imageUrls);
    }
}
