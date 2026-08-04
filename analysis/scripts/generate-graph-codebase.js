import neo4j from "neo4j-driver";
import fs from "fs";
import path from "path";
import ts from "typescript";
const { createSourceFile, ScriptTarget, SyntaxKind } = ts;
import { Command, Option } from "commander";
import winston from "winston";
import cliProgress from "cli-progress";

const program = new Command();
const { createLogger, format, transports } = winston;
const { combine, timestamp, printf } = format;

const exclusions = [
  ".test.",
  "componentFactory",
  "icons",
  "createMockStores",
  "src/backend",
];
const skipFunctions = [];
const skipImports = ['react'];
const excludedOwners = ['JSON', 'Array', 'next/server#NextResponse', 'UNSAFE_componentWillReceiveProps', 'decodeURIComponent'];

let storesFunctions = {}; // functions coming from a store
let rootStoreStores = []; // stores in rootstore
let failures = [];

let orphans = [];

const logFilePath1 = path.join("./logs/generate-graph-codebase.error.log");
const logFilePath2 = path.join("./logs/generate-graph-codebase.debug.log");
const logFilePath3 = path.join("./logs/generate-graph-codebase.all.log");

// Delete the log file if it exists
if (fs.existsSync(logFilePath1)) fs.unlinkSync(logFilePath1)
if (fs.existsSync(logFilePath2)) fs.unlinkSync(logFilePath2)
if (fs.existsSync(logFilePath3)) fs.unlinkSync(logFilePath3)

// Custom format to include method name
const customFormat = printf(({ timestamp, level, message, ...meta }) => {
  let logMessage = `${timestamp} - ${level.toUpperCase()} - ${message}`;
  if (Object.keys(meta).length > 0) {
    logMessage += ` - ${JSON.stringify(meta)}`;
  }
  return logMessage;
});

const logger = createLogger({
  level: 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    customFormat,
  ),
  transports: [
    new transports.File({
      filename: "./logs/generate-graph-codebase.error.log",
      level: "error",
    }),
    new transports.File({
      filename: "./logs/generate-graph-codebase.debug.log",
      level: "debug",
    }),
    new transports.File({
      filename: "./logs/generate-graph-codebase.all.log",
    }),
  ],
});

program
  .version("1.0.0", "-v, --version")
  .usage("[OPTIONS]...")
  .option("-t, --trace <value>", "Component to trace information about")
  .option("-c, --clean", "Clean database before running")
  .option("-u, --user <value>", "Username of neo4j database", "neo4j")
  .option("-p, --password <value>", "Password of neo4j database", "neo4j")
  .option("-r, --uri <value>", "URI of neo4j database", "bolt://localhost:7687")
  .option("-w, --write", "Write to neo4j", false)
  .parse(process.argv);

const options = program.opts();
const traceComponent = options.trace;

// Set up Neo4j connection
const uri = options.uri;
const user = options.user;
const password = options.password;
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

const multibar = new cliProgress.MultiBar(
  {
    format: " {bar} | {percentage}% | {step} | {value}/{total} | {file}",
    hideCursor: true,
  },
  cliProgress.Presets.shades_grey
);

function getFileType(fileFullPath, imports) {
  if (fileFullPath.includes(".service.")) {
    return "Service";
  } else if (imports.some((imp) => imp.includes("ISitecoreComponent"))) {
    return "Rendering";
  } else if (isStoreClassBasedOnContent(fileFullPath)) {
    return "Store";
  } else if (fileFullPath.includes('.util.')) {
    return "Util";
  } else {
    return "Component"; // Return Unknown if no specific type is matched
  }
}

// Function to read TypeScript files and extract local imports
function extractLocalImports(filePath, baseDir) {
  const content = fs.readFileSync(filePath, "utf8");
  const importRegex = /import\s+[^;]+;|import\s*\([^)]+\)/g;
  const imports = content.match(importRegex) || [];

  return imports
    .map((line) => {
      const match = line.match(/from\s+['"]([^'"]+)['"]/);
      return match ? match[1] : null;
    })
    .filter((importPath) => importPath !== null)
    .map((importPath) => {
      let resolvedPath = "";

      if (importPath.startsWith(".")) {
        resolvedPath = path.resolve(path.dirname(filePath), importPath);
      } else {
        resolvedPath = path.resolve(baseDir, importPath);
      }
      let ext = fs.existsSync(resolvedPath + ".ts") ? ".ts" : ".tsx";
      return resolvedPath + ext;
    })
    .filter((resolvedPath) => {
      if (!fs.existsSync(resolvedPath)) {
        return false;
      }
      return true;
    })
    .map((importPath) => path.relative(baseDir, importPath)); // Convert full path back to relative path
}

// Helper function to determine if the file name includes any excluded substrings
function isExcluded(filePath) {
  return exclusions.some((excludedStr) => filePath.includes(excludedStr));
}

