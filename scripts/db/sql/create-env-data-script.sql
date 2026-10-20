SET NOCOUNT ON;

select '-- robots.txt, llms.txt and security.txt';
select 'update pd set textValue = ''' || replace(pd.textValue, CHAR(10), '\n') || ''' from umbracoPropertyData pd, umbracoContentVersion cv, umbracoDocumentVersion dv where pd.versionId = cv.id and dv.id = cv.id and dv.published = 1 and cv.nodeId = ' || cv.nodeId || ' and pd.propertyTypeId = ' || pd.propertyTypeId || ';'
from
    umbracoPropertyData pd,
    umbracoContentVersion cv,
    umbracoDocumentVersion dv
where dv.published = 1
and pd.versionId = cv.id
and dv.id = cv.id
and pd.propertyTypeId in (470, 471, 472);

select CHAR(10) || '-- support email';
select 'update pd set varcharValue = ''' || pd.varcharValue || ''' from umbracoPropertyData pd, umbracoContentVersion cv, umbracoDocumentVersion dv where pd.versionId = cv.id and dv.published = 1 and dv.id = cv.id and cv.nodeId = ' || cv.nodeId || ' and pd.propertyTypeId = ' || pd.propertyTypeId || ';'
from
    umbracoPropertyData pd,
    umbracoContentVersion cv,
    umbracoDocumentVersion dv
where pd.propertyTypeId = 102
and pd.versionId = cv.id
and cv.nodeId = 11212
and dv.id = cv.id
and dv.published = 1;

select CHAR(10) || '-- Keep shallowLink for forms';
select 'update pd set varcharValue = ''' || pd.varcharValue || ''' from umbracoPropertyData pd, umbracoContentVersion cv, umbracoDocumentVersion dv where pd.versionId = cv.id and dv.published = 1 and cv.nodeId = ' || cv.nodeId || ' and dv.id = cv.id and pd.languageId = ' || pd.languageId || ' and pd.propertyTypeId = ' || pd.propertyTypeId || ';'
from
    umbracoPropertyData pd,
    umbracoContentVersion cv,
    umbracoDocumentVersion dv
where dv.published = 1
and pd.versionId = cv.id
and dv.id = cv.id
and pd.propertyTypeId = 325;

select CHAR(10) || '-- Keep deeplink for forms';
select 'update pd set varcharValue = ''' || pd.varcharValue || ''' from umbracoPropertyData pd, umbracoContentVersion cv, umbracoDocuementVersion dv where dv.published = 1 and pd.versionId = cv.id and dv.id = cv.id and cv.nodeId = ' || cv.nodeId || ' and pd.propertyTypeId = ' || pd.propertyTypeId || ';'
from
    umbracoPropertyData pd,
    umbracoContentVersion cv,
    umbracoDocumentVersion dv
where dv.published = 1
and pd.versionId = cv.id
and dv.id = cv.id
and pd.propertyTypeId = 324;
