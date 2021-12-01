<template>
  <header class="d-flex justify-start">
    <v-app-bar color="#e31e30">
      <div class="logo">
        <img src="../assets/image/logo.svg" alt="" />
      </div>
      <v-tabs align-with-title>
        <v-tab active-class="tab d-flex">
          <div class="img-inventory">
            <img src="../assets/image/inventory.svg" alt="" />
          </div>
          Inventory
        </v-tab>
        <v-tabs-slider color="white"></v-tabs-slider>
      </v-tabs>
    </v-app-bar>
  </header>
</template>

<script>
export default {
  name: "Header",
};
</script>