// Modified function with an exclusion parameter
function getAllTsFiles(dir, exclusions = [], fileList = []) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  files.forEach((file) => {
    const filePath = path.join(dir, file.name);
    if (file.isDirectory()) {
      fileList = getAllTsFiles(filePath, exclusions, fileList); // Recursively call for directories
    } else if (
      file.isFile() &&
      (file.name.endsWith(".ts") || file.name.endsWith(".tsx")) &&
      !isExcluded(filePath)
    ) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

function findClassMethods(sourceFile, filePath) {
  const classMethods = new Set();
  const fileName = path.basename(filePath);

  function visit(node) {
    // Look for class declarations
    if (ts.isClassDeclaration(node)) {
      // standardize classes and components making the classes exporting its definition as function
      if (node.name?.text == fileName.substring(0, fileName.indexOf(".")))
        classMethods.add(node.name.text);

      // iterate over all memebers of the class
      node.members.forEach((member) => {
        let methodName = null;

        // handle regular method declarations
        if (
          ts.isMethodDeclaration(member) ||
          ts.isGetAccessor(member) ||
          ts.isSetAccessor(member)
        ) {
          methodName = member.name?.getText();
        }
        // handle arrow functions or function expressions assigned to properties
        else if (ts.isPropertyDeclaration(member) && member.initializer) {
          if (
            traceComponent &&
            fileName == traceComponent &&
            (node.name || node.initializer)
          ) {
            logger.info(
              `Node ${member.name?.text} kind: ${
                ts.SyntaxKind[member.kind]
              }, isFunctionExpression: ${ts.isFunctionExpression(
                member.initializer
              )}, isArrowFunction: ${ts.isArrowFunction(member.initializer)}`
            );
          }

          if (
            ts.isArrowFunction(member.initializer) ||
            ts.isFunctionExpression(member.initializer)
          ) {
            methodName = member.name?.getText();
          }
        }
        // Handle properties with decorators such as @validate or @observable
        if (ts.isPropertyDeclaration(member) && member.decorators) {
          member.decorators.forEach((decorator) => {
            // You can refine this to handle specific decorators or general cases
            methodName = member.name?.getText(); // Assuming the decorator modifies behavior akin to a method
          });
        }

        if (methodName) {
          if (traceComponent && fileName == traceComponent)
            logger.info(`Found method ${methodName}`);
          classMethods.add(methodName);
        }
      });
    }
    // Look for standalone function declarations (potential functional components)
    else if (ts.isFunctionDeclaration(node)) {
      const functionName = node.name?.getText();
      if (functionName) {
        classMethods.add(functionName);
      }
    }
    // Look for variable declarations that are functions or arrow functions (potential functional components)
    else if (ts.isVariableDeclaration(node) && node.initializer) {
      if (
        ts.isFunctionExpression(node.initializer) ||
        ts.isArrowFunction(node.initializer)
      ) {
        const functionName = node.name?.getText();
        if (functionName) {
          classMethods.add(functionName);
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  ts.forEachChild(sourceFile, visit);
  return Array.from(classMethods);
}

function extractExportedFunctions(filePath) {
  const fileContents = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    fileContents,
    ts.ScriptTarget.Latest,
    true
  );
  return findClassMethods(sourceFile, filePath);
}

function getImportMappings(sourceFile, filePath, baseDir) {
  const importMappings = {};

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isImportDeclaration(node) && node.importClause) {
      const moduleName = node.moduleSpecifier.text;
      const namedBindings = node.importClause.namedBindings;

      let resolvedPath = "";

      if (moduleName.startsWith(".")) {
        resolvedPath = path.resolve(path.dirname(filePath), moduleName);
      } else {
        resolvedPath = path.resolve(baseDir, moduleName);
      }
      let imp = fs.existsSync(resolvedPath + '.ts') ? path.basename(resolvedPath + '.ts') : undefined;
      imp = (imp == undefined && fs.existsSync(resolvedPath + '.tsx')) ? path.basename(resolvedPath + '.tsx') : imp;
      imp = (imp == undefined && fs.existsSync(resolvedPath + '/index.ts')) ? path.basename(resolvedPath + '.ts') : imp;

      if (imp) {
        if (node.importClause.name) {
          importMappings[node.importClause.name.text] = imp;
        } else if (namedBindings && ts.isNamespaceImport(namedBindings)) {
          importMappings[namedBindings.name.text] = imp;
        } else if (namedBindings && ts.isNamedImports(namedBindings)) {
          namedBindings.elements.forEach((spec) => {
            const importName = (spec.propertyName || spec.name).text;
            const alias = spec.name.text;
            importMappings[alias] = imp; // Keeping track of the exact import
          });
        }
      }
    }
  });

  return importMappings;
}


function getMobxInjectedStores(filePath, baseDir) {
  const content = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

  const mobxInjectedStores = {};

  function visit(node) {
    if (ts.isCallExpression(node) && node.getText(sourceFile).startsWith('inject')) {

      const injectArguments = node.arguments;

  const mobxInjectedMethods = {};
      if (injectArguments) {
        const lastArgument = injectArguments[injectArguments.length - 1];
        if (injectArguments.length > 0 && ts.isFunctionLike(lastArgument)) {

          if (ts.isArrowFunction(lastArgument) || ts.isFunctionExpression(lastArgument)) {
            const injectFunction = lastArgument;

            if (ts.isParenthesizedExpression(injectFunction.body)) {
              if (ts.isObjectLiteralExpression(injectFunction.body.expression)) {
                injectFunction.body.expression.properties.forEach(prop => {
                  if (ts.isPropertyAssignment(prop)) {
                    const methodName = prop.name.getText(sourceFile);
                    let mobxStoreMethod = prop.initializer.getText(sourceFile);

                    mobxInjectedStores[methodName] = mobxStoreMethod;
                  }
                });
              }
            }

          }
        }
      }
    }

    // Recurse into children nodes
    ts.forEachChild(node, visit);

  }
  visit(sourceFile);

  return mobxInjectedStores;
}

function extractFunctionCalls(fileName, filePath, baseDir) {
  const sourceFile = ts.createSourceFile(filePath, fs.readFileSync(filePath, 'utf8'), ts.ScriptTarget.Latest, true);
  const functionCalls = {};
  const importMappings = getImportMappings(sourceFile, filePath, baseDir);
  const defaultCaller = fileName.replaceAll(".tsx", "").replaceAll(".ts", "");

  if (traceComponent && fileName == traceComponent) {
    logger.info("defaultCaller", defaultCaller);
    logger.info("Import mapping used to retrieve the owner of used functions:");
    logger.info(importMappings);
  }

  // functionCalls[defaultCaller] = new Set()

  if (traceComponent && fileName == traceComponent) {
    logger.info('Serching injected methods')
  }

  // Fetch MobX injected methods
  const mobxInjectedStores = getMobxInjectedStores(filePath, baseDir);


  if (traceComponent && fileName == traceComponent) {
    logger.info(`${fileName} - mobx injected methods: ${JSON.stringify(mobxInjectedStores)}`)
  }

  function visit(node) {

    if (traceComponent && fileName == traceComponent && (node.name || node.initializer || node.expression)) {
      logger.info(`Node [name: ${node.name?.text}, type: ${ts.SyntaxKind[node.kind]}] `)
      logger.info(`Node - Initializer [name: ${node.initializer?.name?.text}, type ${ts.SyntaxKind[node.initializer?.kind]}]`)
      logger.info(`Node - Parent [name: ${node.parent?.name?.text}, type ${ts.SyntaxKind[node.parent?.kind]}]`)
      logger.info(`Node - Expression [name: ${node.expression?.name?.text}, type ${ts.SyntaxKind[node.expression?.kind]}]`)

      // if (node.name?.text == 'loadAlternativeOffers') {
      //   logger.info(ts.isPropertyAccessExpression(node))
      //   logger.info(node.expression?.getText(sourceFile))
      //   logger.info(node.expression?.name?.text)
      //   logger.info(node.expression && node.expression?.getText(sourceFile) == 'props')
      //   logger.info(node.parent && ts.isCallExpression(node.parent))
      // }
    }

    //  // Case1: Handle function declarations
    // if (ts.isCallExpression(node) && traceComponent && fileName == traceComponent) {
    //   logger.info(`Case 0: Handle call expressions - Node %o`, node.expression?.getText(sourceFile))
    //   recordFunctionCall(node.expression);
    // }
    // Case1: Handle function declarations
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isMethodDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) ||
      (ts.isVariableDeclaration(node) &&
        node.initializer &&
        ts.isFunctionLike(node.initializer))
    ) {
      if (
        traceComponent &&
        fileName == traceComponent &&
        (node.name || node.initializer)
      ) {
        logger.info(
          `Case 1: Handle function declarations - Node ${node.name?.text}`
        );
      }
      recordFunctionCall(node);
    }
    // Case 2: Handle class declaration
    else if (ts.isClassDeclaration(node)) {
      if (
        traceComponent &&
        fileName == traceComponent &&
        (node.name || node.initializer)
      ) {
        logger.info(
          `Case 2: Handle class declaration -  Node ${node.name?.text}`
        );
      }
      node.members.forEach(visit);
    }
    // Case 3: Handle property declaration or functionlike
    else if (
      ts.isPropertyDeclaration(node) &&
      node.initializer &&
      ts.isFunctionLike(node.initializer)
    ) {
      if (
        traceComponent &&
        fileName == traceComponent &&
        (node.name || node.initializer)
      ) {
        logger.info(
          `Case 3: Handle property declaration or functionlike - Node ${node.name?.text}`
        );
      }
      recordFunctionCall(node.initializer);
    }
    // Case 4: Handle JsxElement
    else if (node.kind === ts.SyntaxKind.JsxElement || node.kind === ts.SyntaxKind.JsxSelfClosingElement) {
      if (traceComponent && fileName == traceComponent) {
        if (node.tagName?.text)
          logger.info(`Case 4: Handle JsxElement - OpenJSX ${node.tagName?.text}`)
        if (node.openingElement?.tagName.text)
          logger.info(`Case 4: Handle JsxElement - Selfclosing ${node.openingElement?.tagName.text}`)
      }
      processJsxElement(node);
    }
    // Case 5: Handle JsxExpression
    else if (ts.isJsxExpression(node)) {
      if (traceComponent && fileName == traceComponent && (node.name || node.initializer)) {
        logger.info(`Case 5: Handle JsxExpression - Node ${node.name?.text}`)
      }
      if (node.expression && ts.isCallExpression(node.expression)) {

        recordFunctionCallInContext(node.expression, defaultCaller, fileName);
      }
    }
    //Case 6: Handle store function assignment
    else if ((node.name && node.initializer?.name
      && ts.isPropertyAssignment(node)
      && ts.isPropertyAccessExpression(node.initializer)
      && checkFunctionFromImportedStore(node.initializer?.name?.text, importMappings, node.initializer?.expression?.name?.text))
      || (node.name
        && ts.isPropertyAccessExpression(node)
        && checkFunctionFromImportedStore(node.name?.text, importMappings, node.expression?.name?.text))) {

      if (traceComponent && fileName == traceComponent && (node.name || node.initializer)) {
        logger.info(`Case 6: Handle store function assignment - Node ${node.name?.text} - Initializer ${node.initializer?.name.text}`)
      }

      const store = checkFunctionFromImportedStore(node.initializer?.name.text || node.name?.text, importMappings, node.initializer?.expression?.name?.text || node.expression?.name?.text);

      if (traceComponent && fileName == traceComponent) {
        logger.info(
          `Case 6: Found store function binding and the store is ${store}`
        );
      }

      const callName = node.name?.text;
      const caller = node.initializer?.name?.text || findParentCallerFunction(node.parent);
      const owner = store;

      if (caller && callName && owner) {

        // if (!functionCalls[caller]) {
        //   functionCalls[caller] = new Set();
        // }

        // const callDetail = { owner: owner, callName: callName };
        // functionCalls[caller].add(callDetail);

        addFunctionCall(caller, callName, owner);

        // if (traceComponent && fileName == traceComponent) {
        //   logger.info(`Case 6: storing {caller: ${caller}, owner: ${owner}, function: ${callName} }`)
        // }
      } else {
        logger.info(`Case 6 FAILED storing {caller: ${caller}, owner: ${owner}, function: ${callName} }`)
      }
    }
    //Case 7: Handle MobX injected methods usage
    else if ((ts.isIdentifier(node) || ts.isPropertyAssignment(node)) && mobxInjectedStores[node.name?.text]) {
      if (traceComponent && fileName == traceComponent && (node.name || node.initializer)) {
        logger.info(`Case 7: Mobx injections - Node ${node.name?.text} - Initializer ${node.initializer?.name?.text}`)
      }

      const mobxMethodCall = mobxInjectedStores[node.name?.text].split('.');
      const methodName = mobxMethodCall[mobxMethodCall.length - 1];
      const storeName = mobxMethodCall[mobxMethodCall.length - 2];
      const store = checkFunctionFromImportedStore(methodName, importMappings, storeName)

      if (store) {
        addFunctionCall(defaultCaller, methodName, store);
        // functionCalls[defaultCaller].add({ owner: store, callName: methodName });
      }

      //logger.info(`extractFunctionCalls (MobX): storing {caller: ${defaultCaller}, owner: ${storeName}, method: ${methodName} }`);
    }
    else if (ts.isPropertyAccessExpression(node)
      && (node.expression && node.expression?.getText(sourceFile) == 'props' || node.expression && node.expression?.getText(sourceFile) == 'this.props')
      && node.parent && ts.isCallExpression(node.parent)) {

      const func = node.name?.text;
      const owner = fileName;
      if (traceComponent && fileName == traceComponent && (node.name || node.expression)) {
        logger.info('finding parent')
      }
      const caller = findParentCallerFunction(node.parent)

      if (caller) {
        if (traceComponent && fileName == traceComponent && (node.name || node.expression)) {
          logger.info(`Case 8: Props functions - Node ${node.name?.text} - Expression ${node.expression?.getText(sourceFile)} - Caller ${caller}`)
        }

        // if (!functionCalls[caller]) {
        //   functionCalls[caller] = new Set();
        // }

        // functionCalls[caller].add({ owner: owner, callName: func });
        addFunctionCall(caller, func, owner)
      }
    }
    // Case 9: Handle TryStatement
    else if (ts.isTryStatement(node)) {
      if (traceComponent && fileName == traceComponent) {
        logger.info(`Case 9: Handle TryStatement - Node ${node.name?.text}`)
      }

      // Traverse the try block
      ts.forEachChild(node.tryBlock, visit);

      // Traverse the catch block, if it exists
      if (node.catchClause) {
        ts.forEachChild(node.catchClause.block, visit);
      }

      // Traverse the finally block, if it exists
      if (node.finallyBlock) {
        ts.forEachChild(node.finallyBlock, visit);
      }
    }
    //Case 10: Skipped
    else {
      if (traceComponent && fileName == traceComponent && (node.name || node.initializer || node.expression)) {
        logger.info(`Case 10 Unidentified: Node ${node.name?.text} will be skipped`)
      }
    }

    // Recurse into children nodes
    ts.forEachChild(node, visit);
  }

  function findParentCallerFunction(node) {
    if (node == null || node == undefined) return undefined;

    //logger.info(`findParentCallerFunction ${node.name?.text} - ${ts.SyntaxKind[node.kind]}`)

    if ((ts.isFunctionLike(node) || ts.isMethodDeclaration(node)) && node.name)
      return node.name?.text;

    if ((ts.isFunctionLike(node) || ts.isMethodDeclaration(node)) && (ts.isPropertyDeclaration(node.parent)) && node.parent.name)
      return node.parent.name.text;

    return findParentCallerFunction(node.parent);
  }

  function recordFunctionCallInContext(node, context, fileName) {
    let callName = null,
      owner = null;

    if (node.name?.text) {
      callName = node.name?.text;
    }


    if (node.expression) {
      const expression = node.expression;
      (callName = expression.getText(sourceFile)), (owner = fileName);

      // Checking if the function is called from an object property
      if (ts.isPropertyAccessExpression(expression)) {
        callName = expression.name.getText(sourceFile);
        owner = expression.expression.getText(sourceFile); // Capturing the owner of the function

        // Map back to the imported module if possible
        const nestedObject = owner.split(".");
        if (nestedObject.length > 0) {
          owner = nestedObject[nestedObject.length-1] // fix to get the real parent not the first element...
        }

        if (importMappings[owner]) {
          owner = importMappings[owner];
        } else {
          const store = checkFunctionFromImportedStore(callName, importMappings, owner);
          if (store) {
            owner = store
          }
        }
      }
    }

    // check if it is store function and if the store has been imported in this file
    if (!owner || owner == 'this' || owner == 'this.props' || owner == 'props') {
      owner = fileName
    }

    // if (!functionCalls[context]) {
    //   functionCalls[context] = new Set();
    // }

    // const callDetail = { owner: owner, callName: callName }; // Adding ownership to the call name if available

    // logger.info(`recordFunctionCallInContext: storing {caller: ${context}, owner: ${owner}, function: ${callName} }`)
    // functionCalls[context].add(callDetail);
    addFunctionCall(context, callName, owner);
  }

  function processFunctionCalls(node, contextName = "Global", fileName) {
    if (ts.isCallExpression(node)) {
      recordFunctionCallInContext(node, contextName, fileName);
    }

    ts.forEachChild(node, (child) =>
      processFunctionCalls(child, contextName, fileName)
    );
  }

  function recordFunctionCall(node) {
    let nodeName = node.name ? node.name.getText() : "anonymous";

    // If the node is anonymous, set the context to the parent node name
    if (nodeName === "anonymous") {
      if (traceComponent && fileName == traceComponent) {
        logger.info(`recordFunctionCall - Node identifier is: ${nodeName}`);
      }

      const parent = node.parent;

      if (
        parent &&
        (ts.isMethodDeclaration(parent) ||
          ts.isFunctionDeclaration(parent) ||
          ts.isPropertyDeclaration(parent))
      ) {
        nodeName = parent.name ? parent.name.getText() : "anonymous";
        if (traceComponent && fileName == traceComponent) {
          logger.info(
            `recordFunctionCall - Falling back to parent identifier: ${nodeName}`
          );
        }
      }

      // if (!functionCalls[nodeName]) {
      //   functionCalls[nodeName] = new Set();
      // }
    }
    // Process all call expressions within the function node
    processFunctionCalls(node, nodeName, fileName);

  }

  function processJsxElement(node) {

    const properties = node.attributes?.properties || node.openingElement.attributes.properties || [];

    for (let i = 0; i < properties.length; i++) {
      const prop = properties[i];

      if (ts.isJsxAttribute(prop) && prop.initializer) {
        if (ts.isJsxExpression(prop.initializer)
          && prop.initializer.expression
          && (ts.isCallExpression(prop.initializer.expression) || ts.isIdentifier(prop.initializer.expression))) {

          let callName = prop.initializer.expression.expression?.getText(sourceFile) || prop.initializer.expression.text;
          let caller = defaultCaller;
          let owner = fileName;

          if (ts.isJsxSelfClosingElement(node)) {
            caller = node.tagName.getText();
          }

          const callNameElements = callName.split(".");
          if (callNameElements.length > 1) {
            callName = callNameElements[1];
            if (importMappings[callNameElements[0]]) {
              owner = importMappings[callNameElements[0]];
            }
          }

          // if (!functionCalls[caller])
          //   functionCalls[caller] = new Set();

          // functionCalls[caller].add({ owner: owner, callName: callName });
          addFunctionCall(caller, callName, owner);
          //logger.info(`processJsxElement: storing {caller: ${caller}, owner: ${owner}, function: ${callName} }`)
        }
      }
    }

    if (ts.isJsxElement(node) || ts.isJsxFragment(node)) {
      const children = node.children;

      for (let i = 0; i < children.length; i++) {
        const child = children[i];

        if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
          processJsxElement(child);
        } else {
          visit(child);
        }
      }
    }

    if (ts.isJsxSelfClosingElement(node)) {
      const tagName = node.tagName.getText();
      const owner = importMappings[tagName]
        ? importMappings[tagName]
        : fileName;

      if (traceComponent && fileName == traceComponent) {
        logger.info(`processJsxElement - Found JSX element: <${tagName}>`);
      }

      //TOFIX
      //logger.info(`processJsxElement (isJsxSelfClosingElement): storing {caller: ${defaultCaller}, owner: ${fileName}, function: ${tagName} }`)
      //functionCalls[defaultCaller].add({ owner: owner, callName: tagName });
      addFunctionCall(defaultCaller, tagName, owner);
    }
  }

  function addFunctionCall(caller, callName, owner) {
    if (traceComponent && fileName == traceComponent) {
      logger.info(`Storing function call {caller: ${caller}, owner: ${owner}, function: ${callName} }`);
    }

    if(caller == undefined || callName == undefined || owner == undefined || caller.toString().includes(' ') || callName.toString().includes(' ') || owner.toString().includes(' ')){
      logger.info(`FAILED storing function call, some params are undefined: {caller: ${caller}, owner: ${owner}, function: ${callName} }`);
      failures.push(`{caller: ${caller}, owner: ${owner}, function: ${callName} }`);
      return;
    }

    if (!functionCalls[caller]) {
      functionCalls[caller] = new Set();
    }

    functionCalls[caller].add({ owner: owner, callName: callName });

    const printReadyFunctions = {}
    if (traceComponent && fileName == traceComponent) {
      // Convert the Set to array
      for (const [key, value] of Object.entries(functionCalls)) {
        if (value.size > 0) {
          printReadyFunctions[key] = Array.from(value).filter(Boolean); // translate into array and filter out undefined
        } 
      }
      logger.info(`Updated function calls ${JSON.stringify(printReadyFunctions)} `);
    }
  }

  visit(sourceFile);

  // Convert the Set to array
  for (const [key, value] of Object.entries(functionCalls)) {
    if (value.size > 0) {
      functionCalls[key] = Array.from(value).filter(Boolean); // translate into array and filter out undefined
    } else {
      delete functionCalls[key];
    }
  }

  if (traceComponent && fileName == traceComponent) {
    logger.info(`Function calls before changes`);
    logger.info(JSON.stringify(functionCalls));
  }

  if (functionCalls["anonymous"]) {
    functionCalls[defaultCaller] = functionCalls[defaultCaller]
      ? functionCalls["anonymous"].concat(functionCalls[defaultCaller])
      : functionCalls["anonymous"];

    delete functionCalls["anonymous"];
  }

  return functionCalls;
}

