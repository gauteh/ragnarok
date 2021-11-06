<template lang="pug">
.grid
  .Topbar
  .Sidebar
    h1.text-3xl.font-black Astruid
    ul
      li(
        v-for="(filter, name) in filters",
        @click="query(filter)",
        :class="filter === activeFilter || filter.query === activeFilter ? 'active' : ''"
      ) {{ name }}
    img(
      src="/favicon.svg",
      title="Icon by cornecoba.com",
      :class="status ? 'fading' : ''"
    )
  //.Information
    small {{status}} {{activeMessage}}
  .List
    .flex.p-4.sticky.top-0(style="background-color: rgba(56, 58, 89, 0.75)")
      input.flex-grow.text-black.mr-1.rounded-md.px-2(
        style="flex-grow: 1",
        v-model="searchString",
        @keyup.enter.native="search"
      )
      ButtonGroup
        ButtonGroupButton(text="‹", @click="changePage(page - 1)")
        ButtonGroupButton(:disabled="true", :text="page")
        ButtonGroupButton(text="›", @click="changePage(page + 1)")
      Menu.relative.inline-block.text-left(as="div")
        MenuButton.inline-flex.justify-center.w-full.border.rounded-md.border-gray-200.px-4.py-1.ml-1 ☰
        MenuItems.absolute.right-0.w-56.origin-top-right.bg-white.divide-y.rounded-md
          MenuItem(v-slot="{ active }")
            button(
              :class="[active ? 'bg-blue-200 text-black' : 'text-gray-900', 'group flex rounded-md items-center w-full px-2 py-2 text-sm']"
            ) Archive <kbd>A</kbd>
          MenuItem(v-slot="{ active }")
            button(
              :class="[active ? 'bg-blue-200 text-black' : 'text-gray-900', 'group flex rounded-md items-center w-full px-2 py-2 text-sm']"
            ) Spam <kbd>S</kbd>
          MenuItem(v-slot="{ active }")
            button(
              :class="[active ? 'bg-blue-200 text-black' : 'text-gray-900', 'group flex rounded-md items-center w-full px-2 py-2 text-sm']"
            ) Trash <kbd>T</kbd>

    .item(
      v-for="thread of threads",
      @click="showThread(thread.id)",
      style="display: flex",
      :class="{ active: thread.id === activeThreadID, selected: thread.selected, unread: thread.tags.includes('unread') }"
    )
      input.rounded.bg-transparent.mr-2.text-blue-700(
        type="checkbox",
        v-model="thread.selected"
      )
      .authors
        template(v-for="(author, index) in thread.authors")
          span(v-if="index === thread.authors.length - 1") {{ author }}
          span(v-else) {{ author }},
        span(v-if="thread.total_messages > 1", style="opacity: 0.7") &nbsp;({{ thread.total_messages }})
      .subject
        | {{ thread.subject }}
        .inline-block.text-xs.ml-1.text-white(
          v-for="tag of thread.tags.filter(x=>!filterHide.includes(x))",
          :style="`background-color: hsl(${tag.toHue()}, 40%, 30%) !important`"
        ) {{ replaceTagDisplay[tag] || tag }}

  .Thread
    .thread-header(v-if="thread.length")
      .flex.flex-nowrap.float-right
        ButtonGroup
          ButtonGroupButton(@click="selectMessage(0)", text="«")
          ButtonGroupButton(
            @click="selectMessage(activeMessage - 1)",
            text="‹"
          )
          ButtonGroupButton(
            disabled,
            :text="activeMessage + 1 + '/' + thread.length"
          )
          ButtonGroupButton(
            @click="selectMessage(activeMessage + 1)",
            text="›"
          )
          ButtonGroupButton(
            @click="selectMessage(thread.length - 1)",
            text="»"
          )
        Menu(as="div")
          MenuButton.border.rounded-md.border-gray-200.inline-flex.px-4.py-1.items-center.ml-1 ☰
          MenuItems.absolute.right-0.w-56.mt-2.origin-top-right.bg-white.divide-y.divide-gray-100.rounded-md.shadow-lg.ring-1.ring-black.ring-opacity-5.focus_outline-none
            MenuItem(v-slot="{ active }")
              button(
                :class="[active ? 'bg-blue-200 text-black' : 'text-gray-900', 'group flex rounded-md items-center w-full px-2 py-2 text-sm']"
              ) Archive <kbd>a</kbd>
            MenuItem(v-slot="{ active }")
              button(
                :class="[active ? 'bg-blue-200 text-black' : 'text-gray-900', 'group flex rounded-md items-center w-full px-2 py-2 text-sm']"
              ) Spam <kbd>s</kbd>
            MenuItem(v-slot="{ active }")
              button(
                :class="[active ? 'bg-blue-200 text-black' : 'text-gray-900', 'group flex rounded-md items-center w-full px-2 py-2 text-sm']"
              ) Trash <kbd>t</kbd>
            MenuItem(v-slot="{ active }")
              button(
                :class="[active ? 'bg-blue-200 text-black' : 'text-gray-900', 'group flex rounded-md items-center w-full px-2 py-2 text-sm']"
              ) Print <kbd>p</kbd>
      h4
        | {{ thread[0].headers.Subject }}
        .inline-block.ml-1.text-sm(
          v-for="tag of currentTags",
          :style="`background-color: hsl(${tag.toHue()}, 40%, 30%) !important`"
        ) {{ tag }}

    .message.mb-4(
      style="background: #282a36",
      v-for="(message, index) of thread",
      :id="'message-' + index",
      :class="index === activeMessage ? 'active' : ''"
    )
      .message-header
        h5(style="flex-grow: 1") {{ cleanFromHeader(message.headers.From) }}
        span {{ message.date_relative }}
        Dropdown.m-2(split="", size="sm", text="Reply")
          ul
            li(href="#") Forward
            li(href="#") Print
      hr
      div(v-for="{ type, content } in [getMessageContent(message.body)]")
        iframe(
          v-if="['html', 'plaintext'].includes(type)",
          :srcdoc="content",
          style="width: 100%",
          scrolling="no",
          @load="loaded(index)",
          onload="this.height=this.contentWindow.document.body.scrollHeight;"
        )
