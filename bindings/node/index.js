const fs = require('fs');
const path = require('path');

let languageBinding;

// Construct the path to the prebuilt binary
const platform = process.platform;
const arch = process.arch;
const prebuildDir = path.join(__dirname, '..', '..', 'prebuilds', `${platform}-${arch}`);
// const prebuildFile = path.join(prebuildDir, 'node.napi.node'); // Old conventional name
const prebuildFileName = 'tree-sitter-toml-grammar.node'; // Use the actual name generated/published
const prebuildFile = path.join(prebuildDir, prebuildFileName);

console.log(`[Toml Bindings] Checking for prebuild at: ${prebuildFile}`);

if (fs.existsSync(prebuildFile)) {
    console.log(`[Toml Bindings] Prebuild found. Attempting to load directly.`);
    try {
        languageBinding = require(prebuildFile);
        console.log('[Toml Bindings] Successfully loaded prebuild directly:', languageBinding);
    } catch (e) {
        console.error(`[Toml Bindings] Error loading prebuild directly (${prebuildFile}):`, e);
        languageBinding = { language: { loadError: "Failed loading prebuild" } };
    }
} else {
    console.error(`[Toml Bindings] Prebuild not found at ${prebuildFile}. Cannot load native module. Please ensure prebuilds were generated and included.`);
    // Attempt fallback to node-gyp-build ONLY as a last resort during development/local linking?
    // For published package, this path should generally not be hit if prebuilds are correct.
    console.warn('[Toml Bindings] Attempting node-gyp-build as fallback (likely to fail in packaged extension)... ');
    try {
        const root = path.join(__dirname, "..", "..");
        languageBinding = require("node-gyp-build")(root);
         console.log('[Toml Bindings] Fallback load via node-gyp-build result:', languageBinding);
    } catch (e) {
        console.error('[Toml Bindings] Error loading with node-gyp-build fallback:', e);
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
     console.error('[Toml Bindings] CRITICAL: Loaded object is missing or has an invalid language property:', JSON.stringify(languageBinding));
     // Ensure object exists before modifying
     if (!languageBinding) languageBinding = {};
     if (!languageBinding.hasOwnProperty('language') || typeof languageBinding.language !== 'object' || languageBinding.language === null) languageBinding.language = {};
     languageBinding.language.loadError = "Failed to load native module or module invalid after require";
} else {
    console.log('[Toml Bindings] Native language object appears valid after loading attempt.');
}


try {
  languageBinding.nodeTypeInfo = require("../../src/node-types.json");
  console.log('[Toml Bindings] nodeTypeInfo loaded successfully.');
} catch (_) {
  console.warn('[Toml Bindings] Failed to load node-types.json (this might be expected).');
}

module.exports = languageBinding;
