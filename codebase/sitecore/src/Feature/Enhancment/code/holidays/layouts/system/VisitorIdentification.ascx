<%@ Control Language="c#" AutoEventWireup="true" TargetSchema="http://schemas.microsoft.com/intellisense/ie5" %>

<%  if (Sitecore.Context.Diagnostics.Tracing || Sitecore.Context.Diagnostics.Profiling)
    {%>
<!-- Visitor identification is disabled because debugging is active. -->
<%
    }
    else if (Sitecore.Analytics.Tracker.IsActive && Sitecore.Analytics.Core.ContactClassification.IsAutoDetectedRobot(Sitecore.Analytics.Tracker.Current.Session.Contact.System.Classification))
    {
      string virtualFolder = "/";
      if (Sitecore.Context.Site != null && !Sitecore.Context.Site.SiteInfo.IsInternal)
      {
        virtualFolder = Sitecore.Context.Site.VirtualFolder;
      }
%>
<meta name="VIcurrentDateTime" content="<%: DateTime.UtcNow.Ticks %>" />
<meta name="VirtualFolder" content="<%: virtualFolder %>" />
<script type="text/javascript" src="/layouts/system/VisitorIdentification.js"></script>
<%
    }
%>
