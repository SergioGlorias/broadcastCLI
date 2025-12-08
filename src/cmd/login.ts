import { exit } from "node:process";
import { createInterface } from "node:readline";
import {
  saveCredentials,
  clearCredentials,
  fetchTokenScopes,
} from "../utils/credentials";
import cl from "../utils/colors";

export const loginCommand = async (args: string[]): Promise<void> => {
  // Check if logout is requested
  if (args.includes("--logout") || args.includes("-lo")) {
    try {
      clearCredentials();
      console.log(
        cl.green("✓ Credentials cleared successfully. You are now logged out."),
      );
      return;
    } catch (error) {
      console.error(cl.red("Error clearing credentials:"), error);
      exit(1);
    }
  }

  try {
    // Filter out flags to get positional arguments
    const positionalArgs = args.filter((arg) => !arg.startsWith("-"));
    let token = positionalArgs[0];
    let domain = positionalArgs[1] || "https://lichess.org";

    // If no token provided as argument, prompt interactively
    if (!token) {
      const readline = createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const question = (prompt: string): Promise<string> => {
        return new Promise((resolve) => {
          readline.question(prompt, (answer) => {
            resolve(answer);
          });
        });
      };

      console.log(cl.whiteBold("Lichess Token Login"));
      console.log(
        cl.blue(
          "Please enter your Lichess token \n" +
            "You can generate one at https://lichess.org/account/oauth/token/create?scopes[]=study:write&scopes[]=study:read&scopes[]=web:mod&description=Broadcast+CLI",
        ),
      );
      console.log("");

      token = await question(cl.whiteBold("Lichess Token: "));

      if (!token?.trim()) {
        console.error(cl.red("Error: Token cannot be empty."));
        readline.close();
        exit(1);
      }

      if (!token.startsWith("lip_")) {
        console.error(
          cl.red(
            "Error: Invalid token format. Token must start with 'lip_'. Please check your token.",
          ),
        );
        readline.close();
        exit(1);
      }

      domain =
        (await question(
          cl.whiteBold("Lichess Domain (default: https://lichess.org): "),
        )) || "https://lichess.org";

      readline.close();
    } else {
      // Token provided as argument - validate it
      if (!token.startsWith("lip_")) {
        console.error(
          cl.red(
            "Error: Invalid token format. Token must start with 'lip_'. Please check your token.",
          ),
        );
        exit(1);
      }
    }

    // Normalize domain
    domain = domain.replace(/\/$/, "");

    // Check if validation should be skipped
    const skipValidation = args.includes("--skip-validation");

    // Fetch token scopes
    let scopes: string[] = [];
    if (!skipValidation) {
      console.log(cl.blue("Validating token and fetching scopes..."));
      try {
        scopes = await fetchTokenScopes(token, domain);
        console.log(
          cl.green(`✓ Token valid with scopes: ${scopes.join(", ")}`),
        );
      } catch (error) {
        console.error(
          cl.red(
            `Error: Failed to validate token: ${error instanceof Error ? error.message : String(error)}`,
          ),
        );
        exit(1);
      }
    } else {
      console.log(cl.blue("Skipping token validation..."));
    }

    saveCredentials({
      lichessToken: token,
      lichessDomain: domain,
      scopes: scopes,
    });

    console.log("");
    console.log(
      cl.green(
        "✓ Credentials saved successfully! You can now use the CLI without setting environment variables.",
      ),
    );
  } catch (error) {
    console.error(cl.red("Error during login:"), error);
    exit(1);
  }
};
