//Trovare gli slots e i rendering a partire da una pagina
MATCH p=(pg:Page {name:"{pageName}"})-[r:HAS_TEMPLATE]->(t)-[r2:CONTAINS]->()-[r3:HAS_RENDERING]->() RETURN p

//Trova gli archi a partire da rendering
MATCH p=(re:Rendering {name: "ViewBooking.tsx"})-[r:HAS_FUNCTION*]->(c)-[ca:CALLS*..9]->(f:Function)<-[rr:HAS_FUNCTION]-(s:Service) RETURN p

// trova path da rendering ad api
MATCH p=(re:Rendering {name: "ViewBooking.tsx"})-[r:HAS_FUNCTION*]->(c)-[ca:CALLS*..10]->(f:Function {owner: "endpoints.ts"})-[ap:CALLS_API]->() RETURN p

// da store ad api
MATCH p=(s:Store {name:"HolidayCreditStore.ts"})-[r:HAS_FUNCTION]->(c)-[ca:CALLS*..10]->(f:Function {owner: "endpoints.ts"})-[ap:CALLS_API]->(a:API) return p

MATCH p=(page:Page)-[*..3]-(re:Rendering)-[r:HAS_FUNCTION]->(c)-[ca:CALLS*..6]->(f:Function {owner: "endpoints.ts"})-[ap:CALLS_API]->(a:API) 
RETURN page.webUrl AS WebPage, re.name AS LayoutComponent,  a.api AS CalledAPI LIMIT 10

MATCH p=(page:Page {webUrl: "/sustainability", lang:"en"})-[*..5]->(re:Widget {webUrl: "/sustainability", lang:"en"})-[:HAS_RENDERING]-(rendering:Rendering)
OPTIONAL MATCH a=(rendering)-[r:HAS_FUNCTION*]->(c)-[ca:CALLS*..6]->(f:Function {owner: "endpoints.ts"})-[ap:CALLS_API*]->(api: APIInterface)
RETURN DISTINCT p,a

// best query
MATCH p=(page:Page {webUrl: "/booking/my_booking", lang:"en"})-[:HAS_TEMPLATE]-(t:Template)-[*..5]->(re:Widget {webUrl: "/booking/my_booking", lang:"en"})-[:HAS_RENDERING]-(rendering:Rendering)
OPTIONAL MATCH a=(rendering)-[r:HAS_FUNCTION*]->(c)-[ca:CALLS*..6]->(f:Function {owner: "endpoints.ts"})-[ap:CALLS_API*]->(api: APIInterface)
OPTIONAL MATCH b=(t)-[:IS_IMPLEMENTED]->(c2:Component {name:"Layout.tsx"})-[:HAS_FUNCTION]-()-[ca2:CALLS*..6]->(f2:Function {owner: "endpoints.ts"})-[ap2:CALLS_API*]->(api2: APIInterface)
return b,a,p

MATCH p=(page:Page {webUrl: "/booking/my_booking", lang:"en"})-[*..15]-(api: APIInterface)

//Propaga i tags forthward
MATCH (page:Page)-[:HAS_TEMPLATE]->(t:Template)-[:CONTAINS]->(s:Slot)-[:CONTAINS] ->(w:Widget)-[:HAS_RENDERING]->(r:Rendering)
WITH page, COLLECT(distinct r.tags) AS renderingTags
SET page.tags = REDUCE(s = [], tags IN renderingTags | s + tags)

//Propagazione backward
MATCH (r:Rendering)-[:IMPORT|HAS_FUNCTION|CALLS|CALLS_API*]->(api:API)
WITH r.tags AS renderingTags, api
UNWIND renderingTags AS tag
WITH COLLECT(DISTINCT tag) AS uniqueTags, api
SET api.tags = uniqueTags
RETURN api

//query confronto tag IAN AmendNoTransfersPopup  api frontendTags
MATCH (n:APIInterface)
WHERE n.name = 'account/customer-details' OR
n.name = 'account/status' OR
n.name ='amend/alternative-transfers/price'OR
n.name="amend/amend-date/info" OR
n.name="amend/amend-dates/summary" OR
n.name="amend/amend-dates/transfer" OR
n.name="booking" OR
n.name="booking/list" OR
n.name="credit/me" OR
n.name="excursions" OR
n.name="seats" OR
n.name="shortlist/status"

 return n.name, n.frontendTags

 //query pagine per FunctionalTag
   MATCH (page:Page)-[:HAS_TEMPLATE]->(t:Template)
WHERE '$FunctionalTag' in page.functionalTags
MATCH (t)-[*0..15]->(depW)
MATCH (depW)-[:HAS_RENDERING]->(r:Rendering)
MATCH (r)-[:HAS_FUNCTION]->(f:Function)
MATCH (f)-[*0..5]->(deepF)
RETURN DISTINCT page.name, page.functionalTags