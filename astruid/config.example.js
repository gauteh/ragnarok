const config = {
  messagesPerPage: 50,
  filters: {
    "📥 Inbox": {
      query: "tag:inbox and folder:sync/INBOX and not tag:spam",
      hide: ["inbox", "unread"],
    },
    "📤 Sent": {
      query: "tag:sent",
      hide: ["sent"]
    },
    "📁 Archive": "not tag:inbox and not tag:sent",
    "💩 Spam": "tag:spam",
    "🗑️ Trash": "tag:trash",
  },
  keybindings: {
    nextMessage: "n",
    previousMessage: "p",
    nextThread: "ArrowRight",
    previousThread: "ArrowLeft",
    selectThread: " ",
    tags: {
      a: "inbox",
      s: "spam",
      t: {
        trash: [{ remove: ["trash"] }, { add: ["trash"], remove: ["inbox"] }],
      },
    },
  },
  replaceTagDisplay: {
    attachment: "📎",
    replied: "↩️",
  },
};

export { config };
