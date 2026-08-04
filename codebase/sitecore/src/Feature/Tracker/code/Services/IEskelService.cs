using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using easyJet.Feature.Tracker.Models.Eskel;

namespace easyJet.Feature.Tracker.Services
{
    public interface IEskelService
    {
        Task<IReadOnlyCollection<Booking>> GetBookings(DateTime startDate, DateTime endDate);
    }
}