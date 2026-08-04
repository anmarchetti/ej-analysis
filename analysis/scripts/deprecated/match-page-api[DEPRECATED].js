import neo4j from "neo4j-driver";
import fs from "fs";
import csvParser from "csv-parser";
import { createObjectCsvWriter as createCsvWriter } from "csv-writer";
import dotenv from "dotenv";
// Set up Neo4j connection
dotenv.config();
const uri = process.env.NEO4J_URI;
const user = process.env.NEO4J_USER;
const password = process.env.NEO4J_PASSWORD;
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

// Configurare CSV writer
const csvWriter = createCsvWriter({
    path: 'output_data/PageApiRelations.csv',
    header: [
      {id: 'page', title: 'Page'},
      {id: 'api', title: 'API'},
      {id: 'count', title: 'Count'}
    ]
  });

// Lettura del file CSV e estrazione degli URL
const pageList = new Set();
fs.createReadStream('input_data/PageComponentsExport.csv')
  .pipe(csvParser())
  .on('data', (row) => {
    // Push URLs from the 'PageUrl' column into the pageList array
    pageList.add(row.PageUrl);
  })
  .on('end', async () => {
    console.log('CSV file successfully processed.');
    const relations = await queryPages(pageList);
    await csvWriter.writeRecords(relations); // Scrivere i risultati nel CSV
    console.log('Data has been written to CSV file.');
    await driver.close();
  })
  .on('error', (err) => {
    console.error("Error while reading CSV:", err);
  });

async function queryPages(pageList) {
  const session = driver.session();
  let dataForCSV = new Map();
  const pages = Array.from(pageList);
  console.log(pages)
  for (const page of pages) {

    try {
      const result = await session.run(
        "MATCH p=(page:Page {webUrl: $pageUrl})-[*..4]-(re:Rendering)-[r:HAS_FUNCTION]->(c)-[ca:CALLS*..10]->(f:Function {owner: 'endpoints.ts'})-[ap:CALLS_API]->(api: API) RETURN DISTINCT page, api, count(api) as count",
        { pageUrl: page }
      );
      result.records.forEach(record => {
        dataForCSV[page + '_' + record.get('api').properties.api] = {
          page: page,
          api: record.get('api').properties.api,
          count: record.get('count')  // Raccogli il conteggio delle relazioni
        };
      })
      console.log(`Results for ${page}:`, result.records.length);
      // console.log(`Results for result`, result);
    } catch (error) {
      console.error(`Failed to execute query for ${page}:`, error);
    }
  }
  await session.close();
  console.error(`dataForCSV`, dataForCSV);
  return Array.from(Object.values(dataForCSV));
}