export abstract class BaseProvider<RawFormat> {
  abstract fetchRawData(query?: string): Promise<RawFormat[]>;
}
