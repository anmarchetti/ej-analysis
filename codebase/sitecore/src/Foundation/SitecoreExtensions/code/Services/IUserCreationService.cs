using Sitecore.Security.Accounts;

namespace easyJet.Foundation.SitecoreExtensions.Services
{
    public interface IUserCreationService
    {
        User GetOrCreateNonAnonymousUser(string username);
    }
}