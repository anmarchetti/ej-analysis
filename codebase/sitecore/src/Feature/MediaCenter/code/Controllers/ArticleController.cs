using System.Linq;
using System.Web.Mvc;
using easyJet.Feature.MediaCenter.ContentSearch.Queries;
using easyJet.Feature.MediaCenter.ContentSearch.Repositories;
using easyJet.Feature.MediaCenter.Models.Domain;
using easyJet.Feature.MediaCenter.Models.Requests;
using easyJet.Feature.MediaCenter.Models.Responses;
using easyJet.Feature.MediaCenter.Services;
using easyJet.Foundation.SitecoreExtensions.Controllers;
using Sitecore;

namespace easyJet.Feature.MediaCenter.Controllers
{
    public class ArticleController : BaseServicesApiController
    {
        private readonly IArticleSearchRepository articleRepository;
        private readonly ITopicsService topicsService;

        public ArticleController(IArticleSearchRepository articleRepository, ITopicsService topicsService)
        {
            this.articleRepository = articleRepository;
            this.topicsService = topicsService;
        }

        /// <summary>
        /// Get Articles by topics search requset.
        /// </summary>
        /// <param name="topicsRequest">Topics rquest param for filtring articles.</param>
        /// <returns>Articles response:  total count, articles, topics.</returns>
        [HttpPost]
        public ActionResult Search(ArticlesByTopicsRequest topicsRequest)
        {
            var data = articleRepository.GetArticles(new ArticlesQueryArgs(topicsRequest.Take, topicsRequest.Page, topicsRequest.Offset, topicsRequest.StartDate, topicsRequest.EndDate, topicsRequest.Query, topicsRequest.Topics));
            var facets = data.Facets.Categories.FirstOrDefault(x => x.Name == "topics")?.Values.Select(x => new Topic() { Name = x.Name, Count = x.AggregateCount });
            var result = new ArticlesResponse(
                data.TotalSearchResults,
                data.Select(article =>
                new Article(
                    article.Document.Title,
                    article.Document.ArticleUrl,
                    article.Document.Image,
                    article.Document.ShortDescription,
                    DateUtil.ToServerTime(article.Document.PublicationDate).ToString("o"),
                    article.Document.Topics)),
                facets);

            return Json(result, JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Get all avaliable topics.
        /// </summary>
        /// <returns>Avaliable topics.</returns>
        [HttpGet]
        public ActionResult GetTopics()
        {
            var data = topicsService.GetTopics();
            return Json(data, JsonRequestBehavior.AllowGet);
        }
    }
}