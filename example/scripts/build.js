const wikicli = require("wikibook-cli");

wikicli.build({
    map: "src/wikimap.json",
    targetDir: "dist"
});