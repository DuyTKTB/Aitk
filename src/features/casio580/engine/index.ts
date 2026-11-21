/**
 * Module Core Math Evaluation Engine cho Casio fx-580VN X
 */

export * from './errors';
export * from './fraction';
export * from './decimal';
export * from './result';
export * from './evaluator';
export * from './trig';
export * from './logarithm';
export * from './complex';

import { CoreMathEngine, EvaluationContext } from './evaluator';
import { CalculationResult } from './result';

/**
 * Hàm tiện ích tính toán nhanh một chuỗi biểu thức toán học
 */
export function calculate(expression: string, context?: EvaluationContext): CalculationResult {
  const engine = new CoreMathEngine(context);
  return engine.evaluateExpression(expression);
}
