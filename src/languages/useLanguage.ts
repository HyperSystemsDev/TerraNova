import { useMemo } from "react";
import type { LanguageDefinition, FieldTransform, LanguageId } from "./types";
import { terranovaLanguage } from "./terranova";
import { hytaleLanguage } from "./hytale";
import { useSettingsStore } from "@/stores/settingsStore";

const LANGUAGES: Record<LanguageId, LanguageDefinition> = {
  terranova: terranovaLanguage,
  hytale: hytaleLanguage,
};

export interface LanguageHelpers {
  language: LanguageDefinition;
  getTypeDisplayName: (internalType: string) => string;
  getFieldDisplayName: (typeName: string, fieldKey: string) => string;
  getFieldTransform: (typeName: string, fieldKey: string) => FieldTransform | null;
  isTypeVisible: (typeName: string) => boolean;
  matchesSearch: (typeName: string, query: string) => boolean;
}

function buildHelpers(lang: LanguageDefinition): LanguageHelpers {
  const getTypeDisplayName = (internalType: string): string =>
    lang.typeDisplayNames[internalType] ?? internalType;

  const getFieldDisplayName = (typeName: string, fieldKey: string): string => {
    const transform = lang.fieldTransforms[typeName]?.[fieldKey];
    if (transform) return transform.displayName;
    return lang.fieldDisplayNames[typeName]?.[fieldKey] ?? fieldKey;
  };

  const getFieldTransform = (typeName: string, fieldKey: string): FieldTransform | null =>
    lang.fieldTransforms[typeName]?.[fieldKey] ?? null;

  const isTypeVisible = (typeName: string): boolean =>
    !lang.hiddenTypes.has(typeName);

  const matchesSearch = (typeName: string, query: string): boolean => {
    const lq = query.toLowerCase();
    if (typeName.toLowerCase().includes(lq)) return true;
    const displayName = getTypeDisplayName(typeName);
    if (displayName.toLowerCase().includes(lq)) return true;
    return false;
  };

  return { language: lang, getTypeDisplayName, getFieldDisplayName, getFieldTransform, isTypeVisible, matchesSearch };
}

/** Non-hook version for use outside React components. */
export function getLanguageHelpers(langId?: LanguageId): LanguageHelpers {
  const id = langId ?? useSettingsStore.getState().language;
  return buildHelpers(LANGUAGES[id]);
}

/** React hook that returns memoized language helpers. */
export function useLanguage(): LanguageHelpers {
  const langId = useSettingsStore((s) => s.language);
  return useMemo(() => buildHelpers(LANGUAGES[langId]), [langId]);
}
