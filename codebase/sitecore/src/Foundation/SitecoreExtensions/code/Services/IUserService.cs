using Sitecore.Security.Accounts;

namespace easyJet.Foundation.SitecoreExtensions.Services
{
    public interface IUserService
    {
        User GetContextUser();

        User CreateUser(string username, string password);

        User GetUser(string username, bool isAuthenticated);

        bool UserExists(string username);
    }
}