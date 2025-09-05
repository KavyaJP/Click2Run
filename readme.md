# Click2Run

Create custom, one-click buttons in the VS Code status bar to run any terminal command or script. Boost your productivity by turning your most frequent commands into accessible buttons.

## Features

* **Create Buttons Easily:** Use the `+` button in the status bar to create new buttons through a simple, guided process.

* **Run Any Command:** Execute any command-line instruction you can think of, from starting a development server with different backend and frontend directories (`npm run dev`) to running a script (`python my_script.py`).

* **Chain Commands:** Run multiple commands in sequence using `&&`. For example: `npm install && npm run build`.

* **Full Customization:** Manually edit your `settings.json` to customize button text, tooltips, colors, and the order they appear in.

* **Instant Updates:** The extension automatically reloads your buttons whenever you change the configuration.

* **Lightweight & fast**: No heavy IDE overhead—full control of your workflow.
  
* **Project-specific configuration**: Buttons are saved per workspace.

## How to Use

There are two ways to create and manage your buttons:

### 1. The Easy Way (The `+` Button)

1. Click the `(+)` icon in the bottom-left status bar.

2. Follow the prompts at the top of the screen to enter the button's text (you can use icons like `$(play)`), the command to run, and an optional tooltip.

3. Your new button will appear instantly!

### 2. The Advanced Way (Editing `settings.json`)

For more control, you can directly edit your VS Code settings file.

1. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).

2. Run the command **"Custom Buttons: Edit Configuration (settings.json)"**.

3. This will open your `settings.json` file and you can add your button configurations like the example below:

```
"custom-buttons.buttons": [
    {
        "text": "$(debug-start) Run Server",
        "command": "npm run dev",
        "tooltip": "Starts the Webpack dev server",
        "color": "#33FF57",
        "priority": 10
    },
    {
        "text": "$(book) Build Docs",
        "command": "npm run build-docs",
        "tooltip": "Build the project documentation"
    }
]

```

## Known Issues

None yet! Please report any issues you find on the project's GitHub page.

## Release Notes

### 1.0.0

* Initial release of Click2Run.

* Ability to add, manage, and run commands from status bar buttons.

**Enjoy!**