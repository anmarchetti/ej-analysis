using easyJet.Feature.PageContent.Models;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using Schema.NET;
using Sitecore.Data.Items;

namespace easyJet.Feature.PageContent.Services
{
    [Service(typeof(ISchemaFactory), Lifetime = Lifetime.Singleton)]
    public class SchemaFactory : ISchemaFactory
    {
        /// <inheritdoc/>
        public WebSite GetSchema(Item item)
        {
            if (item.TemplateID == Constants.TemplateIds.QuestionsAndAnswersFolder)
            {
                return new QuestionAndAnswerSchema(item);
            }

            return null;
        }
    }
}