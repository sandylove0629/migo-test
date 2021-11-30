<template>
  <v-container fluid class="home">
    <p class="mb-4">Inventory Manager</p>
    <!-- Search -->
    <v-row>
      <v-col md="4">
        <v-text-field
          filled
          dense
          single-line
          outlined
          label="Search for titles in inventory"
          v-model="search"
          prepend-inner-icon="mdi-magnify"
        >
        </v-text-field>
      </v-col>
    </v-row>
    <!-- Table -->
    <v-data-table
      height="500"
      :headers="headers"
      :items="showInventoryList"
      item-key="title_id"
      class="elevation-1"
      :search="search"
      :custom-filter="filterOnlyCapsText"
      :items-per-page="-1"
      hide-default-footer
      :expanded.sync="expanded"
      show-expand
      single-expand
      :fixed-header="true"
    >
      <template v-slot:item="{ item, expand, isExpanded }">
        <tr class="regular-row" :key="item.title_id">
          <td>
            <span class="line arrow" v-if="item.seasons.length && isExpanded" />
            <v-icon
              v-if="item.seasons.length"
              class="icon-expand"
              :class="{ expand: isExpanded }"
              size="8"
              @click="expand(!isExpanded)"
            >
              mdi-triangle
            </v-icon>
          </td>
          <td>{{ item.title_id }}</td>
          <td>
            <b class="text-truncate">{{ item.title_name }}</b>
          </td>
          <td>{{ item.content_type }}</td>
          <td>{{ item.seasons.length ? item.seasons.length : "--" }}</td>
          <td>
            {{ item.episode_count ? item.episode_count : "--" }}
          </td>
          <td>{{ dateFormat(item.publish_timestamp, "MMM D, YYYY") }}</td>
          <td>
            <v-switch
              v-model="item.activate"
              dense
              inset
              :label="
                item.content_type === 'Movie' ? 'Single Movie' : 'All Seasons'
              "
              color="#fff"
            ></v-switch>
          </td>
        </tr>
      </template>
      <template v-slot:expanded-item="{ item }">
        <tr
          class="regular-row"
          v-for="tItem in item.table_items"
          :key="tItem.season_id || tItem.episode_id"
          v-show="tItem.season_id || currentSeason === tItem.episode_season_id"
        >
          <td>
            <span
              class="line line-y"
              :class="{
                'h-100': (!tItem.last && tItem.season_id) || tItem.episode_id,
              }"
              v-if="!tItem.season_last"
            ></span>
            <span class="line line-x" v-if="tItem.season_id"></span>
          </td>
          <td colspan="2">
            <div class="d-flex h-100 align-center">
              <!-- icon -->
              <span class="px-1" v-if="tItem.season_id">
                <v-icon
                  size="13"
                  v-if="currentSeason === tItem.season_id"
                  @click="changeCurrentSeason(null)"
                >
                  mdi-plus-box
                </v-icon>
                <v-icon
                  size="13"
                  @click="changeCurrentSeason(tItem.season_id)"
                  v-else
                >
                  mdi-minus-box-outline
                </v-icon>
              </span>
              <!-- episode line -->
              <div
                class="line-episode align-self-start"
                v-if="tItem.episode_id"
              >
                <div
                  class="line line-y w-100"
                  :class="{ 'h-100': !tItem.last }"
                ></div>
                <div
                  class="line line-x w-100"
                  :class="{ 'h-50': tItem.last }"
                ></div>
              </div>

              <!-- id -->
              <span class="px-1">{{
                tItem.season_id || tItem.episode_id
              }}</span>
              <!-- name -->
              <b class="text-truncate px-1">
                {{ tItem.season_name || tItem.episode_name || "--" }}
              </b>
            </div>
          </td>
          <td>{{ tItem.season_id ? "Season" : "Episode" }}</td>
          <td>{{ tItem.season_id ? tItem.season_name : "--" }}</td>
          <td>{{ tItem.episode_count || `EP${tItem.episode_number}` }}</td>
          <td>{{ dateFormat(tItem.publish_timestamp, "MMM D, YYYY") }}</td>
          <td>
            <v-switch
              v-model="tItem.activate"
              dense
              inset
              :label="tItem.season_id ? 'All Episodes' : 'Per Episode'"
              color="#fff"
            ></v-switch>
          </td>
        </tr>
      </template>
    </v-data-table>
  </v-container>
</template>

<script>
import data from "@/utlis/titles.json";
import dayjs from "dayjs";

export default {
  name: "Home",
  components: {},
  data() {
    return {
      search: "",
      calories: "",
      expanded: [],
      currentSeason: "", // 點擊的 season
    };
  },
  watch: {
    currentSeason(to) {
      console.log(to);
    },
  },
  computed: {
    headers() {
      return [
        { text: "", value: "data-table-expand" },
        {
          text: "ID",
          align: "start",
          value: "title_id",
        },
        {
          text: "Title Name",
          align: "start",
          value: "title_name",
          filter: (value) => {
            if (!this.calories) return true;

            return value < parseInt(this.calories);
          },
        },
        { text: "Type", value: "content_type" },
        { text: "Season", value: "seasons.length" },
        { text: "Episode", sortable: false, value: "episode_count" },
        { text: "Published", value: "publish_timestamp" },
        { text: "Programmable", value: "programmable" },
      ];
    },
    inventoryList() {
      return data;
    },
    showInventoryList() {
      return data.map((item) => {
        const { seasons } = item;
        let table_items = [];
        if (seasons) {
          for (let i = 0; i < seasons.length; i++) {
            let episodes = seasons[i].episodes;
            episodes = episodes.map((episode, eIndex) => ({
              ...episode,
              episode_season_id: seasons[i].season_id,
              last: eIndex === episodes.length - 1,
              season_last: i === seasons.length - 1,
            }));
            let season = {
              ...seasons[i],
              last: i === seasons.length - 1,
            };
            table_items = [...table_items, season, ...episodes];
          }
        }
        return {
          ...item,
          table_items,
        };
      });
    },
  },
  methods: {
    changeCurrentSeason(val) {
      console.log(val);
      this.currentSeason = val;
    },
    dateFormat(val, dFormat) {
      if (!val) return "";
      if (!dFormat) return val;
      return dayjs(val).format(dFormat);
    },
    filterOnlyCapsText(value, search, item) {
      return (
        value != null &&
        search != null &&
        typeof value === "string" &&
        item.title_name
          .toString()
          .toLowerCase()
          .indexOf(search.toLowerCase()) !== -1
      );
    },
  },
};
</script>
