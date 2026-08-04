<<<<<<< HEAD
SELECT c.ContactId INTO TempContacts FROM [xdb_collection].[Contacts] c 
	WHERE ContactId Not IN (SELECT contactId FROM [xdb_collection].[Interactions] i where i.EndDateTime > DATEADD(month, -10, GetDate()))
	AND c.ContactId IN (SELECT DISTINCT contactId
			  FROM [xdb_collection].[ContactIdentifiers]
			  WHERE IdentifierType = 0 
			  AND ContactId NOT IN (
						SELECT contactId
						FROM [xdb_collection].[ContactIdentifiers]
						WHERE IdentifierType = 1
					       )
			)

GO
DELETE FROM [xdb_collection].[ContactFacets] WHERE ContactId IN (SELECT contactId FROM TempContacts)
GO

DELETE FROM [xdb_collection].[ContactIdentifiersIndex] WHERE ContactId IN (SELECT contactId FROM TempContacts)
GO 

DELETE FROM [xdb_collection].[InteractionFacets] WHERE ContactId IN (SELECT contactId FROM TempContacts)
GO

DELETE FROM [xdb_collection].[Interactions] WHERE ContactId IN (SELECT contactId FROM TempContacts)

GO

DELETE FROM [xdb_collection].[ContactIdentifiers] WHERE ContactId IN (SELECT contactId FROM TempContacts)
GO
  
DELETE FROM [xdb_collection].[Contacts] WHERE ContactId IN (SELECT contactId FROM TempContacts)
GO

DELETE FROM [xdb_collection].[DeviceProfiles] WHERE LastKnownContactId IN (select contactId from TempContacts)
GO

Drop Table TempContacts



=======
DECLARE @BatchSize        INT = 1000
DECLARE @DeadLine        DateTime2 = DATEADD(month, -1, GetDate())

PRINT 'Copy considered contacts to local variable...' 
SELECT  c.ContactId INTO #TempContacts FROM [xdb_collection].[Contacts] c 
WHERE Not EXISTS 
(
	SELECT contactId FROM [xdb_collection].[Interactions] i where
	i.ContactId = c.ContactId and
	i.EndDateTime > @DeadLine
) 
and NOT Exists 
(
	SELECT contactId
	FROM [xdb_collection].[ContactIdentifiers] ci
	WHERE IdentifierType = 1 and ci.ContactId = c.ContactId 
)
PRINT 'Clearing Data...' 
WHILE 1=1
BEGIN
	IF EXISTS (select contactId from #TempContacts) 
		BEGIN

			DELETE FROM [xdb_collection].[ContactFacets] WHERE ContactId IN (SELECT top (@BatchSize) contactId FROM #TempContacts)

			DELETE FROM [xdb_collection].[ContactIdentifiersIndex] WHERE ContactId IN (SELECT top (@BatchSize) contactId FROM #TempContacts)

			DELETE FROM [xdb_collection].[InteractionFacets] WHERE ContactId IN (SELECT top (@BatchSize) contactId FROM #TempContacts)

			DELETE FROM [xdb_collection].[Interactions] WHERE ContactId IN (SELECT top (@BatchSize) contactId FROM #TempContacts)

			DELETE FROM [xdb_collection].[ContactIdentifiers] WHERE ContactId IN (SELECT top (@BatchSize) contactId FROM #TempContacts)

			DELETE FROM [xdb_collection].[Contacts] WHERE ContactId IN (SELECT top (@BatchSize) contactId FROM #TempContacts)
 
			DELETE FROM [xdb_collection].[DeviceProfiles] WHERE LastKnownContactId IN (select top (@BatchSize) contactId from #TempContacts)

			DELETE top (@BatchSize) FROM #TempContacts

		END
	ELSE
		BEGIN
			PRINT 'Clearing finished...' 
			Drop Table #TempContacts
			BREAK;
		END
END
>>>>>>> eee2eed273 (Cleanup)