function isStoreClassBasedOnContent(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const sourceFile = ts.createSourceFile(
      filePath,
      fileContent,
      ts.ScriptTarget.Latest,
      true
    );

    let isStoreClass = false;

    /**
     * Visit nodes and set `isStoreClass` if class is likely to be a store.
     * @param {ts.Node} node - The TypeScript AST node.
     */
    function visit(node) {
      if (ts.isClassDeclaration(node) && node.name) {
        const className = node.name.text;

        // Example: Check if class name contains the word 'Store'
        if (className.includes("Store")) {
          isStoreClass = true;
        }

        // Example: Check for specific decorators or usages
        if (
          node.decorators &&
          node.decorators.some(
            (decorator) =>
              ts.isCallExpression(decorator.expression) &&
              (decorator.expression.expression.text === "observable" ||
                decorator.expression.expression.text === "action" ||
                decorator.expression.expression.text === "computed")
          )
        ) {
          isStoreClass = true;
        }
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    return isStoreClass;
  } catch (e) {
    return false;
  }
}

function extractAPIs(filePath) {
  const fileContent = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    fileContent,
    ts.ScriptTarget.Latest,
    true
  );

  let endpointMap = new Map();
  const regex = /\$\{[^\}]+\}\/[^\`]+/g;
  const cleaner = /(?<=\))\/[^?]*/;
  const newCleaner = /(''|\/\/|\/|https\:\/\/)([^(?|\`)]+)/;

  function visit(node) {
    let endpoint = null;
    let functionName = null;

    if (
      ts.isPropertyAssignment(node) &&
      (ts.isArrowFunction(node.initializer) ||
        ts.isFunctionExpression(node.initializer))
    ) {
      functionName = node.name?.getText();
      endpoint = extractEndpoint(node.initializer.body);
    } else if (
      ts.isMethodDeclaration(node) ||
      ts.isFunctionDeclaration(node) ||
      ts.isVariableDeclaration(node)
    ) {
      functionName =
        node.name?.getText() ||
        (node.initializer &&
          node.initializer.name &&
          node.initializer.name.getText());
      endpoint = extractEndpointFromFunctionOrMethod(node);
    }

    if (functionName && endpoint) {
      //endpoint = endpoint.replace(/`|\${|}/g, '').trim();
      let cleanMatch = endpoint.match(newCleaner);
      if (cleanMatch) {
        endpoint = cleanMatch[2];
      }
      endpointMap.set(functionName, endpoint);
    }
    if (endpoint) endpointMap.set(functionName, endpoint);

    ts.forEachChild(node, visit);
  }

  function extractEndpoint(node) {
    if (
      ts.isTemplateExpression(node) ||
      ts.isNoSubstitutionTemplateLiteral(node)
    ) {
      let endpoint = node.getText();
      for (const span of node.templateSpans) {
        if (ts.isCallExpression(span.expression)) {
          endpoint += extractEndpointFromCallExpression(span.expression);
        }
      }
      return endpoint;
    } else if (ts.isBlock(node)) {
      for (const statement of node.statements) {
        if (ts.isReturnStatement(statement) && statement.expression) {
          return extractEndpoint(statement.expression);
        }
      }
    } else if (ts.isCallExpression(node) && node.arguments.length) {
      const arg = node.arguments[0];
      return ts.isStringLiteral(arg) ||
        ts.isTemplateExpression(arg) ||
        ts.isNoSubstitutionTemplateLiteral(arg)
        ? arg.getText()
        : undefined;
    } else if (ts.isBinaryExpression(node)) {
      return node.getText().match(regex)[0];
    }
  }

  function extractEndpointFromFunctionOrMethod(node) {
    if (node.body && ts.isBlock(node.body)) {
      return extractEndpoint(node.body);
    }
    if (node.initializer && ts.isArrowFunction(node.initializer)) {
      return extractEndpoint(node.initializer.body);
    }
    return undefined;
  }

  function extractEndpointFromCallExpression(callExpression) {
    let endpoint = "";
    if (ts.isPropertyAccessExpression(callExpression.expression)) {
      const calledFunction = callExpression.expression.getFullText().trim();
      endpoint += calledFunction + "(";
      for (let i = 0; i < callExpression.arguments.length; i++) {
        const arg = callExpression.arguments[i];
        endpoint += arg.getFullText().trim();
        if (i < callExpression.arguments.length - 1) {
          endpoint += ", ";
        }
      }
      endpoint += ")";
    }
    return endpoint;
  }

  visit(sourceFile);
  return Object.fromEntries(endpointMap);
}