</template>

<script>
import ndjsonStream from "can-ndjson-stream";
import { config } from "../../config.js";
import Dropdown from "./Dropdown.vue";
import ButtonGroup from "./ButtonGroup.vue";
import ButtonGroupButton from "./ButtonGroupButton.vue";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";

String.prototype.toHue = function () {
  var hash = 0;
  if (this.length === 0) return hash;
  for (var i = 0; i < this.length; i++) {
    hash = this.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  return hash % 360;
};

export default {
  name: "MuchVue",
  components: {
    Dropdown,
    ButtonGroup,
    ButtonGroupButton,
    Menu,
    MenuButton,
    MenuItems,
    MenuItem,
  },
  props: {
    msg: String,
  },
  data() {
    return {
      ...config,
      count: 0,
      allthreads: [],
      threads: [],
      status: "",
      thread: [],
      page: 1,
      activeMessage: 0,
      firstUnread: 0,
      previousFetch: null,
      searchString: "",
      filterHide: [],
      activeThreadID: null,
      activeFilter: "",
    };
  },
  watch: {
    thread: {
      handler(thread) {
        if (thread.every((m) => m.loaded)) {
          this.selectMessage(this.firstUnread);
          this.status = "";
        }
      },
      deep: true,
    },
  },
  computed: {
    currentTags: function () {
      return [...new Set(this.thread.map((x) => x.tags).flat())];
    },
    // a computed getter
    /* threads: function () { */
    /*   // `this` points to the vm instance */
    /*   const messagesPerPage = 10; */
    /*   return this.allthreads.slice((this.page - 1) * messagesPerPage, this.page * messagesPerPage); */
    /*   //return []; */
    /* }, */
  },
  methods: {
    loaded(index) {
      this.thread[index].loaded = true;
    },
    changePage(pageNum) {
      this.page = pageNum;
      this.threads = this.allthreads.slice(
        (pageNum - 1) * this.messagesPerPage,
        pageNum * this.messagesPerPage
      );
    },
    processthreadRecord(record) {
      record.authors = record.authors.join().split("|");
      record.selected = false;
      return record;
    },
    search() {
      this.query(this.searchString);
    },
    query(query) {
      if (query.query) {
        this.filterHide = query.hide;
        query = query.query;
      } else {
        this.filterHide = [];
      }
      this.status = "Loading " + query + "...";
      this.searchString = query;
      console.log(query);
      if (this.previousFetch) this.previousFetch.abort();

      const controller = new AbortController();
      const { signal } = controller;
      this.previousFetch = controller;

      this.allthreads = [];
      this.threads = [];
      this.page = 1;
      fetch("http://localhost:8088/threads/" + encodeURIComponent(query), {
        signal,
      })
        .then((response) => ndjsonStream(response.body))
        .then((stream) => {
          const reader = stream.getReader();

          const read = ({ done, value }) => {
            if (!done) {
              value = this.processthreadRecord(value);
              this.allthreads.push(value);
              if (this.threads.length <= this.messagesPerPage) {
                this.threads.push(value);
              }

              reader.read().then(read);
            } else {
              this.status = "";
              return;
            }
          };

          reader.read().then(read);
        });

      this.activeFilter = query;
    },
    cleanFromHeader(header) {
      return (
        header
          .replace(/\<[^()]*\>/g, "")
          .trim()
          .replace(/^"(.*)"$/, "$1") || header
      );
    },
    getMessageContent(message) {
      const contents = [];
      const digger = (attachments) => {
        if (Array.isArray(attachments.content))
          attachments = attachments.content;
        for (const attachment of attachments) {
          if (
            attachment["content-type"] === "multipart/alternative" ||
            attachment["content-type"] === "multipart/mixed" ||
            attachment["content-type"] === "multipart/related"
          ) {
            digger(attachment);
          } else {
            contents.push(attachment);
          }
        }
      };
      digger(message);
      const html = contents.filter((x) => x["content-type"] === "text/html");
      const plaintext = contents.filter(
        (x) => x["content-type"] === "text/plain"
      );

      const iframeStyle =
        "<style>* { font-size: 0.9rem; font-family: sans-serif; background-color: #282a36 !important; background: #282a36 !important; color: white !important} a[href] { color: #8be9fd !important; } hidden-script { display: none; !important}</style> <meta http-equiv='Content-Security-Policy' content='default-src \"none\";'>";

      if (html.length)
        return {
          content:
            iframeStyle +
            html[0].content
              .replaceAll("<script", "<hidden-script style='display: none;'")
              .replaceAll("href", "target='_blank' href"),

          type: "html",
        };
      if (plaintext.length) {
        console.log(plaintext);
        return {
          content: iframeStyle + "<pre>" + plaintext[0].content + "</pre>",
          type: "plaintext",
        };
      }
      console.error("Couldn't find content for", message);
      return {
        content: iframeStyle + "Error getting message content",
        type: "plaintext",
      };
    },
    async showThread(id) {
      // do nothing if thread is already selected
      if (this.activeThreadID === id) return;
      document.getElementsByClassName("Thread")[0].scrollTo(0, 0);
      if (this.previousFetch) this.previousFetch.abort();

      const controller = new AbortController();
      const { signal } = controller;
      this.previousFetch = controller;

      this.status = "Loading thread" + id + "...";
      this.activeThreadID = id;
      const d = await fetch("http://localhost:8088/messages/thread:" + id);
      const messagesTree = await d.json();
      const thread = [];

      const flattener = (item) => {
        if (Array.isArray(item)) {
          for (const sub of item) {
            flattener(sub);
          }
        } else {
          thread.push(item);
        }
      };

      flattener(messagesTree);

      this.thread = thread.map((m) => {
        return { ...m, loaded: false };
      });
      let start = 0;
      for (const i in this.thread) {
        start = i;
        if (this.thread[i].tags.includes("unread")) break;
      }
      this.firstUnread = parseInt(start);
      this.status = "Rendering messages...";
    },
    async changeTags(threadId, action) {
      await fetch(`http://localhost:8088/threads/thread:${threadId}/tag`, {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(action),
      });

      this.query(this.activeFilter);
    },
    selectMessage(index) {
      console.log("selecting message", index);
      if (index < 0) this.moveThread(-1);
      else if (index >= this.thread.length) this.moveThread(1);
      else {
        this.activeMessage = index;
        document.getElementsByClassName("Thread")[0].scrollBy({
          behavior: "smooth",
          top:
            document.getElementById("message-" + index).getBoundingClientRect()
              .top -
            document.getElementsByClassName("thread-header")[0].offsetHeight -
            5,
        });
      }
    },
    moveThread(movement) {
      if (this.activeThreadID) {
        const index = this.threads.indexOf(
          this.threads.filter((x) => x.id === this.activeThreadID)[0]
        );

        this.showThread(this.threads[index + movement].id);
      } else {
        this.showThread(this.threads[0].id);
      }
    },
    toggleThread() {
      if (this.activeThreadID) {
        const index = this.threads.indexOf(
          this.threads.filter((x) => x.id === this.activeThreadID)[0]
        );
        this.threads[index].selected = !this.threads[index].selected;
      } else {
        this.moveThread(1);
        this.threads[0].selected = !this.threads[0].selected;
      }
      this.moveThread(1);
    },
    handleKeyPress: function (e) {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName))
        return true;
      const tagKeybinding = Object.entries(this.keybindings.tags).filter(
        (x) => x[0] === e.key
      )?.[0];
      if (tagKeybinding) {
        if (typeof tagKeybinding[1] === "string") {
          this.currentTags.includes(tagKeybinding[1])
            ? this.changeTags(this.activeThreadID, {
                remove: [tagKeybinding[1]],
              })
            : this.changeTags(this.activeThreadID, { add: [tagKeybinding[1]] });
        } else {
          for (const [checkTag, action] of Object.entries(tagKeybinding[1])) {
            this.currentTags.includes(checkTag)
              ? this.changeTags(this.activeThreadID, action)
              : this.changeTags(this.activeThreadID, action);
          }
        }
      } else if (e.key === this.keybindings.nextThread) {
        e.preventDefault();
        this.moveThread(1);
      } else if (e.key === this.keybindings.previousThread) {
        e.preventDefault();
        this.moveThread(-1);
      } else if (e.key === this.keybindings.nextMessage) {
        e.preventDefault();
        this.selectMessage(this.activeMessage + 1);
      } else if (e.key === this.keybindings.previousMessage) {
        e.preventDefault();
        this.selectMessage(this.activeMessage - 1);
      } else if (e.key === this.keybindings.selectThread) {
        e.preventDefault();
        this.toggleThread();
      }
    },
  },
  beforeDestroy() {
    window.removeEventListener("keydown", this.handleKeyPress);
  },
  async mounted() {
    const filter = Object.entries(this.filters)[0][1];
    window.addEventListener("keydown", this.handleKeyPress);
    this.query(filter);
  },
};
</script>

