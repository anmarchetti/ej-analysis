// This file is used by Code Analysis to maintain SuppressMessage
// attributes that are applied to this project.
// Project-level suppressions either have no target or are given
// a project-specific target.

using System.Diagnostics.CodeAnalysis;

// Suppress CA1515 (Consider making public types internal) for API Controllers
// Controllers need to be public for ASP.NET Core MVC to discover and route to them properly
[assembly: SuppressMessage("Design", "CA1515:Consider making public types internal", 
    Justification = "API Controllers must be public for ASP.NET Core MVC routing to work correctly", 
    Scope = "namespaceanddescendants", 
    Target = "~N:easyJet.Holidays.Api.Controllers")]