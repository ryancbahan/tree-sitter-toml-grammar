const root = require("path").join(__dirname, "..", "..");
let languageBinding; // Declare outside try/catch

// Determine which path to try based on Bun environment (though unlikely in VSCode)
const isBun = typeof process.versions.bun === "string";
const prebuildPath = `../../prebuilds/${process.platform}-${process.arch}/tree-sitter-toml.node`;

if (isBun) {
    console.log(`[Toml Bindings] Bun environment detected. Attempting to load prebuild: ${prebuildPath}`);
    try {
        languageBinding = require(prebuildPath);
        console.log('[Toml Bindings] Successfully loaded prebuild:', languageBinding);
    } catch (e) {
        console.error(`[Toml Bindings] Error loading prebuild (${prebuildPath}):`, e);
        languageBinding = { language: {} }; // Simulate failure
    }
} else {
    console.log(`[Toml Bindings] Node environment detected. Attempting to load via node-gyp-build from root: ${root}`);
    try {
        languageBinding = require("node-gyp-build")(root);
        console.log('[Toml Bindings] Successfully loaded via node-gyp-build:', languageBinding);
    } catch (e) {
        console.error('[Toml Bindings] Error loading native module via node-gyp-build:', e);
        // Attempt to load prebuild as a fallback if node-gyp-build fails
        console.log(`[Toml Bindings] node-gyp-build failed. Attempting prebuild fallback: ${prebuildPath}`);
        try {
            languageBinding = require(prebuildPath);
             console.log('[Toml Bindings] Successfully loaded prebuild fallback:', languageBinding);
        } catch (prebuildError) {
            console.error(`[Toml Bindings] Error loading prebuild fallback (${prebuildPath}):`, prebuildError);
             languageBinding = { language: {} }; // Simulate final failure
        }
    }
}

// Check the loaded object immediately
if (!languageBinding || !languageBinding.language || Object.keys(languageBinding.language).length === 0 && languageBinding.language.constructor === Object) {
     console.error('[Toml Bindings] CRITICAL: Loaded object is missing or has an empty/invalid language property:', JSON.stringify(languageBinding));
     // Assign a clearly identifiable dummy object for debugging if it failed
     if (!languageBinding) languageBinding = {};
     languageBinding.language = { loadError: "Failed to load native module" };
} else {
    console.log('[Toml Bindings] Native language object appears valid after loading.');
}


try {
  // Use languageBinding consistently
  languageBinding.nodeTypeInfo = require("../../src/node-types.json");
  console.log('[Toml Bindings] nodeTypeInfo loaded successfully.');
} catch (_) {
  console.warn('[Toml Bindings] Failed to load node-types.json (this might be expected).');
}

module.exports = languageBinding; // Export the result