<style lang="scss">
.grid {
  display: grid;
  grid-template-columns: 10em 1fr 1fr;
  grid-template-rows: 1em 1fr 1.5rem;
  gap: 0px 0px;
  grid-auto-flow: row;
  max-height: 100vh;
  height: 100vh;
  grid-template-areas:
    "Sidebar List Thread"
    "Sidebar List Thread"
    "Sidebar List Thread";
}

.Topbar {
  grid-area: Topbar;
  display: flex;
  align-items: center;
  padding-right: 1rem;
  background: #282a36;
}

.Sidebar {
  grid-area: Sidebar;
  background: #282a36;
  display: flex;
  flex-direction: column;

  h1 {
    color: #383a59;
    text-align: center;
    margin-top: 1rem;
    font-weight: bold;
  }

  img {
    max-width: 2rem;
    margin: 1rem auto;

    &.fading {
      animation: fadeAnimation 2s infinite;
    }
  }

  ul {
    list-style-type: none;
    margin: 3rem 0;
    padding: 0;
    flex-grow: 1;

    li {
      font-weight: bold;
      padding: 0.4rem 0 0.4rem 1rem;
      cursor: pointer;

      &:hover {
        background: lighten(#44475a, 10%);
      }

      &.active {
        background: #383a59;
      }
    }
  }
}

.Information {
  padding-left: 0.5rem;
  font-weight: bold;
  grid-area: Information;
  display: flex;
  align-items: center;
  background: #44475a;
}

.List {
  resize: horizontal;
  min-width: 10rem;
  max-width: 100%;
  grid-area: List;
  scrollbar-color: #6272a4 #44475a;
  scrollbar-width: thin;
  overflow: auto;
  border-radius: 0.5rem 0 0 0;
  background: #383a59;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-bottom: 0;
  border-right: 0;
}

.Thread {
  grid-area: Thread;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: #6272a4 transparent;
  background: #44475a;
  padding: 0 1rem;

  .message {
    @apply rounded-lg p-2;

    &.active {
      box-shadow: 0 0 0 2px #8be9fd;
    }
  }

  .thread-header {
    position: sticky;
    top: 0rem;
    background: rgba(68, 71, 90, 0.75);
    z-index: 10;
    align-items: center;
    padding: 0.75rem 0rem;
    margin-bottom: 2px;

    h4 {
      flex-grow: 1;
      font-size: 1.2rem;
      margin-bottom: 0;
    }
  }

  .message-header {
    display: flex;
    align-items: center;
    margin-top: -0.5rem;
    margin-right: -0.5rem;
    margin-left: 0.5rem;

    h5 {
      font-weight: bold;
      margin: 0;
      font-size: 1.1rem;
    }

    & + hr {
      margin: 0;
      background-color: #8be9fd;
      height: 1px;
      opacity: 1;
    }
  }
}

.List .item {
  height: 2.5rem;
  font-size: 0.9rem;
  padding: 0 0 0 0.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.3);
  align-items: center;
  border-left: 5px solid transparent;

  .authors {
    flex: 1 1 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .subject {
    flex: 2 1 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    cursor: pointer;
  }

  &.active {
    background: #44475a;
    border-left: 5px solid rgba(255, 255, 255, 0.75);
  }

  &.unread {
    font-weight: bold;
  }

  &.selected {
    background-color: #bd93f9;
    color: black;
  }
}
</style>
