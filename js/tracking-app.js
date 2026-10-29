var app = new Vue({
  el: '#app',

  data: {
    pengirimanList: [
      { kode: "REG", nama: "JNE Regular (3-5 hari)" },
      { kode: "EXP", nama: "JNE Express (1-2 hari)" }
    ],

    paket: [
      {
        kode: "PAKET-UT-001",
        nama: "PAKET Sistem Informasi",
        isi: ["MSIM4309 (Pemrograman Berbasis Web)", "MSIM4201 (Sistem Basis Data)"],
        harga: 150000
      },
      {
        kode: "PAKET-UT-002",
        nama: "PAKET PGSD",
        isi: ["PDGK4101 (Keterampilan Berbahasa Indonesia)", "PDGK4205 (Pembelajaran Terpadu di SD)"],
        harga: 135000
      }
    ],

    tracking: {
      "DO2025-001": {
        nomorDO: "DO2025-001",
        nim: "123456789",
        nama: "Rina Wulandari",
        status: "Dalam Perjalanan",
        ekspedisi: "JNE Regular (3-5 hari)",
        tanggalKirim: "2025-08-25",
        paket: "PAKET-UT-001",
        namaPaket: "PAKET Sistem Informasi",
        total: 150000,
        perjalanan: [
          { waktu: "2025-08-25 10:12:20", keterangan: "Penerimaan di Loket: TANGSEL" },
          { waktu: "2025-08-25 14:07:56", keterangan: "Tiba di Hub: JAKSEL" },
          { waktu: "2025-08-26 08:44:01", keterangan: "Diteruskan ke Kantor Tujuan" }
        ]
      },
      "DO2025-002": {
        nomorDO: "DO2025-002",
        nim: "987654321",
        nama: "Agus Pranoto",
        status: "Selesai Antar",
        ekspedisi: "JNE Express (1-2 hari)",
        tanggalKirim: "2025-08-26",
        paket: "PAKET-UT-002",
        namaPaket: "PAKET PGSD",
        total: 135000,
        perjalanan: [
          { waktu: "2025-08-26 09:00:15", keterangan: "Penerimaan di Loket: TANGSEL" },
          { waktu: "2025-08-26 13:45:00", keterangan: "Tiba di Hub: BANDUNG" },
          { waktu: "2025-08-27 11:20:00", keterangan: "Selesai Antar. Penerima: Agus Pranoto" }
        ]
      }
    },

    formDO: {
      nim: "",
      nama: "",
      ekspedisi: "",
      paketKode: "",
      tanggalKirim: "",
      total: 0
    },
    errors: {},

    searchDO: "",
    inputSearchDO: ""
  },

  computed: {
    nomorDOBaru: function() {
      var tahun = new Date().getFullYear();
      var prefix = "DO" + tahun + "-";
      var maxSeq = 0;

      Object.keys(this.tracking).forEach(key => {
        if (key.indexOf(prefix) === 0) {
          var seq = parseInt(key.replace(prefix, ""), 10);
          if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
        }
      });

      var next = maxSeq + 1;
      var strSeq = next < 10 ? ("00" + next) : (next < 100 ? ("0" + next) : ("" + next));
      return prefix + strSeq;
    },

    selectedPaket: function() {
      return this.paket.find(p => p.kode === this.formDO.paketKode) || null;
    },

    hasilTracking: function() {
      if (!this.searchDO) return null;
      var key = this.searchDO.trim().toUpperCase();
      return this.tracking[key] || null;
    },

    daftarDO: function() {
      return Object.keys(this.tracking);
    }
  },

  watch: {
    'formDO.paketKode': function() {
      if (this.selectedPaket) {
        this.formDO.total = this.selectedPaket.harga;
      } else {
        this.formDO.total = 0;
      }
    },

    tracking: {
      deep: true,
      handler: function(val) {
        localStorage.setItem("sitta_tracking_data", JSON.stringify(val));
      }
    }
  },

  created: function() {
    var saved = localStorage.getItem("sitta_tracking_data");
    if (saved) {
      try {
        this.tracking = JSON.parse(saved);
      } catch (e) {
        console.error("Gagal membaca tracking dari localStorage", e);
      }
    }
    this.setTanggalHariIni();
  },

  methods: {
    setTanggalHariIni: function() {
      var d = new Date();
      var year = d.getFullYear();
      var month = String(d.getMonth() + 1).padStart(2, "0");
      var day = String(d.getDate()).padStart(2, "0");
      this.formDO.tanggalKirim = year + "-" + month + "-" + day;
    },

    validasi: function() {
      this.errors = {};
      if (!this.formDO.nim.trim()) this.errors.nim = "NIM wajib diisi";
      if (!this.formDO.nama.trim()) this.errors.nama = "Nama wajib diisi";
      if (!this.formDO.ekspedisi) this.errors.ekspedisi = "Pilih ekspedisi";
      if (!this.formDO.paketKode) this.errors.paketKode = "Pilih paket bahan ajar";
      if (!this.formDO.tanggalKirim) this.errors.tanggalKirim = "Tanggal kirim wajib diisi";

      return Object.keys(this.errors).length === 0;
    },

    simpanDO: function() {
      if (!this.validasi()) return;

      var noDO = this.nomorDOBaru;
      var pkt = this.selectedPaket;
      var waktuSekarang = new Date().toLocaleTimeString("id-ID");

      var itemDO = {
        nomorDO: noDO,
        nim: this.formDO.nim.trim(),
        nama: this.formDO.nama.trim(),
        status: "Penerimaan di Loket",
        ekspedisi: this.formDO.ekspedisi,
        tanggalKirim: this.formDO.tanggalKirim,
        paket: this.formDO.paketKode,
        namaPaket: pkt ? pkt.nama : this.formDO.paketKode,
        total: Number(this.formDO.total),
        perjalanan: [
          {
            waktu: this.formDO.tanggalKirim + " " + waktuSekarang,
            keterangan: "Penerimaan di Loket Pengiriman: PUSLABA Universitas Terbuka"
          }
        ]
      };

      this.$set(this.tracking, noDO, itemDO);
      this.searchDO = noDO;
      this.inputSearchDO = noDO;

      this.formDO.nim = "";
      this.formDO.nama = "";
      this.formDO.ekspedisi = "";
      this.formDO.paketKode = "";
      this.setTanggalHariIni();
      this.errors = {};
    },

    cariDO: function() {
      this.searchDO = this.inputSearchDO;
    },

    pilihDO: function(no) {
      this.searchDO = no;
      this.inputSearchDO = no;
    },

    formatRupiah: function(num) {
      return "Rp " + Number(num || 0).toLocaleString("id-ID");
    }
  }
});
