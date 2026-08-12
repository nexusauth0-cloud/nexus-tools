// Entry point used by build-help-artwork.mjs: imports every tool module
// so artwork is registered, then prints the collected snapshot as JSON.
import { collectDecorations } from "./artwork"
import "../tools/index"

console.log(JSON.stringify(collectDecorations()))