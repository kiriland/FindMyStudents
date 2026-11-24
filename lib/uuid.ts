const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Whether `value` is a lowercase UUID, such as a Cognito `sub` or a `randomUUID()`. */
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}
