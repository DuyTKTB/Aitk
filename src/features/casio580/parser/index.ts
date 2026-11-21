/**
 * Module Parser biểu thức toán học Casio fx-580VN X
 */

export * from './ast';
export * from './tokens';
export * from './errors';
export * from './lexer';
export * from './parser';

import { Lexer } from './lexer';
import { Parser } from './parser';
import { ASTNode } from './ast';

/**
 * Hàm tiện ích phân tích nhanh chuỗi biểu thức sang cây AST
 */
export function parseExpression(expression: string): ASTNode {
  const parser = new Parser(expression);
  return parser.parse();
}

/**
 * Hàm tiện ích chuyển biểu thức thành chuỗi token
 */
export function tokenizeExpression(expression: string) {
  const lexer = new Lexer(expression);
  return lexer.tokenize();
}
