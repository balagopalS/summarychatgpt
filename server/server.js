const express = require("express");
const cors = require("cors");
const bodyparser = require("body-parser");
const fs = require("fs");
const pdf = require("pdf-parse");
const fileUploader = require("express-fileupload");
const { Configuration, OpenAIApi } = require("openai");
const dotenv = require("dotenv");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = 8800;

const configuration = new Configuration({
  apiKey: "sk - mGlcbqoKzbwFvaZJC6gfT3BlbkFJ5Ndaxodr3WlSrW2sJXJi",
});
const openai = new OpenAIApi(configuration);

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

app.post("/summary", async function (req, res) {
  if (!req.files || Object.keys(req.files).length === 0) {
    console.log("No file uploaded");
    return res.status(400).send("No file uploaded");
  }

  const sampleFile = req.files.uploadedFile;
  const uploadPath =
    __dirname + "/tmp" + new Date().getTime() + "/" + sampleFile.name;

  // Create the /tmp directory if it doesn't exist
  if (!fs.existsSync(__dirname + "/tmp")) {
    fs.mkdirSync(__dirname + "/tmp");
  }

  try {
    await sampleFile.mv(uploadPath);
    console.log("File uploaded successfully");

    const dataBuffer = fs.readFileSync(uploadPath);
    const data = await pdf(dataBuffer);

    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: data.text + `\n\nTl;dr`,
      temperature: 0.7,
      max_tokens: Math.floor(data.text?.length / 2),
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0.5,
    });

    fs.unlinkSync(uploadPath);
    if (response.data?.choices && response.data.choices.length > 0) {
      const summaryText = response.data.choices[0].text;
      console.log("Summary generated successfully");
      res.json({ id: new Date().getTime(), text: summaryText });
    } else {
      console.log("Unable to get summary from OpenAI API");
      res.status(500).send("Unable to get summary from OpenAI API");
    }
  } catch (err) {
    console.log("Error:", err);
    res.status(500).send("An error occurred while processing the file");
  }
});

app.listen(PORT, () => {
  console.log("Server listening on port " + PORT);
});
