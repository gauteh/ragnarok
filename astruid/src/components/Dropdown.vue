<template lang="pug">
span
  span.cursor-pointer(ref="menu", @click="toggleMenu") {{ text }}
  .absolute.bg-white.text-black(:class="visible ? 'block' : 'hidden'")
    slot
</template>

<script>
export default {
  name: "Dropdown",
  props: ["text"],
  data() {
    return {
      visible: false,
    };
  },
  methods: {
    toggleMenu() {
      const _this = this;

      const closeListerner = (e) => {
        if (_this.catchOutsideClick(e, _this.$refs.menu))
          window.removeEventListener("click", closeListerner),
            (_this.visible = false);
      };

      window.addEventListener("click", closeListerner);

      this.visible = !this.visible;
    },
    catchOutsideClick(event, dropdown) {
      // When user clicks menu — do nothing
      if (dropdown == event.target) return false;

      // When user clicks outside of the menu — close the menu
      if (this.visible && dropdown != event.target) return true;
    },
  },
};
</script>
