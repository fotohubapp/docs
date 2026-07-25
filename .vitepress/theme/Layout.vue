<script setup>
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import HomePage from './components/HomePage.vue'

const { Layout } = DefaultTheme
const { frontmatter } = useData()
</script>

<template>
  <Layout>
    <template #home-hero-after>
      <HomePage v-if="frontmatter.layout === 'home'" />
    </template>
  </Layout>
</template>
