import { Vector, VectorValue } from './Vector';
import { VectorId, VectorDimension } from './types';
import { Decimal } from '../../engine/decimal';
import { AngleUnit } from '../../engine/trig';
import { MathError } from '../../engine/errors';

/**
 * Quản lý chế độ tính toán Véc-tơ (Mode 5: Vector) chuẩn Casio fx-580VN X
 */
export class VectorMode {
  private vectors: Map<VectorId, Vector> = new Map();

  constructor() {
    // Khởi tạo các véc-tơ rỗng
  }

  public defineVector(
    id: VectorId,
    dimensionOrData: VectorDimension | VectorValue[],
    initialData?: VectorValue[]
  ): Vector {
    if (Array.isArray(dimensionOrData)) {
      const vct = Vector.fromArray(dimensionOrData);
      this.vectors.set(id, vct);
      return vct;
    }
    if (initialData) {
      const vct = Vector.fromArray(initialData);
      this.vectors.set(id, vct);
      return vct;
    }
    const vct = new Vector(dimensionOrData);
    this.vectors.set(id, vct);
    return vct;
  }

  public setVector(id: VectorId, vector: Vector): void {
    this.vectors.set(id, vector);
  }

  public getVector(id: VectorId): Vector {
    const v = this.vectors.get(id);
    if (!v) {
      throw new MathError({
        code: 'UNDEFINED_VARIABLE',
        message: `Véc-tơ ${id} chưa được định nghĩa`
      });
    }
    return v;
  }

  public hasVector(id: VectorId): boolean {
    return this.vectors.has(id);
  }

  public setComponent(id: VectorId, index: number, value: VectorValue): void {
    const current = this.getVector(id);
    const updated = current.set(index, value);
    this.vectors.set(id, updated);
  }

  public add(id1: VectorId, id2: VectorId): Vector {
    const v1 = this.getVector(id1);
    const v2 = this.getVector(id2);
    const result = v1.add(v2);
    this.vectors.set('VctAns', result);
    return result;
  }

  public sub(id1: VectorId, id2: VectorId): Vector {
    const v1 = this.getVector(id1);
    const v2 = this.getVector(id2);
    const result = v1.sub(v2);
    this.vectors.set('VctAns', result);
    return result;
  }

  public mulScalar(id: VectorId, scalar: VectorValue): Vector {
    const v = this.getVector(id);
    const result = v.mulScalar(scalar);
    this.vectors.set('VctAns', result);
    return result;
  }

  public dot(id1: VectorId, id2: VectorId): Decimal {
    const v1 = this.getVector(id1);
    const v2 = this.getVector(id2);
    return v1.dot(v2);
  }

  public cross(id1: VectorId, id2: VectorId): Vector {
    const v1 = this.getVector(id1);
    const v2 = this.getVector(id2);
    const result = v1.cross(v2);
    this.vectors.set('VctAns', result);
    return result;
  }

  public magnitude(id: VectorId): Decimal {
    const v = this.getVector(id);
    return v.magnitude();
  }

  public angle(id1: VectorId, id2: VectorId, unit: AngleUnit = 'DEG'): Decimal {
    const v1 = this.getVector(id1);
    const v2 = this.getVector(id2);
    return v1.angle(v2, unit);
  }

  public unitVector(id: VectorId): Vector {
    const v = this.getVector(id);
    const result = v.unitVector();
    this.vectors.set('VctAns', result);
    return result;
  }
}
