const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

const buttonDisposables = new Map();
let sharedTerminal;
let outputChannel; // Variable for our logging panel

const colorOptions = [
  {
    label: "Default",
    description: "Uses the standard text color of your theme",
    color: undefined,
  },
  {
    label: "Green (Vibrant)",
    description: "A bright, eye-catching green",
    color: "#33FF57",
  },
  {
    label: "Red (Vibrant)",
    description: "A strong, attention-grabbing red",
    color: "#FF5733",
  },
  {
    label: "Yellow (Vibrant)",
    description: "A bright, noticeable yellow",
    color: "#FFC300",
  },
  {
    label: "Blue (Vibrant)",
    description: "A clear, modern blue",
    color: "#30B4FF",
  },
  {
    label: "Warning Yellow (Theme)",
    description: "Uses your theme's standard warning color",
    color: "statusBarItem.warningForeground",
  },
  {
    label: "Error Red (Theme)",
    description: "Uses your theme's standard error color",
    color: "statusBarItem.errorForeground",
  },
];

function activate(context) {
  // Create the output channel for logging
  outputChannel = vscode.window.createOutputChannel("Click2Run");
  log("Click2Run extension is now active.");

  const WELCOME_MESSAGE_KEY = "click2run.hasShownWelcome";
  if (!context.globalState.get(WELCOME_MESSAGE_KEY)) {
    vscode.window.showInformationMessage(
      "Click2Run is ready! Click the (+) icon in the status bar to add your first command button.",
      "Got it!"
    );
    context.globalState.update(WELCOME_MESSAGE_KEY, true);
    log("First-time welcome message shown.");
  }

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
      const selectedColor = await vscode.window.showQuickPick(colorOptions, {
        placeHolder: "Select a color for the button (optional)",
      });
      if (!selectedColor) return;
      const text = await vscode.window.showInputBox({
        prompt: "Button Text",
        placeHolder: "Start Server",
      });
      if (!text) return;
      const buttonText = iconText + text;
      const command = await vscode.window.showInputBox({
        prompt: "Terminal Command to Run",
        placeHolder: "npm run dev",
      });
      if (!command) return;
      const terminalOption = await vscode.window.showQuickPick(
        ["No (use shared terminal)", "Yes (create a new terminal)"],
        {
          placeHolder: "Run this command in a new terminal?",
        }
      );
      if (!terminalOption) return;
      const useNewTerminal = terminalOption.startsWith("Yes");
      const tooltip = await vscode.window.showInputBox({
        prompt: "Tooltip Text (Optional)",
        placeHolder: `Runs the command: ${command}`,
      });
      const finalTooltip = tooltip || `Runs the command: '${command}'`;
      const priorityStr = await vscode.window.showInputBox({
        prompt: "Button Order Priority (Higher numbers appear further left)",
        placeHolder: "e.g., 100 for far left, 0 for default",
        value: "0",
        validateInput: (text) => {
          return isNaN(parseInt(text, 10))
            ? "Please enter a valid number."
            : null;
        },
      });
      if (priorityStr === undefined) return;
      const priority = parseInt(priorityStr, 10);
      const config = vscode.workspace.getConfiguration("click2run");
      const buttons = config.get("buttons", []);
      const newButton = {
        id: Date.now().toString(),
        text: buttonText,
        command,
        tooltip: finalTooltip,
        color: selectedColor.color,
        useNewTerminal: useNewTerminal,
        priority: priority,
      };
      buttons.push(newButton);
      await config.update(
        "buttons",
        buttons,
        vscode.ConfigurationTarget.Workspace
      );
      log(`Button added: '${buttonText}' with command '${command}'`);
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
        log(`Button deleted: '${selectedButton.label}'`);
        vscode.window.showInformationMessage(
          `Button '${selectedButton.label}' was deleted.`
        );
      } else if (action === "Edit") {
        const buttonToEdit = buttons.find((b) => b.id === selectedButton.id);
        if (!buttonToEdit) return;
        const newColor = await vscode.window.showQuickPick(colorOptions, {
          placeHolder: "Select a new color for the button",
        });
        if (!newColor) return;
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
        const terminalOption = await vscode.window.showQuickPick(
          ["No (use shared terminal)", "Yes (create a new terminal)"],
          {
            placeHolder: "Run this command in a new terminal?",
          }
        );
        if (!terminalOption) return;
        const useNewTerminal = terminalOption.startsWith("Yes");
        const newTooltip = await vscode.window.showInputBox({
          prompt: "Tooltip Text (Optional)",
          value: buttonToEdit.tooltip || "",
        });
        const finalTooltip = newTooltip || `Runs the command: '${newCommand}'`;
        const priorityStr = await vscode.window.showInputBox({
          prompt: "Button Order Priority (Higher numbers appear further left)",
          placeHolder: "e.g., 100 for far left, 0 for default",
          value: (buttonToEdit.priority || 0).toString(),
          validateInput: (text) => {
            return isNaN(parseInt(text, 10))
              ? "Please enter a valid number."
              : null;
          },
        });
        if (priorityStr === undefined) return;
        const newPriority = parseInt(priorityStr, 10);
        const buttonIndex = buttons.findIndex(
          (b) => b.id === selectedButton.id
        );
        buttons[buttonIndex].text = newText;
        buttons[buttonIndex].command = newCommand;
        buttons[buttonIndex].tooltip = finalTooltip;
        buttons[buttonIndex].color = newColor.color;
        buttons[buttonIndex].useNewTerminal = useNewTerminal;
        buttons[buttonIndex].priority = newPriority;
        await config.update(
          "buttons",
          buttons,
          vscode.ConfigurationTarget.Workspace
        );
        log(`Button edited: '${newText}'`);
        vscode.window.showInformationMessage(
          `Button '${newText}' was updated.`
        );
      }
    }
  );

  const editButtonsFileCommand = vscode.commands.registerCommand(
    "click2run.editButtonsFile",
    () => {
      log("Opening settings.json for manual editing.");
      vscode.commands.executeCommand(
        "workbench.action.openWorkspaceSettings",
        "click2run.buttons"
      );
    }
  );

  const exportButtonsCommand = vscode.commands.registerCommand(
    "click2run.exportButtons",
    async () => {
      const buttons = vscode.workspace
        .getConfiguration("click2run")
        .get("buttons", []);
      if (buttons.length === 0) {
        vscode.window.showErrorMessage("There are no buttons to export.");
        return;
      }
      const defaultUri = vscode.workspace.workspaceFolders
        ? vscode.Uri.joinPath(
            vscode.workspace.workspaceFolders[0].uri,
            "click2run-buttons.json"
          )
        : undefined;
      const uri = await vscode.window.showSaveDialog({
        defaultUri: defaultUri,
        saveLabel: "Export Buttons",
        filters: { JSON: ["json"] },
      });
      if (uri) {
        log(`Exporting ${buttons.length} buttons to ${uri.fsPath}`);
        const buttonsJson = JSON.stringify(buttons, null, 4);
        fs.writeFile(uri.fsPath, buttonsJson, (err) => {
          if (err) {
            log(`ERROR exporting buttons: ${err.message}`);
            vscode.window.showErrorMessage(
              `Failed to export buttons: ${err.message}`
            );
          } else {
            log("Export successful.");
            vscode.window.showInformationMessage(
              `Buttons successfully exported to ${path.basename(uri.fsPath)}`
            );
          }
        });
      }
    }
  );

  const importButtonsCommand = vscode.commands.registerCommand(
    "click2run.importButtons",
    async () => {
      const uris = await vscode.window.showOpenDialog({
        canSelectMany: false,
        openLabel: "Import Buttons",
        filters: { JSON: ["json"] },
      });
      if (uris && uris[0]) {
        log(`Attempting to import buttons from ${uris[0].fsPath}`);
        fs.readFile(uris[0].fsPath, "utf8", async (err, data) => {
          if (err) {
            log(`ERROR reading import file: ${err.message}`);
            vscode.window.showErrorMessage(
              `Failed to read import file: ${err.message}`
            );
            return;
          }
          try {
            const importedButtons = JSON.parse(data);
            if (!Array.isArray(importedButtons)) {
              throw new Error("File does not contain a valid button array.");
            }
            const importType = await vscode.window.showQuickPick(
              ["Merge with existing buttons", "Overwrite existing buttons"],
              {
                placeHolder: "How would you like to import these buttons?",
              }
            );
            if (!importType) return;
            const config = vscode.workspace.getConfiguration("click2run");
            let newButtons = [];
            if (importType.startsWith("Merge")) {
              const currentButtons = config.get("buttons", []);
              newButtons = [...currentButtons, ...importedButtons];
              log(
                `Merging ${importedButtons.length} buttons with ${currentButtons.length} existing buttons.`
              );
            } else {
              // Overwrite
              newButtons = importedButtons;
              log(
                `Overwriting existing buttons with ${importedButtons.length} imported buttons.`
              );
            }
            await config.update(
              "buttons",
              newButtons,
              vscode.ConfigurationTarget.Workspace
            );
            vscode.window.showInformationMessage(
              "Buttons imported successfully!"
            );
          } catch (e) {
            log(`ERROR parsing import file: ${e.message}`);
            vscode.window.showErrorMessage(
              `Failed to import buttons: ${e.message}`
            );
          }
        });
      }
    }
  );

  const runButton1 = vscode.commands.registerCommand(
    "click2run.runButton1",
    () => runButtonByIndex(0)
  );
  const runButton2 = vscode.commands.registerCommand(
    "click2run.runButton2",
    () => runButtonByIndex(1)
  );
  const runButton3 = vscode.commands.registerCommand(
    "click2run.runButton3",
    () => runButtonByIndex(2)
  );

  const showLogsCommand = vscode.commands.registerCommand(
    "click2run.showLogs",
    () => {
      outputChannel.show();
    }
  );

  context.subscriptions.push(
    addButtonCommand,
    manageButtonsCommand,
    editButtonsFileCommand,
    exportButtonsCommand,
    importButtonsCommand,
    runButton1,
    runButton2,
    runButton3,
    showLogsCommand
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("click2run.buttons")) {
        log("Configuration changed, updating buttons.");
        updateButtons();
      }
    })
  );

  createAddButton(context);
  updateButtons();
}

