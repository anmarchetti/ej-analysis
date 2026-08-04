import neo4j from "neo4j-driver";
import { Command } from "commander";
const program = new Command();

program
  .version("1.0.0", "-v, --version")
  .usage("[OPTIONS]...")
  .option("-u, --user <value>", "Username of neo4j database", "neo4j")
  .option("-p, --password <value>", "Password of neo4j database", "neo4j")
  .option("-r, --uri <value>", "URI of neo4j database", "bolt://localhost:7687")
  .option("-tag, --tagType <value>", "tag type to propagate foreward")
  .parse(process.argv);

const options = program.opts();

// Set up Neo4j connection
const uri = options.uri;
const user = options.user;
const password = options.password;
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
const tagType = options.tagType;

const session = driver.session();

const results = await session.run(`
    MATCH (page:Page)-[:HAS_TEMPLATE]->(t:Template)
    MATCH (t:Template)-[*0..10]->(depW)
    MATCH (depW)-[:HAS_RENDERING]->(r:Rendering)
    WITH page, t, depW, r.${tagType} AS allRenderingFunctionalTags
    UNWIND allRenderingFunctionalTags AS Tags
    WITH DISTINCT Tags, page, t, depW
    WITH COLLECT(DISTINCT Tags) AS uniqueTags, page, t, depW, [page, t, depW] AS nodesList
    FOREACH (node IN nodesList | 
        SET node.${tagType} = CASE
        WHEN node.${tagType} IS NULL THEN 
        CASE WHEN uniqueTags IS NULL THEN [] ELSE uniqueTags END
        ELSE REDUCE(s = [], x IN node.${tagType} + COALESCE(uniqueTags, []) | CASE WHEN x IN s THEN s ELSE s + x END)
    END)
`);

console.log(`Generated tags ${results.records.length}.`);

await driver.close();
