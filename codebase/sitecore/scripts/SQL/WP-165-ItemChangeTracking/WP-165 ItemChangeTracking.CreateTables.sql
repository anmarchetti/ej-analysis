SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[easyJet.Feature.ChangeTracking.FieldChanges](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[Date] [datetime] NOT NULL,
	[ItemId] [uniqueidentifier] NOT NULL,
	[TemplateId] [uniqueidentifier] NOT NULL,
	[Language] [nvarchar](50) NOT NULL,
	[Version] [int] NOT NULL,
	[FieldId] [uniqueidentifier] NOT NULL,
	[Value] [nvarchar](max) NULL,
	[Author] [nvarchar](255) NOT NULL,
	[IsLatestVersion] [bit] NOT NULL,
	[OldValue] [nvarchar](max) NULL,
	[Path] [nvarchar](512) NULL,
 CONSTRAINT [PK_easyJet.Feature.ChangeTracking.ChangeTracking] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

CREATE NONCLUSTERED INDEX [IX_easyJet.Feature.ChangeTracking.FieldChanges_ItemId] ON [dbo].[easyJet.Feature.ChangeTracking.FieldChanges]
(
	[ItemId] ASC,
	[Language] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO

CREATE NONCLUSTERED INDEX [IX_easyJet.Feature.ChangeTracking.FieldChanges_TemplateId] ON [dbo].[easyJet.Feature.ChangeTracking.FieldChanges]
(
	[TemplateId] ASC,
	[Language] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO


CREATE TABLE [dbo].[easyJet.Feature.ChangeTracking.ItemChanges](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[Date] [datetime] NOT NULL,
	[ItemId] [uniqueidentifier] NOT NULL,
	[TemplateId] [uniqueidentifier] NOT NULL,
	[ParentItemId] [uniqueidentifier] NOT NULL,
	[Language] [nvarchar](50) NOT NULL,
	[Version] [int] NOT NULL,
	[Action] [char](1) NOT NULL,
	[Author] [nvarchar](255) NOT NULL,
	[IsLatestVersion] [bit] NOT NULL,
	[Path] [nvarchar](512) NULL,
	[OldPath] [nvarchar](512) NULL,
	[OldParentItemId] [uniqueidentifier] NULL,
 CONSTRAINT [PK_easyJet.Feature.ChangeTracking.ItemChanges] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
/****** Object:  Index [IX_easyJet.Feature.ChangeTracking.ItemChanges_ItemId]    Script Date: 17.11.2017 13:00:14 ******/
CREATE NONCLUSTERED INDEX [IX_easyJet.Feature.ChangeTracking.ItemChanges_ItemId] ON [dbo].[easyJet.Feature.ChangeTracking.ItemChanges]
(
	[ItemId] ASC,
	[Language] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO

CREATE NONCLUSTERED INDEX [IX_easyJet.Feature.ChangeTracking.ItemChanges_TemplateId] ON [dbo].[easyJet.Feature.ChangeTracking.ItemChanges]
(
	[TemplateId] ASC,
	[Language] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO




