import { RECIPES } from "../src/data/db/index";
import fs from "node:fs";
const missing = RECIPES.filter((r) => !r.image || !fs.existsSync("public/" + r.image));
console.log(`${RECIPES.length - missing.length}/${RECIPES.length} recettes avec photo`, missing.map((r) => r.title));
