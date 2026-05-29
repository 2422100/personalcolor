const express = require("express");
const multer = require("multer");
const app = express();
const https = require("https");
const fs = require("fs");
const path = require("path");
const options = {
  key: fs.readFileSync(path.join(__dirname, "ssl", "key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "ssl", "cert.pem")),
};

const PORT = process.env.PORT || 3004;
https.createServer(options, app).listen(PORT, () => {
  console.log(`HTTPS listening on ${PORT}...`);
});

app.use(express.static(path.join(__dirname, "public")));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/CSV/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'data-' + uniqueSuffix + '.csv');
  },
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("CSVファイルのみアップロード可能です"), false);
    }
  }
});

app.post("/upload_csv", upload.single("file"), (req, res) => {
  res.status(200).send({ message: "File uploaded successfully" });
});

app.use((req, res, next) => {
  if (req.path !== "/") {
    return next();
  }

  const publicPath = path.join(__dirname, "public");

  fs.readdir(publicPath, (err, files) => {
    if (err) {
      return res.status(500).send("ディレクトリを読み込めませんでした");
    }

    const htmlFiles = files.filter((file) => file.endsWith(".html"));

    const fileListHTML = htmlFiles
      .map((file) => `<a href="${path.join(req.path, file)}">${file}</a>`)
      .join("</br>");

    res.send(`<h1>Room：</h1>${fileListHTML}`);
  });
});