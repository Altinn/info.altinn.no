update umbracoPropertyData set varcharValue = 'https://af.tt02.altinn.no/' where id in (select pd.id from umbracoPropertyData pd, umbracoContentVersion cv
where pd.propertyTypeId = 184
and pd.versionId = cv.id
and cv.[current] = 1);

update umbracoPropertyData set varcharValue = 'https://am.ui.tt02.altinn.no/' where id in (select pd.id from umbracoPropertyData pd, umbracoContentVersion cv
where pd.propertyTypeId = 186
and pd.versionId = cv.id
and cv.[current] = 1); 

update umbracoPropertyData set varcharValue = 'test.support@altinn.no' where id in (select pd.id from umbracoPropertyData pd, umbracoContentVersion cv
where pd.propertyTypeId = 102
and pd.versionId = cv.id
and cv.nodeId = 11212
and cv.[current] = 1);

update umbracoPropertyData set varcharValue = 'altinn.starteogdrive@brreg.no' where id in (select pd.id from umbracoPropertyData pd, umbracoContentVersion cv
where pd.propertyTypeId = 102
and pd.versionId = cv.id
and cv.nodeId = 11211
and cv.[current] = 1);

-- Keep deeplink and shallowLink for forms
UPDATE pd
SET pd.varcharValue = pdb.varcharValue
FROM 
    umbracoPropertyData pd, 
    umbracoPropertyData [umbraco-backup].pdb,
    umbracoContentVersion cv,
    umbracoContentVersion [umbraco-backup].cvb
WHERE
    cvb.nodeId = cv.nodeId
    AND cv.[current] = 1
    AND cvb.[current] = 1
    AND pd.versionId = cv.id
    AND pdb.versionId = cvb.id
    AND (pd.languageId = pdb.languageId or (pd.languageId is null and pdb.languageId is null))
    AND pd.propertyTypeId in (324, 325)
    AND pdb.propertyTypeId = pd.propertyTypeId;