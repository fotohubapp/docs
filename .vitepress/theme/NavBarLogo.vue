<script setup>
import { useData } from 'vitepress'
const { isDark } = useData()
</script>

<template>
  <a href="/" class="nav-bar-logo-right" aria-label="FOTOhub Home">
    <img v-if="isDark" src="/logo-dark.png" alt="FOTOhub" class="nav-logo-img" />
    <img v-else src="/logo-light.png" alt="FOTOhub" class="nav-logo-img" />
  </a>
</template>

<style scoped>
.nav-bar-logo-right {
  display: flex;
  align-items: center;
  margin-left: 8px;
}

.nav-logo-img {
  height: 24px;
  width: auto;
}
</style>
