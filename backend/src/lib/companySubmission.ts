export const TAG_CATEGORIES = [
  "frontend",
  "backend",
  "cloud",
  "devops",
] as const;

const MAX_TAGS = 50;

export interface CompanySubmission {
  name: string;
  uid: string | null;
  website: string | null;
  city: string;
  lat: number;
  lng: number;
  tags: { tag: string; category: string }[];
}

export class ValidationError extends Error {}

function text(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== "string" || !value.trim())
    throw new ValidationError(`${field} is required`);
  const trimmed = value.trim();
  if (trimmed.length > maxLength)
    throw new ValidationError(
      `${field} must be at most ${maxLength} characters`,
    );
  return trimmed;
}

function optionalText(
  value: unknown,
  field: string,
  maxLength: number,
): string | null {
  if (value === undefined || value === null || value === "") return null;
  return text(value, field, maxLength);
}

function coordinate(value: unknown, field: string, limit: number): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    Math.abs(value) > limit
  ) {
    throw new ValidationError(
      `${field} must be a number between -${limit} and ${limit}`,
    );
  }
  return value;
}

/** Turns an untrusted request body into a company the database can store, or throws a ValidationError. */
export function parseCompanySubmission(body: unknown): CompanySubmission {
  const input = (body ?? {}) as Record<string, unknown>;

  let website = optionalText(input.website, "website", 500);
  if (website) {
    // Rendered as a link on the profile, so only web URLs may get through (not javascript:).
    let protocol: string;
    try {
      protocol = new URL(website).protocol;
    } catch {
      throw new ValidationError("website must be a valid URL");
    }
    if (protocol !== "http:" && protocol !== "https:")
      throw new ValidationError("website must be an http(s) URL");
  }
  website = website || null;

  const rawTags = input.tags ?? [];
  if (!Array.isArray(rawTags) || rawTags.length > MAX_TAGS) {
    throw new ValidationError(
      `tags must be a list of at most ${MAX_TAGS} entries`,
    );
  }
  const tags = rawTags.map((entry) => {
    const { tag, category } = (entry ?? {}) as Record<string, unknown>;
    if (
      typeof category !== "string" ||
      !(TAG_CATEGORIES as readonly string[]).includes(category)
    ) {
      throw new ValidationError(
        `tag category must be one of: ${TAG_CATEGORIES.join(", ")}`,
      );
    }
    return { tag: text(tag, "tag", 50), category };
  });

  return {
    name: text(input.name, "name", 200),
    uid: optionalText(input.uid, "uid", 30),
    website,
    city: text(input.city, "city", 100),
    lat: coordinate(input.lat, "lat", 90),
    lng: coordinate(input.lng, "lng", 180),
    tags,
  };
}
