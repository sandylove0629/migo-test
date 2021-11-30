<template>
  <v-app id="app">
    <v-main>
      <v-container class="p-0" fluid>
        <migo-header></migo-header>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>
<script>
import MigoHeader from "@/views/Header";

export default {
  components: {
    MigoHeader,
  },
};
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
</style>
