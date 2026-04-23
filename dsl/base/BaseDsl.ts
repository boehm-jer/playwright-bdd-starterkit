export abstract class BaseDsl {
  abstract navigate(url: string): Promise<void>;
  abstract getTitle(): Promise<string>;
  abstract getUrl(): Promise<string>;
}
