/**
 * AI blog generator configuration.
 *
 * Each knob is an ordered option list whose FIRST entry is the default. It is
 * the single source of truth for both the admin <select> (key + label) and how
 * the generator interprets a stored value. An unknown or blank stored value
 * resolves to the first entry, so a bad settings row can never break a run.
 *
 * Framework-agnostic: no DB or network imports here.
 */

export interface Option {
  key: string;
  label: string;
}

export interface ToneOption extends Option {
  phrase: string;
}
export interface LengthOption extends Option {
  words: string;
  maxTokens: number;
}
export interface AudienceOption extends Option {
  phrase: string;
}
export interface CreativityOption extends Option {
  temperature: number;
}

export const TONES: ToneOption[] = [
  { key: "practical", label: "Practical", phrase: "practical and down-to-earth, focused on actionable advice" },
  { key: "warm", label: "Warm", phrase: "warm and encouraging, like a trusted mentor" },
  { key: "authoritative", label: "Authoritative", phrase: "authoritative and confident, grounded in experience" },
  { key: "conversational", label: "Conversational", phrase: "conversational and approachable, as if talking to a friend" },
];

export const LENGTHS: LengthOption[] = [
  { key: "standard", label: "Standard (500-800 words)", words: "500 to 800 words", maxTokens: 2200 },
  { key: "short", label: "Short (350-500 words)", words: "350 to 500 words", maxTokens: 1500 },
  { key: "indepth", label: "In-depth (900-1300 words)", words: "900 to 1300 words", maxTokens: 3600 },
];

export const AUDIENCES: AudienceOption[] = [
  { key: "both", label: "Everyone", phrase: "Adventist business owners and the wider community alike" },
  { key: "businessOwners", label: "Business owners", phrase: "Adventist business owners and entrepreneurs" },
  { key: "community", label: "Community", phrase: "members of the Adventist community exploring business and enterprise" },
];

export const CREATIVITIES: CreativityOption[] = [
  { key: "balanced", label: "Balanced", temperature: 0.7 },
  { key: "focused", label: "Focused", temperature: 0.3 },
  { key: "exploratory", label: "Exploratory", temperature: 1.0 },
];

export const DEFAULT_TEXT_MODEL = "claude-sonnet-5";
export const GUIDANCE_MAX_CHARS = 600;

// Curated, evergreen topics — no time-sensitive legal or price specifics. The
// generator rotates through these; an admin can override the list in settings.
export const DEFAULT_TOPICS: string[] = [
  "Building a business on Christian values",
  "Balancing faith, family, and entrepreneurship",
  "Ethical leadership in a small business",
  "Networking and building relationships within a faith community",
  "Stewardship: managing business finances wisely",
  "Serving your community through your business",
  "Keeping a healthy work-life rhythm as a business owner",
  "Building trust and integrity with customers",
  "Marketing your small business authentically",
  "Mentorship and supporting the next generation of entrepreneurs",
  "Turning a skill or calling into a business",
  "Resilience and perseverance through business challenges",
  "Collaboration over competition among local businesses",
  "Generosity and giving back as a business owner",
  "Hiring and leading a team with care",
  "Customer service as a form of service to others",
  "The basics of starting a business in the Cayman Islands",
  "Managing stress and avoiding burnout as an owner",
  "Using simple technology to grow a small business",
  "Building a lasting family business and planning succession",
];

// Optional angles — a fresh one is applied each full pass through the topics,
// so a topic gets a different treatment each time it comes back around.
export const DEFAULT_ANGLES: string[] = [
  "a practical how-to guide",
  "a short personal reflection or story",
  "common mistakes to avoid and how to fix them",
  "a beginner-friendly primer",
  "lessons drawn from Scripture applied to business",
];

/** Resolve a stored key against an option list; blank/unknown -> first entry. */
export function resolveOption<T extends Option>(options: T[], key: string | null | undefined): T {
  const found = options.find((o) => o.key === key);
  return found ?? options[0];
}

export interface GeneratorConfig {
  tone: ToneOption;
  length: LengthOption;
  audience: AudienceOption;
  creativity: CreativityOption;
  model: string;
  guidance: string;
  topics: string[];
  angles: string[];
}

export interface RawConfig {
  tone?: string | null;
  length?: string | null;
  audience?: string | null;
  creativity?: string | null;
  model?: string | null;
  guidance?: string | null;
  topics?: string[] | null;
  angles?: string[] | null;
}

/** Turn a loosely-typed settings bag into a fully-resolved config. */
export function resolveConfig(raw: RawConfig): GeneratorConfig {
  const model = (raw.model ?? "").trim() || DEFAULT_TEXT_MODEL;
  const guidance = (raw.guidance ?? "").trim().slice(0, GUIDANCE_MAX_CHARS);
  const topics = raw.topics && raw.topics.length ? raw.topics : DEFAULT_TOPICS;
  const angles = raw.angles && raw.angles.length ? raw.angles : DEFAULT_ANGLES;
  return {
    tone: resolveOption(TONES, raw.tone),
    length: resolveOption(LENGTHS, raw.length),
    audience: resolveOption(AUDIENCES, raw.audience),
    creativity: resolveOption(CREATIVITIES, raw.creativity),
    model,
    guidance,
    topics,
    angles,
  };
}

/** Rotate topics by how many AI posts already exist. */
export function selectTopic(topics: string[], aiPostCount: number): string {
  if (topics.length === 0) return DEFAULT_TOPICS[0];
  return topics[aiPostCount % topics.length];
}

/** Advance one angle per FULL pass through the topics (topic x angle coverage). */
export function selectAngle(angles: string[], aiPostCount: number, topicCount: number): string | null {
  if (angles.length === 0 || topicCount === 0) return null;
  const pass = Math.floor(aiPostCount / topicCount);
  return angles[pass % angles.length];
}
