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

  const addButtonCommand = vscode.commands.registerCommand(
    "click2run.addButton",
    async () => {
      // --- NEW: ICON PICKER LOGIC ---

      // 1. Create a list of common icons for the user to choose from.
      const icons = [
        { label: "None", description: "Just plain text" },
        { label: "$(play) play", description: "A play icon" },
        { label: "$(debug-start) debug-start", description: "A debug icon" },
        { label: "$(terminal) terminal", description: "A terminal icon" },
        { label: "$(check) check", description: "A checkmark icon" },
        { label: "$(x) x", description: "An X icon" },
        { label: "$(sync) sync", description: "A sync/refresh icon" },
        { label: "$(flame) flame", description: "A flame icon" },
        { label: "$(rocket) rocket", description: "A rocket icon for deploys" },
        { label: "$(bug) bug", description: "A bug icon for debugging" },
        { label: "$(trash) trash", description: "A trash/delete icon" },
        { label: "$(gear) gear", description: "A settings gear icon" },
        {
          label: "$(cloud-upload) cloud-upload",
          description: "An upload icon",
        },
        {
          label: "$(source-control) source-control",
          description: "A git/source control icon",
        },
      ];

      // 2. Show the Quick Pick dropdown to the user.
      const selectedIcon = await vscode.window.showQuickPick(icons, {
        placeHolder: "Select an icon for your button (optional)",
      });

      // Exit if the user presses escape
      if (!selectedIcon) return;

      // 3. Determine the icon string. If "None", use an empty string.
      const iconText =
        selectedIcon.label === "None"
          ? ""
          : selectedIcon.label.split(" ")[0] + " ";

      // --- OLD LOGIC (with one small change) ---

      const text = await vscode.window.showInputBox({
        prompt: "Button Text (the icon will be added automatically)",
        placeHolder: "Start Server", // Simpler placeholder now
      });
      if (!text) return;

      // Combine the selected icon with the user's text
      const buttonText = iconText + text;

      const command = await vscode.window.showInputBox({
        prompt: "Terminal Command to Run",
        placeHolder: "npm run dev",
      });
      if (!command) return;

      const tooltip = await vscode.window.showInputBox({
        prompt: "Tooltip Text (Optional)",
        placeHolder: `Runs the command: ${command}`,
      });

      const config = vscode.workspace.getConfiguration("click2run");
      const buttons = config.get("buttons", []);

      // Use the combined buttonText here
      buttons.push({ text: buttonText, command, tooltip });

      await config.update(
        "buttons",
        buttons,
        vscode.ConfigurationTarget.Workspace
      );

      vscode.window.showInformationMessage(
        `Button '${buttonText}' was added to this workspace!`
      );
    }
  );

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

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("click2run.buttons")) {
        updateButtons();
      }
    })
  );

  createAddButton(context);
  updateButtons();
}

/**
 * Clears existing buttons and creates new ones based on the current configuration.
 */
function updateButtons() {
  for (const disposable of buttonDisposables.values()) {
    disposable.command.dispose();
    disposable.statusBarItem.dispose();
  }
  buttonDisposables.clear();

  const buttonConfigs = vscode.workspace
    .getConfiguration("click2run")
    .get("buttons", []);

  buttonConfigs.forEach((buttonConfig, i) => {
    const commandId = `click2run.runCommand.${i}`;

    const commandDisposable = vscode.commands.registerCommand(commandId, () => {
      if (!terminal || terminal.exitStatus) {
        terminal = vscode.window.createTerminal(`Click2Run`);
      }
      terminal.show();
      terminal.sendText(buttonConfig.command);
    });

    const statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      buttonConfig.priority || 0
    );
    statusBarItem.text = buttonConfig.text;
    statusBarItem.tooltip = buttonConfig.tooltip;
    statusBarItem.color = buttonConfig.color;
    statusBarItem.command = commandId;
    statusBarItem.show();

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
  );
  addButton.text = "$(add)";
  addButton.tooltip = "Click2Run: Add a new command button";
  addButton.command = "click2run.addButton";
  addButton.show();
  context.subscriptions.push(addButton);
}

function deactivate() {
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
