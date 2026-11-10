/*
  Replace legacy links from the old CMS (#710)

    href="~/link/{hex}.aspx..."  ->  type="document" href="/{localLink:{guid}}..."

  Plain REPLACEs, one round per legacy GUID, in all versions of all pages (drafts too).
  Query strings and fragments are kept, since only the start of the href is replaced.
  type is put before href so it can be added without finding the end of the tag; Umbraco
  only looks for type="document"/"media", so a remaining type="external" is ignored.

  The HTML is stored inside JSON, so a quote can be ", \" or backslash-u0022 (once or
  twice escaped). Each replacement is done for all four.

  HOW TO RUN
    1. Back up the database.
    2. Run as is: nothing is saved, only the report is shown.
    3. Set @Apply = 1 and run again.
    4. Backoffice: Settings > Published Status > Rebuild Database Cache, then restart Umbraco.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @Apply bit = 0;

DECLARE @bs nchar(1) = NCHAR(92);  -- backslash, as some clients mangle backslash-u in literals
DECLARE @quotes TABLE (q nvarchar(10));
INSERT INTO @quotes VALUES (N'"'), (@bs + N'"'), (@bs + N'u0022'), (@bs + @bs + N'u0022');

-- Pages redirected in #699 (astro-infoportal/src/pages/[...slug].astro): old key -> new page.
-- Used when the old page isn't published.
DECLARE @redirects TABLE (oldKey uniqueidentifier, newKey uniqueidentifier);
INSERT INTO @redirects VALUES
  ('B9DCB0CA-2342-40B7-848E-09831F3BBC26', '80643ABF-4F74-483E-A884-14A431278036'), -- /hjelp/ny-tilgangsstyring/
  ('89EE8D8A-F3DB-4B2D-B7EC-11E33C78714F', '34173B58-F9E9-49E4-BFE9-BB63E5337CF4'), -- /hjelp/ny-innboks-beta/
  ('D3A1D3C5-B102-43C8-8522-3D99D27B7BAD', '713C4332-8039-4B28-874B-07F46A33F77E'), -- /hjelp/systemtilgang/
  ('CFD06368-21FD-4FA0-8621-6A9665640A0F', '072F021E-17E4-4856-BCF6-0A7E16BBAF36'), -- /hjelp/innlogging/
  ('2CE1A67C-2C6C-40BA-929D-84F8A3013426', '072F021E-17E4-4856-BCF6-0A7E16BBAF36'), -- /hjelp/innlogging/
  ('6EB9787F-B889-4452-A505-B05EF9ACC8D9', '2A8DABCA-35A1-448F-A112-F24724342216'), -- /hjelp/
  ('79519E28-7698-411C-A554-C361003866CE', '80643ABF-4F74-483E-A884-14A431278036'), -- /hjelp/ny-tilgangsstyring/
  ('5B1E2E22-38DD-4D3F-82F7-CB11996949F9', 'FA3D5585-C3BA-4163-BF65-5A2160895F92'); -- /hjelp/innlogging/slik-logger-du-inn-i-altinn/

IF EXISTS (SELECT 1 FROM @redirects r WHERE NOT EXISTS (SELECT 1 FROM umbracoNode n WHERE n.uniqueId = r.newKey))
BEGIN
  SELECT r.* FROM @redirects r WHERE NOT EXISTS (SELECT 1 FROM umbracoNode n WHERE n.uniqueId = r.newKey);
  RAISERROR('Redirect target pages not found in this database. Update @redirects.', 16, 1);
  RETURN;
END;

-- Work on a copy of the values with legacy links, so each REPLACE doesn't scan the whole table.
-- Neutral collation: in Danish_Norwegian "aa" counts as "å", so GUIDs containing "aa" wouldn't match.
SELECT pd.id, cv.nodeId, CAST(CASE WHEN cv.[current] = 1 OR dv.published = 1 THEN 1 ELSE 0 END AS bit) AS isLive,
       pd.textValue COLLATE Latin1_General_100_CI_AS AS t
INTO #rows
FROM umbracoPropertyData pd
JOIN umbracoContentVersion cv ON cv.id = pd.versionId
LEFT JOIN umbracoDocumentVersion dv ON dv.id = cv.id
WHERE pd.textValue LIKE N'%~/link/%';

-- Legacy GUIDs used in content
WITH occ AS (
  SELECT t, CHARINDEX(N'~/link/', t) AS pos FROM #rows
  UNION ALL
  SELECT t, CHARINDEX(N'~/link/', t, pos + 1) FROM occ WHERE CHARINDEX(N'~/link/', t, pos + 1) > 0
)
SELECT DISTINCT LOWER(SUBSTRING(t, pos + 7, 32)) AS hex
INTO #legacy
FROM occ
WHERE SUBSTRING(t, pos + 39, 5) = N'.aspx'
OPTION (MAXRECURSION 0);

-- Target per legacy GUID: the new page if redirected, otherwise the page/media with the same key
SELECT l.hex,
       LOWER(CONVERT(nvarchar(36), COALESCE(r.newKey, n.uniqueId))) AS newKey,
       CASE WHEN r.newKey IS NULL AND n.nodeObjectType = 'B796F64C-1F99-4FFB-B886-4BF4BC011A9C' THEN 'media' ELSE 'document' END AS kind
INTO #map
FROM #legacy l
CROSS APPLY (SELECT TRY_CONVERT(uniqueidentifier, STUFF(STUFF(STUFF(STUFF(l.hex, 21, 0, '-'), 17, 0, '-'), 13, 0, '-'), 9, 0, '-')) AS oldKey) k
LEFT JOIN umbracoNode n ON n.uniqueId = k.oldKey AND n.trashed = 0
LEFT JOIN umbracoDocument d ON d.nodeId = n.id
LEFT JOIN @redirects r ON r.oldKey = k.oldKey AND COALESCE(d.published, 0) = 0;

-- Legacy link appended to a full URL
UPDATE #rows
SET t = REPLACE(t, N'https://info.altinn.no/nn/skjemaoversikt/statistisk-sentralbyra/lokale-folkeavstemninger/~/link/', N'~/link/');

DECLARE @hex nvarchar(32), @key nvarchar(36), @kind nvarchar(8), @q nvarchar(10);
DECLARE links CURSOR LOCAL FAST_FORWARD FOR
  SELECT m.hex, m.newKey, m.kind, q.q FROM #map m CROSS JOIN @quotes q WHERE m.newKey IS NOT NULL;
OPEN links;
FETCH NEXT FROM links INTO @hex, @key, @kind, @q;

WHILE @@FETCH_STATUS = 0
BEGIN
  UPDATE #rows
  SET t = REPLACE(REPLACE(t,
        -- the link
        N'href=' + @q + N'~/link/' + @hex + N'.aspx',
        N'type=' + @q + @kind + @q + N' href=' + @q + N'/{localLink:' + @key + N'}'),
        -- tooltip showing just the legacy URL: removed (tooltips with a query string are left)
        N' title=' + @q + N'~/link/' + @hex + N'.aspx' + @q,
        N'')
  WHERE t LIKE N'%~/link/' + @hex + N'.aspx%';

  FETCH NEXT FROM links INTO @hex, @key, @kind, @q;
END;

CLOSE links;
DEALLOCATE links;

-- Report
-- Unresolved links (target doesn't exist), and tooltips (title) with a query string
SELECT 'Legacy links left' AS report, n.text AS page, n.uniqueId AS pageKey,
       SUBSTRING(r.t, CHARINDEX(N'~/link/', r.t) - 14, 58) AS link
FROM #rows r JOIN umbracoNode n ON n.id = r.nodeId
WHERE r.isLive = 1 AND r.t LIKE N'%~/link/%'
UNION ALL
SELECT 'Legacy links left (text field)', n.text, n.uniqueId, pd.varcharValue COLLATE Latin1_General_100_CI_AS
FROM umbracoPropertyData pd
JOIN umbracoContentVersion cv ON cv.id = pd.versionId AND cv.[current] = 1
JOIN umbracoNode n ON n.id = cv.nodeId
WHERE pd.varcharValue LIKE N'%~/link/%';

SELECT COUNT(*) AS changedValues, COUNT(DISTINCT nodeId) AS pages,
       SUM(CASE WHEN ISJSON(t) = 0 THEN 1 ELSE 0 END) AS invalidJson   -- must be 0
FROM #rows r WHERE r.t <> (SELECT textValue FROM umbracoPropertyData WHERE id = r.id) COLLATE Latin1_General_100_BIN2;

IF @Apply = 0
BEGIN
  PRINT 'Dry run: nothing was saved. Set @Apply = 1 to save the changes.';
  RETURN;
END;

BEGIN TRANSACTION;

UPDATE pd SET textValue = r.t
FROM umbracoPropertyData pd JOIN #rows r ON r.id = pd.id
WHERE pd.textValue <> r.t COLLATE Latin1_General_100_BIN2;

-- References, so editors are warned when unpublishing a page that is linked to
INSERT INTO umbracoRelation (parentId, childId, relType, [datetime], comment)
SELECT DISTINCT r.nodeId, n.id, rt.id, GETDATE(), ''
FROM #rows r
JOIN #map m ON r.t LIKE (N'%/{localLink:' + m.newKey + N'}%') COLLATE Latin1_General_100_CI_AS
JOIN umbracoNode n ON n.uniqueId = m.newKey
JOIN umbracoRelationType rt ON rt.alias = CASE m.kind WHEN 'media' THEN 'umbMedia' ELSE 'umbDocument' END
WHERE r.isLive = 1
  AND r.nodeId <> n.id
  AND NOT EXISTS (SELECT 1 FROM umbracoRelation x WHERE x.parentId = r.nodeId AND x.childId = n.id AND x.relType = rt.id);

COMMIT TRANSACTION;

PRINT 'Done. Rebuild the published cache: Settings > Published Status > Rebuild Database Cache, then restart Umbraco.';
