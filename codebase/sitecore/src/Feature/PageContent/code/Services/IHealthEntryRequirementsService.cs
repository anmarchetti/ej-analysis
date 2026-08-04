using System.Collections.Generic;
using easyJet.Feature.PageContent.Models;

namespace easyJet.Feature.PageContent.Services
{
    public interface IHealthEntryRequirementsService
    {
        /// <summary>
        /// Get healthy/entry requirements by airport code.
        /// </summary>
        /// <param name="airportCode">The airport code.</param>
        /// <returns>Collection of health/entry requirements.</returns>
        IEnumerable<HealthEntryRequirementTile> Get(string airportCode);

        /// <summary>
        /// Get flight and hotel healthy/entry requirements by airport code.
        /// </summary>
        /// <param name="airportCode">The airport code.</param>
        /// <returns>Collection of flight and hotel health/entry requirements.</returns>
        IEnumerable<HealthEntryRequirementTile> GetFlightAndHotelHealthEntryRequirements(string airportCode);

        /// <summary>
        /// Get all healthy/entry requirement blocks.
        /// </summary>
        /// <returns>Collection of health/entry requirement blocks.</returns>
        IEnumerable<HealthEntryRequirementBlock> GetAll();

        /// <summary>
        /// Get all flight and hotel healthy/entry requirement blocks.
        /// </summary>
        /// <returns>Collection of flight and hotel health/entry requirement blocks.</returns>
        IEnumerable<HealthEntryRequirementBlock> GetAllFlightAndHotelHealthEntryRequirements();
    }
}