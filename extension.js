const vscode = require("vscode");

const buttonDisposables = new Map();
let terminal;

function activate(context) {
  // --- REGISTER COMMANDS ---

  const addButtonCommand = vscode.commands.registerCommand(
    "click2run.addButton",
    async () => {
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

      const selectedIcon = await vscode.window.showQuickPick(icons, {
        placeHolder: "Select an icon for your button (optional)",
      });

      if (!selectedIcon) return;

      const iconText =
        selectedIcon.label === "None"
          ? ""
          : selectedIcon.label.split(" ")[0] + " ";

      const text = await vscode.window.showInputBox({
        prompt: "Button Text (the icon will be added automatically)",
        placeHolder: "Start Server",
      });
      if (!text) return;

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

      // *** CHANGE: Add a unique ID using the current timestamp ***
      const newButton = {
        id: Date.now().toString(), // Unique ID!
        text: buttonText,
        command,
        tooltip,
      };

      buttons.push(newButton);

      await config.update(
        "buttons",
        buttons,
        vscode.ConfigurationTarget.Workspace
      );

      vscode.window.showInformationMessage(`Button '${buttonText}' was added!`);
    }
  );

  // *** NEW: Command to Manage (and Delete) Buttons ***
  const manageButtonsCommand = vscode.commands.registerCommand(
    "click2run.manageButtons",
    async () => {
      const config = vscode.workspace.getConfiguration("click2run");
      const buttons = config.get("buttons", []);

      if (buttons.length === 0) {
        vscode.window.showInformationMessage("You have no buttons to manage.");
        return;
      }

      // Create a list of button labels for the Quick Pick
      const buttonItems = buttons.map((b) => ({ label: b.text, id: b.id }));

      // Show the list and let the user select a button
      const selectedButton = await vscode.window.showQuickPick(buttonItems, {
        placeHolder: "Select a button to manage",
      });

      if (!selectedButton) return;

      // Ask the user what action to take
      const action = await vscode.window.showQuickPick(["Delete", "Cancel"], {
        placeHolder: `What would you like to do with '${selectedButton.label}'?`,
      });

      if (action === "Delete") {
        // Filter the array, keeping all buttons EXCEPT the one with the selected ID
        const newButtons = buttons.filter((b) => b.id !== selectedButton.id);
        await config.update(
          "buttons",
          newButtons,
          vscode.ConfigurationTarget.Workspace
        );
        vscode.window.showInformationMessage(
          `Button '${selectedButton.label}' was deleted.`
        );
      }
    }
  );

  const editButtonsFileCommand = vscode.commands.registerCommand(
    "click2run.editButtonsFile",
    () => {
      vscode.commands.executeCommand(
        "workbench.action.openWorkspaceSettings",
        "click2run.buttons"
      );
    }
  );

  context.subscriptions.push(
    addButtonCommand,
    manageButtonsCommand,
    editButtonsFileCommand
  );

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

function updateButtons() {
  for (const disposable of buttonDisposables.values()) {
    disposable.command.dispose();
    disposable.statusBarItem.dispose();
  }
  buttonDisposables.clear();

  const buttonConfigs = vscode.workspace
    .getConfiguration("click2run")
    .get("buttons", []);

  buttonConfigs.forEach((buttonConfig) => {
    // *** CHANGE: Use the unique ID for the command ***
    const commandId = `click2run.runCommand.${buttonConfig.id}`;

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

    // *** CHANGE: Use the unique ID as the key in our map ***
    buttonDisposables.set(buttonConfig.id, {
      command: commandDisposable,
      statusBarItem: statusBarItem,
    });
  });
}

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
