import XCTest
import SwiftTreeSitter
import TreeSitterToml

final class TreeSitterTomlTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_toml())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Toml grammar")
    }
}
