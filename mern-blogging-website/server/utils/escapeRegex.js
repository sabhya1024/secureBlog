/**
 * Escapes special regular expression characters in a user-provided string
 * to prevent Regular Expression Denial of Service (ReDoS) and regex syntax errors.
 *
 * @param {string} str - User-supplied search string
 * @returns {string} Sanitized string safe for new RegExp()
 */
export const escapeRegex = (str) => {
    if (typeof str !== "string") return "";
    return str.slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
