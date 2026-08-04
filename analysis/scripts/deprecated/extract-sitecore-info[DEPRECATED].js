import neo4j from "neo4j-driver";
import fs from "fs";
import csv from "csv-parser";
import path from "path";
import dotenv from "dotenv";

// Set up Neo4j connection
dotenv.config();
const uri = process.env.NEO4J_URI;
const user = process.env.NEO4J_USER; // Assicurati di definire questa variabile nel tuo file .env
const password = process.env.NEO4J_PASSWORD;

// Utilizza la variabile d'ambiente per l'URI
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

//Global variables
let results = {};
let componentCount = {};
const reactComponentsFolder = path.join(
  new URL("../../codebase/frontend/app_/src/frontend/components/renderings", import.meta.url)
    .pathname
);
const componentsMap = {
  sitecoreRenderings: [],
  onlyReactComponents: [],
};
const renderingsUsedMap = {
  usedRenderings: [],
  notUsedRenderings: [],
};

let renderingList = [];
// let queryList = [];
//utils function
function pushKeysToArray(map) {
  let keysArray = [];
  for (let key in map) {
    keysArray.push(key);
  }
  return keysArray;
}
function cleanArray(arr) {
  // Rimuovi gli spazi vuoti da ciascuna stringa nell'array
  const cleanedArray = arr.map((item) => item.replaceAll(" ", ""));
  return cleanedArray;
}
function cleanName(c) {
  const nameMatch = c.match(/^[A-Za-z ]+_(?={)/);
  const name = nameMatch ? nameMatch[0].slice(0, -1) : ""; // Tolgo l'underscore finale
  return name;
}
function formatArray(arr) {
  let newArray = [];
  arr.map((item) => {
    const nameMatch = item.match(/^[A-Za-z ]+_(?={)/);
    const name = nameMatch ? nameMatch[0].slice(0, -1) : ""; // Tolgo l'underscore finale
    // Estraiamo l'UID
    const uidMatch = item.match(/{[^}]+}/);
    // Estraiamo il placeholder
    const uid = uidMatch ? uidMatch[0] : "";
    const placeholderSegments = item.split(uid);
    const placeholder =
      placeholderSegments.length > 1 ? placeholderSegments[1] : "";

    let placeholderMatch = placeholder.split("/");
    let splittedPlaceholder = placeholderMatch ? placeholderMatch[1] : "";

    let fatherComponentMatchFinal;
    if (placeholderMatch.length > 2) {
      let fatherComponentMatch = placeholderMatch[2];
      const regexforUID = /{([^}]+)}/;
      // Applica la regex alla stringa
      fatherComponentMatchFinal = fatherComponentMatch.match(regexforUID)[0];
    } else if (placeholderMatch.length === 1) {
      splittedPlaceholder = placeholderMatch[0].replace("_", "");
    } else if (placeholderMatch.length === 2) {
      splittedPlaceholder = placeholderMatch[1].replace("_", "");
    }

    // Creiamo l'oggetto con i dati estratti
    const obj = {
      Name: name,
      Uid: uid,
      Placeholder: splittedPlaceholder,
      FatherComponent: fatherComponentMatchFinal || "",
    };

    // Aggiungiamo l'oggetto al nuovo array
    newArray.push(obj);
  });
  return newArray;
}

