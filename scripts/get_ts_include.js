const path = require('path');

try {
  // Resolve the main tree-sitter module path
  const tsModulePath = require.resolve('tree-sitter/package.json');
  // Construct the path to the include directory relative to the package.json
  const tsIncludePath = path.join(path.dirname(tsModulePath), 'include');
  console.log(tsIncludePath);
} catch (e) {
  console.error("Error: Could not resolve tree-sitter include path. Ensure 'tree-sitter' is installed.");
  process.exit(1);
} 