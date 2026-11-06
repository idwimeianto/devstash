export interface GenerateAutoTagsInput {
  title: string;
  content?: string;
}

export type GenerateAutoTagsResult =
  | { success: true; data: { tags: string[] } }
  | {
      success: false;
      error: string;
      fieldErrors?: Partial<Record<keyof GenerateAutoTagsInput, string[]>>;
      upgradeRequired?: boolean;
    };
