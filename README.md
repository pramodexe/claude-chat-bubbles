# chat-bubbles

Makes Claude Code feel more like a chat app: every prompt you send shows up as a green, WhatsApp-style chat bubble on the right side of the chat, with a little tail.

Under each bubble, on the right, you see the time you sent the prompt and a **⧉ copy** button. Click it to copy that prompt.

Times are saved, so they stay after a restart or when you resume a session. Prompts sent before you installed the mod have no time.

Works in **Claude Code (CLI)**, the terminal version.

## Easy install: let Claude do it

Copy this prompt, paste it into Claude Code, and Claude will do the rest:

```text
Please install the "chat-bubbles" Claude Code plugin for me from the GitHub repository pramodexe/claude-chat-bubbles.
Add it as a plugin marketplace, install the "chat-bubbles" plugin from it for my user, and check that it shows as enabled.
Then tell me what I need to restart to see the chat bubbles.
```

When it's done, restart Claude Code. Your next prompt shows up as a bubble.

## Manual install

Type this at the Claude Code prompt:

```text
/plugin install chat-bubbles --marketplace pramodexe/claude-chat-bubbles
```

Or run these two commands in a terminal:

```bash
claude plugin marketplace add pramodexe/claude-chat-bubbles
claude plugin install chat-bubbles@claude-chat-bubbles
```

Then restart Claude Code.

## Turn it off

Type `/plugin` in Claude Code, open the **Installed** tab, and switch **chat-bubbles** off. Switch it back on the same way.

## Copy button not working?

The copy button needs a terminal that sends mouse clicks to Claude Code. If clicking does nothing, select the text with your mouse and copy it the usual way.

## License

MIT
