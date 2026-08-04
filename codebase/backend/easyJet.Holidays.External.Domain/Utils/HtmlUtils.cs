using HtmlAgilityPack;

namespace easyJet.Holidays.External.Domain.Utils
{
    public static class HtmlUtils
    {
        public static string RemoveStylesAndScripts(string html)
        {
            if (string.IsNullOrWhiteSpace(html))
            {
                return html;
            }

            var document = new HtmlDocument();
            document.LoadHtml(html);

            var documentNodes = document.DocumentNode.DescendantsAndSelf();

            var htmlNodesToRemove = new List<HtmlNode>();

            foreach (var documentNode in documentNodes)
            {
                //get "style" and "script" nodes
                if (documentNode.Name.Equals("script", StringComparison.InvariantCultureIgnoreCase) ||
                    documentNode.Name.Equals("style", StringComparison.InvariantCultureIgnoreCase))
                {
                    htmlNodesToRemove.Add(documentNode);
                }

                //get "style" and "script" attributes
                var attributesToRemove = documentNode.Attributes.Where(x =>
                    x.Name.Equals("style", StringComparison.InvariantCultureIgnoreCase) ||
                    x.Name.Equals("script", StringComparison.InvariantCultureIgnoreCase)).ToList();

                //remove "style" and "script" attributes
                attributesToRemove.ForEach(attribute => attribute.Remove());
            }

            //remove "style" and "script" nodes
            htmlNodesToRemove.ForEach(node => node.Remove());

            return document.DocumentNode.OuterHtml;
        }
    }
}