const strangeStoreNaming = {
  'hotelsStore': 'OffersStore'
}

function checkFunctionFromImportedStore(functionName, imports, parentObject) {
  let foundStore = null;

  if (functionName) {

    const storeKeys = Object.keys(storesFunctions);
    const importedObjects = Object.values(imports);

    for (let index = 0; index < storeKeys.length; index++) {
      const store = storeKeys[index];
      const storeFunctionArray = storesFunctions[storeKeys[index]];

      if (storeFunctionArray.includes(functionName)) { // a cazzo paystore dovrebbe essere paymentstore...
        const importedStoreFunctions = importedObjects.filter(imp => imp.includes(store));
        const isRootImportedStore = rootStoreStores.filter(st => st.includes(store) || st.includes(store.replace('Base', '')));
        if (importedStoreFunctions.length > 0) {
          foundStore = importedStoreFunctions[0];
          break;
        } else if ((importedObjects.includes("HolidaysRootStore.ts")
          || importedObjects.includes("holidays.ts")
          || importedObjects.includes("useStore.ts")
          || importedObjects.includes("IStores.ts"))
          && isRootImportedStore.length > 0) {

          let strangeNamingCheck = strangeStoreNaming[parentObject];

          if (parentObject &&
            (store.toLowerCase().replace('.ts', '') == parentObject.toLowerCase() 
              || store.replace('Base', '').toLowerCase().replace('.ts', '') == parentObject.toLowerCase())
              || (strangeNamingCheck && store.toLowerCase().replace('.ts', '') == strangeNamingCheck.toLowerCase())) {
            foundStore = store;
            break;
          }
          // else {
          //   logger.info(`Parent object '${parentObject}' does not match '${store}'`)
          // }
        }
      }
    }
  }
  return foundStore;
}

