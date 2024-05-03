import jetpack from "fs-jetpack";
import * as sass from "sass";
import * as glob from "glob";

const config = {
    sourceDir: jetpack.path("./src"),
    targetDir: jetpack.path("../wikibook-cli/src/web"),
}

function fixSourcePath(path) {
    return path.replace(config.sourceDir, config.targetDir);
};

function build() {
    const mainSass = jetpack.path(config.sourceDir, "styles", "main.scss");
    const filesToCopy = glob.sync("./src/**/*.!(scss)");

    jetpack.remove(config.targetDir);

    jetpack.write(jetpack.path(config.targetDir, "styles", "main.css"), sass.compile(mainSass).css);

    filesToCopy.forEach(filePath => {
        filePath = jetpack.path(filePath);
        jetpack.copy(filePath, fixSourcePath(filePath), { overwrite: true });
    });
};

build();