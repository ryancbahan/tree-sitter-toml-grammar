const fs = require('fs');
const path = require('path');
const napi = require('node-addon-api'); // Require node-addon-api

let languageBinding;

// Construct the path to the prebuilt binary
const platform = process.platform;
const arch = process.arch;
const prebuildDir = path.join(__dirname, '..', '..', 'prebuilds', `${platform}-${arch}`);
// const prebuildFile = path.join(prebuildDir, 'node.napi.node'); // Old conventional name
const prebuildFileName = 'tree-sitter-toml-grammar.node'; // Use the actual name generated/published
const prebuildFile = path.join(prebuildDir, prebuildFileName);

console.log(`[Toml Bindings - NAPI Load] Checking for prebuild at: ${prebuildFile}`);

if (fs.existsSync(prebuildFile)) {
    console.log(`[Toml Bindings - NAPI Load] Prebuild found. Attempting to load via napi.load.`);
    try {
        // Use napi.load, providing the directory as context
        languageBinding = napi.load(prebuildDir, prebuildFileName);
        console.log('[Toml Bindings - NAPI Load] Successfully loaded prebuild via napi.load. Result:', languageBinding);
        // Explicitly log the language property if it exists
        if (languageBinding && languageBinding.language) {
            console.log('[Toml Bindings - NAPI Load] language property after load:', languageBinding.language);
        } else {
            console.log('[Toml Bindings - NAPI Load] language property MISSING after load.');
        }
    } catch (e) {
        console.error(`[Toml Bindings - NAPI Load] Error loading prebuild via napi.load (${prebuildFile}):`, e);
        languageBinding = { language: { loadError: "Failed loading prebuild via NAPI load" } };
    }
} else {
    console.error(`[Toml Bindings - NAPI Load] Prebuild not found at ${prebuildFile}. Cannot load native module.`);
    // Attempt fallback to node-gyp-build ONLY as a last resort during development/local linking?
    // For published package, this path should generally not be hit if prebuilds are correct.
    console.warn('[Toml Bindings - NAPI Load] Attempting node-gyp-build as fallback (likely to fail in packaged extension)... ');
    try {
        const root = path.join(__dirname, "..", "..");
        languageBinding = require("node-gyp-build")(root);
         console.log('[Toml Bindings - NAPI Load] Fallback load via node-gyp-build result:', languageBinding);
    } catch (e) {
        console.error('[Toml Bindings - NAPI Load] Error loading with node-gyp-build fallback:', e);
        languageBinding = { language: { loadError: "Prebuild missing and node-gyp-build fallback failed" } };
    }
}

// Improved check for validity
const isLanguagePropertyInvalid = !languageBinding ||
                                 !languageBinding.hasOwnProperty('language') ||
                                 (typeof languageBinding.language === 'object' &&
                                  languageBinding.language !== null &&
                                  Object.keys(languageBinding.language).length === 0 &&
                                  languageBinding.language.constructor === Object) ||
                                 (languageBinding.language && languageBinding.language.loadError); // Check our custom error

if (isLanguagePropertyInvalid) {
     console.error('[Toml Bindings - NAPI Load] CRITICAL: Native module loading failed or produced invalid object. Final binding:', JSON.stringify(languageBinding));
     // Ensure object exists before modifying
     if (!languageBinding) languageBinding = {};
     if (!languageBinding.hasOwnProperty('language') || typeof languageBinding.language !== 'object' || languageBinding.language === null) languageBinding.language = {};
     // Add error marker if not already present
     if (!languageBinding.language.loadError) {
        languageBinding.language.loadError = "Invalid language object detected after load attempt";
     }
} else {
    console.log('[Toml Bindings - NAPI Load] Native language object appears valid after loading attempt.');
}


try {
  // Attempt to load nodeTypeInfo regardless, but use || {} to avoid errors if languageBinding is totally busted
  (languageBinding || {}).nodeTypeInfo = require("../../src/node-types.json");
  console.log('[Toml Bindings - NAPI Load] nodeTypeInfo loaded successfully.');
} catch (_) {
  console.warn('[Toml Bindings - NAPI Load] Failed to load node-types.json (this might be expected).');
}

module.exports = languageBinding;
