import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const CONFIG_DIR = join(homedir(), ".libroadcast");
const CREDENTIALS_FILE = join(CONFIG_DIR, "credentials.json");

interface Credentials {
  lichessToken: string;
  lichessDomain?: string;
  scopes?: string[];
}

/**
 * Ensures the config directory exists
 */
const ensureConfigDir = () => {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
};

/**
 * Get credentials from the credentials file
 */
export const getStoredCredentials = (): Credentials | null => {
  try {
    if (!existsSync(CREDENTIALS_FILE)) {
      return null;
    }
    const content = readFileSync(CREDENTIALS_FILE, "utf-8");
    return JSON.parse(content) as Credentials;
  } catch (error) {
    return null;
  }
};

/**
 * Save credentials to the credentials file
 */
export const saveCredentials = (credentials: Credentials): void => {
  ensureConfigDir();
  writeFileSync(
    CREDENTIALS_FILE,
    JSON.stringify(credentials, null, 2),
    "utf-8",
  );
};

/**
 * Clear stored credentials
 */
export const clearCredentials = (): void => {
  try {
    if (existsSync(CREDENTIALS_FILE)) {
      const fs = require("node:fs");
      fs.unlinkSync(CREDENTIALS_FILE);
    }
  } catch (error) {
    // Ignore errors when clearing
  }
};

/**
 * Fetch token scopes from Lichess API
 */
export const fetchTokenScopes = async (
  token: string,
  domain: string,
): Promise<string[]> => {
  try {
    // Ensure domain ends with /
    const normalizedDomain = domain.replace(/\/$/, "") + "/";
    const url = `${normalizedDomain}api/token/test`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: token,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = (await response.json()) as Record<string, { scopes: string }>;
    const scopes = data[token]?.scopes;
    return scopes ? scopes.split(",").map((s) => s.trim()) : [];
  } catch (error) {
    throw new Error(
      `Failed to fetch token scopes: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
