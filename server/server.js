const express = require("express");
const cors = require("cors");
const bodyparser = require("body-parser");
const fs = require("fs");
const pdf = require("pdf-parse");
const fileUploader = require("express-fileupload");
const { Configuration, OpenAIApi } = require("openai");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = 8800;

const configuration = new Configuration({
  apiKey: process.env.OPENAI_KEY,
});

const openai = new OpenAIApi(configuration);

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

app.post("/summary", async function (req, res) {
  let sampleFile;
  let uploadPath;

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No file uploaded");
  }
  sampleFile = req.files.uploadedFile;

  uploadPath =
    __dirname + "/tmp" + new Date().getTime() + "/" + sampleFile.name;
  sampleFile.mv(uploadPath, async function (err) {
    if (err) return res.status(500).send(err);
    let dataBuffer = fs.readFileSync(uploadPath);
    pdf(dataBuffer).then(async function (data) {
      openai
        .createCompletion({
          model: "text-davinci-003",
          prompt: data.text + `\n\nTl;dr`,
          temperature: 0.7,
          max_tokens: Math.floor(data.text?.length / 2),
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0.5,
        })
        .then((response) => {
          fs.unlinkSync(uploadPath);
          res.json({
            id: new Date().getTime(),
            text: response.data.choices[0].text,
          });
        })
        .catch((err) => {
          console.log("Error:", err);
          res.status(500).send("an error occured");
        });
    });
  });
});

app.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});
