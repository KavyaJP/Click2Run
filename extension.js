const vscode = require("vscode");

// A Map to store our button disposables so we can clean up properly.
const buttonDisposables = new Map();
let terminal;

/**
 * This is the main function that runs when your extension is activated.
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // --- REGISTER THE COMMANDS ---
  // These commands are defined in package.json and can be run from the Command Palette.

  // Command to guide the user through adding a new button
  const addButtonCommand = vscode.commands.registerCommand(
    "click2run.addButton",
    async () => {
      // Prompt for button details.
      const text = await vscode.window.showInputBox({
        prompt: "Button Text (e.g., $(play) Start Server)",
        placeHolder: "$(play) Start Server",
      });
      if (!text) return; // Exit if user cancels

      const command = await vscode.window.showInputBox({
        prompt: "Terminal Command to Run",
        placeHolder: "npm run dev",
      });
      if (!command) return; // Exit if user cancels

      const tooltip = await vscode.window.showInputBox({
        prompt: "Tooltip Text (Optional)",
        placeHolder: "Starts the development server",
      });

      // Get the current configuration for this workspace.
      const config = vscode.workspace.getConfiguration("click2run");
      const buttons = config.get("buttons", []);

      // Add the new button object to the array.
      buttons.push({ text, command, tooltip });

      // **IMPORTANT**: This updates the WORKSPACE settings, not the global ones.
      await config.update(
        "buttons",
        buttons,
        vscode.ConfigurationTarget.Workspace
      );

      vscode.window.showInformationMessage(
        `Button '${text}' was added to this workspace!`
      );
    }
  );

  // Command to open the workspace settings.json file for manual editing
  const manageButtonsCommand = vscode.commands.registerCommand(
    "click2run.manageButtons",
    () => {
      vscode.commands.executeCommand(
        "workbench.action.openWorkspaceSettings",
        "click2run.buttons"
      );
    }
  );

  context.subscriptions.push(addButtonCommand, manageButtonsCommand);

  // --- WATCH FOR CONFIGURATION CHANGES ---
  // If the user manually edits the settings, we need to update the buttons.
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("click2run.buttons")) {
        updateButtons();
      }
    })
  );

  // --- INITIALIZE BUTTONS ON STARTUP ---
  createAddButton(context); // The static "+" button
  updateButtons(); // All the user-defined buttons
}

/**
 * Clears existing buttons and creates new ones based on the current configuration.
 */
function updateButtons() {
  // Clean up any buttons and commands that might already exist.
  for (const disposable of buttonDisposables.values()) {
    disposable.command.dispose();
    disposable.statusBarItem.dispose();
  }
  buttonDisposables.clear();

  // Get the button configurations from the workspace settings.
  const buttonConfigs = vscode.workspace
    .getConfiguration("click2run")
    .get("buttons", []);

  // Create a status bar item for each button object in the settings.
  buttonConfigs.forEach((buttonConfig, i) => {
    const commandId = `click2run.runCommand.${i}`;

    // Register a unique command for this specific button
    const commandDisposable = vscode.commands.registerCommand(commandId, () => {
      // If we don't have a terminal or the last one was closed, create a new one.
      if (!terminal || terminal.exitStatus) {
        terminal = vscode.window.createTerminal(`Click2Run`);
      }
      terminal.show(); // Bring the terminal into view
      terminal.sendText(buttonConfig.command); // Send the command to the terminal
    });

    // Create the visible button in the status bar
    const statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      buttonConfig.priority || 0
    );
    statusBarItem.text = buttonConfig.text;
    statusBarItem.tooltip = buttonConfig.tooltip;
    statusBarItem.color = buttonConfig.color;
    statusBarItem.command = commandId; // When clicked, run the command we just registered
    statusBarItem.show();

    // Store the new button and its command so we can dispose of them later.
    buttonDisposables.set(i, {
      command: commandDisposable,
      statusBarItem: statusBarItem,
    });
  });
}

/**
 * Creates the static "+" button that is always visible.
 * @param {vscode.ExtensionContext} context
 */
function createAddButton(context) {
  const addButton = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  ); // High priority to appear on the left
  addButton.text = "$(add)";
  addButton.tooltip = "Click2Run: Add a new command button";
  addButton.command = "click2run.addButton"; // This triggers the command we registered in activate()
  addButton.show();
  context.subscriptions.push(addButton);
}

// This function is called when the extension is deactivated.
function deactivate() {
  // Clean up all disposables and the terminal.
  for (const disposable of buttonDisposables.values()) {
    disposable.command.dispose();
    disposable.statusBarItem.dispose();
  }
  if (terminal) {
    terminal.dispose();
  }
}

module.exports = {
  activate,
  deactivate,
};
