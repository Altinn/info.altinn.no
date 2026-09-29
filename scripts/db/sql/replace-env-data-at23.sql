update umbracoPropertyData set varcharValue = 'https://af.at23.altinn.cloud/' where id in (select pd.id from umbracoPropertyData pd, umbracoContentVersion cv
where pd.propertyTypeId = 184
and pd.versionId = cv.id
and cv.[current] = 1);

update umbracoPropertyData set varcharValue = 'https://am.ui.at23.altinn.cloud/' where id in (select pd.id from umbracoPropertyData pd, umbracoContentVersion cv
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