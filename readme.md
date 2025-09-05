# Click2Run

Create a powerful, fully customizable dashboard of command buttons directly in your VS Code status bar. Boost your productivity by turning your most frequent and complex terminal commands into accessible, one-click actions.

## Features

- **Easy Button Creation**: A simple, guided workflow walks you through creating new buttons. Just click the `(+)` in the status bar to start.
- **Full Customization**:
    - **Icons**: Choose from a curated list of helpful icons to make your buttons instantly recognizable.
    - **Colors**: Assign custom colors to categorize your buttons (e.g., green for 'build', red for 'stop'). Supports theme-aware colors!
    - **Tooltips**: Add descriptive tooltips, or let the extension auto-generate them for you.
- **Powerful Execution**:
    - **Chain Commands**: Run multiple commands in sequence using `&&`.
    - **Multiple Terminals**: Choose to run a command in a shared terminal or spawn a new, dedicated terminal for long-running tasks like web servers.
- **Total Organization**:
    - **Button Ordering**: Use a priority system to arrange buttons in the status bar, keeping your most-used commands on the left.
- **Productivity Boosters**:
    - **Keyboard Shortcuts**: Run your top three buttons with default shortcuts (`Ctrl+Alt+1`, etc.) and easily customize them.
- **Project Management**:
    - **Import/Export**: Easily export your button configurations to a JSON file and share them with your team or import them into a new project.
- **Workspace-Specific**: All buttons are saved to your workspace's `.vscode/settings.json`, so they are specific to your project and can be checked into version control.
- **Logging**: A dedicated output channel shows you exactly what the extension is doing, which is great for debugging complex command chains.

## How to Use

### Creating a Button
1.  Click the `(+)` icon in the bottom-left status bar.
2.  Follow the prompts:
    1.  **Icon**: Select a visual icon from the list.
    2.  **Color**: Choose a color for the button text.
    3.  **Button Text**: Enter the text to display (e.g., "Start Server").
    4.  **Command**: Enter the terminal command to run (e.g., `npm run dev`).
    5.  **Terminal Choice**: Decide if the command should run in a new or shared terminal.
    6.  **Tooltip**: Add a custom tooltip or press Enter to auto-generate one.
    7.  **Priority**: Enter a number to control the button's order (higher numbers are further left).

### Managing Buttons
- Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).
- Run **`Click2Run: Manage Buttons (Delete, Edit)`** to open a menu where you can edit or delete any existing button.

### Using Keyboard Shortcuts
- **`Ctrl+Alt+1`** (or `Cmd+Alt+1` on Mac): Runs your first button (the one with the highest priority).
- **`Ctrl+Alt+2`** / **`Ctrl+Alt+3`** for the second and third buttons.
- **To customize**: Open Keyboard Shortcuts (`Ctrl+K Ctrl+S`), search for "Click2Run", and reassign the keys to your preference.

## Advanced Configuration (`settings.json`)

You can directly edit your `.vscode/settings.json` file for advanced control. Run the command **`Click2Run: Edit Buttons File (settings.json)`** to open it.

Here is a full example of a button configuration:

```json
"click2run.buttons": [
    {
        "id": "1678886400000",
        "text": "$(play) Start Server",
        "command": "npm run dev",
        "tooltip": "Runs the command: 'npm run dev'",
        "color": "#33FF57",
        "useNewTerminal": true,
        "priority": 100
    },
    {
        "id": "1678886400001",
        "text": "$(bug) Run Tests",
        "command": "npm test",
        "tooltip": "Runs all unit tests",
        "color": "statusBarItem.warningForeground",
        "useNewTerminal": false,
        "priority": 50
    }
]
```

## All Available Commands

- `Click2Run: Add New Button`
- `Click2Run: Manage Buttons (Delete, Edit)`
- `Click2Run: Export Buttons to a File`
- `Click2Run: Import Buttons from a File`
- `Click2Run: Run First/Second/Third Button`
- `Click2Run: Show Extension Logs`
- `Click2Run: Edit Buttons File (settings.json)`

## Release Notes

### 1.0.0
- Initial release.
- Added ability to choose a color for button text.
- Added unique IDs to buttons.
- Added ability to Delete and Edit existing buttons.
- Added icon picker for easier customization.
- Added auto-generation for tooltips.
- Added button ordering via a priority system.
- Added option to run commands in a new or shared terminal.
- Added Import/Export functionality.
- Added keyboard shortcuts for the first three buttons.
- Added command and output channel for logging extension activity.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.