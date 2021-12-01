import Vue from "vue";
import Vuex from "vuex";
import data from "@/utlis/titles.json";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    inventories: [],
  },
  mutations: {
    setInventories: (state, inventories) => {
      state.inventories = inventories;
    },
  },
  actions: {
    getInventories({ commit }) {
      return new Promise((resolve) => {
        /*
        // axios call api
        axios.get('/inventories').then(() => {

        })
        .catch(() => {

        })
        */
        setTimeout(() => {
          commit("setInventories", data);
          resolve();
        }, 5000);
      });
    },
  },
  getters: {
    inventories: (state) => state.inventories,
  },
});
