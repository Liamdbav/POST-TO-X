/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/extension.ts"
/*!**************************!*\
  !*** ./src/extension.ts ***!
  \**************************/
(__unused_webpack_module, exports, __webpack_require__) {

eval("{\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.activate = activate;\nexports.deactivate = deactivate;\nconst vscode = __webpack_require__(/*! vscode */ \"vscode\");\nconst fs = __webpack_require__(/*! fs */ \"fs\");\nconst path = __webpack_require__(/*! path */ \"path\");\nconst child_process_1 = __webpack_require__(/*! child_process */ \"child_process\");\nfunction git(cwd, args) {\n    return (0, child_process_1.execSync)(`git ${args}`, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();\n}\nfunction buildRepoContext(rootPath) {\n    // README\n    const readmePath = path.join(rootPath, 'README.md');\n    if (!fs.existsSync(readmePath)) {\n        throw new Error('README.md introuvable à la racine du workspace.');\n    }\n    const readmeContent = fs.readFileSync(readmePath, 'utf8');\n    // Nom du repo : remote origin en priorité, sinon nom du dossier\n    let remotUrl = null;\n    let repoName = path.basename(rootPath);\n    try {\n        remotUrl = git(rootPath, 'remote get-url origin');\n        // \"https://github.com/user/my-repo.git\" → \"my-repo\"\n        const match = remotUrl.match(/\\/([^/]+?)(?:\\.git)?$/);\n        if (match) {\n            repoName = match[1];\n        }\n    }\n    catch {\n        // pas de remote configuré — on garde le nom du dossier\n    }\n    // Dernier tag\n    let lastTag = null;\n    try {\n        lastTag = git(rootPath, 'describe --tags --abbrev=0');\n    }\n    catch {\n        // aucun tag dans ce repo\n    }\n    // Commits depuis le dernier tag\n    let commitsSinceTag = null;\n    if (lastTag) {\n        try {\n            const count = git(rootPath, `rev-list ${lastTag}..HEAD --count`);\n            commitsSinceTag = parseInt(count, 10);\n        }\n        catch {\n            // tag existe mais rev-list a échoué (cas rare)\n        }\n    }\n    return { repoName, readmeContent, lastTag, commitsSinceTag, remotUrl };\n}\nfunction activate(context) {\n    const command = vscode.commands.registerCommand('repo-to-post.generatePost', () => {\n        const folders = vscode.workspace.workspaceFolders;\n        if (!folders || folders.length === 0) {\n            vscode.window.showErrorMessage('Post to X : aucun workspace ouvert.');\n            return;\n        }\n        const rootPath = folders[0].uri.fsPath;\n        try {\n            const repoContext = buildRepoContext(rootPath);\n            console.log('[repo-to-post] RepoContext :', JSON.stringify(repoContext, null, 2));\n            vscode.window.showInformationMessage(`Post to X : contexte lu — ${repoContext.repoName}` +\n                (repoContext.lastTag ? ` @ ${repoContext.lastTag}` : ''));\n        }\n        catch (err) {\n            const message = err instanceof Error ? err.message : String(err);\n            vscode.window.showErrorMessage(`Post to X : ${message}`);\n        }\n    });\n    context.subscriptions.push(command);\n}\nfunction deactivate() { }\n\n\n//# sourceURL=webpack://repo-to-post/./src/extension.ts?\n}");

/***/ },

/***/ "vscode"
/*!*************************!*\
  !*** external "vscode" ***!
  \*************************/
(module) {

module.exports = require("vscode");

/***/ },

/***/ "child_process"
/*!********************************!*\
  !*** external "child_process" ***!
  \********************************/
(module) {

module.exports = require("child_process");

/***/ },

/***/ "fs"
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
(module) {

module.exports = require("fs");

/***/ },

/***/ "path"
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
(module) {

module.exports = require("path");

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src/extension.ts");
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;