import neo4j from "neo4j-driver";
import { Command } from "commander";
const program = new Command();

program
  .version("1.0.0", "-v, --version")
  .usage("[OPTIONS]...")
  .option("-c, --clean", "Clean tags before running")
  .option("-u, --user <value>", "Username of neo4j database", "neo4j")
  .option("-p, --password <value>", "Password of neo4j database", "neo4j")
  .option("-r, --uri <value>", "URI of neo4j database", "bolt://localhost:7687")
  .parse(process.argv);

const options = program.opts();

// Set up Neo4j connection
const uri = options.uri;
const user = options.user;
const password = options.password;
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

const session = driver.session();

// remove all tags
if (options.clean) {
  const clean = await session.run(`
        MATCH (p)
        REMOVE p.tags
    `);
}

async function propagateTag() {
  //per ogni rendering devo fare questa query
  const result = await session.run(
    `MATCH (r:Rendering)
        WITH 'frontendTags' AS newTag
        MATCH (w:Widget)-[:HAS_RENDERING]->(r)
        MATCH (sl:Slot)-[:CONTAINS]->(w)
        MATCH (t:Template)-[:CONTAINS]->(sl)
        MATCH (t)-[:IS_IMPLEMENTED]->(c:Component)
        MATCH (page:Page)-[:HAS_TEMPLATE]->(t)
        SET 
        page.frontendTags = CASE
                    WHEN page.frontendTags IS NULL THEN [newTag]
                    ELSE REDUCE(s = [], x IN page.frontendTags + newTag | CASE WHEN x IN s THEN s ELSE s + x END)
              END,
            t.frontendTags = CASE
                    WHEN t.frontendTags IS NULL THEN [newTag]
                    ELSE REDUCE(s = [], x IN t.frontendTags + newTag | CASE WHEN x IN s THEN s ELSE s + x END)
              END,
            c.frontendTags = CASE
                WHEN c.frontendTags IS NULL THEN [newTag]
                ELSE REDUCE(s = [], x IN c.frontendTags + newTag | CASE WHEN x IN s THEN s ELSE s + x END)
              END,
            sl.frontendTags = CASE
                WHEN sl.frontendTags IS NULL THEN [newTag]
                ELSE REDUCE(s = [], x IN sl.frontendTags + newTag | CASE WHEN x IN s THEN s ELSE s + x END)
              END
            w.frontendTags = CASE
                WHEN w.frontendTags IS NULL THEN [newTag]
                ELSE REDUCE(s = [], x IN w.frontendTags + newTag | CASE WHEN x IN s THEN s ELSE s + x END)
              END
          RETURN page,t,w, c, sl`
  );
  console.log(`Generated tags: ${result.records.length}`);
}

propagateTag()
  .then(() => {
    console
      .log(`Data created successfully`)
      .catch(console.error)
      .finally(() => driver.close());
  })
  .catch(() => {
    console.error;
    driver.close();
  });
