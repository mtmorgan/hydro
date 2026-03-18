import m from "mithril";

const ImplimentationView: m.Component = {
  view: () =>
    m(".container", [
      m("h2", "Implementation Notes"),
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
          {
            href: "https://erikvullings.github.io/mithril-materialized/#!/home",
          },
          "Mithril-Materialized",
        ),
        " components. I also learned about XML parsing in JavaScript,",
        "complementing my knowledge of xpath in R.",
      ),
      m(
        "p",
        "Using some kind of AI has become unavoidable. I used Google ",
        "Gemini through the browser as a kind of tutor. This proved really ",
        "helpful for learning JavaScript, even though Gemini seems to always ",
        "think that I have great ideas, and it seems like I am learning a dying ",
        "practice (writing code rather than letting an agent do it).",
      ),
    ]),
};

export default ImplimentationView;
