import neo4j from "neo4j-driver";
import { Command } from "commander";
const program = new Command();

program
  .version("1.0.0", "-v, --version")
  .usage("[OPTIONS]...")
  .option("-c, --clean", "Clean tags before running")
  .option("-l, --log", "Clean tags before running")
  .option("-u, --user <value>", "Username of neo4j database", "neo4j")
  .option("-p, --password <value>", "Password of neo4j database", "neo4j")
  .option("-r, --uri <value>", "URI of neo4j database", "bolt://localhost:7687")
  .option("-t, --tagType <value>", "tag type to propagate")
  .option(
    "-s, --stepNumber <value>",
    "the step to propagate the tagging, could be: 1 -  From Functions to Functions and Service, 2 - From Functions to Rendering, 3 - From Rendering to Components"
  )
  .parse(process.argv);

const options = program.opts();

// Set up Neo4j connection
const uri = options.uri;
const user = options.user;
const password = options.password;
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
const tagType = options.tagType;
const step = options.stepNumber;
const log = options.log;

const session = driver.session();

// remove all tags
if (options.clean) {
  const clean = await session.run(`
        MATCH (p)
        REMOVE p.${tagType}
    `);
}

let results;
let fResults;
let tResults;
let cResults;
let pResults;

if (log) {
  console.log(options.tagType);
  console.log(options.stepNumber);
}

