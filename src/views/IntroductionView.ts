import m from "mithril";

const IntroductionView: m.Component = {
  view: () => [
    m(
      "p",
      m(
        "a",
        {
          href: "https://www.oeb.ca/consumer-information-and-protection/green-button",
        },
        "Green Button",
      ),
      " has been adopted by Hydro One (and other Ontario energy providers?) ",
      "as a way to give consumers access to their energy consumption data. ",
      "Apparently there are apps that provide access to the ",
      "data, but I haven't found any free, household consumer-oriented ",
      "options.",
    ),
    m(
      "p",
      "My hydro meter provides ",
      m("i", "hourly"),
      " usage data ",
      "(I believe this is done over a wireless connection). The data are ",
      "aggregated into billing periods. The hourly and aggregated data can be ",
      "downloaded as XML files from the Hydro One web site through your ",
      "account.",
    ),
    m(
      "p",
      "Use this application by entering your Hydro One data (click on ",
      "'Hydro' at the top of the page) and selecting a climate station ",
      "('Climate' button). The 'Insights' button presents some simple ",
      "plots to summarize heating degree days, consumption, and cost.",
    ),
    m("p", m("b", "Implementation notes")),
    m(
      "p",
      "The main purpose of this app was to learn more JavaScript. I wanted ",
      "to learn more of the ",
      m("a", { href: "https://d3js.org/" }, "D3"),
      " (data visualization) and ",
      m("a", { href: "https://datatables.net/" }, "DataTables"),
      " libraries, and to explore the ",
      m("a", { href: "https://mithril.js.org/" }, "mithril"),
      " framework (as a simpler alternative to svelte?) with ",
      m(
        "a",
        { href: "https://erikvullings.github.io/mithril-materialized/#!/home" },
        "Mithril-Materialized",
      ),
      " components. I also learned about XML parsing in JavaScript,",
      "compleneting my knowledge of xpath in R.",
    ),
    m(
      "p",
      "Using some kind of AI has become unavoidable. I used Google ",
      "Gemini through the browser as a kind of tutor. This proved really ",
      "helpful for learning JavaScript, even though Gemini seems to always ",
      "think that I have great ideas, and it seems like I am learning a dying ",
      "practice (writing code rather than letting an agent do it).",
    ),
  ],
};

export default IntroductionView;
