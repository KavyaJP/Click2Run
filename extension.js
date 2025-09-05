const vscode = require("vscode");

const buttonDisposables = new Map();
let terminal;

// --- A list of predefined colors for the user to choose from ---
const colorOptions = [
  {
    label: "Default",
    description: "Standard editor text color",
    color: undefined,
  },
  {
    label: "Green",
    description: "Good for success/start/build tasks",
    color: "#33FF57",
  },
  {
    label: "Red",
    description: "Good for danger/stop/delete tasks",
    color: "#FF5733",
  },
  {
    label: "Yellow",
    description: "Good for warning/linting tasks",
    color: "#FFC300",
  },
  {
    label: "Blue",
    description: "Good for info/install tasks",
    color: "#30B4FF",
  },
  // This special ID tells VS Code to use its built-in error color
  {
    label: "Error Color",
    description: "Uses the standard theme error color",
    color: "statusBarItem.errorForeground",
  },
];

function activate(context) {
  // --- REGISTER COMMANDS ---

  const addButtonCommand = vscode.commands.registerCommand(
    "click2run.addButton",
    async () => {
      // This command's flow is now: Icon -> Color -> Text -> Command -> Tooltip

      // Icon Picker (no change)
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

      // *** NEW: Color Picker ***
      const selectedColor = await vscode.window.showQuickPick(colorOptions, {
        placeHolder: "Select a color for the button (optional)",
      });
      if (!selectedColor) return; // Exit if user cancels

      // Continue with the rest of the prompts (no change)
      const text = await vscode.window.showInputBox({
        prompt: "Button Text (icon and color will be added automatically)",
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

      // *** CHANGE: Add the selected color to the new button object ***
      const newButton = {
        id: Date.now().toString(),
        text: buttonText,
        command,
        tooltip,
        color: selectedColor.color, // Add the color property
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

  const manageButtonsCommand = vscode.commands.registerCommand(
    "click2run.manageButtons",
    async () => {
      const config = vscode.workspace.getConfiguration("click2run");
      let buttons = config.get("buttons", []);

      if (buttons.length === 0) {
        vscode.window.showInformationMessage("You have no buttons to manage.");
        return;
      }

      const buttonItems = buttons.map((b) => ({ label: b.text, id: b.id }));

      const selectedButton = await vscode.window.showQuickPick(buttonItems, {
        placeHolder: "Select a button to manage",
      });

      if (!selectedButton) return;

      const action = await vscode.window.showQuickPick(
        ["Edit", "Delete", "Cancel"],
        {
          placeHolder: `What would you like to do with '${selectedButton.label}'?`,
        }
      );

      if (action === "Delete") {
        const newButtons = buttons.filter((b) => b.id !== selectedButton.id);
        await config.update(
          "buttons",
          newButtons,
          vscode.ConfigurationTarget.Workspace
        );
        vscode.window.showInformationMessage(
          `Button '${selectedButton.label}' was deleted.`
        );
      } else if (action === "Edit") {
        const buttonToEdit = buttons.find((b) => b.id === selectedButton.id);
        if (!buttonToEdit) return;

        // *** NEW: Add color prompt to the Edit flow ***
        const newColor = await vscode.window.showQuickPick(colorOptions, {
          placeHolder: "Select a new color for the button",
        });
        if (!newColor) return; // Exit if user cancels

        const newText = await vscode.window.showInputBox({
          prompt: "Button Text",
          value: buttonToEdit.text,
        });
        if (!newText) return;

        const newCommand = await vscode.window.showInputBox({
          prompt: "Terminal Command to Run",
          value: buttonToEdit.command,
        });
        if (!newCommand) return;

        const newTooltip = await vscode.window.showInputBox({
          prompt: "Tooltip Text (Optional)",
          value: buttonToEdit.tooltip || "",
        });

        const buttonIndex = buttons.findIndex(
          (b) => b.id === selectedButton.id
        );

        // *** CHANGE: Update the color property along with the others ***
        buttons[buttonIndex].text = newText;
        buttons[buttonIndex].command = newCommand;
        buttons[buttonIndex].tooltip = newTooltip;
        buttons[buttonIndex].color = newColor.color; // Update the color

        await config.update(
          "buttons",
          buttons,
          vscode.ConfigurationTarget.Workspace
        );
        vscode.window.showInformationMessage(
          `Button '${newText}' was updated.`
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
  // This function automatically applies the color, so no changes are needed here.
  for (const disposable of buttonDisposables.values()) {
    disposable.command.dispose();
    disposable.statusBarItem.dispose();
  }
  buttonDisposables.clear();
  const buttonConfigs = vscode.workspace
    .getConfiguration("click2run")
    .get("buttons", []);
  buttonConfigs.forEach((buttonConfig) => {
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
    statusBarItem.color = buttonConfig.color; // This line does all the work!
    statusBarItem.command = commandId;
    statusBarItem.show();
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
