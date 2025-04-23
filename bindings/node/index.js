const fs = require('fs');
const path = require('path');
// const napi = require('node-addon-api'); // Not needed for loading

let languageBinding;

// Construct the path to the prebuilt binary
const platform = process.platform;
const arch = process.arch;
const prebuildDir = path.join(__dirname, '..', '..', 'prebuilds', `${platform}-${arch}`);
const prebuildFileName = 'tree-sitter-toml-grammar.node';
const prebuildFile = path.join(prebuildDir, prebuildFileName);

console.log(`[Toml Bindings - Direct Require] Checking for prebuild at: ${prebuildFile}`);

if (fs.existsSync(prebuildFile)) {
    console.log(`[Toml Bindings - Direct Require] Prebuild found. Attempting to load via require().`);
    try {
        // Use standard require() on the direct path
        languageBinding = require(prebuildFile);
        console.log('[Toml Bindings - Direct Require] Successfully loaded prebuild via require().');
        console.log('[Toml Bindings - Direct Require] typeof languageBinding:', typeof languageBinding);
        if (languageBinding) {
            console.log('[Toml Bindings - Direct Require] Object.keys(languageBinding):', Object.keys(languageBinding));
            console.log('[Toml Bindings - Direct Require] Object.getOwnPropertyNames(languageBinding):', Object.getOwnPropertyNames(languageBinding));
        }

        // Explicitly log the language property if it exists
        if (languageBinding && languageBinding.language) {
            console.log('[Toml Bindings - Direct Require] typeof languageBinding.language:', typeof languageBinding.language);
            console.log('[Toml Bindings - Direct Require] language property value after load:', languageBinding.language);
             try {
                 console.log('[Toml Bindings - Direct Require] Object.keys(languageBinding.language):', Object.keys(languageBinding.language));
             } catch (e) {
                 console.log('[Toml Bindings - Direct Require] Could not get keys of languageBinding.language:', e);
             }
        } else {
            console.log('[Toml Bindings - Direct Require] language property MISSING or falsy after load.');
        }
    } catch (e) {
        console.error(`[Toml Bindings - Direct Require] Error loading prebuild via require() (${prebuildFile}):`, e);
        languageBinding = { language: { loadError: "Failed loading prebuild via require()" } };
    }
} else {
    console.error(`[Toml Bindings - Direct Require] Prebuild not found at ${prebuildFile}. Cannot load native module.`);
    // Fallback logic remains the same
    console.warn('[Toml Bindings - Direct Require] Attempting node-gyp-build as fallback... ');
    try {
        const root = path.join(__dirname, "..", "..");
        languageBinding = require("node-gyp-build")(root); // Still need this dependency for the install script
         console.log('[Toml Bindings - Direct Require] Fallback load via node-gyp-build result:', languageBinding);
    } catch (e) {
        console.error('[Toml Bindings - Direct Require] Error loading with node-gyp-build fallback:', e);
        languageBinding = { language: { loadError: "Prebuild missing and node-gyp-build fallback failed" } };
    }
}

// Improved check for validity - checking specifically for the loadError property we add
const isLanguagePropertyInvalid = !languageBinding ||
                                 !languageBinding.hasOwnProperty('language') ||
                                 (languageBinding.language && languageBinding.language.loadError);

if (isLanguagePropertyInvalid) {
     console.error('[Toml Bindings - Direct Require] CRITICAL: Native module loading failed or produced invalid object. Final binding:', JSON.stringify(languageBinding));
     // Ensure object exists before modifying
     if (!languageBinding) languageBinding = {};
     if (!languageBinding.hasOwnProperty('language') || typeof languageBinding.language !== 'object' || languageBinding.language === null) languageBinding.language = {};
     // Add error marker if not already present
     if (!languageBinding.language.loadError) {
        languageBinding.language.loadError = "Invalid language object detected after load attempt";
     }
} else {
    console.log('[Toml Bindings - Direct Require] Native language object appears valid after loading attempt.');
}


try {
  // Attempt to load nodeTypeInfo regardless, but use || {} to avoid errors if languageBinding is totally busted
  (languageBinding || {}).nodeTypeInfo = require("../../src/node-types.json");
  console.log('[Toml Bindings - Direct Require] nodeTypeInfo loaded successfully.');
} catch (_) {
  console.warn('[Toml Bindings - Direct Require] Failed to load node-types.json (this might be expected).');
}

module.exports = languageBinding;
