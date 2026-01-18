type Result<T, E = Error> =
    | { data: T; error: null }
    | { data: null; error: E };

export function tryCatch<T>(fn: () => T): Result<T> {
    try {
        return { data: fn(), error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
}