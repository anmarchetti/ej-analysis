using System.Web.Mvc;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.ContentTesting;
using Sitecore.ContentTesting.ViewModel;
using Sitecore.SecurityModel;

namespace easyJet.Foundation.SitecoreExtensions.Controllers
{
    public class CreateTestDialogController : BaseServicesApiController
    {
        [HttpPost]
        public bool StartTest(TestOptionsModel model)
        {
            System.Web.HttpContext.Current.Session.Add("createTestDialogHandle", true);
            var initialContentDatabase = Context.ContentDatabase;

            Context.ContentDatabase = Context.ContentDatabase ?? Factory.GetDatabase("master");

            using (new SecurityDisabler())
            {
                var createTestDialogController = new Sitecore.ContentTesting.Requests.Controllers.CreateTestDialogController(ContentTestingFactory.Instance.ContentTestStore);

                var result = createTestDialogController.StartTest(model);

                Context.ContentDatabase = initialContentDatabase;
                return result;
            }
        }
    }
}