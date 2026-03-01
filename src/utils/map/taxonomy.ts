export const TAXONOMY_KEYS = [
  "mass_shooting",
  "domestic_violence",
  "child_involved",
  "officer_involved",
] as const;

export type TaxonomyKey = (typeof TAXONOMY_KEYS)[number];

export interface TaxonomyDefinition {
  key: TaxonomyKey;
  label: string;
  hint: string;
}

export const TAXONOMY_DEFINITIONS: TaxonomyDefinition[] = [
  {
    key: "mass_shooting",
    label: "Mass Shooting",
    hint: "4+ killed or explicit mass-shooting flag",
  },
  {
    key: "domestic_violence",
    label: "Domestic Violence",
    hint: "Domestic-violence related incidents",
  },
  {
    key: "child_involved",
    label: "Child Involved",
    hint: "Child victim/participant signal",
  },
  {
    key: "officer_involved",
    label: "Officer Involved",
    hint: "Police/officer involvement signal",
  },
];

const toRecord = (feature: GeoJSON.Feature): Record<string, unknown> => {
  const props = feature.properties;
  if (!props || typeof props !== "object") return {};
  return props as Record<string, unknown>;
};

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter((item) => item.length > 0);
  }

  if (typeof value === "string") {
    return value
      .split(/[\n|;,]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  return [];
};

const characteristicTokens = (props: Record<string, unknown>): string[] => {
  const keys = [
    "incident_characteristics",
    "incident_characteristics1",
    "incident_characteristics2",
    "characteristics",
    "characteristic",
  ];

  return keys
    .flatMap((key) => toStringArray(props[key]))
    .map((token) => token.toLowerCase());
};

const hasCharacteristic = (
  props: Record<string, unknown>,
  patterns: RegExp[]
): boolean => {
  const tokens = characteristicTokens(props);
  if (tokens.length === 0) return false;
  return tokens.some((token) => patterns.some((pattern) => pattern.test(token)));
};

const getNumber = (value: unknown): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) return null;
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }

  return null;
};

const getBoolean = (value: unknown): boolean | null => {
  if (typeof value === "boolean") return value;

  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "1.0", "true", "yes", "y"].includes(normalized)) return true;
    if (["0", "0.0", "false", "no", "n"].includes(normalized)) return false;
  }

  return null;
};

const pickFirstBoolean = (
  props: Record<string, unknown>,
  keys: string[]
): boolean | null => {
  for (const key of keys) {
    const parsed = getBoolean(props[key]);
    if (parsed !== null) return parsed;
  }
  return null;
};

const pickFirstNumber = (
  props: Record<string, unknown>,
  keys: string[]
): number | null => {
  for (const key of keys) {
    const parsed = getNumber(props[key]);
    if (parsed !== null) return parsed;
  }
  return null;
};

export const featureMatchesTaxonomy = (
  feature: GeoJSON.Feature,
  key: TaxonomyKey
): boolean => {
  const props = toRecord(feature);

  if (key === "mass_shooting") {
    const explicit = pickFirstBoolean(props, [
      "mass_shooting",
      "is_mass_shooting",
      "massshooting",
      "mass_shooting_incident",
    ]);
    if (explicit !== null) return explicit;

    const fromCharacteristics = hasCharacteristic(props, [
      /\bmass\s+shooting\b/i,
      /\bmass\s+murder\b/i,
    ]);
    if (fromCharacteristics) return true;

    const killed = pickFirstNumber(props, ["n_killed", "killed", "fatalities"]);
    if (killed !== null) return killed >= 4;

    return false;
  }

  if (key === "domestic_violence") {
    const explicit = pickFirstBoolean(props, [
      "domestic_violence",
      "is_domestic_violence",
      "dv",
      "domestic",
    ]);
    if (explicit !== null) return explicit;

    return hasCharacteristic(props, [
      /\bdomestic\b/i,
      /\bfamily\b/i,
      /\bintimate\s+partner\b/i,
      /\bspouse\b/i,
    ]);
  }

  if (key === "child_involved") {
    const explicit = pickFirstBoolean(props, [
      "child_involved",
      "children",
      "child_present",
      "involves_child",
    ]);
    if (explicit !== null) return explicit;

    const childParticipants = pickFirstNumber(props, [
      "n_participants_child",
      "participants_child",
      "children_count",
      "n_child",
    ]);
    if (childParticipants !== null) return childParticipants > 0;

    const fromCharacteristics = hasCharacteristic(props, [
      /\bchild\b/i,
      /\bchildren\b/i,
      /\bteen\b/i,
      /\bjuvenile\b/i,
      /\bminor\b/i,
      /\bschool\b/i,
    ]);
    if (fromCharacteristics) return true;

    const age = pickFirstNumber(props, ["age", "victim_age", "min_victim_age"]);
    if (age !== null) return age < 18;

    return false;
  }

  if (key === "officer_involved") {
    const explicit = pickFirstBoolean(props, [
      "officer_involved",
      "police_involved",
      "law_enforcement_involved",
      "involves_officer",
    ]);
    if (explicit !== null) return explicit;

    const fromCharacteristics = hasCharacteristic(props, [
      /\bofficer\b/i,
      /\bpolice\b/i,
      /\blaw\s+enforcement\b/i,
      /\bdeputy\b/i,
      /\bstate\s+trooper\b/i,
    ]);

    if (fromCharacteristics) return true;

    const participantType = toStringArray(
      props.participant_type || props.participant_status
    )
      .join(" ")
      .toLowerCase();
    if (participantType) {
      return /\bofficer\b|\bpolice\b|\blaw\s+enforcement\b/i.test(
        participantType
      );
    }

    return false;
  }

  return false;
};

export const filterGeoJSONByTaxonomy = (
  data: GeoJSON.FeatureCollection | null,
  selectedTaxonomy: string[]
): GeoJSON.FeatureCollection | null => {
  if (!data) return null;

  const keys = selectedTaxonomy.filter((key): key is TaxonomyKey =>
    TAXONOMY_KEYS.includes(key as TaxonomyKey)
  );

  if (keys.length === 0) return data;

  return {
    type: "FeatureCollection",
    features: data.features.filter((feature) =>
      keys.every((key) => featureMatchesTaxonomy(feature, key))
    ),
  };
};

export const getTaxonomyCounts = (
  data: GeoJSON.FeatureCollection | null
): Record<TaxonomyKey, number> => {
  const initial: Record<TaxonomyKey, number> = {
    mass_shooting: 0,
    domestic_violence: 0,
    child_involved: 0,
    officer_involved: 0,
  };

  if (!data) return initial;

  data.features.forEach((feature) => {
    TAXONOMY_KEYS.forEach((key) => {
      if (featureMatchesTaxonomy(feature, key)) {
        initial[key] += 1;
      }
    });
  });

  return initial;
};
