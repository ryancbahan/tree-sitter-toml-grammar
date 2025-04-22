/**
 * @file Toml grammar for tree-sitter
 * @author Ryan Bahan
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "toml",

  rules: {
    // TODO: add the actual grammar rules
    source_file: $ => "hello"
  }
});
