; Comments
(comment) @comment

; Punctuation
"[" @punctuation.bracket
"]" @punctuation.bracket
"[[" @punctuation.bracket
"]]" @punctuation.bracket
"{" @punctuation.bracket
"}" @punctuation.bracket
"." @punctuation.delimiter
"," @punctuation.delimiter
"=" @operator

; Values
(string) @string
; TODO: Consider specific escapes later if needed: (_escape_sequence) @string.escape
(integer) @number
(float) @number
(boolean) @boolean
(date_time) @string.special ; Dates are often special strings

; Keys & Tables

; Default for bare keys (will be overridden by context)
(bare_key) @property

; Default for quoted keys (will be overridden by context)
(quoted_key (string)) @string.quoted.property

; Keys specifically in key-value pairs
(key_value key: (key (bare_key)) @property)
(key_value key: (key (quoted_key (string))) @string.quoted.property)
(key_value key: (key (dotted_key)) @property) ; Apply property to whole dotted key here

; Highlight parts of dotted keys within key-value context
(key_value key: (key (dotted_key table_key: (key) @property member_key: (bare_key))) @property)
(key_value key: (key (dotted_key table_key: (key) @property member_key: (quoted_key (string)))) @string.quoted.property)

; Table names (higher priority than key_value keys)
(table name: (key (bare_key)) @namespace)
(table name: (key (quoted_key (string))) @namespace)
(table name: (key (dotted_key)) @namespace) ; Apply namespace to whole dotted key here

; Highlight parts of dotted keys within table context
(table name: (key (dotted_key table_key: (key) @namespace member_key: (bare_key))) @namespace)
(table name: (key (dotted_key table_key: (key) @namespace member_key: (quoted_key (string)))) @namespace)

; Array of Table names (higher priority than key_value keys)
(array_of_tables name: (key (bare_key)) @namespace)
(array_of_tables name: (key (quoted_key (string))) @namespace)
(array_of_tables name: (key (dotted_key)) @namespace) ; Apply namespace to whole dotted key here

; Highlight parts of dotted keys within array_of_tables context
(array_of_tables name: (key (dotted_key table_key: (key) @namespace member_key: (bare_key))) @namespace)
(array_of_tables name: (key (dotted_key table_key: (key) @namespace member_key: (quoted_key (string)))) @namespace) 