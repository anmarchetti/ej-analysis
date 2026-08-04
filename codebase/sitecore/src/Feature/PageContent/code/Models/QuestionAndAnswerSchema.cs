using System.Linq;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Schema.NET;
using Sitecore.Data.Items;

namespace easyJet.Feature.PageContent.Models
{
    public class QuestionAndAnswerSchema : WebSite
    {
        public override string Type => "FAQPage";

        /// <summary>
        /// Initializes a new instance of the <see cref="QuestionAndAnswerSchema"/> class.
        /// Builds question and answer schema.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        public QuestionAndAnswerSchema(Item item)
        {
            var questions = item
                .GetDescendantsByTemplate(Constants.TemplateIds.QuestionAndAnswer)
                .Select(x => new Question()
                {
                    Name = x[Constants.Fields.QuestionAndAnswer.Question],
                    AcceptedAnswer = new Answer()
                    {
                        Text = x[Constants.Fields.QuestionAndAnswer.Answer]
                    }
                });

            MainEntity = new OneOrMany<IThing>(questions);
        }

        public QuestionAndAnswerSchema()
        {
        }
    }
}