function runButtonByIndex(index) {
  const buttonConfigs = vscode.workspace
    .getConfiguration("click2run")
    .get("buttons", []);
  buttonConfigs.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  if (buttonConfigs.length > index) {
    const button = buttonConfigs[index];
    runCommandInTerminal(button.command, button.useNewTerminal, button.text);
  } else {
    log(
      `WARNING: Shortcut triggered for button index ${index}, but no button exists.`
    );
    vscode.window.showWarningMessage(
      `Click2Run: No button configured at position ${index + 1}.`
    );
  }
}

function runCommandInTerminal(command, useNewTerminal, buttonText) {
  log(`Executing command: '${command}' for button '${buttonText}'`);
  let targetTerminal;
  if (useNewTerminal) {
    log("Creating new terminal for command.");
    targetTerminal = vscode.window.createTerminal(`Click2Run: ${buttonText}`);
  } else {
    if (!sharedTerminal || sharedTerminal.exitStatus) {
      log("Creating new shared terminal.");
      sharedTerminal = vscode.window.createTerminal(`Click2Run (Shared)`);
    } else {
      log("Reusing existing shared terminal.");
    }
    targetTerminal = sharedTerminal;
  }
  targetTerminal.show();
  targetTerminal.sendText(command);
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
  buttonConfigs.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  log(`Updating status bar. Found ${buttonConfigs.length} buttons.`);
  buttonConfigs.forEach((buttonConfig) => {
    const commandId = `click2run.runCommand.${buttonConfig.id}`;
    const commandDisposable = vscode.commands.registerCommand(commandId, () => {
      runCommandInTerminal(
        buttonConfig.command,
        buttonConfig.useNewTerminal,
        buttonConfig.text
      );
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

function log(message) {
  if (outputChannel) {
    const time = new Date().toLocaleTimeString();
    outputChannel.appendLine(`[${time}] ${message}`);
  }
}

function deactivate() {
  log("Deactivating Click2Run extension.");
  if (outputChannel) {
    outputChannel.dispose();
  }
  if (sharedTerminal) {
    sharedTerminal.dispose();
  }
}

module.exports = {
  activate,
  deactivate,
};
