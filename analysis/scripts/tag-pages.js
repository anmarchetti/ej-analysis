import neo4j from "neo4j-driver";
import { Command } from "commander";
const program = new Command();

program
  .version("1.0.0", "-v, --version")
  .usage("[OPTIONS]...")
  .option("-u, --user <value>", "Username of neo4j database", "neo4j")
  .option("-p, --password <value>", "Password of neo4j database", "neo4j")
  .option("-r, --uri <value>", "URI of neo4j database", "bolt://localhost:7687")
  .option("-t, --tagValue <value>", "tag value to apply")
  .option("-z, --tagAttr <value>", "tag name to apply")
  .option("-k, --pagelist <value>", "page list in which apply the tag")
  .option("-l, --lang <value>", "tag name to apply")
  .parse(process.argv);

const options = program.opts();
// Set up Neo4j connection
const uri = options.uri;
const user = options.user;
const password = options.password;
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
const tagValue = options.tagValue;
const tagAttr = options.tagAttr;
const lang = options.lang;
const list = options.pagelist;
const session = driver.session();
let pageList = JSON.parse(list);
console.log(pageList);
// Lista delle pagine da aggiornare

if (!list) {
  pageList = [
    `/sitecore/content/EasyJet/Holidays/Home/Booking/My_Bookings - en`,
    `/sitecore/content/EasyJet/Holidays/Home/Booking/My_Booking - en`,
    `/sitecore/content/EasyJet/Holidays/Home/Booking/Change Dates - en`,
    `/sitecore/content/EasyJet/Holidays/Home/Booking/Change Flight - en`,
    `/sitecore/content/EasyJet/Holidays/Home/Booking/Change Room And Board - en`,
    `/sitecore/content/EasyJet/Holidays/Home/Booking/Change Transfer - en`,
    `/sitecore/content/EasyJet/Holidays/Home/Booking/Amend Payment - en`,
    `/sitecore/content/EasyJet/Holidays/Home/Booking/Confirmation - en`,
  ];
}

console.log(tagAttr, "tagAttr");
async function updatePages() {
  try {
    const result = await session.run(
      `MATCH (p:Page) WHERE p.name IN $pageList SET p.${tagAttr} = ['${tagValue}'] RETURN p`,
      { pageList: pageList }
    );

    result.records.forEach((record) => {
      console.log(`Updated: ${record.get("p").properties.name}`);
    });

    const propagationResult = await session.run(
      `MATCH p=(page:Page{${tagAttr}: ['${tagValue}'], lang: "en"})-[:HAS_TEMPLATE]->(t:Template)-[:CONTAINS]->(s:Slot)-[:CONTAINS]->(w:Widget)-[:HAS_RENDERING]->(r:Rendering)-[:IMPORTS]->(comp:Component)
        WITH DISTINCT page, t, s, w, r, comp
        WITH [page, t, s, w, r, comp] AS nodesList
        UNWIND nodesList AS node
        SET node.${tagAttr} = ['${tagValue}']
        RETURN count(DISTINCT node) AS updatedNodes`
    );

    const propagateToAPI = await session.run(
      `MATCH (r:Rendering {${tagAttr}: ['${tagValue}']})-[:HAS_FUNCTION]->(f1)-[*]->(depF)-[:CALLS_API]->(api:APIInterface)-[:INTERFACE_OF]->(api:API)
        RETURN DISTINCT api.name`
    );
  } catch (error) {
    console.error("Error updating pages:", error);
  } finally {
    await session.close();
    await driver.close();
  }
}

updatePages();