//parsing csv caricato in locale e creazione dei file
fs.createReadStream("./input_data/PageComponentsExport.csv") //TO DO da rendere configurabile con path del CSV
  .pipe(csv())
  .on("data", (data) => {
    const template = data.ItemName ? data.ItemName.trim() : "no item name";
    const language = data.Language;
    const url = data.PagePath.trim() + "-" + data.Language;
    const dirtyComponenents = data.Components.split("|");
    let components = cleanArray(dirtyComponenents);
    let formattedComponents = formatArray(components);
    const pageUrl = data.PageUrl;
    const isPublished = data.IsPublishedLive;
    const keyLang = url;

    if (results.hasOwnProperty(keyLang)) {
      results[keyLang] = {
        components: formattedComponents,
        language: language,
        pageUrl: pageUrl,
        template: template,
        isPublished: isPublished,
        repeat: (results[keyLang].repeat += 1),
      };
    } else {
      results[keyLang] = {
        components: formattedComponents,
        language: language,
        pageUrl: pageUrl,
        isPublished: isPublished,
        template: template,
        repeat: 1,
      };
    }
    //conta quanti widget ci sono
    components.forEach((component) => {
      const trimmedComponent = cleanName(component);
      if (componentCount[trimmedComponent]) {
        componentCount[trimmedComponent] += 1;
      } else {
        componentCount[trimmedComponent] = 1;
      }
    });
  })
  .on("end", () => {
    const sortedComponentCount = Object.entries(componentCount)
      .sort((a, b) => b[1] - a[1])
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    let componentArrayNew = [];

    componentArrayNew = pushKeysToArray(sortedComponentCount);
    const logData = {
      componentMap: results,
      componentCount: sortedComponentCount,
      componentArray: componentArrayNew,
    };

    const logFilePath = "./logs/componentMap.log";
    const query = `
    UNWIND $data AS page
    MERGE (p:Page {name: page.pageName, webUrl: page.pageUrl, isPublished:page.isPublished, component: "frontend"})
    MERGE (t:Template {name: page.template, component: "frontend"})
    MERGE (p)-[:HAS_TEMPLATE]->(t)
    WITH p, t, page
    UNWIND page.components AS component
    WITH p, t, component
    OPTIONAL MATCH (s:Slot {name: component.Name, uid: component.Uid, fatherComponent: component.FatherComponent, placeholder: component.Placeholder, component: "frontend"})
    WITH p, t, component, COUNT(s) AS componentCount
    MERGE (s:Slot {name: component.Name, uid: component.Uid, fatherComponent: component.FatherComponent, placeholder: component.Placeholder, component: "frontend"})
    ON CREATE SET s.count = 1
    ON MATCH SET s.count = s.count + 1
    MERGE (t)-[:CONTAINS]->(s)
`;
    const session = driver.session();
    const dataForQuery = Object.entries(logData.componentMap).map(
      ([pageName, pageData]) => ({
        pageName,
        template: pageData.template,
        pageUrl: pageData.pageUrl,
        isPublished: pageData.isPublished,
        components: pageData.components,
      })
    );

    session
      .run(query, { data: dataForQuery })
      .then((result) => {
        // console.log(result);
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        // Chiudi la sessione
        session.close();
      });

    // Controlla se il file di log esiste già e lo sostituisce
    if (fs.existsSync(logFilePath)) {
      fs.unlinkSync(logFilePath); // Elimina il file esistente
    }
    fs.writeFileSync(logFilePath, JSON.stringify(logData, null, 2));

    // Usage

    extractAndSaveImports(reactComponentsFolder, driver)
      .then(() => {
        // console.log("Tutte le query eseguite con successo.");
      })
      .catch((error) => {
        console.error("Errore durante l'esecuzione delle query:", error);
      })
      .finally(() => {
        verificaPresenzaElementi(logData.componentArray, renderingList);
        // driver.close(); // Chiudi il driver dopo aver chiuso la sessione
      });

    // verifico
    function verificaPresenzaElementi(array1, array2) {
      for (let i = 0; i < array1.length; i++) {
        let renderingName = array2[i].replace(/\.[^/.]+$/, "");
        let renderingNameToSave = array2[i]; // Rimuovi l'estensione del file
        if (array1.includes(renderingName)) {
          // console.log(renderingName + " è presente in entrambi gli array");
          renderingsUsedMap.usedRenderings.push(renderingName);
          let componentName = renderingName;
          const session = driver.session();
          const query = `
          MATCH (s:Slot {name: '${componentName}', component: "frontend"})
          MATCH (r:Rendering {name: '${renderingNameToSave}', component: "frontend"} )
          MERGE (s)-[:HAS_RENDERING]->(r)
          `;
          // console.log(componentName, renderingNameToSave)
          session
            .run(query)
            .then((result) => {
              if(result.records.length > 0)
                console.log(`
                  MATCH (s:Slot {name: '${componentName}', component: "frontend"})
                  MATCH (r:Rendering {name: '${renderingNameToSave}', component: "frontend"} )
                  MERGE (s)-[:HAS_RENDERING]->(r)
                `);
              else
                console.log(`Relation betwenn rendering  ${renderingNameToSave} and Slot ${componentName} not created`)
            })
            .catch((error) => {
              console.error("Errore durante l'esecuzione delle query:", error);
            })
            .finally(() => {
              // fs.appendFileSync("sitecore_queries.cypher", query + "\n");
              session.close();
            });
        } else {
          renderingsUsedMap.notUsedRenderings.push(array1[i]);
        }
      }
    }

    async function extractAndSaveImports(folderPath, driver) {
      const session = driver.session();
      const files = fs.readdirSync(folderPath, { withFileTypes: true });
      for (const file of files) {
        const filePath = path.join(folderPath, file.name);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
          const subFolder = path.join(folderPath, file.name);
          await extractAndSaveImports(subFolder, driver); // Passa lo stesso driver ricorsivamente
        } else {
          if (!file.name.includes(".test.")) {

            const content = fs.readFileSync(filePath, "utf8");
            const importRegex = /import\s+[^;]+;|import\s*\([^)]+\)/g;
            const imports = content.match(importRegex) || [];
            for (const importStatement of imports) {
              if (importStatement.includes("ISitecoreComponent")) {

                const fileName = file.name;
                renderingList.push(file.name);
                const importQuery = `MERGE (n:Rendering {name: '${fileName}'})`;

                try {
                  const result = await session.run(importQuery, { fileName });
                
                  if(result.records.length > 0)
                    console.log(`MERGE (n:Rendering {name: '${fileName}'})`);
                  else
                    console.log(`Rendering ${fileName} not created`)

                } catch (error) {
                  console.error(error);
                }
              }
            }
          }
        }
      }
      session.close(); // Chiudi la sessione dopo aver eseguito tutte le query nella directory corrente
    }
  });

//Nodes for layout component
  fs.createReadStream("./input_data/PageComponentsExportLayoutComponents.csv") //TO DO da rendere configurabile con path del CSV
  .pipe(csv())
  .on("data", (data) => {
    const dirtyComponenents = data.Components.split("|");
    let components = cleanArray(dirtyComponenents);
    let formattedComponents = formatArray(components);
    formattedComponents.map((comp)=>{
      const query = `
      MERGE (s:Slot {name: $name, uid: $uid, fatherComponent: $fatherComponent, placeholder: $placeholder, component: "frontend"})
      `;
      const session = driver.session();

    session
      .run(query, {
        name: comp.Name,
        uid: comp.Uid,
        placeholder: comp.Placeholder,
        fatherComponent: comp.FatherComponent
    })
      .then((result) => {
        if(result.records.length > 0)
          console.log(`MERGE (s:Slot {name: $${comp.Name}, uid: $${comp.Uid}, fatherComponent: $${comp.FatherComponent}, placeholder: $${comp.Placeholder}})`);
        else
          console.log(`Slot ${comp.Name} not created`)
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        // Chiudi la sessione
        session.close();
      });
    })
    
  })
  .on("end", () => {
    
  });