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

export type GenerateDescriptionResult =
  | { success: true; data: { description: string } }
  | {
      success: false;
      error: string;
      fieldErrors?: Partial<Record<string, string[]>>;
      upgradeRequired?: boolean;
    };

export type ExplainCodeResult =
  | { success: true; data: { explanation: string } }
  | {
      success: false;
      error: string;
      fieldErrors?: Partial<Record<string, string[]>>;
      upgradeRequired?: boolean;
    };
