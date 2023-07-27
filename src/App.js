import React, { useEffect, useState } from "react";
import Delete from "./assets/delete.png";
import axios from "axios";

function App() {
  const [value, setValue] = useState("");
  const [data, setData] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [isCopy, setIsCopy] = useState(false);
  const apiURL = "http://localhost:8800";
  const [selected, setSelected] = useState(null);

  const handlesubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);

    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Bearer " + "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",
      },
      body: JSON.stringify({
        prompt: value + `\n\nTl;dr`,
        temperature: 0.1,
        max_tokens: Math.floor(value.length / 2),
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.5,
        stop: ['"""'],
      }),
    };

    fetch(
      "https://api.openai.com/v1/engines/text-davinci-003/completions",
      requestOptions
    )
      .then((response) => response.json())
      .then((dt) => {
        const text = dt.choices[0].text;
        setSubmitting(false);

        console.log("Summary generated:", text);
        localStorage.setItem(
          "summary",
          JSON.stringify(
            data?.length > 0
              ? [...data, { id: new Date().getTime(), text: text }]
              : [text]
          )
        );
        fetchLocalStorage();
      })
      .catch((error) => {
        setSubmitting(false);
        console.log("Error generating summary:", error);
      });
  };

  const handlesubmitPDF = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const file = e.target.files[0];
    var formData = new FormData();
    formData.append("filename", "User File");
    formData.append("uploadedFile", file);

    try {
      const { data: res } = await axios.post(apiURL + "/summary", formData);
      console.log("Summary response:", res);
      localStorage.setItem("summary", JSON.stringify([...data, res]));
      fetchLocalStorage();
    } catch (error) {
      console.log("Error uploading PDF:", error);
    }
  };

  const fetchLocalStorage = async () => {
    try {
      const result = await localStorage.getItem("summary");
      const parsedData = JSON.parse(result);
      console.log("Fetched data from localStorage:", parsedData);
      setData(parsedData?.reverse() || []);
    } catch (error) {
      console.log("Error fetching from localStorage:", error);
    }
  };

  async function copyTextToClipboard(text) {
    if ("clipboard" in navigator) {
      return await navigator.clipboard.writeText(text);
    }
  }

  const handleCopy = (txt) => {
    copyTextToClipboard(txt.text)
      .then(() => {
        setSelected(txt.id);
        setIsCopy(true);

        setTimeout(() => {
          setIsCopy(false);
          setSelected(null);
        }, 1500);
      })
      .catch((err) => console.log("Error copying text:", err));
  };

  const handleDelete = (txt) => {
    const filtered = data?.filter((d) => d.id !== txt.id);

    setData(filtered);

    localStorage.setItem("summary", JSON.stringify(filtered));
  };

  useEffect(() => {
    fetchLocalStorage();
  }, []);

  return (
    <div
      className="w-full bg-[#0f172a] h-full min-h-[100vh]
      py-4
      px-4
      md:px-20"
    >
      <div className="w-full">
        <div
          className="flex flex-row justify-between items-center
        w-full h-10 px-5 2xl:px-40"
        >
          <h3 className="cursor-pointer text-3xl font-bold text-cyan-600"></h3>
        </div>

        <div
          className="flex flex-col items-center justify-center
        mt-4 p-4"
        >
          <h1 className="text-3xl text-white text-center leading-10 font-semibold">
            PRD
            <br />
            <span className="text-5xl font-bold text-cyan-500">Summarizer</span>
          </h1>
          <p className="mt-5 text-lg text-gray-500 sm:text-xl text-center max-w-2xl">
            Upload your document and get a quick summary
          </p>
        </div>

        <div className="flex flex-col w-full items-center justify-center mt-5">
          <textarea
            placeholder="Paste doc content here ..."
            rows={6}
            className="block w-full md:w-[650px] rounded-md border border-slate-700
            bg-slate-800 p-2 text-sm shadow-lg font-medium text-white focus:border-gray-500
             focus:outline-none focus:ring-0"
            onChange={(e) => setValue(e.target.value)}
          ></textarea>

          {value?.length > 0 && !submitting && (
            <button
              className="mt-5 bg-blue-500 px-5 py-2 text-white text-md font-
            cursor-pointer rounded-md
          "
              onClick={handlesubmit}
            >
              Submit
            </button>
          )}
          {!value?.length > 0 && (
            <div className="mt-5">
              <label htmlFor="userFile" className="text-white mr-2">
                Choose File
              </label>
              <input
                type="file"
                id="userFile"
                name="userFile"
                accept="pdf"
                className="text-slate-300"
                onChange={(e) => handlesubmitPDF(e)}
              />
            </div>
          )}
          {submitting && (
            <p className="text-md text-cyan-500 mt-5">Please wait ....</p>
          )}
        </div>
      </div>

      <div
        className="w-full mt-10 flex flex-col gap-5 shadow-md
      items-center justify-center"
      >
        {data?.length > 0 && (
          <>
            <p className="text-white font-semibold text-lg">Summary History</p>
            {data?.map((d, index) => (
              <div
                key={index}
                className="max-w-2xl bg-slate-800 p-3 rounded-md"
              >
                <p className="text-gray-400 text-lg">{d.text}</p>
                <div className="flex gap-5 items-center justify-end mt-2">
                  <p
                    className="text-gray-500 font-semibold cursor-pointer"
                    onClick={() => handleCopy(d)}
                  >
                    {isCopy && selected === d.id ? "Copied" : "Copy"}
                  </p>
                  <span
                    className="cursor-pointer"
                    onClick={() => handleDelete(d)}
                  >
                    <img src={Delete} className="w-6 h-6" />
                  </span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
