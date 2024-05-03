const jetpack = require("fs-jetpack");
const glob = require("glob");
const JSDOM = require("jsdom").JSDOM;

const pageFilesDir = jetpack.path("./node_modules/wikibook-cli/src/web");
const pageIndexPath = jetpack.path(pageFilesDir, "index.html");

/**
 * @typedef WikiMapPage
 * @param {string} title
 * @param {string} contentPath
 */

/**
 * @typedef WikiMapCategory
 * @param {string} title
 * @param {Array<WikiMapPage>} pages
 */

/**
 * @typedef WikiMap
 * @param {string} title
 * @param {string} resources - Directory where custom resources are stored
 * @param {string} pages - Directory where the pages are stored
 * @param {Array<WikiMapCategory>} categories
 */

/**
 * @typedef BuildOptions
 * @param {string} map - Map
 * @param {string} targetDir - Output directory
 */

/**
 * Builds a wiki from a specified JSON map
 * @param {BuildOptions} options 
 */
async function build(options) {
    try {
        const targetDir = jetpack.path(options.targetDir);
        const buildCache = {};

        /**
         * The wikimap
         * @type {WikiMap}
         */
        const map = JSON.parse(jetpack.read(jetpack.path(options.map)));

        buildCache.menu = await generateMenu(map);

        const index = await createEmptyPage();
        index.window.document.title = map.title;
        getMenuPages(index).innerHTML = buildCache.menu;

        map.categories.forEach((category, categoryIndex) => {
            category.pages.forEach(async (page, pageIndex) => {
                const pageDom = await createEmptyPage();
                pageDom.window.document.title = `${page.title} - ${category.title} - ${map.title}`;
                getMenuPages(pageDom).innerHTML = buildCache.menu;

                const subDirectories = getSubDirStr(page.contentPath);

                const pageStyles = pageDom.window.document.querySelectorAll("link");
                pageStyles.forEach(style => {
                    const stylePath = style.getAttribute("href");
                    style.setAttribute("href", `${subDirectories}${stylePath}`);
                });

                const pageLinks = pageDom.window.document.querySelectorAll("a");
                pageLinks.forEach(link => {
                    const linkPath = link.getAttribute("href");
                    link.setAttribute("href", `${subDirectories}${linkPath}`);
                });

                pageDom.window.document.getElementById("page").innerHTML = jetpack.read(jetpack.path(map.pages, page.contentPath));

                pageDom.window.document.getElementById(`wiki-menu-btn-page-${categoryIndex}-${pageIndex}`).classList.add("active");

                savePage(pageDom, jetpack.path(targetDir, "pages", page.contentPath));
            });
        });

        savePage(index, jetpack.path(targetDir, "index.html"));

        copyGlob(pageFilesDir, "/**/*.!(html)", targetDir);

        if (!map.resources)
            return;

        jetpack.copy(jetpack.path(map.resources), jetpack.path(targetDir, "resources"), { overwrite: true });
    }
    catch (err) {
        console.error("Error when building wiki:", err);
    }
};

/**
 * Generates a menu innerHTML from WikiMap
 * @param {WikiMap} map
 * @returns {Promise<string>}
 */
async function generateMenu(map) {
    const page = await createEmptyPage();
    const pages = getMenuPages(page);

    map.categories.forEach((category, categoryIndex) => {
        pages.innerHTML += `<button class="reference">${category.title}</button>`;

        category.pages.forEach((page, pageIndex) => {
            pages.innerHTML += `<a href="pages/${page.contentPath}"><button class="reference sub" id="wiki-menu-btn-page-${categoryIndex}-${pageIndex}">${page.title}</button></a>`;
        });
    });

    return pages.innerHTML;
};

/**
 * Returns the pages node
 * @param {JSDOM} pages
 * @returns {HTMLElement}
 */
function getMenuPages(pages) {
    return pages.window.document.getElementById("pages");
};

/**
 * Creates an JSDOM from the empty wiki page
 * @param {string} filePath
 * @returns {Promise<JSDOM>}
 */
async function createEmptyPage() {
    return await JSDOM.fromFile(pageIndexPath);
};

/**
 * Returns a string with subdirectories
 * @param {string} pagePath
 * @returns {string}
 */
function getSubDirStr(pagePath) {
    const subDirectories = pagePath.split("/").length - 1;
    let subDirStr = "../";

    for (let i = 0; i < subDirectories; i++)
        subDirStr += "../";

    return subDirStr;
};

/**
 * Saves a JSDOM page to file
 * @param {JSDOM} page
 * @param {string} targetPath
 */
function savePage(page, targetPath) {
    jetpack.write(targetPath, page.window.document.documentElement.outerHTML);
};

/**
 * Copies files with glob search
 * @param {string} parentDir
 * @param {string} globQuery
 * @param {string} targetDir
 */
function copyGlob(parentDir, globQuery, targetDir) {
    parentDir = jetpack.path(parentDir);
    targetDir = jetpack.path(targetDir);

    const filesToCopy = glob.sync(`${parentDir}${globQuery}`);
    filesToCopy.forEach(filePath => {
        filePath = jetpack.path(filePath);
        jetpack.copy(filePath, filePath.replace(parentDir, targetDir), { overwrite: true });
    });
};

exports.build = build;