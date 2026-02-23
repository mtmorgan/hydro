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
      "data, but I haven't found any free, retail consumer-oriented ",
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
    m(
      "p",
      "See the ",
      m("a", { href: "/#!implementation" }, "implementation notes"),
      " for some detail.",
    ),
  ],
};

export default IntroductionView;