switch (step) {
  case "1":
    fResults = await session.run(`
    MATCH (s:Service)-[:HAS_FUNCTION]->(f2:Function)
    MATCH (f2)-[:CALLS]->(deepF)
    MATCH (deepF)-[:CALLS_API]->(api:APIInterface)
    WITH api.${tagType} AS apiTags, f2, deepF
    UNWIND apiTags AS tag
    WITH DISTINCT tag, f2,deepF
    WITH COLLECT(DISTINCT tag) AS uniqueTags, f2, deepF, [f2, deepF] AS nodesList
    FOREACH (node IN nodesList |
        SET node.${tagType} = CASE
        WHEN node.${tagType} IS NULL THEN
        CASE WHEN uniqueTags IS NULL THEN [] ELSE uniqueTags END
        ELSE REDUCE(s = [], x IN node.${tagType} + COALESCE(uniqueTags, []) | CASE WHEN x IN s THEN s ELSE s + x END)
    END
    )
    RETURN uniqueTags
`);
    console.log(`Generated tags: ${fResults.records.length}`);
    break;
  case "2":
    results = await session.run(`
    MATCH (r:Rendering)-[:HAS_FUNCTION*]->(f1)-[:CALLS*0..150]->(fx)-[:CALLS*0..150]->(f2:Function)
    WITH f2.${tagType} AS apiTags, f1, f2,fx
    UNWIND apiTags AS tag
    WITH DISTINCT tag, f1, f2, fx
    WITH COLLECT(DISTINCT tag) AS uniqueTags, f1, f2, fx, [ f1, f2, fx] AS nodesList
    FOREACH (node IN nodesList |
        SET node.${tagType} = CASE
        WHEN node.${tagType} IS NULL THEN
        CASE WHEN uniqueTags IS NULL THEN [] ELSE uniqueTags END
        ELSE REDUCE(s = [], x IN node.${tagType} + COALESCE(uniqueTags, []) | CASE WHEN x IN s THEN s ELSE s + x END)
  END
    )
    RETURN uniqueTags
`);
    console.log(`Generated tags: ${results.records.length}`);
    break;
  case "3":
    pResults = await session.run(`
    MATCH (page:Page)-[:HAS_TEMPLATE]->(t:Template)
    MATCH (t:Template)-[*0..10]->(depW)
    MATCH (depW)-[:HAS_RENDERING]->(r:Rendering)
    MATCH (r)-[:HAS_FUNCTION]->(f:Function)
    MATCH (f)-[*0..3]->(deepF)
    WITH f.${tagType} AS renderingTags, page, t, depW, r, f, deepF
    UNWIND renderingTags AS tag
      WITH DISTINCT tag, page, t, depW, r, f, deepF
      WITH COLLECT(DISTINCT tag) AS uniqueTags, page, t, depW, r, f,deepF, [page, t, depW, r, f] AS nodesList
      FOREACH (node IN nodesList |
        SET node.${tagType} = CASE
        WHEN node.${tagType} IS NULL THEN
        CASE WHEN uniqueTags IS NULL THEN [] ELSE uniqueTags END
        ELSE REDUCE(s = [], x IN node.${tagType} + COALESCE(uniqueTags, []) | CASE WHEN x IN s THEN s ELSE s + x END)
      END
      )
    RETURN uniqueTags
`);
    console.log(`Generated tags: ${pResults.records.length}`);
    break;
  case "4":
    cResults = await session.run(`
  MATCH (r:Rendering)-[:IMPORTS]->(comp:Component)
  MATCH (comp)-[:IMPORTS*0..2]-(deepC)
  WITH r.${tagType} AS renderingTags, comp, deepC
  UNWIND renderingTags AS tag
    WITH DISTINCT tag, comp, deepC
    WITH COLLECT(DISTINCT tag) AS uniqueTags, comp, deepC
    SET comp.${tagType} = CASE
    WHEN comp.${tagType} IS NULL THEN
    CASE WHEN uniqueTags IS NULL THEN [] ELSE uniqueTags END
    ELSE REDUCE(s = [], x IN comp.${tagType} + COALESCE(uniqueTags, []) | CASE WHEN x IN s THEN s ELSE s + x END)
END
  RETURN comp
`);

    console.log(`Generated tags: ${cResults.records.length}`);
    break;

  default:
    console.log(`You ran a lot, you've to wait a bit`);
    fResults = await session.run(`
    MATCH (s:Service)-[:HAS_FUNCTION]->(f2:Function)
    MATCH (f2)-[:CALLS]->(deepF)
    MATCH (deepF)-[:CALLS_API]->(api:APIInterface)
    WITH api.${tagType} AS apiTags, f2, deepF
    UNWIND apiTags AS tag
    WITH DISTINCT tag, f2,deepF
    WITH COLLECT(DISTINCT tag) AS uniqueTags, f2, deepF, [f2, deepF] AS nodesList
    FOREACH (node IN nodesList | 
        SET node.${tagType} = CASE
        WHEN node.${tagType} IS NULL THEN 
        CASE WHEN uniqueTags IS NULL THEN [] ELSE uniqueTags END
        ELSE REDUCE(s = [], x IN node.${tagType} + COALESCE(uniqueTags, []) | CASE WHEN x IN s THEN s ELSE s + x END)
    END
    )
    RETURN uniqueTags
`);

    results = await session.run(`
    MATCH (r:Rendering)-[:HAS_FUNCTION*]->(f1)-[:CALLS*0..150]->(fx)-[:CALLS*0..150]->(f2:Function)
    WITH f2.${tagType} AS apiTags, f1, f2, fx, r
    UNWIND apiTags AS tag
    WITH DISTINCT tag, f1, f2, fx,r
    WITH COLLECT(DISTINCT tag) AS uniqueTags, f1, f2, fx, r, [ f1, f2, fx, r] AS nodesList
    FOREACH (node IN nodesList | 
        SET node.${tagType} = CASE
        WHEN node.${tagType} IS NULL THEN 
        CASE WHEN uniqueTags IS NULL THEN [] ELSE uniqueTags END
        ELSE REDUCE(s = [], x IN node.${tagType} + COALESCE(uniqueTags, []) | CASE WHEN x IN s THEN s ELSE s + x END)
  END
    )
    RETURN uniqueTags
`);

    tResults = await session.run(`
  MATCH (page:Page)-[:HAS_TEMPLATE]->(t:Template)
  MATCH (t:Template)-[*0..10]->(depW)
  MATCH (depW)-[:HAS_RENDERING]->(r:Rendering)
  MATCH (r)-[:HAS_FUNCTION]->(f:Function)
  MATCH (f)-[:CALLS]->(depF)
  WITH f.${tagType} AS renderingTags, page, t, depW, r, f, depF
  UNWIND renderingTags AS tag
    WITH DISTINCT tag, page, t, depW, r, f, depF 
    WITH COLLECT(DISTINCT tag) AS uniqueTags, page, t, depW, r, f, depF, [page, t, depW, r, f, depF] AS nodesList
    FOREACH (node IN nodesList | 
      SET node.${tagType} = CASE
      WHEN node.${tagType} IS NULL THEN 
      CASE WHEN uniqueTags IS NULL THEN [] ELSE uniqueTags END
      ELSE REDUCE(s = [], x IN node.${tagType} + COALESCE(uniqueTags, []) | CASE WHEN x IN s THEN s ELSE s + x END)
    END
    )   
  RETURN uniqueTags
`);

    cResults = await session.run(`
  MATCH (r:Rendering)-[:IMPORTS]->(comp:Component)
  WITH r.${tagType} AS renderingTags, comp 
  UNWIND renderingTags AS tag
    WITH DISTINCT tag, comp
    WITH COLLECT(DISTINCT tag) AS uniqueTags, comp
    SET comp.${tagType} = CASE
    WHEN comp.${tagType} IS NULL THEN 
    CASE WHEN uniqueTags IS NULL THEN [] ELSE uniqueTags END
    ELSE REDUCE(s = [], x IN comp.${tagType} + COALESCE(uniqueTags, []) | CASE WHEN x IN s THEN s ELSE s + x END)
END
  RETURN comp
`);

    console.log(`Generated tags: ${results.records.length}`);
    console.log(`Generated tags: ${fResults.records.length}`);
    console.log(`Generated tags: ${tResults.records.length}`);
    console.log(`Generated tags: ${cResults.records.length}`);

    break;
}

await driver.close();