function printNodeInformation(node, sourceFile) {
  logger.info(`Node [name: ${node.name?.text}, type: ${ts.SyntaxKind[node.kind]}] `)
  logger.info(`Node - Initializer [name: ${node.initializer?.name?.text}, type ${ts.SyntaxKind[node.initializer?.kind]}]`)
  logger.info(`Node - Parent [name: ${node.parent?.name?.text}, type ${ts.SyntaxKind[node.parent?.kind]}]`)
  logger.info(`Node - Expression [name: ${node.expression?.getText(sourceFile)}, type ${ts.SyntaxKind[node.expression?.kind]}]`)
}

function unifyStoreFunctionsInRoot(filePath, baseDir) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, fileContent, ts.ScriptTarget.Latest, true);

  const importMappings = getImportMappings(sourceFile, filePath, baseDir);

  function visit(node) {

    if (ts.isTypeReferenceNode(node) && node.parent && ts.isPropertyDeclaration(node.parent)) {
      const store = node.parent.name?.getText();
      let type = undefined;

      const typeName = node.typeName;
      if (ts.isIdentifier(typeName)) {
        type = typeName.text;
      } else if (ts.isQualifiedName(typeName)) {
        // For cases like `namespace.Type`
        type = typeName.right.text;
      }
      if (importMappings[type] && importMappings[type] != 'base.ts')
        rootStoreStores.push(capitalizeFirstLetter(importMappings[type]));
      else if (importMappings[type] && importMappings[type] == 'base.ts') // workaround for the base store that is included differently
        rootStoreStores.push(capitalizeFirstLetter(type + '.ts'));
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

async function createGraphData(tsFilesDir) {
  const session = driver.session();

  logger.info(`Program arguments:`);
  logger.info(options);

  //delete everything first
  if (options.clean && options.write)
    await session.run(`MATCH (n)  DETACH DELETE n`);

  try {
    const files = getAllTsFiles(tsFilesDir);

    let storeRoot = '';
    const importedFiles = {};       // tracking all the imported files by each file
    const functionExports = {};     // tracking all functions present in a file
    let apiMap = new Map();         // tracking all the APIs

    // create new progress bars instances
    const progressBar1 = multibar.create(files.length, 0);
    progressBar1.update(0, { step: "imports and exports", file: "n/a" });
    const progressBar2 = multibar.create(files.length, 0);
    progressBar2.update(0, { step: "function calls", file: "n/a" });

    // iterate over all files to find imports and exports
    for (const filePath of files) {
      const fileName = path.basename(filePath);

      progressBar1.increment({ step: "imports and exports", file: fileName });
      multibar.update();

      // get imported files
      const imports = extractLocalImports(filePath, tsFilesDir);
      importedFiles[fileName] = [...imports];

      if (traceComponent && fileName == traceComponent) {
        logger.info("Imports size: " + imports.length);
        logger.info(imports);
      }

      // find functions in the file
      const exportedFunctions = extractExportedFunctions(filePath);
      functionExports[fileName] = [...exportedFunctions];

      // get file type
      let fileType = getFileType(filePath, imports);

      // if it is a store, add the methods to the store functions, it will be used to correctly retrieve the owner of methods when extrating function calls
      if (fileType == 'Store') {
        storesFunctions[fileName] = exportedFunctions;
      }

      if (fileName == 'HolidaysRootStore.ts') {
        storeRoot = filePath;
      }

      // save functions present in the file
      for (const func of exportedFunctions) {
        if (!skipFunctions.some((skpFunc) => skpFunc === func)) {
          if (options.write) {
            await session.run(
              `
                            MERGE (f:${fileType} {name: $fileName, component: "frontend"})
                            MERGE (fn:Function {name: $funcName, owner: $fileName, component: "frontend"})
                            MERGE (f)-[:HAS_FUNCTION]->(fn)
                        `,
              {
                fileName: fileName,
                funcName: func,
              }
            );
          }

          logger.info(`${fileType}:${fileName} exports ${func}`);

          const componentFunctionName = fileName.replace('.tsx', '').replace('.ts', '');

          if (options.write && ['Rendering', 'Component'].includes(fileType)) {
            //TODO togliere in caso di service o store
            await session.run(`
                            MERGE (fc:Function {name: $componentFunctionName, owner: $fileName, component: "frontend"})
                            MERGE (fn:Function {name: $funcName, owner: $fileName, component: "frontend"})
                            MERGE (fc)-[:CALLS]->(fn)
                        `, {
              fileName: fileName,
              componentFunctionName: componentFunctionName,
              funcName: func
            });

            logger.info(`Function ${componentFunctionName} in ${fileName} calls function ${func} (${fileName})`);
          }
        }
      }

      // create api nodes, fixed behavior because the information are only inside endpoints.ts file
      if (fileName == "endpoints.ts") {
        apiMap = extractAPIs(filePath);

        for (const func of Object.keys(apiMap)) {
          if (options.write && apiMap[func].toLowerCase() !== "v1.0") {
            await session.run(
              `
                            MERGE (f:Function {name: $funcName, owner: $fileName, component: "frontend"})
                            MERGE (fn:APIInterface {name: $api, route: $api, component: "frontend"})
                            MERGE (f)-[:CALLS_API]->(fn)
                        `,
              {
                fileName: fileName,
                funcName: func,
                api: apiMap[func],
              }
            );
          }
          logger.info(`${fileName}.${func} calls api ${apiMap[func]}`);
        }
      }

      for (const imp of imports) {
        const importedFileName = path.basename(imp);
        const fileType = getFileType(filePath, imports);
        const importedFileType = getFileType(
          importedFileName,
          importedFiles[importedFileName] !== undefined
            ? importedFiles[importedFileName]
            : []
        );

        if (!skipImports.some((skpImp) => skpImp === imp)) {
          if (options.write) {
            await session.run(
              `
                            MERGE (f:${fileType} {name: $fileName, component: "frontend"})
                            MERGE (i:${importedFileType} {name: $importedFileName, component: "frontend"})
                            MERGE (f)-[:IMPORTS]->(i)
                        `,
              {
                fileName: fileName,
                importedFileName: importedFileName,
              }
            );
          }

          logger.info(
            `${fileType}:${fileName} imports ${importedFileType}:${importedFileName}`
          );
        }
      }
    }

    //unifiy functions in store root file
    unifyStoreFunctionsInRoot(storeRoot, tsFilesDir);

    let owners = new Set();

    for (const filePath of files) {
      const fileName = path.basename(filePath);

      progressBar2.increment({ step: "function calls", file: fileName });
      multibar.update();

      const functionCalls = extractFunctionCalls(fileName, filePath, tsFilesDir);

      for (const caller in functionCalls) {
        if (traceComponent && fileName == traceComponent) {
          logger.info("Function calls size: " + functionCalls[caller].length + ' (' + caller + ')')
          logger.info(`${JSON.stringify(functionCalls[caller])}`)
        }

        for (const calledFunc of functionCalls[caller]) {
          // logger.info(JSON.stringify(calledFunc));
          if (!excludedOwners.some(owner => calledFunc.owner.startsWith(owner))) {
            owners.add(calledFunc.owner)
            if (options.write) {
              const result = await session.run(
                `
                                MERGE (f:Function {name: $caller, owner: $fileName, component: "frontend"})
                                MERGE (fn:Function {name: $calledFunc, owner: $owner, component: "frontend"})
                                MERGE (f)-[r:CALLS]->(fn)
                                RETURN f, fn, r
                            `,
                {
                  fileName: fileName,
                  caller: caller,
                  calledFunc: calledFunc.callName,
                  owner: calledFunc.owner,
                }
              );
            }
            logger.info(
              `Function ${caller} in ${fileName} calls function ${calledFunc.callName} (${calledFunc.owner})`
            );
          } else {
            logger.info("Excluded owner " + calledFunc.owner);
          }
        }
      }
    }
  } catch (error) {
    logger.error("Error creating graph data:", error);
  } finally {
    logger.info(`Following functions failures:`)
    failures.map((fail) => logger.info(fail));
    await session.close();
  }
}

createGraphData("../../codebase/frontend/app_/src")
  .then(() => {
    //logger.info(orphans.length, "orphans quantity")
    logger.info("Graph data created successfully");
  })
  .catch(logger.error)
  .finally(() => {
    driver.close();
    multibar.stop();
  });
