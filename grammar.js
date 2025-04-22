/**
 * @file Toml grammar for tree-sitter
 * @author Ryan Bahan
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// Helper function for comma-separated list (optional elements)
function sepBy(sep, rule) {
  return optional(seq(rule, repeat(seq(sep, rule))));
}

// Helper function for comma-separated list (at least one element)
function sepBy1(sep, rule) {
  return seq(rule, repeat(seq(sep, rule)));
}

module.exports = grammar({
  name: "toml",

  extras: $ => [
    $.comment,
    /\s/, // Handles spaces, tabs, non-significant newlines within values like arrays
  ],

  // Define external tokens handled by scanner.c
  externals: $ => [
    $.__multiline_basic_string_content, // Hidden
    $.__multiline_literal_string_content, // Hidden
    // Potentially add error recovery token here later
    // $.error_sentinel
  ],

  // Precedences or conflicts might arise between keys and value types (e.g., key 'true' vs boolean true)
  // Key-value pairs are given higher precedence. Dotted keys also need precedence.
  conflicts: $ => [
      // [$._simple_key, $.float], // Resolved by key_value precedence
      // [$._simple_key, $.integer], // Resolved by key_value precedence
      // [$._simple_key, $.boolean], // Resolved by key_value precedence
      // [$._simple_key, $.date_time], // Resolved by key_value precedence
      // [$.dotted_key, $.float], // Resolved by key_value precedence
      [$._multiline_basic_string, $._multiline_literal_string], // Necessary for external scanner
  ],

  rules: {
    source_file: $ => repeat(
      choice(
        // An expression followed by mandatory newline(s)
        seq($._expression, $._newline),
        // Or just newline(s) (blank lines)
        $._newline,
        // Or a comment followed by mandatory newline(s)
        seq($.comment, $._newline)
      )
    ),

    _expression: $ => choice(
      $.key_value,
      $.table,
      $.array_of_tables
    ),

    // Match one or more newlines, crucial for separating statements
    _newline: $ => /(\r?\n)+/,

    // Comment: # until newline
    comment: $ => token(prec(-1, seq('#', /[^\n]*/))), // Low precedence to avoid conflicts

    // === Key-Value Pair ===
    key_value: $ => prec(1, seq(
      field('key', $.key),
      '=',
      field('value', $._value)
    )),

    // === Keys ===
    key: $ => choice(
      $._simple_key,
      $.dotted_key
    ),

    _simple_key: $ => choice(
      $.bare_key,
      $.quoted_key
    ),

    // Bare keys: A-Za-z0-9_- , non-empty
    bare_key: $ => token(/[A-Za-z0-9_-]+/),

    // Quoted keys: Use string definitions, appear as 'string' nodes
    quoted_key: $ => choice(
      alias($._basic_string_inline, $.string),
      alias($._literal_string_inline, $.string)
    ),

    // Dotted key: key.subkey.subsubkey...
    // Using right associative precedence for easier nested parsing like a.b.c.d
     dotted_key: $ => prec.right(seq(
       field('table_key', $.key),
       '.',
       field('member_key', $._simple_key)
     )),

    // === Tables ===
    table: $ => seq(
      '[',
      field('name', $.key),
      ']'
    ),

    array_of_tables: $ => seq(
      '[[',
      field('name', $.key),
      ']]'
    ),

    // === Values ===
    _value: $ => choice(
      $.string,
      $.integer,
      $.float,
      $.boolean,
      $.date_time,
      $.array,
      $.inline_table
    ),

    // === String ===
    string: $ => choice(
      $._basic_string_inline,
      $._literal_string_inline,
      $._multiline_basic_string,
      $._multiline_literal_string
    ),

    // Basic String (single line)
    _basic_string_inline: $ => seq(
      '"',
      repeat(choice(
        token.immediate(prec(1, /[^\\"%\n]+/)), // Content (not \\, ", % or newline) - % is used by tree-sitter internally
        $._escape_sequence // Use hidden escape sequence
      )),
      '"'
    ),

    // Literal String (single line)
    _literal_string_inline: $ => seq(
      "'",
      repeat(token.immediate(prec(1, /[^'%\n]+/))), // Content (not ', % or newline)
      "'"
    ),

     // Multiline Basic String (uses external scanner)
     _multiline_basic_string: $ => seq(
       '"""',
       repeat($.__multiline_basic_string_content), // Use hidden token
       '"""'
     ),

    // Multiline Literal String (uses external scanner)
    _multiline_literal_string: $ => seq(
      "\'\'\'",
      repeat($.__multiline_literal_string_content), // Use hidden token
      "\'\'\'"
    ),

    _escape_sequence: $ => token.immediate(seq( // Renamed to hide
      '\\',
      choice(
        /[\"\\bfnrt]/, // Simple escapes
        /u[0-9a-fA-F]{4}/, // Unicode \uXXXX
        /U[0-9a-fA-F]{8}/  // Unicode \UXXXXXXXX
      )
    )),

    // === Integer ===
    // Simplified regex, external scanner might be needed for strict underscore rule
    integer: $ => token(choice(
      /[+-]?(0|[1-9](_?[0-9])*)/,
      /0x[0-9a-fA-F](_?[0-9a-fA-F])*/i,
      /0o[0-7](_?[0-7])*/,
      /0b[01](_?[01])*/
    )),

    // === Float ===
    // Simplified regex, external scanner might be needed for strict underscore rule
    float: $ => token(choice(
      seq(
        /[+-]?(0|[1-9](_?[0-9])*)/, // Integer part
        choice(
          // Fractional part is mandatory if there's a dot
          seq(/\.[0-9](_?[0-9])*/, optional(/[eE][+-]?[0-9](_?[0-9])*/)), // .Fractional + optional Exponent
           // Exponent part requires integer part first
          /[eE][+-]?[0-9](_?[0-9])*/ // Exponent only
        )
      ),
      /[+-]?(inf|nan)/ // Special floats (lowercase only)
    )),

    // === Boolean ===
    boolean: $ => token(choice('true', 'false')),

    // === Date/Time ===
    // RFC 3339 subset patterns
    date_time: $ => token(choice(
      // Offset Date-Time
      /\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})/,
      // Local Date-Time
      /\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?/,
      // Local Date
      /\d{4}-\d{2}-\d{2}/,
      // Local Time
      /\d{2}:\d{2}:\d{2}(\.\d+)?/
    )),

    // === Array ===
    // Elements separated by comma, allows newlines/comments, trailing comma ok.
    array: $ => seq(
      '[',
       optional(seq($._value, repeat(seq(',', $._value)))), // Use inlined sepBy
       optional(','), // Trailing comma
      ']'
    ),

    // === Inline Table ===
    // { key = val, key = val }, single line, no trailing comma.
    inline_table: $ => seq(
      '{',
       optional(seq($.inline_key_value, repeat(seq(',', $.inline_key_value)))), // Use inlined sepBy
       // No trailing comma allowed per spec
      '}'
    ),

    // Separate rule for key-value inside inline table for clarity if needed later
    inline_key_value: $ => seq(
      field('key', $.key),
      '=',
      field('value', $._value)
    ),
  }
});
