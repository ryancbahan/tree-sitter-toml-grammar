#include <tree_sitter/parser.h>
#include <wctype.h> // For iswspace
#include <stdio.h> // For debugging printf
#include <stdbool.h>
#include <string.h> // For strncmp if needed, but char comparison is likely enough

enum TokenType {
  MULTILINE_BASIC_STRING_CONTENT,
  MULTILINE_LITERAL_STRING_CONTENT,
  // ERROR_SENTINEL // Add later if needed
};

// Helper function to check if a character is horizontal whitespace (space or tab)
static inline bool is_horizontal_space(int32_t c) {
    return c == ' ' || c == '\t';
}

// Helper function to check if a character indicates a newline sequence
static inline bool is_newline(int32_t c) {
    return c == '\n' || c == '\r';
}

// Forward declarations of functions needed by tree-sitter
void *tree_sitter_toml_external_scanner_create() { return NULL; }
void tree_sitter_toml_external_scanner_destroy(void *payload) {}
unsigned tree_sitter_toml_external_scanner_serialize(void *payload, char *buffer) { return 0; }
void tree_sitter_toml_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {}

// The main scanning function
bool tree_sitter_toml_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {

  // NOTE: Initial whitespace *before* the content token starts is already skipped
  // by the main parser via the `extras` rule or by previous scanner runs.
  // The spec's "trim first newline" rule applies to the newline *immediately*
  // after the opening delimiter, which is tricky to handle here perfectly without state.
  // We focus on scanning the content *up to* the closing delimiter. Tree-sitter
  // combines adjacent tokens of the same type (like string_content), which helps.

  if (valid_symbols[MULTILINE_BASIC_STRING_CONTENT]) {
    lexer->result_symbol = MULTILINE_BASIC_STRING_CONTENT;
    bool advanced_once = false;

    while (lexer->lookahead != 0) {
      if (lexer->lookahead == '\\') {
        // Handle potential line-ending backslash or escape sequences
        lexer->advance(lexer, false); // Consume '\'
        advanced_once = true;

        if (is_newline(lexer->lookahead)) {
           // Line ending backslash: Skip newline and subsequent whitespace
           // Consume the newline (\n or \r\n)
           if (lexer->lookahead == '\r') {
                lexer->advance(lexer, false); // Consume '\r'
                if (lexer->lookahead == '\n') {
                     lexer->advance(lexer, false); // Consume '\n'
                }
           } else {
                lexer->advance(lexer, false); // Consume '\n'
           }
           // Consume horizontal whitespace on the next line
           while (is_horizontal_space(lexer->lookahead)) {
              lexer->advance(lexer, false);
           }
           // Continue scanning from the first non-whitespace char
           // The consumed content (backslash, newline, whitespace) is effectively ignored
           // by not marking the end here.
        } else {
            // Regular escape sequence or just a backslash.
            // Consume the character following the backslash.
            // Specific escape validation (\u, \U, etc.) is complex here;
            // the grammar can potentially validate later if needed, or we assume valid escapes.
            if (lexer->lookahead != 0) { // Avoid advancing past EOF
                 lexer->advance(lexer, false);
            }
        }

      } else if (lexer->lookahead == '"') {
        // Check for closing delimiter """
        lexer->mark_end(lexer); // Mark end before potential delimiter
        lexer->advance(lexer, false); // Consume first "
        if (lexer->lookahead == '"') {
          lexer->advance(lexer, false); // Consume second "
          if (lexer->lookahead == '"') {
            // Found """, end the token *before* the delimiter
            return advanced_once; // Return true only if we consumed something
          }
          // It was "" followed by something else, continue scanning
        }
        // It was just " followed by something else, continue scanning
        // We already advanced past the first ", the loop will continue
         advanced_once = true;

      } else {
        // Consume regular character
        lexer->advance(lexer, false);
        advanced_once = true;
      }
       // Mark end after consuming regular characters or escapes
       lexer->mark_end(lexer);
    }
    // EOF reached
     lexer->mark_end(lexer);
     return advanced_once; // Return true if we consumed anything before EOF

  } else if (valid_symbols[MULTILINE_LITERAL_STRING_CONTENT]) {
    lexer->result_symbol = MULTILINE_LITERAL_STRING_CONTENT;
    bool advanced_once = false;

    while (lexer->lookahead != 0) {
      if (lexer->lookahead == '\'') {
        // Check for closing delimiter '''
         lexer->mark_end(lexer); // Mark end before potential delimiter
         lexer->advance(lexer, false); // Consume first '
         if (lexer->lookahead == '\'') {
            lexer->advance(lexer, false); // Consume second '
            if (lexer->lookahead == '\'') {
                // Found ''', end the token *before* the delimiter
                return advanced_once; // Return true only if we consumed something
            }
            // It was '' followed by something else, continue scanning
         }
         // It was just ' followed by something else, continue scanning
         advanced_once = true;

      } else {
        // Consume regular character
        lexer->advance(lexer, false);
        advanced_once = true;
      }
      // Mark end after consuming characters
      lexer->mark_end(lexer);
    }
     // EOF reached
     lexer->mark_end(lexer);
     return advanced_once; // Return true if we consumed anything before EOF
  }

  return false; // No valid symbol expected
} 