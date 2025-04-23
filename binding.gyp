{
  "targets": [
    {
      "target_name": "tree_sitter_toml_binding",
      "dependencies": [
        "<!(node -p \"require('node-addon-api').targets\"):node_addon_api_except",
      ],
      "include_dirs": [
        "<!(node -p \"require('node-addon-api').include\")",
        "<!(node scripts/get_ts_include.js)",
        "src",
      ],
      "sources": [
        "bindings/node/binding.cc",
        "src/parser.c",
      ],
      "variables": {
        "has_scanner": "<!(node -p \"fs.existsSync('src/scanner.c')\")"
      },
      "conditions": [
        ["has_scanner=='true'", {
          "sources+": ["src/scanner.c"],
        }],
        ["OS!='win'", {
          "cflags_c": [
            "-std=c11",
          ],
          "cflags!": [
            "-fno-exceptions"
          ],
          "cflags_cc!": [
            "-fno-exceptions"
          ],
          "xcode_settings": {
            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
            "CLANG_CXX_LIBRARY": "libc++",
            "MACOSX_DEPLOYMENT_TARGET": "10.15",
          },
        }, { # OS == "win"
          "cflags_c": [
            "/std:c11",
            "/utf-8",
          ],
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": 1,
            },
          },
        }],
      ],
    }
  ]
}
