import neo4j from 'neo4j-driver';

import * as path from 'path';
import * as ts from 'typescript';
const { createSourceFile, ScriptTarget, SyntaxKind } = ts;
import Utils from './modules/Utils'
import { Codebase } from './modules/Codebase';

// Set up Neo4j connection
const uri = "bolt://localhost:7687";
const user = "neo4j";
const password = "neo4j";
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
const exclusions = ['.test.', 'componentFactory', 'icons']
const extensions = ['.ts', '.tsx']
//const skipFunctions = ['render', 'componentWillUnmount', 'componentDidMount', 'componentWillUpdate', 'componentDidUnmount', 'shouldComponentUpdate', 'setState', 'useEffect']
const skipFunctions = []

async function createGraphData(tsFilesDir) {
    const codebase = new Codebase(tsFilesDir, exclusions,extensions )
    const utils = new Utils();

    const session = driver.session();
    try {
        const files = codebase.getAllTsFiles(tsFilesDir);
        const importedFiles = {}
        const functionExports = {};

        for (const filePath of files) {
            const fileName = path.basename(filePath);

            const imports = utils.extractLocalImports(filePath, codebase.rootPath);
            importedFiles[fileName] = [...imports];

            const exportedFunctions = utils.extractExportedFunctions(filePath);
            functionExports[fileName] = [...exportedFunctions];

            let type = utils.getFileType(filePath, imports)

            for (const func of exportedFunctions) {
                if (!skipFunctions.some(skpFunc => skpFunc === func)) {
                    await session.run(`
                        MERGE (f:${type} {name: $fileName})
                        MERGE (fn:Function {name: $funcName: owner: $fileName})
                        MERGE (f)-[:EXPORTS]->(fn)
                    `, {
                        fileName: fileName,
                        funcName: func,
                    });
                    console.log(`${fileName} exports ${func}`);
                }
            }
        }

        for (const filePath of files) {
            const fileName = path.basename(filePath);
            const functionCalls = utils.extractFunctionCalls(fileName, filePath);

            console.error(functionCalls)

            for (const caller in functionCalls) {

                for (const calledFunc of functionCalls[caller]) {
                    await session.run(`
                        MATCH (f:Function {name: $caller: owner: $fileName})
                        MATCH (fn:Function {name: $calledFunc: owner: $owner})
                        MERGE (f)-[:USES]->(fn)
                    `, {
                        fileName: fileName,
                        caller: caller,
                        calledFunc: calledFunc.callName,
                        owner: calledFunc.owner
                    });
                    console.log(`Function ${caller} in ${fileName} calls function ${calledFunc}`);
                }
            }
        }

        for (const filePath of files) {
            const fileName = path.basename(filePath);
            const imports = importedFiles[fileName];
            for (const importedPath of imports) {
                const importedFileName = path.basename(importedPath);

                // Register file imports relation
                const type = utils.getFileType(filePath, imports)
                const impType = utils.getFileType(importedFileName, importedFiles[importedFileName] !== undefined ? importedFiles[importedFileName] : []);

                await session.run(`
                    MERGE (f:${type} {name: $fileName})
                    MERGE (i:${impType} {name: $importedFileName})
                    MERGE (f)-[:IMPORTS]->(i)
                `, {
                    fileName: fileName,
                    importedFileName: importedFileName,
                });

                console.log(`${type}:${fileName} imports ${impType}:${importedFileName}`);

                // Track function usages
                if (functionExports[importedFileName]) {

                    const functionsUsed = utils.getFunctionUsage(filePath, [{ name: importedFileName, exportedFunctions: functionExports[importedFileName] }]);
                    const usedFunctions = functionsUsed[importedFileName] || [];

                    for (const func of usedFunctions) {

                        // if it is not a function to be skipped
                        if (!skipFunctions.some(skpFunc => skpFunc === func)) {

                            // Enhanced error handling and diagnostics
                            const typeF = imports.some(imp => (imp.includes('ISitecoreComponent'))) ? 'Rendering' : 'Component';
                            const checkResult = await session.run(`
                                MERGE (f:${typeF} {name: $fileName})
                                MERGE (fn:Function {name: $funcName})
                                RETURN f, fn
                                `, {
                                fileName,
                                funcName: func,
                                importedFileName
                            });

                            if (checkResult.records.length === 0) {
                                console.error(`Failed to find or create nodes for file: ${fileName} or function: ${func}`);
                            } else {
                                console.log(`${type}:${fileName} created`);
                                // Only attempt to create relationship if nodes are verified
                                const relResult = await session.run(`
                                    MATCH (f {name: $fileName})
                                    MATCH (fn:Function {name: $funcName})
                                    MERGE (f)-[r:USES]->(fn)
                                    RETURN count(r) as createdCount
                                `, {
                                    fileName,
                                    funcName: func,
                                    importedFileName
                                })

                                if (relResult.records.length > 0) {
                                    const createdCount = relResult.records[0].get('createdCount').low;  // Be wary; numbers are BigInteger in the Neo4j driver
                                    if (createdCount > 0) {
                                        console.log(`Relationship USES created between ${fileName} and ${func}`);
                                    } else {
                                        console.log("Relationship already exists.");
                                    }
                                } else {
                                    console.error(`Failed to create relation USES for file: ${fileName} or function: ${func}`);
                                };
                            }
                        }

                    }
                }
            };
        }
    } catch (error) {
        console.error('Error creating graph data:', error);
    } finally {
        await session.close();
    }
}

createGraphData('../app_/src')
    .then(() => {
        console.log('Graph data created successfully')
    })
    .catch(console.error)
    .finally(() => driver.close());




