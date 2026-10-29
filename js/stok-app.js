var app = new Vue({
  el: '#app',

  data: {
    upbjjList: ["Jakarta", "Surabaya", "Makassar", "Padang", "Denpasar"],
    kategoriList: ["MK Wajib", "MK Pilihan", "Praktikum", "Problem-Based"],

    stok: [
      {
        kode: "EKMA4116",
        judul: "Pengantar Manajemen",
        kategori: "MK Wajib",
        upbjj: "Jakarta",
        lokasiRak: "R1-A3",
        harga: 65000,
        qty: 28,
        safety: 20,
        catatanHTML: "<em>Edisi 2024, cetak ulang</em>"
      },
      {
        kode: "EKMA4115",
        judul: "Pengantar Akuntansi",
        kategori: "MK Wajib",
        upbjj: "Jakarta",
        lokasiRak: "R1-A4",
        harga: 60000,
        qty: 7,
        safety: 15,
        catatanHTML: "<strong>Cover baru</strong>"
      },
      {
        kode: "BIOL4201",
        judul: "Biologi Umum (Praktikum)",
        kategori: "Praktikum",
        upbjj: "Surabaya",
        lokasiRak: "R3-B2",
        harga: 80000,
        qty: 12,
        safety: 10,
        catatanHTML: "Butuh <u>pendingin</u> untuk kit basah"
      },
      {
        kode: "FISIP4001",
        judul: "Dasar-Dasar Sosiologi",
        kategori: "MK Pilihan",
        upbjj: "Makassar",
        lokasiRak: "R2-C1",
        harga: 55000,
        qty: 2,
        safety: 8,
        catatanHTML: "Stok <i>menipis</i>, prioritaskan reorder"
      },
      {
        kode: "ASIP4301",
        judul: "Pengantar Ilmu Komunikasi",
        kategori: "MK Wajib",
        upbjj: "Padang",
        lokasiRak: "R1-B5",
        harga: 58000,
        qty: 0,
        safety: 15,
        catatanHTML: "<span style='color:red;'>Stok Habis! Segera cetak ulang</span>"
      }
    ],

    filterUpbjj: "",
    filterKategori: "",
    filterReorder: false,
    sortBy: "judul",
    sortOrder: "asc",

    isEdit: false,
    editIndex: -1,
    form: {
      kode: "",
      judul: "",
      kategori: "",
      upbjj: "",
      lokasiRak: "",
      harga: "",
      qty: "",
      safety: "",
      catatanHTML: ""
    },
    errors: {}
  },

  computed: {
    filteredStok() {
      let result = this.stok.slice(); //dicopy

      if (this.filterUpbjj !== "") {
        result = result.filter(item => item.upbjj === this.filterUpbjj);
      }

      if (this.filterUpbjj !== "" && this.filterKategori !== "") {
        result = result.filter(item => item.kategori === this.filterKategori);
      }

      if (this.filterReorder) {
        result = result.filter(item => Number(item.qty) < Number(item.safety) || Number(item.qty) === 0);
      }

      result.sort((a, b) => { //sortir
        const keyA = a[this.sortBy];
        const keyB = b[this.sortBy];

        if (this.sortBy === "judul") {
          const comp = String(keyA).localeCompare(String(keyB));
          return this.sortOrder === "asc" ? comp : -comp;
        } else {
          const numA = Number(keyA) || 0;
          const numB = Number(keyB) || 0;
          return this.sortOrder === "asc" ? numA - numB : numB - numA;
        }
      });

      return result;
    },

    kategoriTersedia() { //filter berdasarkan upbjj
      if (!this.filterUpbjj) return this.kategoriList;
      const set = {};
      this.stok.forEach(item => {
        if (item.upbjj === this.filterUpbjj && item.kategori) {
          set[item.kategori] = true;
        }
      });
      const arr = Object.keys(set);
      return arr.length > 0 ? arr : this.kategoriList;
    },
  },

  watch: {
    filterUpbjj: function() {
      this.filterKategori = "";
    },

    stok: {
      deep: true,
      handler: function(val) {
        localStorage.setItem("sitta_stok_data", JSON.stringify(val));
      }
    }
  },

  created: function() {
    var saved = localStorage.getItem("sitta_stok_data");
    if (saved) {
      try {
        this.stok = JSON.parse(saved);
      } catch (e) {
        console.error("Gagal membaca localStorage", e);
      }
    }
  },

  methods: {
    validasi: function() {
      this.errors = {};
      if (!this.form.kode.trim()) this.errors.kode = "Kode MK wajib diisi";
      if (!this.form.judul.trim()) this.errors.judul = "Nama MK wajib diisi";
      if (!this.form.kategori) this.errors.kategori = "Pilih kategori";
      if (!this.form.upbjj) this.errors.upbjj = "Pilih UT-Daerah";
      if (!this.form.lokasiRak.trim()) this.errors.lokasiRak = "Lokasi rak wajib diisi";
      if (this.form.harga === "" || Number(this.form.harga) <= 0) this.errors.harga = "Harga harus > 0";
      if (this.form.qty === "" || Number(this.form.qty) < 0) this.errors.qty = "Stok minimal 0";
      if (this.form.safety === "" || Number(this.form.safety) < 0) this.errors.safety = "Safety minimal 0";

      return Object.keys(this.errors).length === 0;
    },

    simpanStok: function() {
      if (!this.validasi()) return;

      var payload = {
        kode: this.form.kode.toUpperCase().trim(),
        judul: this.form.judul.trim(),
        kategori: this.form.kategori,
        upbjj: this.form.upbjj,
        lokasiRak: this.form.lokasiRak.toUpperCase().trim(),
        harga: Number(this.form.harga),
        qty: Number(this.form.qty),
        safety: Number(this.form.safety),
        catatanHTML: this.form.catatanHTML.trim() || "-"
      };

      if (this.isEdit && this.editIndex >= 0) {
        this.$set(this.stok, this.editIndex, payload);
      } else {
        this.stok.push(payload);
      }

      this.batalEdit();
    },

    editStok: function(item) {
      var idx = this.stok.indexOf(item);
      if (idx === -1) return;

      this.isEdit = true;
      this.editIndex = idx;
      this.form = Object.assign({}, item);
      this.errors = {};
    },

    batalEdit: function() {
      this.isEdit = false;
      this.editIndex = -1;
      this.form = {
        kode: "",
        judul: "",
        kategori: "",
        upbjj: "",
        lokasiRak: "",
        harga: "",
        qty: "",
        safety: "",
        catatanHTML: ""
      };
      this.errors = {};
    },

    hapusStok: function(item) {
      if (confirm("Hapus data bahan ajar " + item.kode + " - " + item.judul + "?")) {
        var indexHapuz = this.stok.indexOf(item);
        if (indexHapuz !== -1) {
          this.stok.splice(indexHapuz, 1);
          if (this.isEdit && this.editIndex === indexHapuz) this.batalEdit();
        }
      }
    },

    resetFilter: function() {
      this.filterUpbjj = "";
      this.filterKategori = "";
      this.filterReorder = false;
      this.sortBy = "judul";
      this.sortOrder = "asc";
    },

    formatRupiah: function(num) {
      return "Rp " + Number(num || 0).toLocaleString("id-ID");
    }
  }
});
