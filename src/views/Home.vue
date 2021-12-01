<template>
  <v-container fluid class="home" v-resize="onResize">
    <p class="mb-4"><b> Inventory Manager</b></p>
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
      :height="windowSize.y - 178"
      :headers="headers"
      :items="inventoryList"
      item-key="title_id"
      :search="search"
      :custom-filter="filterOnlyCapsText"
      :items-per-page="-1"
      hide-default-footer
      :expanded.sync="expanded"
      show-expand
      single-expand
      :fixed-header="true"
      :loading="loading"
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
                item.content_type === 'Movie'
                  ? 'Single Movie'
                  : inventoryActive[item.title_id].amount ===
                    inventoryActive[item.title_id].activate
                  ? 'All Seasons'
                  : ''
              "
              color="#fff"
              @change="changeSwitch(item)"
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
              <span class="px-1">
                {{ tItem.season_id || tItem.episode_id }}
              </span>
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
              :input-value="tItem.activate"
              dense
              inset
              :label="
                tItem.season_id
                  ? inventoryActive[tItem.season_id] &&
                    inventoryActive[tItem.season_id].activate ===
                      inventoryActive[tItem.season_id].amount
                    ? 'All Episodes'
                    : ''
                  : 'Per Episode'
              "
              color="#fff"
              @change="changeSwitch(tItem)"
            ></v-switch>
          </td>
        </tr>
      </template>
    </v-data-table>
  </v-container>
</template>

<script>
import dayjs from "dayjs";
import { mapGetters, mapActions } from "vuex";

export default {
  name: "Home",
  components: {},
  data() {
    return {
      search: "",
      calories: "",
      expanded: [],
      currentSeason: "", // 點擊的 season
      windowSize: {
        x: "",
        y: "",
      },
      loading: true,
      inventoryList: [],
      inventoryActive: {},
    };
  },
  computed: {
    ...mapGetters(["inventories"]),
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
        { text: "Episode", value: "episode_count" },
        { text: "Published", value: "publish_timestamp" },
        { text: "Programmable", value: "activate" },
      ];
    },
  },
  methods: {
    ...mapActions(["getInventories"]),
    setInventoryList() {
      this.inventoryList = this.inventories.map((item) => {
        const { seasons, title_id } = item;
        let table_items = [];
        this.inventoryActive[title_id] = {
          // seasons 的 總數
          activate: 0,
          amount: seasons.length,
        };
        if (seasons) {
          for (let i = 0; i < seasons.length; i++) {
            let episodes = seasons[i].episodes;
            this.inventoryActive[seasons[i].season_id] = {
              // episode 的 總數
              activate: 0,
              amount: episodes.length,
            };
            episodes = episodes.map((episode, eIndex) => {
              // set episode 數量
              this.inventoryActive[seasons[i].season_id].activate =
                this.inventoryActive[seasons[i].season_id].activate +
                Number(seasons[i].activate);
              return {
                ...episode,
                episode_season_id: seasons[i].season_id,
                episode_title_id: title_id,
                last: eIndex === episodes.length - 1,
                season_last: i === seasons.length - 1,
              };
            });
            let season = {
              ...seasons[i],
              season_title_id: title_id,
              last: i === seasons.length - 1,
            };
            table_items = [...table_items, season, ...episodes];
            // set seasons 數量
            this.inventoryActive[title_id].activate =
              this.inventoryActive[title_id].activate +
              Number(seasons[i].activate);
          }
        }
        return {
          ...item,
          table_items,
        };
      });
    },
    changeSwitch(item) {
      /*** 切換 switch ***/
      const { activate, content_type, season_id, episode_id, title_id } = item;
      // 1 - series
      if (content_type === "Series") {
        // all seasons and episode checked
        item.table_items = item.table_items.map((item) => {
          const { season_id } = item;
          if (season_id) {
            // 對自己
            const num = this.inventoryActive[title_id].activate;
            this.inventoryActive[title_id].activate = activate
              ? num + 1
              : num - 1;
            // 對下
            this.inventoryActive[season_id].activate = activate
              ? this.inventoryActive[season_id].amount
              : 0;
          }

          return {
            ...item,
            activate,
          };
        });
      }
      // 2 - seasons
      const list = this.inventoryList;
      if (season_id) {
        item =
          list.find((title) => title.title_id === item.season_title_id) || [];
        // all episode checked
        let tableItems = [];
        if (item.episodes) {
          item.episodes = item.episodes.map((episodes) => ({
            ...episodes,
            activate,
          }));
        }

        item.table_items.forEach((tItem) => {
          if (tItem.episode_season_id === season_id) {
            tableItems.push({
              ...tItem,
              activate,
            });
          } else tableItems.push(tItem);
        });
        item.table_items = tableItems;

        // 紀錄選取被選取數量
        const { title_id } = item;
        const num = this.inventoryActive[title_id].activate;
        this.inventoryActive[title_id].activate = activate ? num + 1 : num - 1; // 對上
        this.inventoryActive[season_id].activate = activate // 對下
          ? this.inventoryActive[season_id].amount
          : 0;
        this.checkActivite(title_id);
      }
      // 3 - 檢查 activate 數量
      if (episode_id) {
        const { episode_season_id, episode_title_id } = item;
        const num = this.inventoryActive[episode_season_id].activate;
        this.inventoryActive[episode_season_id].activate = activate
          ? num + 1
          : num - 1;
        this.checkActivite(episode_season_id, episode_title_id);

        // 4- 補算 series 下 season 的數量

        let titleNum = this.inventoryActive[episode_title_id].activate;
        const titleOpen = titleNum ? true : false;
        const seasonOpen = this.inventoryActive[episode_season_id].activate
          ? true
          : false;
        if (titleOpen !== seasonOpen) {
          this.inventoryActive[episode_title_id].activate = activate
            ? titleNum + 1
            : titleNum - 1;
        }

        // 5 - 檢查 title 數量
        this.checkActivite(episode_title_id);
      }
    },
    checkActivite(id, parentId) {
      /* 檢查 active */
      const { activate } = this.inventoryActive[id];

      for (let key in this.inventoryActive) {
        // 是 series
        if (Number(key) === id) {
          // 是 series
          let isSeries = this.inventoryList.find(
            (title) => title.title_id === id
          );
          if (isSeries) {
            if (!activate) {
              isSeries.activate = false;
            } else isSeries.activate = true;
            return;
          }

          // 是 seasons
          if (parentId) {
            isSeries = this.inventoryList.find(
              (title) => title.title_id === parentId
            );
            const isSeason = isSeries.seasons.find((season) =>
              season.season_id ? season.season_id === id : false
            );
            const isTableSeason = isSeries.table_items.find((item) =>
              item.season_id ? item.season_id === id : false
            );

            if (isSeason || isTableSeason) {
              if (!activate) {
                this.$set(isSeason, "activate", false);
                this.$set(isTableSeason, "activate", false);
              } else {
                this.$set(isSeason, "activate", true);
                this.$set(isTableSeason, "activate", true);
              }

              return;
            }
          }
        }
      }
    },
    onResize() {
      this.windowSize = { x: window.innerWidth, y: window.innerHeight };
    },
    changeCurrentSeason(val) {
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
  created() {
    this.getInventories().then(() => {
      this.loading = false;
      this.setInventoryList();
    });
  },
};
</script>
