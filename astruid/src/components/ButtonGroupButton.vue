<template lang="pug">
a.disabled_pointer-events-none.disabled_cursor-default.cursor-pointer.hover_bg-white.hover_bg-opacity-10.border-r.last_border-r-0.border-gray-200.inline-flex.px-4.py-1.items-center.font-mono(
  :disabled="disabled ? true : null"
) {{ text }}
</template>

<style>
kbd {
  display: block;
  right: 1rem;
  position: absolute;
  background: #333;
  color: white;
  padding: 0 3px;
}
</style>
<script>
export default {
  name: "ButtonGroup",
  props: ["text", "disabled"],
};
</script>
