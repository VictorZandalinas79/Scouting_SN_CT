import { NormalizedPlayerDTO } from '../types';

export interface BaseNormalizer<RawFormat> {
  normalize(raw: RawFormat): NormalizedPlayerDTO;
}
