const fs = require("node:fs");
const path = require("node:path");
const code = fs.readFileSync(
  path.resolve(process.cwd(), "demo", "utils", "template.txt"),
  "utf-8"
);
const tokenize = require("./tokenize");
const genTAst = require("./tAst");
const transform = require("./transform");
const generate = require("./generate");

function run() {
  const tokens = tokenize(code);
  const tAst = genTAst(tokens);;
  const jsAst = transform(tAst);
  return generate(jsAst.jsCode);
}

module.exports = run;
