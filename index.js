const express = require("express");
const frames = require("./animation");

const app = express();
const PORT = 3000;

app.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  
  let index = 0;
  const interval = setInterval(() => {
    res.write("\033c"); // Terminali temizle
    res.write(frames[index] + "\n");
    index = (index + 1) % frames.length;
  }, 200);

  req.on("close", () => clearInterval(interval)); // Bağlantı kesildiğinde durdur
});

app.listen(PORT, () => {
  console.log(`ASCII stream started at http://localhost:${PORT}`);
});
