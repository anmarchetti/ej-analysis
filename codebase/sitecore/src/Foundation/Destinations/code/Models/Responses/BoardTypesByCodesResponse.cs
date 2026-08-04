using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain;

namespace easyJet.Foundation.Destinations.Models.Responses
{
    public class BoardTypesByCodesResponse
    {
        public BoardTypesByCodesResponse(IEnumerable<DatasourceObject> boardTypes)
        {
            BoardTypes = boardTypes ?? new List<DatasourceObject>();
        }

        public IEnumerable<DatasourceObject> BoardTypes { get; set; }
    }
}