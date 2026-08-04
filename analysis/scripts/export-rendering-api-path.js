import neo4j from "neo4j-driver";
import fs from "fs";
import { Command, Option } from 'commander';
const program = new Command();
import pkg from 'csvtojson';
const { csv } = pkg;
import { createObjectCsvWriter as createCsvWriter } from "csv-writer";

const pageComponentExport = "./input_data/PageComponentsExport.csv";

program
  .version('1.0.0', '-v, --version')
  .usage('[OPTIONS]...')
  .option('-u, --user <value>', 'Username of neo4j database', 'neo4j')
  .option('-p, --password <value>', 'Password of neo4j database', 'neo4j')
  .option('-r, --uri <value>', 'URI of neo4j database', 'bolt://localhost:7687')
  .parse(process.argv);

const options = program.opts();

// Set up Neo4j connection
const uri = options.uri;
const user = options.user;
const password = options.password;
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

// extract pages
const extraction = await csv().fromFile(pageComponentExport);
const onlyPublished = extraction.filter(row => ['TRUE', 'True'].includes(row.IsPublishedLive))

// Configurare CSV writer
const csvWriter = createCsvWriter({
  path: 'output_data/PageRenderingApiPath_new.csv',
  header: [
    { id: 'page', title: 'Page' },
    { id: 'language', title: 'Language' },
    { id: 'rendering', title: 'Rendering' },
    { id: 'api', title: 'API' },
  ]
});

const session = driver.session();

for (const row of onlyPublished) {
  const result = await session.run(`
    MATCH p=(page:Page {webUrl: $pageUrl, lang: $lang})-[*..5]->(re:Widget {webUrl: $pageUrl, lang: $lang})-[:HAS_RENDERING]-(rendering:Rendering)
    OPTIONAL MATCH (rendering)-[r:HAS_FUNCTION*]->(c)-[ca:CALLS*..6]->(f:Function {owner: "endpoints.ts"})-[ap:CALLS_API*]->(api: APIInterface)
    RETURN DISTINCT page, rendering, api  
  `,
  {
    pageUrl: row.PageUrl,
    lang: row.Language
  });

  for(const record of result.records){
    await csvWriter.writeRecords([{
      page: row.PageUrl,
      language: row.Language,
      rendering: record.get('rendering').properties.name,
      api: record.get('api') ? record.get('api').properties.route : 'n_a',
    }])
   
  }

  //await csvWriter.writeRecords(relations)
  console.log(`Results for ${row.PageUrl}:`, result.records.length);

}

driver.close();

// dataForCSV[page + '_' + record.get('rendering').properties.name + '_' + record.get('api').properties.api] = {
//   page: page,
//   rendering: record.get('rendering').properties.name,
//   api: record.get('api').properties.route,
// };

// // Lettura del file CSV e estrazione degli URL
// const pageList = new Set();
// fs.createReadStream('input_data/PageComponentsExport.csv')
//   .pipe(csvParser())
//   .on('data', (row) => {
//     // Push URLs from the 'PageUrl' column into the pageList array
//     pageList.add(row.PageUrl);
//   })
//   .on('end', async () => {
//     console.log('CSV file successfully processed.');
//     const relations = await queryPages(pageList);
//     await csvWriter.writeRecords(relations); // Scrivere i risultati nel CSV
//     console.log('Data has been written to CSV file.');
//     await driver.close();
//   })
//   .on('error', (err) => {
//     console.error("Error while reading CSV:", err);
//   });

// async function queryPages(pageList) {
//   const session = driver.session();
//   let dataForCSV = new Map();
//   const pages = Array.from(pageList);
//   console.log(pages)
//   for (const page of pages) {

//     try {
//       // const result = await session.run(
//       //   "MATCH p=(page:Page {webUrl: $pageUrl})-[*..4]-(rendering:Rendering)-[r:HAS_FUNCTION]->(c)-[ca:CALLS*..10]->(f:Function {owner: 'endpoints.ts'})-[ap:CALLS_API]->(api: APIInterface) RETURN DISTINCT page, rendering, api as count",
//       //   { pageUrl: page }
//       // );

//       const result = await session.run(`
//         MATCH p=(page:Page {webUrl: $pageUrl, lang:"en"})-[*..5]->(re:Widget {webUrl: $pageUrl, lang:"en"})-[:HAS_RENDERING]-(rendering:Rendering)-[r:HAS_FUNCTION*]->(c)-[ca:CALLS*..6]->(f:Function {owner: "endpoints.ts"})-[ap:CALLS_API]->(api: APIInterface) RETURN DISTINCT page, rendering, api as count
//       `)

//       result.records.forEach(record => {
//         dataForCSV[page + '_' + record.get('rendering').properties.name + '_' + record.get('api').properties.api] = {
//           page: page,
//           rendering: record.get('rendering').properties.name,
//           api: record.get('api').properties.route,
//           count: record.get('count')  // Raccogli il conteggio delle relazioni
//         };
//       })
//       console.log(`Results for ${page}:`, result.records.length);
//       // console.log(`Results for result`, result);
//     } catch (error) {
//       console.error(`Failed to execute query for ${page}:`, error);
//     }
//   }
//   await session.close();
//   console.error(`dataForCSV`, dataForCSV);
//   return Array.from(Object.values(dataForCSV));
// }